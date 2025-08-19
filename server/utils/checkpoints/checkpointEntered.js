import { ENCOURAGEMENT_MESSAGES } from "../../constants.js";
import { getVisitor, updateVisitorProgress } from "../visitors/index.js";

export const checkpointEntered = async ({ checkpoints, checkpointNumber, currentElapsedTime, credentials }) => {
  try {
    const { profileId } = credentials;

    const { visitor, visitorProgress } = await getVisitor(credentials);

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

    const result = await updateVisitorProgress({
      credentials,
      options: {
        analytics: [{ analyticName: `checkpointEntered${checkpointNumber}`, profileId, uniqueKey: profileId }],
      },
      updatedProgress: {
        checkpoints,
        elapsedTime: currentElapsedTime,
      },
      visitor,
      visitorProgress,
    });
    if (result instanceof Error) throw result;

    return;
  } catch (error) {
    return new Error(error);
  }
};
