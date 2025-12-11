import { WorldActivityType } from "@rtsdk/topia";
import {
  World,
  errorHandler,
  getVisitor,
  grantBadge,
  isNewHighScoreTop3,
  timeToValue,
  updateVisitorProgress,
} from "../index.js";

export const finishLineEntered = async ({ credentials, currentElapsedTime, wasWrongCheckpointEntered }) => {
  try {
    const { assetId, displayName, profileId, sceneDropId, urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    const raceObject = world.dataObject?.[sceneDropId] || {};

    const { visitor, visitorProgress, visitorInventory } = await getVisitor(credentials);
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
      hasCompletedRace: true,
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

    // Grant Race Rookie badge if this is the visitor's first high score
    if (!visitorProgress.highScore) {
      grantBadge({ credentials, visitor, visitorInventory, badgeName: "Race Rookie" }).catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error granting Race Rookie badge",
        }),
      );
    }

    // Grant Top 3 Racer badge if newHighScore is in top 3 of leaderboard
    const shouldGetTop3Badge = await isNewHighScoreTop3(raceObject.leaderboard, newHighScore);
    if (shouldGetTop3Badge) {
      grantBadge({ credentials, visitor, visitorInventory, badgeName: "Top 3 Racer" }).catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error granting Top 3 Racer badge",
        }),
      );
    }

    // Grant Speed Demon badge if newHighScore is less than 30 seconds
    const [min, sec, mili] = currentElapsedTime.split(":").map(Number);
    const totalSeconds = min * 60 + sec + mili / 100;
    if (totalSeconds < 30) {
      grantBadge({ credentials, visitor, visitorInventory, badgeName: "Speed Demon" }).catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error granting Speed Demon badge",
        }),
      );
    }

    // Grant Race Pro badge if visitor has completed 100 races
    if (visitor.dataObject.racesCompleted + 1 >= 100) {
      grantBadge({ credentials, visitor, visitorInventory, badgeName: "Race Pro" }).catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error granting Race Pro badge",
        }),
      );
    }

    // Grant Race Expert badge if visitor has completed 1000 races
    if (visitor.dataObject.racesCompleted + 1 >= 1000) {
      grantBadge({ credentials, visitor, visitorInventory, badgeName: "Race Expert" }).catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error granting Race Expert badge",
        }),
      );
    }

    // Grant Never Give Up badge if visitor completed the race after previously entering a wrong checkpoint
    if (wasWrongCheckpointEntered) {
      grantBadge({ credentials, visitor, visitorInventory, badgeName: "Never Give Up" }).catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: "Error granting Never Give Up badge",
        }),
      );
    }

    return;
  } catch (error) {
    return new Error(error);
  }
};
