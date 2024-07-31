import { Visitor, World, errorHandler, getCredentials } from "../utils/index.js";
import { TRACKS } from "../constants.js";

export const handleLoadGameState = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, profileId, sceneDropId, visitorId } = credentials;
    const now = Date.now();

    const world = await World.create(urlSlug, { credentials });

    const result = await Promise.all([world.fetchDataObject(), Visitor.get(visitorId, urlSlug, { credentials })]);
    const visitor = result?.[1];

    if (world.dataObject?.race && !world.dataObject?.[sceneDropId]) {
      await migrateRaceDataIfNeeded({ world, sceneDropId });
    } else if (!world?.dataObject?.[sceneDropId]) {
      await initializeRaceDataIfNeeded({ sceneDropId, world });
    }

    const raceData = world?.dataObject?.[sceneDropId];

    let checkpointsCompleted = raceData?.profiles?.[profileId]?.checkpoints;
    let startTimestamp = raceData?.profiles?.[profileId]?.startTimestamp;
    const leaderboard = raceData?.profiles;
    const profile = raceData?.profiles?.[profileId];
    const numberOfCheckpoints = raceData?.numberOfCheckpoints;

    let elapsedTimeInSeconds = startTimestamp ? Math.floor((now - startTimestamp) / 1000) : 0;

    // restart client race if the elapsed time is higher than 3 minutes
    if (startTimestamp && now - startTimestamp > 180000) {
      startTimestamp = null;
      checkpointsCompleted = [];
      elapsedTimeInSeconds = null;

      const lockId = `${sceneDropId}-${profileId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      await world.updateDataObject(
        {
          [`${sceneDropId}.profiles.${profileId}`]: {},
        },
        { lock: { lockId, releaseLock: true } },
      );
    }

    const tracks = parseEnvJson(process.env.TRACKS) || TRACKS;

    return res.json({
      checkpointsCompleted,
      startTimestamp,
      leaderboard,
      numberOfCheckpoints,
      visitor,
      elapsedTimeInSeconds,
      profile,
      tracks,
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleLoadGameState",
      message: "Error loading game state",
      req,
      res,
    });
  }
};

async function migrateRaceDataIfNeeded({ world, sceneDropId }) {
  const { profiles, numberOfCheckpoints, leaderboard } = world.dataObject.race;

  const updatedProfiles = Object.entries(profiles).reduce((acc, [key, value]) => {
    if (!acc[key]) return;
    acc[key] = {
      ...value,
      highscore: value.elapsedTime,
      username: leaderboard[key]?.username,
    };
    delete acc[key].elapsedTime;
    return acc;
  }, {});

  const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
  await world.setDataObject(
    {
      [sceneDropId]: {
        profiles: updatedProfiles,
        numberOfCheckpoints,
      },
      race: null,
    },
    { lock: { lockId, releaseLock: true } },
  );
}

async function initializeRaceDataIfNeeded({ sceneDropId, world }) {
  const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
    uniqueName: "race-track-checkpoint",
    isPartial: true,
  });

  const data = {
    [sceneDropId]: {
      profiles: {},
      numberOfCheckpoints: numberOfCheckpoints?.length,
    },
  };
  const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

  if (Object.keys(world?.dataObject || {}).length === 0) {
    return world.setDataObject(data, { lock: { lockId, releaseLock: true } });
  } else {
    await world.updateDataObject(data, { lock: { lockId, releaseLock: true } });
  }
}

const parseEnvJson = (envVar) => {
  try {
    if (!envVar) throw new Error("Environment variable is undefined");

    const unescapedJson = envVar.replace(/\\"/g, '"');

    return JSON.parse(unescapedJson);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    throw error;
  }
};
