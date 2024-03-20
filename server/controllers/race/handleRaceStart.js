import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleRaceStart = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId, assetId } = req.query;

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

    const startTimestamp = Date.now();
    dataObject.race.profiles[profileId].startTimestamp = startTimestamp;
    dataObject.race.profiles[profileId].waypoints = [];

    await Promise.all([
      world.updateDataObject(dataObject),
      visitor.moveVisitor({ shouldTeleportVisitor: true, x: droppedAsset?.position?.x, y: droppedAsset?.position?.y }),
    ]);

    // await world.updateDataObject(dataObject);
    // await visitor.moveVisitor({ shouldTeleportVisitor: true, x: 0, y: 0 });

    return res.json({ startTimestamp, success: true });
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
