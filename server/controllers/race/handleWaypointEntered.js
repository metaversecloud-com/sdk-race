import { createClient } from "redis";
import { errorHandler } from "../../utils/index.js";
import redisObj from "../../redis/redis.js";

const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.REDIS_URL?.startsWith("rediss"),
  },
});

redis.on("error", (err) => console.log("Redis Client Error", err));
await redis.connect();

export const handleWaypointEntered = async (req, res) => {
  try {
    console.log("handleWaypointEntered");
    const { interactiveNonce, interactivePublicKey, urlSlug, visitorId, profileId } = req.body;
    const { assetId, isInteractive, position, uniqueName, sceneDropId } = req.body;

    const credentials = {
      assetId,
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    };

    let waypointNumber;
    if (uniqueName === "race-track-start") {
      waypointNumber = 0;
    } else {
      waypointNumber = parseInt(uniqueName.split("-").pop(), 10);
    }

    redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
      profileId,
      waypointNumber,
      event: "waypoint-entered",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleWaypointEntered",
      message: "Erro ao entrar no waypoint",
      req,
      res,
    });
  }
};
