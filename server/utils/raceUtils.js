import { Visitor, World, DroppedAsset } from "./utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

// Função auxiliar para converter o tempo de string para valor numérico
function timeToValue(timeString) {
  const [minutes, seconds] = timeString.split(":");
  return parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
}

export const completeRace = async (req, res) => {
  console.log("completeRace");
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
        [`race.profiles.${profileId}`]: null,
        [`race.leaderboard.${profileId}`]: { username, elapsedTime },
      })
      .then()
      .catch();
  }

  const leaderboard = world.dataObject.race.leaderboard;

  visitor
    .fireToast({
      groupId: "race",
      title: "🏁 Finish",
      text: `You finished the race! Your time: ${elapsedTime}`,
    })
    .then()
    .catch();

  return res.json({ success: true, leaderboard, elapsedTime });
};
