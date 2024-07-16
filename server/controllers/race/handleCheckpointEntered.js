import { errorHandler } from "../../utils/index.js";
import { Visitor, World } from "../../utils/topiaInit.js";
import { ENCOURAGEMENT_MESSAGES, CHECKPOINT_NAMES } from "../../utils/constants.js";
import { getCredentials } from "../../utils/getCredentials.js";
import { formatElapsedTime, publishRaceEvent, timeToValue } from "../../utils/utils.js";

export const handleCheckpointEntered = async (req, res) => {
  try {
    const context = {
      ...req.body,
      credentials: getCredentials(req.body),
    };

    const raceManager = new RaceManager(context);
    const result = await raceManager.handleCheckpointEntered();

    return res.status(200).json(result);
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCheckpointEntered",
      message: "Error when entering the checkpoint",
      req,
      res,
    });
  }
};

class RaceManager {
  constructor(context) {
    this.context = context;
  }

  async handleCheckpointEntered() {
    try {
      const { urlSlug, profileId, username, sceneDropId, uniqueName } = this.context;
      const checkpointNumber = this.getCheckpointNumber(uniqueName);
      const currentTimestamp = Date.now();

      let currentElapsedTime = null;

      if (checkpointNumber === 0) {
        currentElapsedTime = await this.handleCheckpointZero(currentTimestamp);
      }

      await publishRaceEvent(profileId, checkpointNumber, currentElapsedTime);

      const world = World.create(urlSlug, { credentials: this.context.credentials });
      const dataObject = await world.fetchDataObject();
      const raceData = this.getRaceData(dataObject);

      await this.updateRaceData(world, checkpointNumber, currentTimestamp, raceData);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async handleCheckpointZero(currentTimestamp) {
    const { urlSlug, credentials, profileId, sceneDropId } = this.context;
    const world = World.create(urlSlug, { credentials });
    const dataObject = await world.fetchDataObject();
    const raceData = this.getRaceData(dataObject);

    const startTimestamp = raceData.startTimestamp || currentTimestamp;
    const elapsedMilliseconds = currentTimestamp - startTimestamp;

    const minutes = Math.floor(elapsedMilliseconds / 60000);
    const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
    const milliseconds = Math.floor((elapsedMilliseconds % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(2, "0")}`;
  }

  getCheckpointNumber(uniqueName) {
    return uniqueName === CHECKPOINT_NAMES.START ? 0 : parseInt(uniqueName.split("-").pop(), 10);
  }

  getRaceData(dataObject) {
    const { sceneDropId, profileId } = this.context;
    const raceObject = dataObject?.[sceneDropId] || {};
    const profilesObject = raceObject.profiles || {};
    return profilesObject[profileId] || {};
  }

  calculateElapsedTime(startTimestamp, currentTimestamp) {
    if (!startTimestamp) return null;
    const elapsedMilliseconds = currentTimestamp - startTimestamp;
    return formatElapsedTime(elapsedMilliseconds);
  }

  async updateRaceData(world, checkpointNumber, currentTimestamp, raceData) {
    if (checkpointNumber === 0) {
      return this.handleFinishLine(world, currentTimestamp, raceData);
    }
    return this.handleCheckpoint(world, checkpointNumber, currentTimestamp, raceData);
  }

  async handleFinishLine(world, currentTimestamp, raceData) {
    const { urlSlug, profileId, username, credentials, sceneDropId } = this.context;
    const { checkpoints, startTimestamp } = raceData;
    const raceObject = (await world.fetchDataObject())?.[sceneDropId] || {};
    const allCheckpointsCompleted = raceObject.numberOfCheckpoints === checkpoints.length;

    if (!allCheckpointsCompleted) return;

    const currentElapsedTime = this.calculateElapsedTime(startTimestamp, currentTimestamp);
    const newHighscore = this.calculateHighscore(raceData, currentElapsedTime);

    await this.updateWorldDataForFinish(world, currentElapsedTime, newHighscore);
    this.notifyVisitorOfFinish(urlSlug, credentials, currentElapsedTime);
  }

  async handleCheckpoint(world, checkpointNumber, currentTimestamp, raceData) {
    const { urlSlug, profileId, credentials, sceneDropId } = this.context;
    const { checkpoints, startTimestamp, highscore } = raceData;

    if (checkpoints[checkpointNumber - 1]) return;
    if (checkpointNumber > 1 && !checkpoints[checkpointNumber - 2]) {
      this.notifyVisitorOfMissedCheckpoint(urlSlug, credentials);
      return;
    }

    checkpoints[checkpointNumber - 1] = true;
    const currentElapsedTime = this.calculateElapsedTime(startTimestamp, currentTimestamp);

    this.notifyVisitorOfCheckpoint(urlSlug, credentials, checkpointNumber);
    await this.updateWorldDataForCheckpoint(world, checkpoints, startTimestamp, currentElapsedTime, highscore);
  }

  async updateWorldDataForFinish(world, currentElapsedTime, newHighscore) {
    const { profileId, username, sceneDropId } = this.context;
    await world.updateDataObject(
      {
        [`${sceneDropId}.profiles.${profileId}`]: {
          username,
          checkpoints: [],
          elapsedTime: currentElapsedTime,
          highscore: newHighscore,
        },
      },
      { analytics: [{ analyticName: "completions", uniqueKey: profileId }] },
    );
  }

  async notifyVisitorOfFinish(urlSlug, credentials, currentElapsedTime) {
    const visitor = await Visitor.get(credentials.visitorId, urlSlug, { credentials });
    await visitor.fireToast({
      groupId: "race",
      title: "🏁 Finish",
      text: `You finished the race! Your time: ${currentElapsedTime}`,
    });
    this.triggerFinishParticle(visitor);
  }

  async triggerFinishParticle(visitor) {
    const { x, y } = visitor.moveTo;
    await visitor.triggerParticle({
      name: "Firework2_BlueGreen",
      duration: 3,
      position: { x, y },
    });
  }

  async notifyVisitorOfMissedCheckpoint(urlSlug, credentials) {
    const visitor = await Visitor.create(credentials.visitorId, urlSlug, { credentials });
    await visitor.fireToast({
      groupId: "race",
      title: "❌ Wrong checkpoint",
      text: "Oops! Go back. You missed a checkpoint!",
    });
  }

  async notifyVisitorOfCheckpoint(urlSlug, credentials, checkpointNumber) {
    const visitor = await Visitor.create(credentials.visitorId, urlSlug, { credentials });
    const text = ENCOURAGEMENT_MESSAGES[checkpointNumber % ENCOURAGEMENT_MESSAGES.length];
    await visitor.fireToast({
      groupId: "race",
      title: `✅ Checkpoint ${checkpointNumber}`,
      text,
    });
  }

  async updateWorldDataForCheckpoint(world, checkpoints, startTimestamp, currentElapsedTime, highscore) {
    const { profileId, sceneDropId } = this.context;
    await world.updateDataObject({
      [`${sceneDropId}.profiles.${profileId}`]: {
        checkpoints,
        startTimestamp,
        currentElapsedTime,
        highscore,
      },
    });
  }

  calculateHighscore(profileObject, currentElapsedTime) {
    const currentHighscore = profileObject.highscore;
    return !currentHighscore || timeToValue(currentElapsedTime) < timeToValue(currentHighscore)
      ? currentElapsedTime
      : currentHighscore;
  }
}
