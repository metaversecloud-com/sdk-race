import { ReactNode, useReducer } from "react";
import { globalReducer } from "./reducer";
import GlobalState from "./GlobalState";
import { InitialState, SCREEN_MANAGER } from "./types";

const initialState: InitialState = {
  hasInteractiveParams: false,
  selectedWorld: {},
  urlSlug: "",
  showOnYourMarkScreen: false,
  screenManager: SCREEN_MANAGER.SHOW_HOME_SCREEN,
  tracks: [],
};

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  return (
    <GlobalState initialState={state} dispatch={dispatch}>
      {children}
    </GlobalState>
  );
};

export default GlobalProvider;
