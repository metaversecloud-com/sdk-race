import { backendAPI } from "@utils/backendAPI";
import { LOAD_GAME_STATE, START_RACE, SCREEN_MANAGER, COMPLETE_RACE, CANCEL_RACE } from "./types";

export const startRace = async ({ dispatch, navigate }) => {
  try {
    const result = await backendAPI.post("/race/start-race");
    if (result.status === 200) {
      dispatch({
        type: START_RACE,
        payload: {
          raceStarted: true,
          startTimestamp: result.data.startTimestamp,
        },
      });
      showRaceInProgressScreen(dispatch);
      return result.data;
    } else return console.error("Error getting data object");
  } catch (error) {
    console.error("error in startRace action");
    console.error(error);
  }
};

export const completeRace = async ({ dispatch, currentFinishedElapsedTime }) => {
  try {
    const result = await backendAPI.post("/race/complete-race");
    if (result.status === 200) {
      dispatch({
        type: COMPLETE_RACE,
        payload: {
          elapsedTime: currentFinishedElapsedTime,
        },
      });
    }
  } catch (error) {
    console.error("error in startRace action");
    console.error(error);
  }
};

export const cancelRace = async (dispatch) => {
  try {
    const result = await backendAPI.post("/race/cancel-race");
    if (result.data.success) {
      dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
      dispatch({ type: CANCEL_RACE });
    }
  } catch (error) {
    console.error("error in cancel action");
    console.error(error);
  }
};

export const resetGame = async () => {
  try {
    const result = await backendAPI.post("/race/reset-game");
    if (result?.data?.success) {
      return true;
    }
  } catch (error) {
    console.error("error in cancel action");
    console.error(error);
  }
};

export const loadGameState = async (dispatch) => {
  try {
    const result = await backendAPI?.post("/race/game-state");
    if (result?.data?.success) {
      await dispatch({
        type: LOAD_GAME_STATE,
        payload: {
          checkpointsCompleted: result.data.checkpointsCompleted,
          startTimestamp: result.data.startTimestamp,
          numberOfCheckpoints: result.data.numberOfCheckpoints,
          visitor: result.data.visitor,
          elapsedTimeInSeconds: result.data.elapsedTimeInSeconds,
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

export const showRaceInProgressScreen = (dispatch) => {
  dispatch({ type: SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN });
};

export const showRaceCompletedScreen = (dispatch) => {
  dispatch({ type: SCREEN_MANAGER.SHOW_RACE_COMPLETED_SCREEN });
};
