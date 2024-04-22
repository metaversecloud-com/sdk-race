import { Visitor, World, DroppedAsset } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleCancelRace = async (req, res) => {
  try {
    console.log("handleCancelRace");
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId, profileId } = req.query;

    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };

    const world = await World.create(urlSlug, { credentials });

    // await world.fetchDataObject();

    if (profileId) {
      world
        .updateDataObject({
          [`race.profiles.${profileId}`]: null,
        })
        .then()
        .catch();
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
