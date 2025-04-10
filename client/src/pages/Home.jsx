import { useContext, useState, useEffect } from "react";

// components
import OnYourMarkScreen from "@components/OnYourMarkScreen/OnYourMarkScreen";
import RaceInProgressScreen from "@components/RaceInProgressScreen/RaceInProgressScreen";
import NewGameScreen from "@components/NewGameScreen/NewGameScreen";
import RaceCompletedScreen from "@components/RaceCompletedScreen/RaceCompletedScreen";
import AdminGear from "@components/Admin/AdminGear";
import AdminView from "@components/Admin/AdminView";
import Loading from "@components/Shared/Loading";

// context
import { SCREEN_MANAGER } from "@context/types";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";

// utils
import { backendAPI, loadGameState } from "@utils";

function Home() {
  const dispatch = useContext(GlobalDispatchContext);
  const { error, screenManager, isAdmin } = useContext(GlobalStateContext);
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

  if (loading) return <Loading />;

  if (showSettings) {
    return <AdminView setShowSettings={setShowSettings} />;
  }

  return (
    <div>
      {isAdmin && <AdminGear setShowSettings={setShowSettings} />}
      {screenManager === SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN && <OnYourMarkScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN && <RaceInProgressScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_HOME_SCREEN && <NewGameScreen />}
      {screenManager === SCREEN_MANAGER.SHOW_RACE_COMPLETED_SCREEN && <RaceCompletedScreen />}
      {error && <p className="p3 pt-10 text-center text-error">{error}</p>}
    </div>
  );
}

export default Home;
