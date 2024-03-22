import { backendAPI } from "@utils/backendAPI";
import { LOAD_GAME_STATE, START_RACE, SCREEN_MANAGER, COMPLETE_RACE } from "./types";

export const loadGameState = async ({ dispatch }) => {
  try {
    const result = await backendAPI.get("/race/game-state");
    if (result.status === 200) {
      dispatch({
        type: LOAD_GAME_STATE,
        payload: {
          waypointsCompleted: result.data.waypointsCompleted,
          startTimestamp: result.data.startTimestamp,
        },
      });
      if (result.data.startTimestamp) {
        dispatch({
          type: SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN,
        });
      }
    }
  } catch (error) {
    console.error("error in loadGameState action");
    console.error(error);
  }
};

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
      return result.data;
    } else return console.error("Error getting data object");
  } catch (error) {
    console.error("error in startRace action");
    console.error(error);
  }
};

export const completeRace = async ({ dispatch }) => {
  try {
    const result = await backendAPI.post("/race/complete-race");
    dispatch({ type: COMPLETE_RACE });
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
