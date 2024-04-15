import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleLoadGameState = async (req, res) => {
  try {
    console.log("handleLoadGameState");
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId } = req.query;

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    const world = await World.create(urlSlug, { credentials });

    await world.fetchDataObject();
    const race = world?.dataObject?.race;

    if (!race) {
      const numberOfWaypoints = await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "race-track-waypoint",
        isPartial: true,
      });
      world.updateDataObject({
        race: {
          leaderboard: {},
          profiles: {},
          numberOfWaypoints: numberOfWaypoints?.length,
        },
      });
    }

    const waypointsCompleted = world?.dataObject?.race?.profiles[profileId]?.waypoints;
    const startTimestamp = world?.dataObject?.race?.profiles[profileId]?.startTimestamp;
    const leaderboard = world?.dataObject?.race?.leaderboard;
    const numberOfWaypoints = world?.dataObject?.race?.numberOfWaypoints;

    return res.json({ waypointsCompleted, startTimestamp, leaderboard, numberOfWaypoints, success: true });
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
