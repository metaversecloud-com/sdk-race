import { WorldActivityType } from "@rtsdk/topia";
import {
  World,
  errorHandler,
  getVisitor,
  awardBadge,
  isNewHighScoreTop3,
  timeToValue,
  updateVisitorProgress,
} from "../index.js";

export const finishLineEntered = async ({ credentials, currentElapsedTime, wasWrongCheckpointEntered, redisObj }) => {
  try {
    const { assetId, displayName, profileId, sceneDropId, urlSlug } = credentials;

    const promises = [];

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
      promises.push(
        world.triggerActivity({ type: WorldActivityType.GAME_HIGH_SCORE, assetId }).catch((error) =>
          errorHandler({
            error,
            functionName: "finishLineEntered",
            message: "Error triggering world activity",
          }),
        ),
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

    promises.push(
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
        ),
    );

    promises.push(
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
        ),
    );

    // Award Race Rookie badge if this is the visitor's first high score
    if (!visitorProgress.highScore) {
      promises.push(
        awardBadge({ credentials, visitor, visitorInventory, badgeName: "Race Rookie", redisObj, profileId }).catch(
          (error) =>
            errorHandler({
              error,
              functionName: "finishLineEntered",
              message: "Error awarding Race Rookie badge",
            }),
        ),
      );
    }

    // Award Top 3 Racer badge if newHighScore is in top 3 of leaderboard
    const shouldGetTop3Badge = await isNewHighScoreTop3(raceObject.leaderboard, newHighScore);
    if (shouldGetTop3Badge) {
      promises.push(
        awardBadge({ credentials, visitor, visitorInventory, badgeName: "Top 3 Racer", redisObj, profileId }).catch(
          (error) =>
            errorHandler({
              error,
              functionName: "finishLineEntered",
              message: "Error awarding Top 3 Racer badge",
            }),
        ),
      );
    }

    // Award Speed Demon badge if newHighScore is less than 30 seconds or Slow & Steady badge if more than 2 minutes
    const [min, sec, mili] = currentElapsedTime.split(":").map(Number);
    const totalSeconds = min * 60 + sec + mili / 100;
    if (totalSeconds < 30) {
      promises.push(
        awardBadge({ credentials, visitor, visitorInventory, badgeName: "Speed Demon", redisObj, profileId }).catch(
          (error) =>
            errorHandler({
              error,
              functionName: "finishLineEntered",
              message: "Error awarding Speed Demon badge",
            }),
        ),
      );
    } else if (totalSeconds > 120) {
      promises.push(
        awardBadge({ credentials, visitor, visitorInventory, badgeName: "Slow & Steady", redisObj, profileId }).catch(
          (error) =>
            errorHandler({
              error,
              functionName: "finishLineEntered",
              message: "Error awarding Slow & Steady badge",
            }),
        ),
      );
    }

    // Award Race Pro badge if visitor has completed 100 races or Race Expert badge if visitor has completed 1000 races
    if (visitor.dataObject.racesCompleted + 1 === 100) {
      promises.push(
        awardBadge({ credentials, visitor, visitorInventory, badgeName: "Race Pro", redisObj, profileId }).catch(
          (error) =>
            errorHandler({
              error,
              functionName: "finishLineEntered",
              message: "Error awarding Race Pro badge",
            }),
        ),
      );
    } else if (visitor.dataObject.racesCompleted + 1 === 1000) {
      promises.push(
        awardBadge({ credentials, visitor, visitorInventory, badgeName: "Race Expert", redisObj, profileId }).catch(
          (error) =>
            errorHandler({
              error,
              functionName: "finishLineEntered",
              message: "Error awarding Race Expert badge",
            }),
        ),
      );
    }

    // Award Never Give Up badge if visitor completed the race after previously entering a wrong checkpoint
    if (wasWrongCheckpointEntered) {
      promises.push(
        awardBadge({ credentials, visitor, visitorInventory, badgeName: "Never Give Up", redisObj, profileId }).catch(
          (error) =>
            errorHandler({
              error,
              functionName: "finishLineEntered",
              message: "Error awarding Never Give Up badge",
            }),
        ),
      );
    }

    // Award Track Completion badge for specific track by name if available
    promises.push(
      awardBadge({
        credentials,
        visitor,
        visitorInventory,
        badgeName: raceObject.trackName,
        redisObj,
        profileId,
      }).catch((error) =>
        errorHandler({
          error,
          functionName: "finishLineEntered",
          message: `Error awarding ${raceObject.trackName} completion badge`,
        }),
      ),
    );

    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === "rejected") console.error(result.reason);
    });

    return;
  } catch (error) {
    return new Error(error);
  }
};
