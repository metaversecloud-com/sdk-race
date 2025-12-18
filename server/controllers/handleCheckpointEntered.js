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

export const handleCheckpointEntered = async (req, res) => {
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
      JSON.parse(await redisObj.get(profileId)) || {};

    if (checkpointNumber !== 0) {
      if (checkpointNumber > 1 && !cachedCheckpoints[checkpointNumber - 2]) {
        redisObj.publish(channel, {
          profileId,
          checkpointsCompleted: cachedCheckpoints,
        });
        const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
        await visitor
          .fireToast({
            groupId: "race",
            title: "❌ Wrong checkpoint",
            text: "Oops! Go back. You missed a checkpoint!",
          })
          .catch((error) =>
            errorHandler({
              error,
              functionName: "handleCheckpointEntered",
              message: "Error firing toast",
            }),
          );

        redisObj.set(profileId, JSON.stringify({ checkpoints: cachedCheckpoints, wasWrongCheckpointEntered: true }));
        return;
      } else {
        redisObj.publish(channel, {
          profileId,
          checkpointNumber,
          currentRaceFinishedElapsedTime: null,
        });
        cachedCheckpoints[checkpointNumber - 1] = true;
        redisObj.set(profileId, JSON.stringify({ checkpoints: cachedCheckpoints, wasWrongCheckpointEntered }));
      }
    }

    if (checkpointNumber === 0) {
      redisObj.publish(channel, {
        profileId,
        checkpointNumber,
        currentRaceFinishedElapsedTime: currentElapsedTime,
      });
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
