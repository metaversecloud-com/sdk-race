import { DEFAULT_PROGRESS } from "../constants.js";
import { World, errorHandler, getCredentials, updateVisitorProgress } from "../utils/index.js";

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
      [`${sceneDropId}.leaderboard`]: {},
    });

    const { visitor } = await getVisitor(credentials);

    const updateVisitorResult = await updateVisitorProgress({
      credentials,
      updatedProgress: DEFAULT_PROGRESS,
      visitor,
    });
    if (updateVisitorResult instanceof Error) throw updateVisitorResult;

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
