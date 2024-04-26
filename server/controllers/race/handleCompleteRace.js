import { World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleCompleteRace = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId } = req.query;
    const credentials = { interactiveNonce, interactivePublicKey, visitorId, assetId };

    const world = await World.create(urlSlug, { credentials });
    await world.fetchDataObject();

    const elapsedTime = world?.dataObject?.race?.profiles?.[profileId]?.elapsedTime;

    const leaderboard = world.dataObject.race.leaderboard;

    return res.json({ success: true, leaderboard, elapsedTime });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCompleteRace",
      message: "Error completing race",
      req,
      res,
    });
  }
};
