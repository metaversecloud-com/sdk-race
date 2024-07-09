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

    const raceData = world?.dataObject?.[sceneDropId];
    await initializeRaceDataIfNeeded({ sceneDropId, raceData, world });

    let checkpointsCompleted = raceData?.profiles?.[profileId]?.checkpoints;
    let startTimestamp = raceData?.profiles?.[profileId]?.startTimestamp;
    const leaderboard = raceData?.leaderboard;
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

    const tracks = process.env.TRACKS ? JSON.parse(process.env.TRACKS) : TRACKS;

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
    await world.setDataObject({
      [sceneDropId]: world.dataObject.race,
      race: null,
    });
  }
}

async function initializeRaceDataIfNeeded({ sceneDropId, raceData, world }) {
  if (!raceData) {
    const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "race-track-checkpoint",
      isPartial: true,
    });
    await world.setDataObject({
      [sceneDropId]: {
        leaderboard: {},
        profiles: {},
        numberOfCheckpoints: numberOfCheckpoints?.length,
      },
    });
  }
}
