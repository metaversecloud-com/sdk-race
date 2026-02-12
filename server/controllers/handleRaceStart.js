import {
  addNewRowToGoogleSheets,
  World,
  errorHandler,
  getCredentials,
  getVisitor,
  updateVisitorProgress,
} from "../utils/index.js";
import redisObj from "../redis/redis.js";
import { WorldActivityType } from "@rtsdk/topia";

export const handleRaceStart = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, profileId, sceneDropId } = credentials;
    const { identityId, displayName } = req.query;
    const startTimestamp = Date.now();

    try {
      await redisObj.set(profileId, JSON.stringify({ checkpoints: { 0: false }, wasWrongCheckpointEntered: false }));
    } catch (error) {
      errorHandler({
        error,
        functionName: "handleRaceStart",
        message: "Error updating object in redis when race started",
      });
    }

    const world = World.create(urlSlug, { credentials });
    world.triggerActivity({ type: WorldActivityType.GAME_ON, assetId }).catch((error) =>
      errorHandler({
        error,
        functionName: "handleRaceStart",
        message: "Error triggering world activity",
      }),
    );

    // move visitor to start line asset
    const startCheckpoint = (
      await world.fetchDroppedAssetsBySceneDropId({
        sceneDropId,
        uniqueName: "race-track-start",
      })
    )?.[0];

    const { visitor, visitorProgress } = await getVisitor(credentials);
    await visitor.moveVisitor({
      shouldTeleportVisitor: true,
      x: startCheckpoint?.position?.x,
      y: startCheckpoint?.position?.y,
    });

    // reset race data
    const updateVisitorResult = await updateVisitorProgress({
      credentials,
      options: { analytics: [{ analyticName: "starts", uniqueKey: profileId }] },
      updatedProgress: {
        checkpoints: {},
        startTimestamp,
      },
      visitor,
      visitorProgress,
    });
    if (updateVisitorResult instanceof Error) throw updateVisitorResult;

    // Update world data object with last race started timestamp
    await world.updateDataObject(
      {
        [`${sceneDropId}.lastRaceStartedDate`]: startTimestamp,
      },
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
