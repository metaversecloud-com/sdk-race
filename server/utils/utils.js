import redisObj from "../redis/redis.js";

export function formatElapsedTime(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const centiseconds = Math.floor((milliseconds % 1000) / 10);
  return `${padZero(minutes)}:${padZero(seconds)}:${padZero(centiseconds)}`;
}

function padZero(num) {
  return num.toString().padStart(2, "0");
}

export function timeToValue(timeString) {
  const [minutes, seconds, milliseconds] = timeString.split(":");
  return parseInt(minutes, 10) * 60000 + parseInt(seconds, 10) * 1000 + parseInt(milliseconds, 10) * 10;
}

export async function publishRaceEvent(profileId, checkpointNumber, currentElapsedTime) {
  await redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
    profileId,
    checkpointNumber,
    currentRaceFinishedElapsedTime: currentElapsedTime,
    event: "checkpoint-entered",
  });
}
