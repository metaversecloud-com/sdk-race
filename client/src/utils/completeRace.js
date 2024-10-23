import { backendAPI, getErrorMessage } from "@utils";
import { SET_ERROR, COMPLETE_RACE } from "@context/types";

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
    dispatch({
      type: SET_ERROR,
      payload: { error: getErrorMessage("conpleting", error) },
    });
  }
};
