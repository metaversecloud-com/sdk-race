import React, { useContext, useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { backendAPI } from "@utils/backendAPI";
import { SCREEN_MANAGER } from "../context/types";

import OnYourMarkScreen from "../components/OnYourMarkScreen/OnYourMarkScreen";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";

import RaceInProgressScreen from "../components/RaceInProgressScreen/RaceInProgressScreen";
import NewGameScreen from "../components/NewGameScreen/NewGameScreen";
import RaceCompletedScreen from "../components/RaceCompletedScreen/RaceCompletedScreen";
import AdminGear from "../components/Admin/AdminGear";
import AdminView from "../components/Admin/AdminView";
import { loadGameState } from "../context/actions";

function Home() {
  const dispatch = useContext(GlobalDispatchContext);
  const { screenManager, visitor } = useContext(GlobalStateContext);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        setLoading(true);
        await loadGameState(dispatch);
      } catch (error) {
        console.error("error in loadGameState action");
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();
  }, [dispatch, backendAPI]);

  if (loading) {
    return (
      <div className="loader">
        <ClipLoader color={"#123abc"} loading={loading} size={150} />
      </div>
    );
  }

  if (showSettings) {
    return <AdminView setShowSettings={setShowSettings} />;
  }

  return (
    <div className="app-wrapper">
      {visitor?.isAdmin ? AdminGear(setShowSettings) : <></>}
      {screenManager === SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN && <OnYourMarkScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN && <RaceInProgressScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_HOME_SCREEN && <NewGameScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_RACE_COMPLETED_SCREEN && <RaceCompletedScreen />}
    </div>
  );
}

export default Home;
