import {
  SET_INTERACTIVE_PARAMS,
  SCREEN_MANAGER,
  START_RACE,
  COMPLETE_RACE,
  CANCEL_RACE,
  LOAD_GAME_STATE,
} from "./types";

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
        checkpoints: [],
        screenManager: SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN,
      };
    case SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN:
      return {
        ...state,
        screenManager: SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN,
      };
    case SCREEN_MANAGER.SHOW_RACE_COMPLETED_SCREEN:
      return {
        ...state,
        screenManager: SCREEN_MANAGER.SHOW_RACE_COMPLETED_SCREEN,
      };
    case START_RACE:
      return {
        ...state,
        raceStarted: payload.raceStarted,
        checkpoints: [],
        startTimestamp: payload.startTimestamp,
        checkpointsCompleted: [],
      };
    case COMPLETE_RACE:
      return {
        ...state,
        screenManager: SCREEN_MANAGER.SHOW_RACE_COMPLETED_SCREEN,
        elapsedTime: payload.elapsedTime,
      };
    case CANCEL_RACE:
      return {
        ...state,
        checkpoints: [],
        startTimestamp: null,
      };
    case LOAD_GAME_STATE:
      return {
        ...state,
        checkpointsCompleted: payload.checkpointsCompleted,
        startTimestamp: payload.startTimestamp,
        leaderboard: payload.leaderboard,
        numberOfCheckpoints: payload.numberOfCheckpoints,
        visitor: payload.visitor,
        elapsedTimeInSeconds: payload.elapsedTimeInSeconds,
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
