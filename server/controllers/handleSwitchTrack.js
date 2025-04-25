import { World, Visitor, errorHandler, getCredentials } from "../utils/index.js";

export const handleSwitchTrack = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, interactiveNonce, interactivePublicKey, urlSlug, visitorId, sceneDropId } = credentials;
    const { trackSceneId } = req.query;

    const world = await World.create(urlSlug, { credentials });
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

    if (!visitor?.isAdmin) {
      return res.status(403).json({
        success: false,
        msg: "The user is not an admin.",
      });
    }

    const allRaceAssets = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });

    const trackContainerAsset = allRaceAssets?.find((raceAsset) => {
      return raceAsset.uniqueName === "race-track-container";
    });

    if (!trackContainerAsset || !trackContainerAsset?.position) {
      return res.status(404).json({
        msg: "Race Track Container asset not found. Please surround the race with a big rectangle object with race-track-container uniqueName",
      });
    }

    let droppedAssetIds = [];
    for (const raceAsset in allRaceAssets) {
      droppedAssetIds.push(allRaceAssets?.[raceAsset]?.id);
    }

    await World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET, credentials);

    await world.dropScene({
      sceneId: trackSceneId,
      position: trackContainerAsset?.position,
      sceneDropId,
    });

    const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "race-track-checkpoint",
      isPartial: true,
    });

    await world.updateDataObject(
      {
        [`${sceneDropId}.numberOfCheckpoints`]: numberOfCheckpoints?.length,
        [`${sceneDropId}.profiles`]: {},
      },
      { analytics: [{ analyticName: "trackUpdates", profileId, uniqueKey: profileId }] },
    );

    await visitor.closeIframe(assetId);

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
