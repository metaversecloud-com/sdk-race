const topiaMock = require("../mocks/@rtsdk/topia").__mock;

import express from "express";
import request from "supertest";

import router from "../routes.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", router);
  return app;
}

const baseCreds = {
  assetId: "asset-123",
  interactivePublicKey: process.env.INTERACTIVE_KEY,
  interactiveNonce: "nonce-xyz",
  visitorId: 1,
  urlSlug: "my-world",
  profileId: "profile-123",
  sceneDropId: "scene-drop-123",
  displayName: "TestUser",
  uniqueName: "race-track-start",
  username: "testuser",
};

// Mock the utils
jest.mock("../utils/index.js", () => ({
  errorHandler: jest.fn(),
  getCredentials: jest.fn(),
  getVisitor: jest.fn(),
  updateVisitorProgress: jest.fn(),
  formatLeaderboard: jest.fn(),
  getInventoryItems: jest.fn(),
  addNewRowToGoogleSheets: jest.fn().mockResolvedValue({}),
  finishLineEntered: jest.fn(),
  checkpointEntered: jest.fn(),
  getElapsedTime: jest.fn(),
  World: {
    create: jest.fn(),
    deleteDroppedAssets: jest.fn(),
  },
  Visitor: {
    create: jest.fn(),
  },
  DroppedAsset: {
    create: jest.fn(),
  },
}));

jest.mock("../redis/redis.js", () => ({
  default: {
    addConn: jest.fn().mockResolvedValue({}),
    set: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue(null),
    publish: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("../constants.js", () => ({
  TRACKS: [{ id: 1, name: "Test Track", thumbnail: "url", sceneId: "scene-1" }],
  DEFAULT_PROGRESS: { checkpoints: {}, elapsedTime: null, highScore: null, startTimestamp: null },
  CHECKPOINT_NAMES: { START: "race-track-start" },
}));

const mockUtils = jest.mocked(require("../utils/index.js"));

describe("routes", () => {
  beforeEach(() => {
    topiaMock.reset();
    jest.clearAllMocks();
  });

  test("GET /system/health returns status OK and env keys", async () => {
    const app = makeApp();
    const res = await request(app).get("/api/system/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("envs");
    expect(res.body.envs).toHaveProperty("NODE_ENV");
  });

  test("POST /race/game-state returns game state", async () => {
    const mockVisitor = {
      isAdmin: true,
      dataObject: {},
    };

    const mockWorld = {
      fetchDataObject: jest.fn().mockResolvedValue({}),
      dataObject: {
        "scene-drop-123": {
          numberOfCheckpoints: 3,
          leaderboard: {},
        },
      },
    };

    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.World.create.mockReturnValue(mockWorld);
    mockUtils.getVisitor.mockResolvedValue({
      visitor: mockVisitor,
      visitorProgress: { checkpoints: {}, startTimestamp: null },
      visitorInventory: {},
    });
    mockUtils.formatLeaderboard.mockResolvedValue({
      leaderboardArray: [],
      highScore: undefined,
    });
    mockUtils.getInventoryItems.mockResolvedValue({ badges: {} });

    const app = makeApp();
    const res = await request(app)
      .post("/api/race/game-state")
      .query(baseCreds)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("numberOfCheckpoints", 3);
    expect(mockUtils.getCredentials).toHaveBeenCalled();
  });

  test("POST /race/cancel-race cancels race successfully", async () => {
    const mockVisitor = { dataObject: {} };

    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.getVisitor.mockResolvedValue({
      visitor: mockVisitor,
      visitorProgress: { checkpoints: {}, startTimestamp: Date.now() },
    });
    mockUtils.updateVisitorProgress.mockResolvedValue({ success: true });

    const app = makeApp();
    const res = await request(app)
      .post("/api/race/cancel-race")
      .query(baseCreds);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(mockUtils.updateVisitorProgress).toHaveBeenCalled();
  });

  test("POST /race/reset-game resets game successfully", async () => {
    const mockWorld = {
      fetchDataObject: jest.fn().mockResolvedValue({}),
      fetchDroppedAssetsWithUniqueName: jest.fn().mockResolvedValue([1, 2, 3]),
      updateDataObject: jest.fn().mockResolvedValue({}),
      dataObject: {},
    };

    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.World.create.mockResolvedValue(mockWorld);
    mockUtils.getVisitor.mockResolvedValue({
      visitor: { dataObject: {} },
      visitorProgress: {},
    });
    mockUtils.updateVisitorProgress.mockResolvedValue({ success: true });

    const app = makeApp();
    const res = await request(app)
      .post("/api/race/reset-game")
      .query(baseCreds);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  test("GET /leaderboard returns leaderboard data", async () => {
    const mockWorld = {
      fetchDataObject: jest.fn().mockResolvedValue({}),
      dataObject: {
        "scene-drop-123": {
          leaderboard: { "profile-1": "User1|01:23:45" },
        },
      },
    };

    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.World.create.mockResolvedValue(mockWorld);
    mockUtils.formatLeaderboard.mockResolvedValue({
      leaderboardArray: [{ displayName: "User1", highScore: "01:23:45" }],
      highScore: "01:23:45",
    });

    const app = makeApp();
    const res = await request(app)
      .get("/api/leaderboard")
      .query(baseCreds);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("leaderboard");
    expect(res.body.leaderboard).toHaveLength(1);
  });

  test("GET /visitor-inventory returns visitor inventory", async () => {
    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.getVisitor.mockResolvedValue({
      visitorInventory: { "Race Rookie": { id: "1", icon: "url", name: "Race Rookie" } },
    });

    const app = makeApp();
    const res = await request(app)
      .get("/api/visitor-inventory")
      .query(baseCreds);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("visitorInventory");
  });

  test("GET /events returns 400 without profileId", async () => {
    const app = makeApp();
    const res = await request(app).get("/api/events");

    expect(res.status).toBe(400);
  });

  test("POST /race/cancel-race handles errors gracefully", async () => {
    const mockError = new Error("Something went wrong");

    mockUtils.getCredentials.mockImplementation(() => {
      throw mockError;
    });
    mockUtils.errorHandler.mockImplementation(({ res }: any) => {
      if (res) {
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    const app = makeApp();
    await request(app)
      .post("/api/race/cancel-race")
      .query(baseCreds);

    expect(mockUtils.errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "handleCancelRace",
      }),
    );
  });
});
