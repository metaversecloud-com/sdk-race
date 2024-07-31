import { World, errorHandler, getCredentials } from "../utils/index.js";

export const handleCompleteRace = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, profileId } = credentials;

    const world = await World.create(urlSlug, { credentials });
    await world.fetchDataObject();

    const elapsedTime = world?.dataObject?.sceneDropId?.profiles?.[profileId]?.elapsedTime;

    return res.json({ success: true, elapsedTime });
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
