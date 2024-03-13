import { SET_INTERACTIVE_PARAMS, SCREEN_MANAGER, START_RACE, LOAD_GAME_STATE } from "./types";

const globalReducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        ...payload,
        hasInteractiveParams: true,
      };
    case SCREEN_MANAGER.SHOW_HOME_SCREEN:
      return {
        ...state,
        screenManager: SCREEN_MANAGER.SHOW_HOME_SCREEN,
      };
    case SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN:
      return {
        ...state,
        screenManager: SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN,
      };
    case SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN:
      return {
        ...state,
        screenManager: SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN,
      };
    case START_RACE:
      return {
        ...state,
        raceStarted: payload.raceStarted,
      };
    case LOAD_GAME_STATE:
      return {
        ...state,
        waypointsCompleted: payload.waypointsCompleted,
        startTimestamp: payload.startTimestamp,
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
