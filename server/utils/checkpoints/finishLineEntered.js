import { WorldActivityType } from "@rtsdk/topia";
import { Visitor } from "../topiaInit.js";
import { timeToValue } from "../utils.js";

export const finishLineEntered = async ({ credentials, currentElapsedTime, profileObject, raceObject, world }) => {
  try {
    const { profileId, sceneDropId, urlSlug, username, visitorId } = credentials;
    const { checkpoints, highscore } = profileObject;
    const allCheckpointsCompleted = raceObject.numberOfCheckpoints === Object.keys(checkpoints).length;

    if (!allCheckpointsCompleted) return;

    const newHighscore =
      !highscore || timeToValue(currentElapsedTime) < timeToValue(highscore) ? currentElapsedTime : highscore;

    if (newHighscore !== highscore) world.triggerActivity({ type: WorldActivityType.GAME_HIGH_SCORE, assetId });

    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    const { x, y } = visitor.moveTo;

    await Promise.all(
      world.updateDataObject(
        {
          [`${sceneDropId}.profiles.${profileId}`]: {
            checkpoints: {},
            elapsedTime: currentElapsedTime,
            highscore: newHighscore,
            startTimestamp: null,
            username,
          },
        },
        { analytics: [{ analyticName: "completions", uniqueKey: profileId }] },
      ),
      visitor.fireToast({
        groupId: "race",
        title: "🏁 Finish",
        text: `You finished the race! Your time: ${currentElapsedTime}`,
      }),
      visitor.triggerParticle({
        name: "trophy_float",
        duration: 3,
        position: { x, y },
      }),
    );

    return;
  } catch (error) {
    return error;
  }
};
