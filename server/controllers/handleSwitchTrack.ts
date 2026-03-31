import { Request, Response } from "express";
import { DEFAULT_PROGRESS } from "../constants.js";
import {
  DroppedAsset,
  World,
  errorHandler,
  getCredentials,
  getVisitor,
  updateVisitorProgress,
} from "../utils/index.js";
import { Track } from "../../shared/types/index.js";

export const handleSwitchTrack = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query as Record<string, any>);
    const { assetId, profileId, urlSlug, sceneDropId } = credentials;
    const { selectedTrack } = req.body as { selectedTrack: Track };
    const { sceneId, name } = selectedTrack;

    const world = await (World as any).create(urlSlug, { credentials });
    const { visitor } = await getVisitor(credentials);

    const allRaceAssets = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });

    const trackContainerAsset = allRaceAssets?.find((raceAsset: any) => {
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

    const droppedAssetIds: string[] = [];

    for (const raceAsset in allRaceAssets) {
      if (allRaceAssets?.[raceAsset]?.id !== assetId) {
        droppedAssetIds.push(allRaceAssets?.[raceAsset]?.id);
      }
    }

    await visitor.closeIframe(assetId).catch((error: any) =>
      errorHandler({
        error,
        functionName: "handleSwitchTrack",
        message: "Error closing iframe",
      }),
    );

    await (World as any).deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET, credentials);

    await world.dropScene({
      allowNonAdmins: true,
      sceneId,
      position,
      sceneDropId,
    });

    const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "race-track-checkpoint",
      isPartial: true,
    });

    const sceneData = {
      trackName: name,
      numberOfCheckpoints: numberOfCheckpoints?.length,
      leaderboard: {},
      position,
    };

    await world.updateDataObject(
      {
        [sceneDropId]: sceneData,
      },
      { analytics: [{ analyticName: "trackUpdates", profileId, uniqueKey: profileId }] },
    );

    const updateVisitorResult = await updateVisitorProgress({
      credentials,
      updatedProgress: DEFAULT_PROGRESS,
      visitor,
    });
    if (updateVisitorResult instanceof Error) throw updateVisitorResult;

    const droppedAsset = (DroppedAsset as any).create(assetId, urlSlug, { credentials });
    await droppedAsset.deleteDroppedAsset();

    return res.json({ success: true, sceneData });
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
