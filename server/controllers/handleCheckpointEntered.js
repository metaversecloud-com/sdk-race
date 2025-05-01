import {
  getCredentials,
  World,
  errorHandler,
  checkpointZeroEntered,
  finishLineEntered,
  checkpointEntered,
  Visitor,
} from "../utils/index.js";
import { CHECKPOINT_NAMES } from "../constants.js";
import redisObj from "../redis/redis.js";

export const handleCheckpointEntered = async (req, res) => {
  try {
    const credentials = getCredentials(req.body);
    const { profileId, sceneDropId, urlSlug, visitorId } = credentials;
    const { uniqueName } = req.body;
    const channel = `${process.env.INTERACTIVE_KEY}_RACE`;

    const checkpointNumber = uniqueName === CHECKPOINT_NAMES.START ? 0 : parseInt(uniqueName.split("-").pop(), 10);

    if (checkpointNumber !== 0) {
      const cachedCheckpoints = JSON.parse(await redisObj.get(profileId)) || {};
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
        return;
      } else {
        redisObj.publish(channel, {
          profileId,
          checkpointNumber,
          currentRaceFinishedElapsedTime: null,
        });
        cachedCheckpoints[checkpointNumber - 1] = true;
        redisObj.set(profileId, JSON.stringify(cachedCheckpoints));
      }
    }

    const world = World.create(urlSlug, { credentials });
    const dataObject = await world.fetchDataObject();
    const raceObject = dataObject?.[sceneDropId] || {};
    const profileObject = raceObject?.profiles?.[profileId] || {};

    const { startTimestamp } = profileObject;
    if (!startTimestamp) return { success: false, message: "Race has not started yet" };
    const currentTimestamp = Date.now();

    if (checkpointNumber === 0) {
      const currentElapsedTime = checkpointZeroEntered(currentTimestamp, profileObject);
      redisObj.publish(channel, {
        profileId,
        checkpointNumber,
        currentRaceFinishedElapsedTime: currentElapsedTime,
      });
      await finishLineEntered({ credentials, currentElapsedTime, profileObject, raceObject, world });
    } else {
      await checkpointEntered({ checkpointNumber, currentTimestamp, credentials, profileObject, world });
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
