import { World, errorHandler, getCredentials } from "../utils/index.js";

export const handleResetGame = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, sceneDropId } = credentials;

    const world = await World.create(urlSlug, { credentials });

    await world.fetchDataObject();

    const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "race-track-checkpoint",
      isPartial: true,
    });

    await world.updateDataObject({
      [`${sceneDropId}.numberOfCheckpoints`]: numberOfCheckpoints?.length,
      [`${sceneDropId}.profiles`]: {},
    });

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleResetGame",
      message: "Error in reset game",
      req,
      res,
    });
  }
};
