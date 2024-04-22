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
    const { elapsedTime } = req.body;
    const credentials = { interactiveNonce, interactivePublicKey, visitorId, assetId };

    if (!elapsedTime) {
      return res.status(400).json({ error: "Elapsed time is required" });
    }

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    const world = await World.create(urlSlug, { credentials });
    await world.fetchDataObject();

    if (!world?.dataObject?.race) {
      world.dataObject.race = {};
    }

    if (!world?.dataObject?.race?.leaderboard) {
      world.dataObject.race.leaderboard = {};
      await world.updateDataObject({ race });
    }

    const currentBestTime = world.dataObject.race.leaderboard?.[profileId]?.elapsedTime;

    if (!currentBestTime || timeToValue(elapsedTime) < timeToValue(currentBestTime)) {
      world.dataObject.race.leaderboard[profileId] = { username, elapsedTime };
      world
        .updateDataObject({
          [`race.leaderboard.${profileId}`]: { username, elapsedTime },
        })
        .then()
        .catch();
    }

    // Reset user time
    // world
    //   .updateDataObject({
    //     [`race.profiles.${profileId}`]: null,
    //   })
    //   .then()
    //   .catch();

    const leaderboard = world.dataObject.race.leaderboard;

    // visitor
    //   .fireToast({
    //     groupId: "race",
    //     title: "Finish",
    //     text: `You finished the race! Your time: ${elapsedTime}`,
    //   })
    //   .then()
    //   .catch();

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
