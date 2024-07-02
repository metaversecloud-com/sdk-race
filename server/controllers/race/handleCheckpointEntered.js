import { errorHandler } from "../../utils/index.js";
import { Visitor, World } from "../../utils/topiaInit.js";
import { ENCOURAGEMENT_MESSAGES, CHECKPOINT_NAMES } from "../../utils/constants.js";
import { getCredentials } from "../../utils/getCredentials.js";
import { formatElapsedTime, publishRaceEvent, timeToValue } from "../../utils/utils.js";

export const handleCheckpointEntered = async (req, res) => {
  try {
    const { urlSlug, profileId, username } = req.body;
    const credentials = getCredentials(req.body);
    const checkpointNumber = getCheckpointNumber(req.body.uniqueName);
    const currentTimestamp = Date.now();

    let currentElapsedTime = null;

    // Checkpoint zero is the finish line. It is handled different because you have to calculate the total race elapsed time.
    if (checkpointNumber === 0) {
      currentElapsedTime = await handleCheckpointZero(urlSlug, credentials, profileId, currentTimestamp);
    }

    /*  The code seems repetitive but the goal is to publish to the frontend as fast as possible, to feel like real time
     *  The background sync can be slower
     */
    await publishRaceEvent(profileId, checkpointNumber, currentElapsedTime);

    const world = World.create(urlSlug, { credentials });
    const dataObject = await world.fetchDataObject();
    const raceData = getRaceData(dataObject, profileId);

    // Background sync
    await updateRaceData(
      world,
      urlSlug,
      profileId,
      checkpointNumber,
      username,
      currentTimestamp,
      credentials,
      raceData,
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCheckpointEntered",
      message: "Erro when entering in the checkpoint",
      req,
      res,
    });
  }
};

async function handleCheckpointZero(urlSlug, credentials, profileId, currentTimestamp) {
  const world = World.create(urlSlug, { credentials });
  const dataObject = await world.fetchDataObject();
  const raceData = getRaceData(dataObject, profileId);

  const startTimestamp = raceData.startTimestamp || currentTimestamp;
  const elapsedMilliseconds = currentTimestamp - startTimestamp;

  const minutes = Math.floor(elapsedMilliseconds / 60000);
  const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
  const milliseconds = Math.floor((elapsedMilliseconds % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(2, "0")}`;
}

function getCheckpointNumber(uniqueName) {
  return uniqueName === CHECKPOINT_NAMES.START ? 0 : parseInt(uniqueName.split("-").pop(), 10);
}

function getRaceData(dataObject, profileId) {
  const raceObject = dataObject.race || {};
  const profilesObject = raceObject.profiles || {};
  return profilesObject[profileId] || {};
}

function calculateElapsedTime(startTimestamp, currentTimestamp) {
  if (!startTimestamp) return null;
  const elapsedMilliseconds = currentTimestamp - startTimestamp;
  return formatElapsedTime(elapsedMilliseconds);
}

async function updateRaceData(
  world,
  urlSlug,
  profileId,
  checkpointNumber,
  username,
  currentTimestamp,
  credentials,
  raceData,
) {
  if (checkpointNumber === 0) {
    return handleFinishLine(world, urlSlug, profileId, username, currentTimestamp, credentials, raceData);
  }
  return handleCheckpoint(world, urlSlug, profileId, checkpointNumber, currentTimestamp, credentials, raceData);
}

async function handleFinishLine(world, urlSlug, profileId, username, currentTimestamp, credentials, raceData) {
  const { checkpoints, startTimestamp } = raceData;
  const raceObject = (await world.fetchDataObject()).race || {};
  const allCheckpointsCompleted = raceObject.numberOfCheckpoints === checkpoints.length;

  if (!allCheckpointsCompleted) return;

  const currentElapsedTime = calculateElapsedTime(startTimestamp, currentTimestamp);
  const newHighscore = calculateHighscore(raceData, currentElapsedTime);

  await updateWorldDataForFinish(world, profileId, currentElapsedTime, newHighscore);
  notifyVisitorOfFinish(urlSlug, credentials, currentElapsedTime)
    .then()
    .catch((error) => console.error(JSON.stringify(error)));

  updateLeaderboard(world, raceObject, profileId, username, currentElapsedTime)
    .then()
    .catch((error) => console.error(JSON.stringify(error)));
}

async function handleCheckpoint(world, urlSlug, profileId, checkpointNumber, currentTimestamp, credentials, raceData) {
  const { checkpoints, startTimestamp, highscore } = raceData;

  if (checkpoints[checkpointNumber - 1]) return;
  if (checkpointNumber > 1 && !checkpoints[checkpointNumber - 2]) {
    notifyVisitorOfMissedCheckpoint(urlSlug, credentials)
      .then()
      .catch((error) => console.error(JSON.stringify(error)));

    return;
  }

  checkpoints[checkpointNumber - 1] = true;
  const currentElapsedTime = calculateElapsedTime(startTimestamp, currentTimestamp);

  notifyVisitorOfCheckpoint(urlSlug, credentials, checkpointNumber)
    .then()
    .catch((error) => console.error(JSON.stringify(error)));
  await updateWorldDataForCheckpoint(world, profileId, checkpoints, startTimestamp, currentElapsedTime, highscore);
}

async function updateWorldDataForFinish(world, profileId, currentElapsedTime, newHighscore) {
  await world.updateDataObject(
    {
      [`race.profiles.${profileId}`]: {
        checkpoints: [],
        elapsedTime: currentElapsedTime,
        highscore: newHighscore,
      },
    },
    { analytics: [{ analyticName: "completions", uniqueKey: profileId }] },
  );
}

async function notifyVisitorOfFinish(urlSlug, credentials, currentElapsedTime) {
  const visitor = await Visitor.get(credentials.visitorId, urlSlug, { credentials });
  await visitor.fireToast({
    groupId: "race",
    title: "🏁 Finish",
    text: `You finished the race! Your time: ${currentElapsedTime}`,
  });
  await triggerFinishParticle(visitor);
}

async function triggerFinishParticle(visitor) {
  const { x, y } = visitor.moveTo;
  await visitor.triggerParticle({
    name: "Firework2_BlueGreen",
    duration: 3,
    position: { x, y },
  });
}

async function updateLeaderboard(world, raceObject, profileId, username, currentElapsedTime) {
  const currentBestTime = raceObject.leaderboard?.[profileId]?.elapsedTime;
  if (
    !currentBestTime ||
    timeToValue(currentElapsedTime) < timeToValue(currentBestTime) ||
    currentElapsedTime === "00:00:00"
  ) {
    await world.updateDataObject({
      [`race.leaderboard.${profileId}`]: { username, elapsedTime: currentElapsedTime },
    });
  }
}

async function notifyVisitorOfMissedCheckpoint(urlSlug, credentials) {
  const visitor = await Visitor.create(credentials.visitorId, urlSlug, { credentials });
  await visitor.fireToast({
    groupId: "race",
    title: "❌ Wrong checkpoint",
    text: "Oops! Go back. You missed a checkpoint!",
  });
}

async function notifyVisitorOfCheckpoint(urlSlug, credentials, checkpointNumber) {
  const visitor = await Visitor.create(credentials.visitorId, urlSlug, { credentials });
  const text = ENCOURAGEMENT_MESSAGES[checkpointNumber % ENCOURAGEMENT_MESSAGES.length];
  await visitor.fireToast({
    groupId: "race",
    title: `✅ Checkpoint ${checkpointNumber}`,
    text,
  });
}

async function updateWorldDataForCheckpoint(
  world,
  profileId,
  checkpoints,
  startTimestamp,
  currentElapsedTime,
  highscore,
) {
  await world.updateDataObject({
    [`race.profiles.${profileId}`]: {
      checkpoints,
      startTimestamp,
      currentElapsedTime,
      highscore,
    },
  });
}

function calculateHighscore(profileObject, currentElapsedTime) {
  const currentHighscore = profileObject.highscore;
  return !currentHighscore || timeToValue(currentElapsedTime) < timeToValue(currentHighscore)
    ? currentElapsedTime
    : currentHighscore;
}
