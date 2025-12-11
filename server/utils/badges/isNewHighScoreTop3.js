import { getTimeInSeconds } from "./getTimeInSeconds.js";

export const isNewHighScoreTop3 = (leaderboard, newHighScore) => {
  const times = Object.values(leaderboard)
    .map((entry) => entry.split("|")[1])
    .map(getTimeInSeconds);

  times.push(getTimeInSeconds(newHighScore));
  times.sort((a, b) => a - b);

  return times.slice(0, 3).includes(getTimeInSeconds(newHighScore));
};
