import { useReducer } from "react";
import { globalReducer } from "./reducer";
import GlobalState from "./GlobalState";

const initialState = {
  hasInteractiveParams: false,
  selectedWorld: {},
  urlSlug: "",
};

const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  return (
    <GlobalState initialState={state} dispatch={dispatch}>
      {children}
    </GlobalState>
  );
};

export default GlobalProvider;
