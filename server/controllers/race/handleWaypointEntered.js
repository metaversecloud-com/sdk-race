import Redis from "ioredis";
import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";
const redis = new Redis();

export const handleWaypointEntered = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId } = req.body;
    const { assetId, isInteractive, position, uniqueName, sceneDropId } = req.body;

    const credentials = {
      assetId,
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    };

    const waypointNumber = parseInt(uniqueName.split("-").pop(), 10);

    redis.publish(`events:${profileId}`, JSON.stringify({ profileId, waypointNumber }));

    return res.status(200).json({ success: true });
    // const world = World.create(urlSlug, { credentials });

    // const dataObject = await world.fetchDataObject();

    // const raceObject = dataObject.race || {};
    // const profilesObject = raceObject.profiles || {};
    // const profileObject = profilesObject[profileId] || {};
    // const waypointsCompleted = (profileObject.waypoints || []).slice();

    // if (waypointsCompleted.length < waypointNumber - 1 || waypointsCompleted[waypointNumber - 1]) {
    //   return res
    //     .status(400)
    //     .json({ error: "Wrong waypoint order. You need to enter the waypoints in the correct order" });
    // }

    // waypointsCompleted[waypointNumber - 1] = true;

    // if (!dataObject.race) dataObject.race = {};
    // if (!dataObject.race.profiles) dataObject.race.profiles = {};

    // // User didn't start the race didn't start
    // if (!dataObject.race.profiles[profileId]) {
    //   const visitor = Visitor.create(urlSlug, { credentials });

    //   const droppedAsset = DroppedAsset.create();
    //   dataObject.race.profiles[profileId] = {};
    // }

    // dataObject.race.profiles[profileId].waypoints = waypointsCompleted;

    // await world.updateDataObject(dataObject);

    // return res.json({
    //   waypointsCompleted,
    //   startTimestamp: dataObject.race.profiles[profileId].startTimestamp,
    //   success: true,
    // });
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
