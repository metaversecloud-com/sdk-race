import { Visitor, World, errorHandler, getCredentials } from "../utils/index.js";
import { TRACKS } from "../constants.js";

export const handleLoadGameState = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, profileId, sceneDropId, visitorId } = credentials;
    const now = Date.now();

    const world = await World.create(urlSlug, { credentials });

    const result = await Promise.all([world.fetchDataObject(), Visitor.get(visitorId, urlSlug, { credentials })]);
    const visitor = result?.[1];

    let data = world.dataObject || {};

    const lockId = `${sceneDropId}-${profileId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    try {
      try {
        await world.updateDataObject({ updateInProgress: true }, { lock: { lockId, releaseLock: true } });
      } catch (error) {
        return res.status(409).json({ message: "Data object update already in progress." });
      }

      if (data.race) data.race = { removedFromWorld: now };

      if (!data[sceneDropId]) {
        const numberOfCheckpoints = await world.fetchDroppedAssetsWithUniqueName({
          uniqueName: "race-track-checkpoint",
          isPartial: true,
        });

        data[sceneDropId] = {
          profiles: {},
          numberOfCheckpoints: numberOfCheckpoints?.length,
        };
      }

      const profile = data[sceneDropId]?.profiles?.[profileId];

      let startTimestamp = profile?.startTimestamp;

      // restart client race if the elapsed time is higher than 3 minutes
      if (!profile || (startTimestamp && now - startTimestamp > 180000)) {
        data[sceneDropId].profiles[profileId] = {
          checkpoints: [],
          startTimestamp: null,
          highscore: null,
          currentElapsedTime: null,
        };
      }

      data.updateInProgress = false;
      if (Object.keys(world?.dataObject || {}).length === 0) {
        return world.setDataObject(data);
      } else {
        await world.updateDataObject(data);
      }
    } catch (error) {
      await world.updateDataObject({ updateInProgress: false });
      throw error;
    }

    const profile = data[sceneDropId]?.profiles?.[profileId];
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
