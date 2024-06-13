import { Visitor, World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";
import { addNewRowToGoogleSheets } from "../../utils/addNewRowToGoogleSheets.js";

export const handleRaceStart = async (req, res) => {
  try {
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
      world.updateDataObject(
        {
          [`race.profiles.${profileId}.startTimestamp`]: startTimestamp,
          [`race.profiles.${profileId}.checkpoints`]: [],
        },
        { analytics: [{ analyticName: "starts", uniqueKey: profileId }] },
      ),
      visitor.moveVisitor({
        shouldTeleportVisitor: true,
        x: startCheckpoint?.position?.x,
        y: startCheckpoint?.position?.y,
      }),
    ]);

    addNewRowToGoogleSheets({
      identityId: req?.query?.identityId,
      displayName: req?.query?.displayName,
      appName: "Race",
      event: "starts",
      urlSlug,
    })
      .then()
      .catch();

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
