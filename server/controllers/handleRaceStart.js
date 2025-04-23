import { addNewRowToGoogleSheets, Visitor, World, errorHandler, getCredentials } from "../utils/index.js";
import redisObj from "../redis/redis.js";
import { WorldActivityType } from "@rtsdk/topia";

export const handleRaceStart = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId, profileId, sceneDropId } = credentials;
    const { identityId, displayName } = req.query;
    const startTimestamp = Date.now();

    redisObj.set(profileId, JSON.stringify({ 0: false }));

    const world = World.create(urlSlug, { credentials });
    world.triggerActivity({ type: WorldActivityType.GAME_ON, assetId });

    // move visitor to start line asset
    const startCheckpoint = (
      await world.fetchDroppedAssetsBySceneDropId({
        sceneDropId,
        uniqueName: "race-track-start",
      })
    )?.[0];
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    await visitor.moveVisitor({
      shouldTeleportVisitor: true,
      x: startCheckpoint?.position?.x,
      y: startCheckpoint?.position?.y,
    });

    // reset race data in World data object)
    await world.updateDataObject(
      {
        [`${sceneDropId}.profiles.${profileId}.checkpoints`]: {},
        [`${sceneDropId}.profiles.${profileId}.startTimestamp`]: startTimestamp,
      },
      { analytics: [{ analyticName: "starts", uniqueKey: profileId }] },
    );

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
