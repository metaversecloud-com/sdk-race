import {
  getCredentials,
  World,
  errorHandler,
  checkpointZeroEntered,
  finishLineEntered,
  checkpointEntered,
} from "../utils/index.js";
import { formatElapsedTime } from "../utils/utils.js";
import { CHECKPOINT_NAMES } from "../constants.js";
import redisObj from "../redis/redis.js";

export const handleCheckpointEntered = async (req, res) => {
  try {
    const credentials = getCredentials(req.body);
    const { profileId, sceneDropId, urlSlug } = credentials;
    const { uniqueName } = req.body;
    const promises = [];

    const world = World.create(urlSlug, { credentials });
    const dataObject = await world.fetchDataObject();
    const raceObject = dataObject?.[sceneDropId] || {};
    const profileObject = raceObject?.profiles?.[profileId] || {};

    const { startTimestamp } = profileObject;
    if (!startTimestamp) return { success: false, message: "Race has not started yet" };

    const checkpointNumber = uniqueName === CHECKPOINT_NAMES.START ? 0 : parseInt(uniqueName.split("-").pop(), 10);
    const currentTimestamp = Date.now();

    let currentElapsedTime = null;

    if (checkpointNumber === 0) {
      currentElapsedTime = checkpointZeroEntered(currentTimestamp, profileObject);
      promises.push(finishLineEntered({ credentials, currentElapsedTime, profileObject, raceObject, world }));
    } else {
      currentElapsedTime = !startTimestamp ? null : formatElapsedTime(currentTimestamp - startTimestamp);
      promises.push(checkpointEntered({ checkpointNumber, currentTimestamp, credentials, profileObject, world }));
    }

    redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
      profileId,
      checkpointNumber,
      currentRaceFinishedElapsedTime: currentElapsedTime,
      event: "checkpoint-entered",
    });

    await Promise.all(promises);
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
