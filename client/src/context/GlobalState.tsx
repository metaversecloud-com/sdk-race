import { Dispatch, ReactNode } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "./GlobalContext";
import { ActionType, InitialState } from "./types";

interface GlobalStateProps {
  children: ReactNode;
  initialState: InitialState;
  dispatch: Dispatch<ActionType>;
}

const GlobalState = ({ children, initialState, dispatch }: GlobalStateProps) => {
  return (
    <GlobalStateContext.Provider value={initialState}>
      <GlobalDispatchContext.Provider value={dispatch}>{children}</GlobalDispatchContext.Provider>
    </GlobalStateContext.Provider>
  );
};

export default GlobalState;
