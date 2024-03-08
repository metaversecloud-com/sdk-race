import { Visitor, World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleWaypointEntered = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId } = req.body;
    const { assetId, isInteractive, position, uniqueName, sceneDropId } = req.body;

    const profileId = "myProfileId";

    const credentials = {
      assetId,
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    };

    const waypointNumber = parseInt(uniqueName.split("-").pop(), 10);

    const world = World.create(urlSlug, { credentials });

    const dataObject = await world.fetchDataObject();

    // await world.setDataObject({});

    const raceObject = dataObject.race || {};
    const sceneDropObject = raceObject[sceneDropId] || {};
    const profilesObject = sceneDropObject.profiles || {};
    const profileObject = profilesObject[profileId] || {};
    const completedWaypoints = (profileObject.waypoints || []).slice();

    if (completedWaypoints.length >= waypointNumber - 1 && !completedWaypoints[waypointNumber - 1]) {
      completedWaypoints[waypointNumber - 1] = true;

      if (!dataObject.race) {
        dataObject.race = {};
      }
      if (!dataObject.race[sceneDropId]) {
        dataObject.race[sceneDropId] = { profiles: {} };
      }
      if (!dataObject.race[sceneDropId].profiles[profileId]) {
        dataObject.race[sceneDropId].profiles[profileId] = {};
      }

      dataObject.race[sceneDropId].profiles[profileId].waypoints = completedWaypoints;

      await world.updateDataObject(dataObject);

      return res.json({ completedWaypoints, success: true });
    } else {
      return res.status(400).json({ error: "Você precisa completar os waypoints na ordem correta." });
    }
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
