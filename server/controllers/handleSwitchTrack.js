import { DEFAULT_PROGRESS } from "../constants.js";
import {
  DroppedAsset,
  World,
  errorHandler,
  getCredentials,
  getVisitor,
  updateVisitorProgress,
} from "../utils/index.js";

export const handleSwitchTrack = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug, sceneDropId } = credentials;
    const { trackSceneId } = req.query;

    const world = await World.create(urlSlug, { credentials });
    const { visitor } = await getVisitor(credentials);

    const allRaceAssets = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });

    const trackContainerAsset = allRaceAssets?.find((raceAsset) => {
      return raceAsset.uniqueName === "race-track-container";
    });

    let position = trackContainerAsset?.position;
    if (!trackContainerAsset || !position) {
      await world.fetchDataObject();
      position = world.dataObject?.[sceneDropId]?.position;
      if (!position) {
        return res.status(404).json({
          msg: "Race Track Container asset not found. Please surround the race with a big rectangle object with race-track-container uniqueName",
        });
      }
    }

    let droppedAssetIds = [];

    for (const raceAsset in allRaceAssets) {
      if (allRaceAssets?.[raceAsset]?.id !== assetId) {
        droppedAssetIds.push(allRaceAssets?.[raceAsset]?.id);
      }
    }

    await visitor.closeIframe(assetId).catch((error) =>
      errorHandler({
        error,
        functionName: "handleSwitchTrack",
        message: "Error closing iframe",
      }),
    );

    await World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET, credentials);

    await world.dropScene({
      allowNonAdmins: true,
      sceneId: trackSceneId,
      position,
      sceneDropId,
    });

    const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "race-track-checkpoint",
      isPartial: true,
    });

    await world.updateDataObject(
      {
        [`${sceneDropId}.numberOfCheckpoints`]: numberOfCheckpoints?.length,
        [`${sceneDropId}.leaderboard`]: {},
        [`${sceneDropId}.position`]: position,
      },
      { analytics: [{ analyticName: "trackUpdates", profileId, uniqueKey: profileId }] },
    );

    const updateVisitorResult = await updateVisitorProgress({
      credentials,
      updatedProgress: DEFAULT_PROGRESS,
      visitor,
    });
    if (updateVisitorResult instanceof Error) throw updateVisitorResult;

    const droppedAsset = DroppedAsset.create(assetId, urlSlug, { credentials });
    await droppedAsset.deleteDroppedAsset();

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleSwitchTrack",
      message: "Error in switch track",
      req,
      res,
    });
  }
};
