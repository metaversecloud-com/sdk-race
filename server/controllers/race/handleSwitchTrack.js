import { World } from "../../utils/topiaInit.js";
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
    });

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