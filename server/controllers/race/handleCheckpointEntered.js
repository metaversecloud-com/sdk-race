import { errorHandler } from "../../utils/index.js";
import redisObj from "../../redis/redis.js";
import { Visitor, World } from "../../utils/topiaInit.js";

export const handleCheckpointEntered = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId, username } = req.body;
    const { assetId, uniqueName } = req.body;

    const credentials = {
      assetId,
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    };

    let checkpointNumber;
    if (uniqueName === "race-track-start") {
      checkpointNumber = 0;
    } else {
      checkpointNumber = parseInt(uniqueName.split("-").pop(), 10);
    }

    let currentElapsedTime = null;
    const currentTimestamp = Date.now();
    if (checkpointNumber === 0) {
      const world = World.create(urlSlug, { credentials });
      const dataObject = await world.fetchDataObject();
      const raceObject = dataObject.race || {};
      const profilesObject = raceObject.profiles || {};
      const profileObject = profilesObject[profileId] || {};
      const checkpoints = (profileObject.checkpoints || []).slice();

      // Calculate and store the current elapsed time
      const startTimestamp = profileObject.startTimestamp || currentTimestamp;
      const elapsedMilliseconds = currentTimestamp - startTimestamp;

      const minutes = Math.floor(elapsedMilliseconds / 60000);
      const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
      const milliseconds = Math.floor((elapsedMilliseconds % 1000) / 10);

      currentElapsedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
    }

    redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
      profileId,
      checkpointNumber,
      currentRaceFinishedElapsedTime: currentElapsedTime,
      event: "checkpoint-entered",
    });

    await registerCheckpointToWorldToDataObject({
      req,
      res,
      urlSlug,
      profileId,
      checkpointNumber,
      username,
      currentTimestamp,
      credentials,
    });

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

async function registerCheckpointToWorldToDataObject({
  req,
  res,
  urlSlug,
  profileId,
  checkpointNumber,
  username,
  currentTimestamp,
  credentials,
}) {
  const world = World.create(urlSlug, { credentials });
  const dataObject = await world.fetchDataObject();
  const raceObject = dataObject.race || {};
  const profilesObject = raceObject.profiles || {};
  const profileObject = profilesObject[profileId] || {};
  const checkpoints = (profileObject.checkpoints || []).slice();

  // Calculate and store the current elapsed time
  const startTimestamp = profileObject.startTimestamp;

  if (!startTimestamp) {
    return;
  }

  const elapsedMilliseconds = currentTimestamp - startTimestamp;

  const minutes = Math.floor(elapsedMilliseconds / 60000);
  const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
  const milliseconds = Math.floor((elapsedMilliseconds % 1000) / 10);

  const currentElapsedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(2, "0")}`;

  // Checkpoint is the finish line, but users could enter the finish line without having finished the race
  if (checkpointNumber === 0) {
    const allCheckpointsCompleted = raceObject.numberOfCheckpoints === checkpoints.length;

    // Race Finished
    if (allCheckpointsCompleted) {
      await world.updateDataObject({
        [`race.profiles.${profileId}`]: {
          checkpoints: [],
          elapsedTime: currentElapsedTime,
        },
      });

      const visitor = await Visitor.create(credentials.visitorId, urlSlug, { credentials });
      visitor
        .fireToast({
          groupId: "race",
          title: "🏁 Finish",
          text: `You finished the race! Your time: ${currentElapsedTime}`,
        })
        .then()
        .catch(() => {
          console.error(error);
        });

      // Update the leaderboard with best time
      const currentBestTime = raceObject.leaderboard?.[profileId]?.elapsedTime;
      if (
        !currentBestTime ||
        timeToValue(currentElapsedTime) < timeToValue(currentBestTime) ||
        currentElapsedTime === "00:00"
      ) {
        await world.updateDataObject({
          [`race.leaderboard.${profileId}`]: { username, elapsedTime: currentElapsedTime },
        });
      }
    }
  } else {
    if (checkpoints[checkpointNumber - 1]) {
      return;
    }

    const visitor = await Visitor.create(credentials.visitorId, urlSlug, { credentials });

    // Verifica se o checkpoint anterior não foi visitado
    if (checkpointNumber > 1 && !checkpoints[checkpointNumber - 2]) {
      visitor
        .fireToast({
          groupId: "race",
          title: "❌ Wrong checkpoint",
          text: "Oops! Go back. You missed a checkpoint!",
        })
        .then()
        .catch((error) => {
          console.error(error);
        });
      return;
    }

    checkpoints[checkpointNumber - 1] = true;

    visitor
      .fireToast({
        groupId: "race",
        title: `✅ Checkpoint ${checkpointNumber}`,
        text: "Keep going!",
      })
      .then()
      .catch((error) => {
        console.error(error);
      });

    await world.updateDataObject({
      [`race.profiles.${profileId}`]: {
        checkpoints,
        startTimestamp,
        currentElapsedTime,
      },
    });
  }
}

function timeToValue(timeString) {
  const [minutesSeconds, milliseconds] = timeString.split(".");
  const [minutes, seconds] = minutesSeconds.split(":");
  return parseInt(minutes, 10) * 60000 + parseInt(seconds, 10) * 1000 + parseInt(milliseconds, 10) * 10;
}
