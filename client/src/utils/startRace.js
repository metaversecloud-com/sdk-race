import { backendAPI } from "@utils/backendAPI";
import { START_RACE, SCREEN_MANAGER } from "@context/types";

export const startRace = async ({ dispatch }) => {
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
      dispatch({ type: SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN });
      return result.data;
    } else return console.error("Error getting data object");
  } catch (error) {
    console.error("error in startRace action");
    console.error(error);
  }
};
