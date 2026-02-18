import { LeaderboardEntry } from "../../shared/types/index.js";

export const formatLeaderboard = async (
  leaderboard: Record<string, string>,
  profileId: string,
): Promise<{ leaderboardArray: LeaderboardEntry[]; highScore: string | undefined }> => {
  const leaderboardArray: LeaderboardEntry[] = [];
  for (const id in leaderboard) {
    const data = leaderboard[id];

    const [displayName, highScore] = data.split("|");

    leaderboardArray.push({
      displayName,
      highScore,
    });
  }

  // Sort leaderboard by highScore as time string (HH:MM:SS)
  const timeToSeconds = (t: string): number => {
    if (!t) return Infinity;
    const [h = "0", m = "0", s = "0"] = t.split(":");
    return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10);
  };
  leaderboardArray.sort((a, b) => timeToSeconds(a.highScore) - timeToSeconds(b.highScore)).slice(0, 20);

  let highScore: string | undefined;
  if (Object.keys(leaderboard).includes(profileId)) highScore = leaderboard[profileId].split("|")[1];

  return { leaderboardArray, highScore };
};
