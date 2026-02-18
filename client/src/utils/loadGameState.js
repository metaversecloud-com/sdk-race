import { backendAPI, getErrorMessage } from "@utils";
import { LOAD_GAME_STATE, SCREEN_MANAGER, SET_ERROR } from "@context/types";

export const loadGameState = async (dispatch, forceRefreshInventory) => {
  try {
    const result = await backendAPI?.post("/race/game-state", { forceRefreshInventory });
    if (result?.data?.success) {
      const {
        checkpointsCompleted,
        elapsedTimeInSeconds,
        highScore,
        isAdmin,
        leaderboard,
        numberOfCheckpoints,
        startTimestamp,
        endTimestamp,
        tracks,
        visitorInventory,
        badges,
        lastRaceStartedDate,
      } = result.data;

      await dispatch({
        type: LOAD_GAME_STATE,
        payload: {
          checkpointsCompleted,
          elapsedTimeInSeconds,
          highScore,
          isAdmin,
          leaderboard,
          numberOfCheckpoints,
          startTimestamp,
          tracks,
          visitorInventory,
          badges,
          lastRaceStartedDate,
        },
      });

      if (startTimestamp && !endTimestamp) {
        await dispatch({
          type: SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN,
        });
      }

      if (startTimestamp && endTimestamp) {
        await dispatch({
          type: SCREEN_MANAGER.SHOW_RACE_COMPLETED,
        });
      }

      if (!startTimestamp) {
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
