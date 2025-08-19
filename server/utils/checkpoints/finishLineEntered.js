import { WorldActivityType } from "@rtsdk/topia";
import { World, getVisitor, timeToValue, updateVisitorProgress } from "../index.js";

export const finishLineEntered = async ({ credentials, currentElapsedTime }) => {
  try {
    const { assetId, displayName, profileId, sceneDropId, urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    const raceObject = world.dataObject?.[sceneDropId] || {};

    const { visitor, visitorProgress } = await getVisitor(credentials);
    const { checkpoints, highScore } = visitorProgress;

    const allCheckpointsCompleted = raceObject.numberOfCheckpoints === Object.keys(checkpoints).length;
    if (!allCheckpointsCompleted) return;

    const newHighScore =
      !highScore || timeToValue(currentElapsedTime) < timeToValue(highScore) ? currentElapsedTime : highScore;

    if (newHighScore !== highScore) {
      world.triggerActivity({ type: WorldActivityType.GAME_HIGH_SCORE, assetId }).catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error triggering world activity",
        }),
      );
    }

    await world.updateDataObject({
      [`${sceneDropId}.leaderboard.${profileId}`]: `${displayName}|${newHighScore}`,
    });

    const updateVisitorResult = await updateVisitorProgress({
      credentials,
      options: { analytics: [{ analyticName: "completions", uniqueKey: profileId }] },
      updatedProgress: {
        checkpoints: {},
        elapsedTime: currentElapsedTime,
        startTimestamp: null,
        highScore: newHighScore,
      },
      visitor,
      visitorProgress,
    });
    if (updateVisitorResult instanceof Error) throw updateVisitorResult;

    visitor
      .fireToast({
        groupId: "race",
        title: "🏁 Finish",
        text: `You finished the race! Your time: ${currentElapsedTime}`,
      })
      .catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error firing toast",
        }),
      );

    visitor
      .triggerParticle({
        name: "trophy_float",
        duration: 3,
      })
      .catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error triggering particle effects",
        }),
      );

    return;
  } catch (error) {
    return new Error(error);
  }
};
