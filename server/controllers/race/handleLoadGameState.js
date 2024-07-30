import { Visitor, World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";
import { TRACKS } from "../../utils/constants.js";

export const handleLoadGameState = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId, sceneDropId } = req.query;
    const now = Date.now();

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    const world = await World.create(urlSlug, { credentials });

    const result = await Promise.all([world.fetchDataObject(), Visitor.get(visitorId, urlSlug, { credentials })]);
    const visitor = result?.[1];

    await migrateRaceDataIfNeeded({ world, sceneDropId });

    await initializeRaceDataIfNeeded({ sceneDropId, raceData: world?.dataObject?.[sceneDropId], world });
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
      await world.updateDataObject({
        [`${sceneDropId}.profiles.${profileId}`]: null,
      });
    }

    // const tracks = process.env.TRACKS ? JSON.parse(process.env.TRACKS) : TRACKS;
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
  if (world.dataObject?.race && !world.dataObject?.[sceneDropId]) {
    const { profiles, numberOfCheckpoints, leaderboard } = world.dataObject.race;

    const updatedProfiles = Object.entries(profiles).reduce((acc, [key, value]) => {
      acc[key] = {
        ...value,
        highscore: value.elapsedTime,
        username: leaderboard[key]?.username,
      };
      delete acc[key].elapsedTime;
      return acc;
    }, {});

    const newDataObject = {
      [sceneDropId]: {
        profiles: updatedProfiles,
        numberOfCheckpoints,
      },
      race: null,
    };

    await world.setDataObject(newDataObject);
  }
}

async function initializeRaceDataIfNeeded({ sceneDropId, raceData, world }) {
  if (!raceData) {
    const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "race-track-checkpoint",
      isPartial: true,
    });

    if (Object.keys(world?.dataObject || {}).length === 0) {
      return world.setDataObject({
        [sceneDropId]: {
          profiles: {},
          numberOfCheckpoints: numberOfCheckpoints?.length,
        },
      });
    }
    await world.updateDataObject({
      [sceneDropId]: {
        profiles: {},
        numberOfCheckpoints: numberOfCheckpoints?.length,
      },
    });
  }
}

const parseEnvJson = (envVar) => {
  if (!envVar) {
    throw new Error("Environment variable is undefined");
  }

  const unescapedJson = envVar.replace(/\\"/g, '"');

  try {
    return JSON.parse(unescapedJson);
  } catch (error) {
    console.error("Error parsing JSON:", error);

    throw error;
  }
};
