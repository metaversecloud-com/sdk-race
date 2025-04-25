import { errorHandler, getCredentials, World } from "../utils/index.js";

export const handleCancelRace = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, profileId, sceneDropId } = credentials;

    const world = await World.create(urlSlug, { credentials });

    if (profileId) {
      world
        .updateDataObject({
          [`${sceneDropId}.profiles.${profileId}.checkpoints`]: {},
          [`${sceneDropId}.profiles.${profileId}.elapsedTime`]: null,
          [`${sceneDropId}.profiles.${profileId}.startTimestamp`]: null,
        })
        .then()
        .catch((error) => console.error(JSON.stringify(error)));
    }

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCancelRace",
      message: "Error canceling race",
      req,
      res,
    });
  }
};
