import { Visitor, World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

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

    const world = World.create(urlSlug, { credentials });

    const dataObject = await world.fetchDataObject();

    const raceObject = dataObject.race || {};
    const profilesObject = raceObject.profiles || {};
    const profileObject = profilesObject[profileId] || {};
    const waypointsCompleted = (profileObject.waypoints || []).slice();

    if (waypointsCompleted.length < waypointNumber - 1 || waypointsCompleted[waypointNumber - 1]) {
      return res
        .status(400)
        .json({ error: "Wrong waypoint order. You need to enter the waypoints in the correct order" });
    }

    waypointsCompleted[waypointNumber - 1] = true;

    if (!dataObject.race) dataObject.race = {};
    if (!dataObject.race.profiles) dataObject.race.profiles = {};
    if (!dataObject.race.profiles[profileId]) dataObject.race.profiles[profileId] = {};

    dataObject.race.profiles[profileId].waypoints = waypointsCompleted;

    await world.updateDataObject(dataObject);

    return res.json({
      waypointsCompleted,
      startTimestamp: dataObject.race.profiles[profileId].startTimestamp,
      success: true,
    });
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
