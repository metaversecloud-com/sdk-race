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
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const router = express.Router();

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    NODE_ENV: process.env.NODE_ENV,
    INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
    INSTANCE_PROTOCOL: process.env.INSTANCE_PROTOCOL,
    INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
    INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "UNSET",
    REDIS_URL: process.env.REDIS_URL ? "SET" : "UNSET",
    COMMIT_HASH: process.env.COMMIT_HASH,
    IS_LOCALHOST: process.env.IS_LOCALHOST,
    GOOGLESHEETS_CLIENT_EMAIL: process.env.CLIENT_EMAIL ? "SET" : "UNSET",
    GOOGLESHEETS_SHEET_ID: process.env.SHEET_ID ? "SET" : "UNSET",
    GOOGLESHEETS_PRIVATE_KEY: process.env.PRIVATE_KEY ? "SET" : "UNSET",
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

// Events
router.get("/events", handleGetEvents);

export default router;
