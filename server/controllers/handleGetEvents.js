import { errorHandler } from "../utils/index.js";
import redisObj from "../redis/redis.js";

export const handleGetEvents = async (req, res) => {
  try {
    const profileId = req.query.profileId;
    if (!profileId) return res.status(400).send("ProfileId required");

    res.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });

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
