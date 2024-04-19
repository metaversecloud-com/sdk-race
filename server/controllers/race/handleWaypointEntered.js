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
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId } = req.body;
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

    // registerWaypointToWorldToDataObject({ req, res, urlSlug, profileId, waypointNumber, credentials })
    //   .then(() => {})
    //   .catch((error) => {
    //     console.error(JSON.stringify(error));
    //   });

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

async function registerWaypointToWorldToDataObject({ req, res, urlSlug, profileId, waypointNumber, credentials }) {
  const world = World.create(urlSlug, { credentials });
  const dataObject = await world.fetchDataObject();

  const raceObject = dataObject.race || {};
  const profilesObject = raceObject.profiles || {};
  const profileObject = profilesObject[profileId] || {};
  const waypoints = (profileObject.waypoints || []).slice();

  if (waypoints.length < waypointNumber - 1 || waypoints[waypointNumber - 1]) {
    return;
  }

  waypoints[waypointNumber - 1] = true;

  if (!dataObject.race) dataObject.race = {};
  if (!dataObject.race.profiles) dataObject.race.profiles = {};

  // User didn't start the race didn't start
  if (!dataObject.race.profiles?.[profileId]) {
    dataObject.race.profiles[profileId] = {};
  }

  dataObject.race.profiles[profileId].waypoints = waypoints;

  await world.updateDataObject(dataObject);
}
