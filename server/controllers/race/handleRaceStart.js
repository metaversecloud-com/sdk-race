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
        { analytics: ["starts"], uniqueKey: profileId },
      ),
      visitor.moveVisitor({
        shouldTeleportVisitor: true,
        x: startCheckpoint?.position?.x,
        y: startCheckpoint?.position?.y,
      }),
    ]);

    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const formattedTime = now.toISOString().split("T")[1].split(".")[0];
    const identityId = req?.query?.identityId;
    const displayName = req?.query?.displayName;

    addNewRowToGoogleSheets({
      req,
      visitor,
      dataRowToBeInsertedInGoogleSheets: [formattedDate, formattedTime, identityId, displayName, "Race", "starts"],
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
