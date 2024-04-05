import Redis from "ioredis";
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

    const subscriber = new Redis();
    subscriber.subscribe(`events:${profileId}`, (err, count) => {
      if (err) {
        console.error("Failed to subscribe to events", err);
        res.end();
      }
    });

    subscriber.on("message", (channel, message) => {
      sendEvent(message);
    });

    req.on("close", () => {
      subscriber.unsubscribe();
      subscriber.quit();
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
