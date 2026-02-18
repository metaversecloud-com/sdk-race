import { Request, Response } from "express";
import { errorHandler, formatLeaderboard, getCredentials, World } from "../utils/index.js";

export const handleGetLeaderboard = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query as Record<string, any>);
    const { profileId, urlSlug, sceneDropId } = credentials;

    const world = await (World as any).create(urlSlug, { credentials });
    await world.fetchDataObject();
    const sceneData = world.dataObject?.[sceneDropId];

    const { leaderboardArray, highScore } = await formatLeaderboard(sceneData.leaderboard, profileId);

    return res.json({ success: true, leaderboard: leaderboardArray, highScore });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetLeaderboard",
      message: "Error fetching leaderboard",
      req,
      res,
    });
  }
};
