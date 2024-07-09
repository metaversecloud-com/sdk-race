import { World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleResetGame = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId, sceneDropId } = req.query;
    const now = Date.now();

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    const world = await World.create(urlSlug, { credentials });

    await world.fetchDataObject();

    const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "race-track-checkpoint",
      isPartial: true,
    });

    await world.updateDataObject({
      [`${sceneDropId}.leaderboard`]: {},
      [`${sceneDropId}.profiles`]: {},
      [`${sceneDropId}.numberOfCheckpoints`]: numberOfCheckpoints?.length,
    });

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleResetGame",
      message: "Error in reset game",
      req,
      res,
    });
  }
};
