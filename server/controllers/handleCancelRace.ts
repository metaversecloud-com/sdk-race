import { Request, Response } from "express";
import { errorHandler, getCredentials, getVisitor, updateVisitorProgress } from "../utils/index.js";

export const handleCancelRace = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query as Record<string, any>);

    const { visitor, visitorProgress } = await getVisitor(credentials);

    const updateVisitorResult = await updateVisitorProgress({
      credentials,
      updatedProgress: {
        checkpoints: {},
        elapsedTime: null,
        startTimestamp: null,
      },
      visitor,
      visitorProgress,
    });
    if (updateVisitorResult instanceof Error) throw updateVisitorResult;

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
