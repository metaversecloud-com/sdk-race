import { addNewRowToGoogleSheets, Visitor, World, errorHandler, getCredentials } from "../utils/index.js";

export const handleRaceStart = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId, sceneDropId } = credentials;
    const { identityId, displayName } = req.query;
    const startTimestamp = Date.now();

    const visitor = await Visitor.get(visitorId, urlSlug, {
      credentials: {
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });

    const world = World.create(urlSlug, { credentials });

    await world.fetchDataObject();

    const startCheckpoint = (
      await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "race-track-start",
        isPartial: false,
      })
    )?.[0];

    await Promise.all([
      world.updateDataObject(
        {
          [`${sceneDropId}.profiles.${profileId}.checkpoints`]: [],
          [`${sceneDropId}.profiles.${profileId}.startTimestamp`]: startTimestamp,
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
      identityId,
      displayName,
      appName: "Race",
      event: "starts",
      urlSlug,
    })
      .then()
      .catch((error) => console.error(JSON.stringify(error)));

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
