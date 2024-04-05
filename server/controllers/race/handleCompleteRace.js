import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

/* This functions completes the race
 * Reset the game for that user
 * Update the leaderboard with the elapsed time of the user
 */
export const handleCompleteRace = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId, username } = req.query;
    const { elapsedTime } = req.body;

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    if (!elapsedTime) {
      return res.status(400).json({ error: "Elapsed time is required" });
    }

    const world = await World.create(urlSlug, { credentials });
    await world.fetchDataObject();

    if (!world?.dataObject?.race) {
      world.dataObject.race == {};
    }

    if (!world?.dataObject?.race?.leaderboard) {
      world.dataObject.race.leaderboard = {};
      await world.updateDataObject({ race });
    }

    world.dataObject.race.leaderboard[profileId] = { username, elapsedTime };

    const leaderboard = world.dataObject.race.leaderboard;

    await world.updateDataObject({
      [`race.profiles.${profileId}`]: null,
      [`race.leaderboard.${profileId}`]: { username, elapsedTime },
    });

    return res.json({ success: true, leaderboard });
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
