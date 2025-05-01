import { Visitor } from "../index.js";
import { formatElapsedTime } from "../utils.js";
import { ENCOURAGEMENT_MESSAGES } from "../../constants.js";

export const checkpointEntered = async ({ checkpointNumber, currentTimestamp, credentials, profileObject, world }) => {
  try {
    const { profileId, sceneDropId, urlSlug, visitorId } = credentials;
    const { checkpoints, startTimestamp } = profileObject;

    if (checkpoints[checkpointNumber - 1]) return;

    checkpoints[checkpointNumber - 1] = true;
    const currentElapsedTime = !startTimestamp ? null : formatElapsedTime(currentTimestamp - startTimestamp);

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    await visitor
      .fireToast({
        groupId: "race",
        title: `✅ Checkpoint ${checkpointNumber}`,
        text: ENCOURAGEMENT_MESSAGES[checkpointNumber % ENCOURAGEMENT_MESSAGES.length],
      })
      .catch((error) =>
        errorHandler({
          error,
          functionName: "checkpointEntered",
          message: "Error firing toast",
        }),
      );

    await world.updateDataObject(
      {
        [`${sceneDropId}.profiles.${profileId}.checkpoints.${checkpointNumber - 1}`]: true,
        [`${sceneDropId}.profiles.${profileId}.elapsedTime`]: currentElapsedTime,
        [`${sceneDropId}.profiles.${profileId}.startTimestamp`]: startTimestamp,
      },
      { analytics: [{ analyticName: `checkpointEntered${checkpointNumber}`, profileId, uniqueKey: profileId }] },
    );

    return;
  } catch (error) {
    return error;
  }
};
