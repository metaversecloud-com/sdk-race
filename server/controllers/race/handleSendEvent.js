import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.REDIS_URL?.startsWith("rediss"),
  },
});

redis.on("error", (err) => console.log("Redis Client Error", err));
await redis.connect();

import { errorHandler } from "../../utils/index.js";

export const handleSendEvent = async (req, res) => {
  try {
    const { profileId, message } = req.body;
    await redis.publish(`events:${profileId}`, JSON.stringify(message));
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
