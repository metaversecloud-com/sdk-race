import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

function timeToValue(timeString) {
  const [minutes, seconds] = timeString.split(":");
  return parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
}

export const handleCompleteRace = async (req, res) => {
  try {
    console.log("handleCompleteRace");
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId, username } = req.query;
    const credentials = { interactiveNonce, interactivePublicKey, visitorId, assetId };

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
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
