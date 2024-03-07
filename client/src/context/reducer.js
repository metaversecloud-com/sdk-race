import { SET_INTERACTIVE_PARAMS, SCREEN_MANAGER } from "./types";

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
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
