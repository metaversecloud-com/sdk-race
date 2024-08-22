import { backendAPI } from "@utils/backendAPI";
import { COMPLETE_RACE } from "@context/types";

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
