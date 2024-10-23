import { backendAPI, getErrorMessage } from "@utils";
import { SCREEN_MANAGER, CANCEL_RACE, SET_ERROR } from "@context/types";

export const cancelRace = async (dispatch) => {
  try {
    const result = await backendAPI.post("/race/cancel-race");
    if (result.data.success) {
      dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
      dispatch({ type: CANCEL_RACE });
    }
  } catch (error) {
    dispatch({
      type: SET_ERROR,
      payload: { error: getErrorMessage("canceling", error) },
    });
  }
};
