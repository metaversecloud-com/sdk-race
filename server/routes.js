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
  handleCheckpointEntered,
  handleLoadGameState,
  handleCancelRace,
  handleGetEvents,
  handleCompleteRace,
  handleResetGame,
  handleSwitchTrack,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const SERVER_START_DATE = new Date();

const router = express.Router();

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    NODE_ENV: process.env.NODE_ENV,
    DEPLOYMENT_DATE: SERVER_START_DATE,
    COMMIT_HASH: process.env.COMMIT_HASH,
    SHOWCASE_WORLDS_URLS: ["https://topia.io/race-prod"],
    INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
    INSTANCE_PROTOCOL: process.env.INSTANCE_PROTOCOL,
    INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
    INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
    REDIS_URL: process.env.REDIS_URL ? "SET" : "NOT SET",
    IS_LOCALHOST: process.env.IS_LOCALHOST,
    GOOGLESHEETS_CLIENT_EMAIL: process.env.CLIENT_EMAIL ? "SET" : "NOT SET",
    GOOGLESHEETS_SHEET_ID: process.env.SHEET_ID ? "SET" : "NOT SET",
    GOOGLESHEETS_PRIVATE_KEY: process.env.PRIVATE_KEY ? "SET" : "NOT SET",
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
router.post("/race/game-state", handleLoadGameState);
router.post("/race/start-race", handleRaceStart);
router.post("/race/checkpoint-entered", handleCheckpointEntered);
router.post("/race/cancel-race", handleCancelRace);
router.post("/race/complete-race", handleCompleteRace);
router.post("/race/reset-game", handleResetGame);
router.post("/race/switch-track", handleSwitchTrack);

// Events
router.get("/events", handleGetEvents);

export default router;
