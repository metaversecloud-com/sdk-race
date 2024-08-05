import { Visitor } from "../index.js";
import { formatElapsedTime } from "../utils.js";
import { ENCOURAGEMENT_MESSAGES } from "../../constants.js";

export const checkpointEntered = async ({ checkpointNumber, currentTimestamp, credentials, profileObject, world }) => {
  try {
    const { profileId, sceneDropId, urlSlug, username, visitorId } = credentials;
    const { checkpoints, startTimestamp, highscore } = profileObject;

    if (checkpoints[checkpointNumber - 1]) return;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });

    if (checkpointNumber > 1 && !checkpoints[checkpointNumber - 2]) {
      await visitor.fireToast({
        groupId: "race",
        title: "❌ Wrong checkpoint",
        text: "Oops! Go back. You missed a checkpoint!",
      });
    } else {
      checkpoints[checkpointNumber - 1] = true;
      const currentElapsedTime = !startTimestamp ? null : formatElapsedTime(currentTimestamp - startTimestamp);

      await visitor.fireToast({
        groupId: "race",
        title: `✅ Checkpoint ${checkpointNumber}`,
        text: ENCOURAGEMENT_MESSAGES[checkpointNumber % ENCOURAGEMENT_MESSAGES.length],
      });

      await world.updateDataObject({
        [`${sceneDropId}.profiles.${profileId}`]: {
          checkpoints,
          elapsedTime: currentElapsedTime,
          highscore,
          startTimestamp,
          username,
        },
      });
    }

    return;
  } catch (error) {
    return error;
  }
};
