import { World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const handleResetGame = async (req, res) => {
  try {
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, assetId } = req.query;
    const credentials = {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
      assetId,
    };
    const world = await World.create(urlSlug, { credentials });

    await world.setDataObject({});

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
