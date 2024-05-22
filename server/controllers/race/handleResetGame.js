import { World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleResetGame = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId } = req.query;
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
    // await world.updateDataObject({
    //   race: {
    //     leaderboard: {},
    //     profiles: {},
    //     numberOfCheckpoints: numberOfCheckpoints?.length,
    //   },
    // });

    await world.updateDataObject({
      [`race.leaderboard`]: {},
      [`race.numberOfCheckpoints`]: numberOfCheckpoints?.length,
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
