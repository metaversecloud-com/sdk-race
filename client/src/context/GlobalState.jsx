import { GlobalDispatchContext, GlobalStateContext } from "./GlobalContext";

const GlobalState = (props) => {
  const { children, initialState, dispatch } = props;
  return (
    <GlobalStateContext.Provider value={initialState}>
      <GlobalDispatchContext.Provider value={dispatch}>{children}</GlobalDispatchContext.Provider>
    </GlobalStateContext.Provider>
  );
};

export default GlobalState;
