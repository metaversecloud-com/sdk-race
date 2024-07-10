import { World, Visitor } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleSwitchTrack = async (req, res) => {
  try {
    const {
      interactiveNonce,
      interactivePublicKey,
      urlSlug,
      visitorId,
      assetId,
      profileId,
      sceneDropId,
      trackSceneId,
    } = req.query;
    const now = Date.now();

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    const world = await World.create(urlSlug, { credentials });
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

    if (!visitor?.isAdmin) {
      return res.status(403).json({
        success: false,
        msg: "The user is not an admin. Perhaps the user is just a super admin but not an admin",
      });
    }

    const allRaceAssets = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });

    const raceTrackContainerAsset = allRaceAssets?.find((raceAsset) => {
      return raceAsset.uniqueName === "race-track-container";
    });

    if (!raceTrackContainerAsset || !raceTrackContainerAsset?.position) {
      return res.status(404).json({
        msg: "Race Track Container asset not found. Please surround the race with a big rectangle object with race-track-container uniqueName",
      });
    }

    let droppedAssetIds = [];
    for (const raceAsset in allRaceAssets) {
      droppedAssetIds.push(allRaceAssets?.[raceAsset]?.id);
    }

    await World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET, {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    });

    await world.dropScene({
      sceneId: trackSceneId,
      position: raceTrackContainerAsset?.position,
      sceneDropId,
    });

    const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "race-track-checkpoint",
      isPartial: true,
    });

    await world.updateDataObject({
      [`${sceneDropId}.profiles`]: {},
      [`${sceneDropId}.numberOfCheckpoints`]: numberOfCheckpoints?.length,
    });

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
