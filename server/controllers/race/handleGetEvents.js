import { createClient } from "redis";
import { errorHandler } from "../../utils/index.js";

export const handleGetEvents = async (req, res) => {
  try {
    const profileId = req.query.profileId;
    if (!profileId) {
      return res.status(400).send("ProfileId required");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (message) => {
      res.write(`data: ${message}\n\n`);
    };

    const subscriber = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: process.env.REDIS_URL?.startsWith("rediss"),
      },
    });

    await subscriber.connect();
    await subscriber.subscribe(`events:${profileId}`, (message) => {
      sendEvent(message);
    });

    req.on("close", async () => {
      await subscriber.unsubscribe();
      await subscriber.quit();
    });
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
