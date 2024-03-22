import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleCancelRace = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId } = req.query;
    const { elapsedTime } = req.body;

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    if (!elapsedTime) {
      return res.status(400).json({ error: "Elapsed time is required" });
    }

    const world = await World.create(urlSlug, { credentials });
    await world.fetchDataObject();

    if (!world?.dataObject?.raceApp) {
      world.dataObject.raceApp == {};
    }

    if (!world?.dataObject?.raceApp?.leaderboard) {
      world.dataObject.raceApp.leaderboard == {};
    }

    world.dataObject.raceApp.leaderboard[profileId] = elapsedTime;

    if (profileId) {
      world.dataObject.race.profiles[profileId].startTimestamp = null;
      world.dataObject.race.profiles[profileId].waypoints = [];
      world.dataObject.race.profiles[profileId] = {};
      await world.updateDataObject({ race: world.dataObject.race });
    }

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCancelRace",
      message: "Error canceling race",
      req,
      res,
    });
  }
};
