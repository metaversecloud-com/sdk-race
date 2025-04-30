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

    await world.updateDataObject(
      {
        [`${sceneDropId}.profiles.${profileId}.checkpoints`]: {},
        [`${sceneDropId}.profiles.${profileId}.elapsedTime`]: currentElapsedTime,
        [`${sceneDropId}.profiles.${profileId}.startTimestamp`]: null,
        [`${sceneDropId}.profiles.${profileId}.highscore`]: newHighscore,
        [`${sceneDropId}.profiles.${profileId}.username`]: username,
      },
      { analytics: [{ analyticName: "completions", uniqueKey: profileId }] },
    );

    if (newHighscore !== highscore) world.triggerActivity({ type: WorldActivityType.GAME_HIGH_SCORE, assetId });

    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    const { x, y } = visitor.moveTo;

    visitor.fireToast({
      groupId: "race",
      title: "🏁 Finish",
      text: `You finished the race! Your time: ${currentElapsedTime}`,
    });
    visitor.triggerParticle({
      name: "trophy_float",
      duration: 3,
      position: { x, y },
    });

    return;
  } catch (error) {
    return error;
  }
};
