import { errorHandler, World } from "../utils/index.js";

export const handleCancelRace = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId, sceneDropId } = req.query;

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

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
