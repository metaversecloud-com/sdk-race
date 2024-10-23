import { backendAPI, getErrorMessage } from "@utils";
import { LOAD_GAME_STATE, SCREEN_MANAGER, SET_ERROR } from "@context/types";

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
    dispatch({
      type: SET_ERROR,
      payload: { error: getErrorMessage("loading", error) },
    });
  }
};
