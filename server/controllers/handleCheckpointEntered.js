import {
  getCredentials,
  World,
  errorHandler,
  checkpointZeroEntered,
  finishLineEntered,
  checkpointEntered,
} from "../utils/index.js";
import { CHECKPOINT_NAMES } from "../constants.js";
import redisObj from "../redis/redis.js";

export const handleCheckpointEntered = async (req, res) => {
  try {
    const credentials = getCredentials(req.body);
    const { profileId, sceneDropId, urlSlug } = credentials;
    const { uniqueName } = req.body;

    const checkpointNumber = uniqueName === CHECKPOINT_NAMES.START ? 0 : parseInt(uniqueName.split("-").pop(), 10);

    if (checkpointNumber !== 0) {
      redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
        profileId,
        checkpointNumber,
        currentRaceFinishedElapsedTime: null,
      });
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
      redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
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
