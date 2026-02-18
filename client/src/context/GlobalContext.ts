import { createContext, Dispatch } from "react";
import { ActionType, InitialState } from "./types";

export const GlobalStateContext = createContext<InitialState>({} as InitialState);
export const GlobalDispatchContext = createContext<Dispatch<ActionType>>(() => {});
