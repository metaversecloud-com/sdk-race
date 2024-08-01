import { Visitor } from "../index.js";
import { formatElapsedTime } from "../utils.js";
import { ENCOURAGEMENT_MESSAGES } from "../../constants.js";

export const checkpointEntered = async ({ checkpointNumber, currentTimestamp, credentials, profileObject, world }) => {
  try {
    const { profileId, sceneDropId, urlSlug, username, visitorId } = credentials;
    const { checkpoints, startTimestamp, highscore } = profileObject;
    const promises = [];

    if (checkpoints[checkpointNumber - 1]) return;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });

    if (checkpointNumber > 1 && !checkpoints[checkpointNumber - 2]) {
      promises.push(
        visitor.fireToast({
          groupId: "race",
          title: "❌ Wrong checkpoint",
          text: "Oops! Go back. You missed a checkpoint!",
        }),
      );
    } else {
      checkpoints[checkpointNumber - 1] = true;
      const currentElapsedTime = !startTimestamp ? null : formatElapsedTime(currentTimestamp - startTimestamp);

      const text = ENCOURAGEMENT_MESSAGES[checkpointNumber % ENCOURAGEMENT_MESSAGES.length];
      promises.push(
        visitor.fireToast({
          groupId: "race",
          title: `✅ Checkpoint ${checkpointNumber}`,
          text,
        }),
        world.updateDataObject({
          [`${sceneDropId}.profiles.${profileId}`]: {
            checkpoints,
            elapsedTime: currentElapsedTime,
            highscore,
            startTimestamp,
            username,
          },
        }),
      );
    }

    await Promise.all(promises);

    return;
  } catch (error) {
    return error;
  }
};
