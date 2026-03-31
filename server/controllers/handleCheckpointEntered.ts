import { Request, Response } from "express";
import {
  getCredentials,
  errorHandler,
  finishLineEntered,
  checkpointEntered,
  Visitor,
  getVisitor,
  getElapsedTime,
} from "../utils/index.js";
import { CHECKPOINT_NAMES } from "../constants.js";
import redisObj from "../redis/redis.js";

export const handleCheckpointEntered = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.body);
    const { profileId, urlSlug, visitorId } = credentials;
    const { uniqueName } = req.body;
    const channel = `${process.env.INTERACTIVE_KEY}_RACE`;

    const { visitorProgress } = await getVisitor(credentials);
    const { startTimestamp } = visitorProgress;

    const currentTimestamp = Date.now();
    const currentElapsedTime = getElapsedTime(currentTimestamp, startTimestamp);
    const checkpointNumber = uniqueName === CHECKPOINT_NAMES.START ? 0 : parseInt(uniqueName.split("-").pop(), 10);

    if (!startTimestamp) return { success: false, message: "Race has not started yet" };

    const { checkpoints: cachedCheckpoints, wasWrongCheckpointEntered } =
      JSON.parse((await redisObj.get(profileId)) || "{}") || {};

    if (checkpointNumber !== 0) {
      if (checkpointNumber > 1 && !cachedCheckpoints[checkpointNumber - 2]) {
        try {
          await redisObj.publish(channel, {
            profileId,
            checkpointsCompleted: cachedCheckpoints,
          });
        } catch (error) {
          errorHandler({
            error,
            functionName: "handleCheckpointEntered",
            message: "Error publishing wrong checkpoint entered to redis",
          });
        }
        const visitor = await (Visitor as any).create(visitorId, urlSlug, { credentials });
        await visitor
          .fireToast({
            groupId: "race",
            title: "❌ Wrong checkpoint",
            text: "Oops! Go back. You missed a checkpoint!",
          })
          .catch((error: any) =>
            errorHandler({
              error,
              functionName: "handleCheckpointEntered",
              message: "Error firing toast",
            }),
          );

        try {
          await redisObj.set(
            profileId,
            JSON.stringify({ checkpoints: cachedCheckpoints, wasWrongCheckpointEntered: true }),
          );
        } catch (error) {
          errorHandler({
            error,
            functionName: "handleCheckpointEntered",
            message: "Error updating object in redis when wrong checkpoint entered",
          });
        }
        return;
      } else {
        try {
          await redisObj.publish(channel, {
            profileId,
            checkpointNumber,
            currentRaceFinishedElapsedTime: null,
          });
        } catch (error) {
          errorHandler({
            error,
            functionName: "handleCheckpointEntered",
            message: "Error publishing checkpoint entered to redis",
          });
        }
        cachedCheckpoints[checkpointNumber - 1] = true;
        try {
          await redisObj.set(profileId, JSON.stringify({ checkpoints: cachedCheckpoints, wasWrongCheckpointEntered }));
        } catch (error) {
          errorHandler({
            error,
            functionName: "handleCheckpointEntered",
            message: "Error updating object in redis when checkpoint entered",
          });
        }
      }
    }

    if (checkpointNumber === 0) {
      try {
        await redisObj.publish(channel, {
          profileId,
          checkpointNumber,
          currentRaceFinishedElapsedTime: currentElapsedTime,
        });
      } catch (error) {
        errorHandler({
          error,
          functionName: "handleCheckpointEntered",
          message: "Error publishing finish line entered to redis",
        });
      }
      const result = await finishLineEntered({ credentials, currentElapsedTime, wasWrongCheckpointEntered, redisObj });
      if (result instanceof Error) throw result;
    } else {
      const result = await checkpointEntered({
        checkpoints: cachedCheckpoints,
        checkpointNumber,
        currentElapsedTime,
        credentials,
      });
      if (result instanceof Error) throw result;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCheckpointEntered",
      message: "Error when entering the checkpoint",
      req,
      res,
    });
  }
};
