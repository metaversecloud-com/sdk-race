import { Visitor, World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleRaceStart = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId } = req.query;
    const { assetId, isInteractive, position, uniqueName } = req.body;

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

    const dataObject = await world.fetchDataObject();

    if (!dataObject.race) dataObject.race = {};
    if (!dataObject.race.profiles) dataObject.race.profiles = {};
    if (!dataObject.race.profiles[profileId]) dataObject.race.profiles[profileId] = {};

    dataObject.race.profiles[profileId].startTimestamp = Date.now();
    dataObject.race.profiles[profileId].waypoints = [];

    await Promise.all([
      world.updateDataObject(dataObject),
      visitor.moveVisitor({ shouldTeleportVisitor: true, x: 0, y: 0 }),
    ]);

    // await world.updateDataObject(dataObject);
    // await visitor.moveVisitor({ shouldTeleportVisitor: true, x: 0, y: 0 });

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
