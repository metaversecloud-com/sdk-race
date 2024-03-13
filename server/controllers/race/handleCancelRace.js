import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleCancelRace = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId } = req.query;

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    const world = await World.create(urlSlug, { credentials });

    await world.fetchDataObject();

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
