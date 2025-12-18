import { errorHandler, getCredentials, getVisitor } from "../utils/index.js";

export const handleGetVisitorInventory = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);

    const { visitorInventory } = await getVisitor(credentials);

    return res.json({ success: true, visitorInventory });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetVisitorInventory",
      message: "Error getting visitor inventory",
      req,
      res,
    });
  }
};
