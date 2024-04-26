import { errorHandler } from "../../utils/index.js";
import redisObj from "../../redis/redis.js";

export const handleGetEvents = async (req, res) => {
  try {
    const profileId = req.query.profileId;
    if (!profileId) {
      return res.status(400).send("ProfileId required");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    redisObj.addConn({ res, lastHeartbeatTime: Date.now() });

    res.write(`retry: 5000\ndata: ${JSON.stringify({ success: true })}\n\n`);
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetEvents",
      message: "Error in handleGetEvents",
      req,
      res,
    });
  }
};
