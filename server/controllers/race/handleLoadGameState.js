import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleLoadGameState = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId } = req.query;

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    const world = await World.create(urlSlug, { credentials });

    await world.fetchDataObject();
    const race = world?.dataObject?.race;

    if (!race) {
      world.updateDataObject({ race: {} });
    }

    const waypointsCompleted = world?.dataObject?.race?.profiles[profileId]?.waypoints;
    const startTimestamp = world?.dataObject?.race?.profiles[profileId]?.startTimestamp;

    return res.json({ waypointsCompleted, startTimestamp, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleLoadGameState",
      message: "Error loading game state",
      req,
      res,
    });
  }
};