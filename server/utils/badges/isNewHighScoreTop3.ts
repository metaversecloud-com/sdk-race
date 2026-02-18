import { getTimeInSeconds } from "./getTimeInSeconds.js";

export const isNewHighScoreTop3 = (leaderboard: Record<string, string>, newHighScore: string): boolean => {
  const times = Object.values(leaderboard)
    .map((entry: string) => entry.split("|")[1])
    .map(getTimeInSeconds);

  times.push(getTimeInSeconds(newHighScore));
  times.sort((a, b) => a - b);

  return times.slice(0, 3).includes(getTimeInSeconds(newHighScore));
};
