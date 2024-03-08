import { SET_INTERACTIVE_PARAMS, SCREEN_MANAGER, START_RACE } from "./types";

const globalReducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        ...payload,
        hasInteractiveParams: true,
      };
    case SCREEN_MANAGER.TOGGLE_ON_YOUR_MARK_SCREEN:
      return {
        ...state,
        screenManager: {
          showOnYourMarkScreen: !state.showOnYourMarkScreen,
        },
      };
    case START_RACE:
      console.log("START_RACE", payload, state);
      return {
        ...state,
        raceStarted: payload.raceStarted,
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
