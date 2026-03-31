import { Request, Response } from "express";
import { errorHandler, getCredentials, getVisitor } from "../utils/index.js";

export const handleGetVisitorInventory = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query as Record<string, any>);

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
