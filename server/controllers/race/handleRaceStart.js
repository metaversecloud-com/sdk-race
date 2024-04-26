import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleRaceStart = async (req, res) => {
  try {
    console.log("handleRaceStart");
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId, assetId } = req.query;
    const startTimestamp = Date.now();

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

    const startCheckpoint = (
      await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "race-track-start",
        isPartial: false,
      })
    )?.[0];

    await Promise.all([
      world.updateDataObject({
        [`race.profiles.${profileId}.startTimestamp`]: startTimestamp,
        [`race.profiles.${profileId}.checkpoints`]: [],
      }),
      visitor.moveVisitor({
        shouldTeleportVisitor: true,
        x: startCheckpoint?.position?.x,
        y: startCheckpoint?.position?.y,
      }),
    ]);

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
