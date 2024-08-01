import { Visitor, World, errorHandler, getCredentials } from "../utils/index.js";
import { TRACKS } from "../constants.js";

export const handleLoadGameState = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, profileId, sceneDropId, username, visitorId } = credentials;
    const now = Date.now();

    const world = await World.create(urlSlug, { credentials });

    const result = await Promise.all([world.fetchDataObject(), Visitor.get(visitorId, urlSlug, { credentials })]);
    const visitor = result?.[1];

    let data = world.dataObject || {};
    let shouldUpdateDataObject = false;

    if (data.race) {
      data.race = { removedFromWorld: now };
      shouldUpdateDataObject = true;
    }

    if (!data[sceneDropId]) {
      const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "race-track-checkpoint",
        isPartial: true,
      });

      data[sceneDropId] = {
        profiles: {},
        numberOfCheckpoints: numberOfCheckpoints?.length,
      };
      shouldUpdateDataObject = true;
    }

    const profile = data[sceneDropId]?.profiles?.[profileId];

    let startTimestamp = profile?.startTimestamp;

    // restart client race if the elapsed time is higher than 3 minutes
    if (!profile || (startTimestamp && now - startTimestamp > 180000)) {
      data[sceneDropId].profiles[profileId] = {
        checkpoints: [],
        startTimestamp: null,
        elapsedTime: null,
        highscore: profile?.highscore,
        username,
      };
      shouldUpdateDataObject = true;
    }

    if (shouldUpdateDataObject) {
      if (Object.keys(world?.dataObject || {}).length === 0) {
        return world.setDataObject(data);
      } else {
        await world.updateDataObject(data);
      }
    }

    return res.json({
      checkpointsCompleted: profile.checkpoints,
      startTimestamp: profile.startTimestamp,
      leaderboard: data[sceneDropId]?.profiles,
      numberOfCheckpoints: data[sceneDropId]?.numberOfCheckpoints,
      visitor,
      elapsedTimeInSeconds: profile.startTimestamp ? Math.floor((now - profile.startTimestamp) / 1000) : 0,
      profile,
      tracks: parseEnvJson(process.env.TRACKS) || TRACKS,
      success: true,
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
