import express from "express";

import {
  handleDropAsset,
  handleGetDroppedAssetsWithUniqueName,
  handleGetWorldDetails,
  handleGetDroppedAsset,
  handleGetVisitor,
  handleUpdateWorldDataObject,
  moveVisitor,
  handleRemoveDroppedAssets,
  handleRaceStart,
  handleWaypointEntered,
  handleLoadGameState,
  handleCancelRace,
  handleSendEvent,
  handleGetEvents,
  handleCompleteRace,
  handleResetGame,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const router = express.Router();

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
    INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
    REDIS_URL: process.env.REDIS_URL,
    REF: process.env.REF,
  });
});

// Dropped Assets
router.get("/dropped-asset-with-unique-name", handleGetDroppedAssetsWithUniqueName);
router.post("/dropped-asset", handleDropAsset);
router.get("/dropped-asset", handleGetDroppedAsset);
router.delete("/dropped-asset", handleRemoveDroppedAssets);

// Visitor
router.get("/visitor", handleGetVisitor);
router.put("/visitor/move", moveVisitor);

// World
router.get("/world", handleGetWorldDetails);
router.put("/world/data-object", handleUpdateWorldDataObject);

// Race
router.get("/race/game-state", handleLoadGameState);
// router.post("/race/setup", handleSetupRace);
router.post("/race/start-race", handleRaceStart);
router.post("/race/waypoint-entered", handleWaypointEntered);
router.post("/race/cancel-race", handleCancelRace);
router.post("/race/complete-race", handleCompleteRace);
router.post("/race/reset-game", handleResetGame);

// Events
router.post("/send-event", handleSendEvent);
router.get("/events", handleGetEvents);

export default router;
