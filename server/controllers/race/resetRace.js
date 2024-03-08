import { Visitor, World } from "../../utils/topiaInit.js";
import { errorHandler } from "../../utils/index.js";

export const resetRace = async (req, res) => {
  try {
    const { urlSlug } = req.query;

    const world = World.create(urlSlug, { credentials });
    await world.setDataObject({});
    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "resetRace",
      message: "Error while reseting the race",
      req,
      res,
    });
  }
};
