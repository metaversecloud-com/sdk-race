import { backendAPI } from "@utils/backendAPI";
import { SCREEN_MANAGER, CANCEL_RACE } from "@context/types";

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
