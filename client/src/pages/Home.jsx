import React, { useContext, useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { backendAPI } from "@utils/backendAPI";
import { LOAD_GAME_STATE, START_RACE, SCREEN_MANAGER } from "../context/types";

import OnYourMarkScreen from "../components/OnYourMarkScreen/OnYourMarkScreen";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";

import RaceInProgressScreen from "../components/RaceInProgressScreen/RaceInProgressScreen";
import NewGameScreen from "../components/NewGameScreen/NewGameScreen";
import RaceCompletedScreen from "../components/RaceCompletedScreen/RaceCompletedScreen";

function Home() {
  const dispatch = useContext(GlobalDispatchContext);
  const { screenManager, waypointsCompleted } = useContext(GlobalStateContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        await loadGameState({ dispatch });
      } catch (error) {
        console.error("error in loadGameState action");
      }
    };

    fetchGameState();
  }, [dispatch, backendAPI]);

  const loadGameState = async ({ dispatch }) => {
    try {
      setLoading(true);
      const result = await backendAPI.get("/race/game-state");
      if (result.data.success) {
        await dispatch({
          type: LOAD_GAME_STATE,
          payload: {
            waypointsCompleted: result.data.waypointsCompleted,
            startTimestamp: result.data.startTimestamp,
          },
        });

        if (result.data.startTimestamp && !result.data.endTimestamp) {
          await dispatch({
            type: SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN,
          });
        }

        if (result.data.startTimestamp && result.data.endTimestamp) {
          await dispatch({
            type: SCREEN_MANAGER.SHOW_RACE_COMPLETED,
          });
        }

        if (!result.data.startTimestamp) {
          await dispatch({
            type: SCREEN_MANAGER.SHOW_HOME_SCREEN,
          });
        }

        setLoading(false);
      }
    } catch (error) {
      console.error("error in loadGameState action");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="loader">
        <ClipLoader color={"#123abc"} loading={loading} size={150} />
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {screenManager === SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN && <OnYourMarkScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN && <RaceInProgressScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_HOME_SCREEN && <NewGameScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_RACE_COMPLETED_SCREEN && <RaceCompletedScreen />}
    </div>
  );
}

export default Home;
