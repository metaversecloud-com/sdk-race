import express from "express";

import {
  handleCancelRace,
  handleCheckpointEntered,
  handleCompleteRace,
  handleGetEvents,
  handleGetVisitorInventory,
  handleLoadGameState,
  handleRaceStart,
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
    serverStartDate: SERVER_START_DATE,
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      COMMIT_HASH: process.env.COMMIT_HASH,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INSTANCE_PROTOCOL: process.env.INSTANCE_PROTOCOL,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
      INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
      REDIS_URL: process.env.REDIS_URL ? "SET" : "NOT SET",
      TRACKS: process.env.TRACKS ? process.env.TRACKS : "NOT SET",
      GOOGLESHEETS_CLIENT_EMAIL: process.env.GOOGLESHEETS_CLIENT_EMAIL ? "SET" : "NOT SET",
      GOOGLESHEETS_SHEET_ID: process.env.GOOGLESHEETS_SHEET_ID ? "SET" : "NOT SET",
      GOOGLESHEETS_PRIVATE_KEY: process.env.GOOGLESHEETS_PRIVATE_KEY ? "SET" : "NOT SET",
    },
  });
});

router.get("/visitor-inventory", handleGetVisitorInventory);

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
