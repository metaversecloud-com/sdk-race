import { createClient } from "redis";
import { errorHandler } from "../../utils/index.js";
import redisObj from "../../redis/redis.js";
import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";

const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.REDIS_URL?.startsWith("rediss"),
  },
});

redis.on("error", (err) => console.log("Redis Client Error", err));
await redis.connect();

export const handleWaypointEntered = async (req, res) => {
  try {
    console.log("handleWaypointEntered");
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId, username } = req.body;
    const { assetId, isInteractive, position, uniqueName, sceneDropId } = req.body;

    const credentials = {
      assetId,
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    };

    let waypointNumber;
    if (uniqueName === "race-track-start") {
      waypointNumber = 0;
    } else {
      waypointNumber = parseInt(uniqueName.split("-").pop(), 10);
    }

    redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
      profileId,
      waypointNumber,
      event: "waypoint-entered",
    });

    registerWaypointToWorldToDataObject({ req, res, urlSlug, profileId, waypointNumber, username, credentials })
      .then(() => {})
      .catch((error) => {
        console.error(JSON.stringify(error));
      });

    return res.status(200).json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleWaypointEntered",
      message: "Erro ao entrar no waypoint",
      req,
      res,
    });
  }
};

async function registerWaypointToWorldToDataObject({
  req,
  res,
  urlSlug,
  profileId,
  waypointNumber,
  username,
  credentials,
}) {
  const world = World.create(urlSlug, { credentials });
  const dataObject = await world.fetchDataObject();
  const raceObject = dataObject.race || {};
  const profilesObject = raceObject.profiles || {};
  const profileObject = profilesObject[profileId] || {};
  const waypoints = (profileObject.waypoints || []).slice();

  if (waypointNumber === 0) {
    const allWaypointsCompleted = raceObject.numberOfWaypoints === waypoints.length;

    // Race Finished
    if (allWaypointsCompleted) {
      if (!dataObject.race) dataObject.race = {};
      if (!dataObject.race.profiles) dataObject.race.profiles = {};
      if (!dataObject.race.profiles[profileId]) dataObject.race.profiles[profileId] = {};

      dataObject.race.profiles[profileId].waypoints = waypoints;

      // TODO: Calculate elapsedTime
      const startTimestamp = dataObject.race.profiles[profileId].startTimestamp;
      const currentTimestamp = Date.now();
      const elapsedMilliseconds = currentTimestamp - startTimestamp;

      const minutes = Math.floor(elapsedMilliseconds / 60000);
      const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);

      const elapsedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      const visitor = await Visitor.create(credentials.visitorId, urlSlug, { credentials });
      visitor
        .fireToast({
          groupId: "race",
          title: "Finish",
          text: `You finished the race! Your time: ${elapsedTime}`,
        })
        .then()
        .catch(() => {
          console.error(error);
        });

      // Update the leaderboard with best time
      const currentBestTime = world.dataObject.race.leaderboard?.[profileId]?.elapsedTime;
      if (!currentBestTime || timeToValue(elapsedTime) < timeToValue(currentBestTime)) {
        world.dataObject.race.leaderboard[profileId] = { username, elapsedTime };
        world
          .updateDataObject({
            [`race.leaderboard.${profileId}`]: { username, elapsedTime },
          })
          .then()
          .catch(() => {
            console.error(error);
          });
      }

      dataObject.race.profiles[profileId] = null;
      // Reset user time
      world
        .updateDataObject({
          [`race.profiles.${profileId}`]: null,
        })
        .then()
        .catch(() => {
          console.error(error);
        });
    } else {
      waypoints[0] = true;

      if (!dataObject.race) dataObject.race = {};
      if (!dataObject.race.profiles) dataObject.race.profiles = {};
      if (!dataObject.race.profiles[profileId]) dataObject.race.profiles[profileId] = {};

      dataObject.race.profiles[profileId].waypoints = waypoints;
    }
  } else {
    if (waypoints.length < waypointNumber - 1 || waypoints[waypointNumber - 1]) {
      return;
    }

    waypoints[waypointNumber - 1] = true;

    if (!dataObject.race) dataObject.race = {};
    if (!dataObject.race.profiles) dataObject.race.profiles = {};
    if (!dataObject.race.profiles[profileId]) {
      dataObject.race.profiles[profileId] = {};
    }

    dataObject.race.profiles[profileId].waypoints = waypoints;
  }

  await world.updateDataObject(dataObject);
}

function timeToValue(timeString) {
  const [minutes, seconds] = timeString.split(":");
  return parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
}
