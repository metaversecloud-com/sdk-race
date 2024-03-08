import { backendAPI } from "@utils/backendAPI";
import { START_RACE } from "./types";

export const startRace = async ({ dispatch, navigate }) => {
  try {
    console.log("startRace");
    const result = await backendAPI.post("/race/start-race");
    if (result.data.success) {
      dispatch({
        type: START_RACE,
        payload: {
          raceStarted: true,
        },
      });
      return result.data;
    } else return console.error("Error getting data object");
  } catch (error) {
    console.error("error in startRace action");
    console.error(error);
  }
};
