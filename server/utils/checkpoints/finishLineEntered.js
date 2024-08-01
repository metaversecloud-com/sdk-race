import { Visitor } from "../topiaInit.js";

export const finishLineEntered = async ({ credentials, currentElapsedTime, profileObject, raceObject, world }) => {
  try {
    const { profileId, sceneDropId, urlSlug, username, visitorId } = credentials;
    const { checkpoints } = profileObject;
    const allCheckpointsCompleted = raceObject.numberOfCheckpoints === checkpoints.length;

    if (!allCheckpointsCompleted) return;

    const highscore =
      !profileObject.highscore || timeToValue(currentElapsedTime) < timeToValue(profileObject.highscore)
        ? currentElapsedTime
        : profileObject.highscore;

    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    const { x, y } = visitor.moveTo;

    await Promise.all(
      world.updateDataObject(
        {
          [`${sceneDropId}.profiles.${profileId}`]: {
            checkpoints: [],
            elapsedTime: currentElapsedTime,
            highscore,
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
        name: "Firework2_BlueGreen",
        duration: 3,
        position: { x, y },
      }),
    );

    return;
  } catch (error) {
    return error;
  }
};
