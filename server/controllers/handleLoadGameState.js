import { Ecosystem, World, errorHandler, getCredentials, getInventoryItems, getVisitor } from "../utils/index.js";
import { TRACKS } from "../constants.js";

export const handleLoadGameState = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, sceneDropId } = credentials;
    const now = Date.now();

    const world = await World.create(urlSlug, { credentials });
    await world.fetchDataObject();

    let sceneData = world.dataObject?.[sceneDropId];
    let shouldUpdateWorldDataObject = false;

    if (!sceneData) {
      const checkpointAssets = await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "race-track-checkpoint",
        isPartial: true,
      });

      let count = 0;
      for (const asset of checkpointAssets) {
        if (asset.sceneDropId === sceneDropId) count++;
      }

      sceneData = {
        numberOfCheckpoints: count,
        leaderboard: {},
      };
      shouldUpdateWorldDataObject = true;
    } else if (sceneData.profiles) {
      let leaderboard = {};
      for (const profileId in sceneData.profiles) {
        const { username, highscore } = sceneData.profiles[profileId];
        leaderboard[profileId] = `${username}|${highscore}`;
      }
      sceneData.leaderboard = leaderboard;
      delete sceneData.profiles;
      shouldUpdateWorldDataObject = true;
    }

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    if (!world.dataObject || Object.keys(world.dataObject).length === 0) {
      await world.setDataObject(
        {
          [sceneDropId]: sceneData,
        },
        { lock: { lockId, releaseLock: true } },
      );
    } else if (shouldUpdateWorldDataObject) {
      await world.updateDataObject(
        {
          [sceneDropId]: sceneData,
        },
        { lock: { lockId, releaseLock: true } },
      );
    }

    const { visitor, visitorProgress, visitorInventory } = await getVisitor(credentials, true);
    const { checkpoints, highScore, startTimestamp } = visitorProgress;

    const leaderboard = [];
    for (const profileId in sceneData.leaderboard) {
      const data = sceneData.leaderboard[profileId];

      const [displayName, highScore] = data.split("|");

      leaderboard.push({
        displayName,
        highScore,
      });
    }

    // Sort leaderboard by highScore as time string (HH:MM:SS)
    const timeToSeconds = (t) => {
      if (!t) return Infinity;
      const [h = "0", m = "0", s = "0"] = t.split(":");
      return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10);
    };
    leaderboard.sort((a, b) => timeToSeconds(a.highScore) - timeToSeconds(b.highScore)).slice(0, 20);

    const { badges } = await getInventoryItems(credentials);

    return res.json({
      checkpointsCompleted: checkpoints,
      elapsedTimeInSeconds: startTimestamp ? Math.floor((now - startTimestamp) / 1000) : 0,
      highScore,
      isAdmin: visitor.isAdmin,
      leaderboard,
      numberOfCheckpoints: sceneData.numberOfCheckpoints,
      startTimestamp,
      success: true,
      tracks: parseEnvJson(process.env.TRACKS) || TRACKS,
      visitorInventory,
      badges,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleLoadGameState",
      message: "Error loading game state",
      req,
      res,
    });
  }
};

const parseEnvJson = (envVar) => {
  try {
    if (!envVar) throw new Error("Environment variable is undefined");

    const unescapedJson = envVar.replace(/\\"/g, '"');

    return JSON.parse(unescapedJson);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    throw error;
  }
};
