import Redis from "ioredis";
const redis = new Redis();
import { errorHandler } from "../../utils/index.js";

export const handleSendEvent = async (req, res) => {
  try {
    const { profileId, message } = req.body;
    redis.publish(`events:${profileId}`, JSON.stringify(message));
    return res.send({ status: "Event Sent" });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleWaypointEntered",
      message: "Error sending event",
      req,
      res,
    });
  }
};
