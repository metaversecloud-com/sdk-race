import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleLoadGameState = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId } = req.query;
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

    const race = world?.dataObject?.race;

    if (!race) {
      const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "race-track-checkpoint",
        isPartial: true,
      });
      await world.updateDataObject({
        race: {
          leaderboard: {},
          profiles: {},
          numberOfCheckpoints: numberOfCheckpoints?.length,
        },
      });
    }

    const checkpointsCompleted = world?.dataObject?.race?.profiles[profileId]?.checkpoints;
    let startTimestamp = world?.dataObject?.race?.profiles[profileId]?.startTimestamp;
    const leaderboard = world?.dataObject?.race?.leaderboard;
    const numberOfCheckpoints = world?.dataObject?.race?.numberOfCheckpoints;

    // restart client race if the elapsed time is higher than 3 minutes
    if (startTimestamp && now - startTimestamp > 180000) {
      startTimestamp = now;
      await world.updateDataObject({
        [`race.profiles.${profileId}`]: null,
      });
    }

    const elapsedTimeInSeconds = startTimestamp ? Math.floor((now - startTimestamp) / 1000) : 0;

    return res.json({
      checkpointsCompleted,
      startTimestamp,
      leaderboard,
      numberOfCheckpoints,
      visitor,
      elapsedTimeInSeconds,
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
