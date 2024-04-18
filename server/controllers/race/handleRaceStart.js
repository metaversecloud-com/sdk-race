import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleRaceStart = async (req, res) => {
  try {
    console.log("handleRaceStart");
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId, assetId } = req.query;
    const { startTimestamp } = req.body;

    const visitor = await Visitor.get(visitorId, urlSlug, {
      credentials: {
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });

    const world = World.create(urlSlug, {
      credentials: {
        assetId,
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, {
      credentials: {
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });

    const dataObject = await world.fetchDataObject();

    if (!dataObject.race) dataObject.race = {};
    if (!dataObject.race.profiles) dataObject.race.profiles = {};
    if (!dataObject.race.profiles[profileId]) dataObject.race.profiles[profileId] = {};

    dataObject.race.profiles[profileId].startTimestamp = startTimestamp;
    dataObject.race.profiles[profileId].waypoints = [];

    await Promise.all([
      world.updateDataObject(dataObject),
      visitor.moveVisitor({ shouldTeleportVisitor: true, x: droppedAsset?.position?.x, y: droppedAsset?.position?.y }),
    ]);

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleRaceStart",
      message: "Error starting the race",
      req,
      res,
    });
  }
};
