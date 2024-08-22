import { backendAPI } from "@utils/backendAPI";
import { LOAD_GAME_STATE, SCREEN_MANAGER } from "@context/types";

export const loadGameState = async (dispatch) => {
  try {
    const result = await backendAPI?.post("/race/game-state");
    if (result?.data?.success) {
      await dispatch({
        type: LOAD_GAME_STATE,
        payload: {
          checkpointsCompleted: result.data.checkpointsCompleted,
          elapsedTimeInSeconds: result.data.elapsedTimeInSeconds,
          highscore: result.data.highscore,
          isAdmin: result.data.isAdmin,
          leaderboard: result.data.leaderboard,
          numberOfCheckpoints: result.data.numberOfCheckpoints,
          startTimestamp: result.data.startTimestamp,
          tracks: result.data.tracks,
        },
      });

      if (result.data.startTimestamp && !result.data.endTimestamp) {
        await dispatch({
          type: SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN,
        });
      }

      if (result.data.startTimestamp && result.data.endTimestamp) {
        await dispatch({
          type: SCREEN_MANAGER.SHOW_RACE_COMPLETED,
        });
      }

      if (!result.data.startTimestamp) {
        await dispatch({
          type: SCREEN_MANAGER.SHOW_HOME_SCREEN,
        });
      }
    }
  } catch (error) {
    console.error("error in startRace action");
    console.error(error);
  }
};
