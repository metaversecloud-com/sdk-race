import { useContext, useState, useEffect } from "react";

// components
import {
  PageContainer,
  NewGameScreen,
  LeaderboardScreen,
  BadgesScreen,
  SwitchTrackScreen,
  OnYourMarkScreen,
  RaceInProgressScreen,
  RaceCompletedScreen,
} from "@components";

// context
import { SCREEN_MANAGER } from "@context/types";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";

// utils
import { backendAPI, loadGameState } from "@utils";

function Home() {
  const dispatch = useContext(GlobalDispatchContext);
  const { screenManager } = useContext(GlobalStateContext);
  const [loading, setLoading] = useState(true);

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

  return (
    <PageContainer isLoading={loading}>
      {(() => {
        switch (screenManager) {
          case SCREEN_MANAGER.SHOW_HOME_SCREEN:
            return <NewGameScreen />;
          case SCREEN_MANAGER.SHOW_LEADERBOARD_SCREEN:
            return <LeaderboardScreen />;
          case SCREEN_MANAGER.SHOW_BADGES_SCREEN:
            return <BadgesScreen />;
          case SCREEN_MANAGER.SHOW_SWITCH_TRACK_SCREEN:
            return <SwitchTrackScreen />;
          case SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN:
            return <OnYourMarkScreen />;
          case SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN:
            return <RaceInProgressScreen />;
          case SCREEN_MANAGER.SHOW_RACE_COMPLETED_SCREEN:
            return <RaceCompletedScreen />;
          default:
            return null;
        }
      })()}
    </PageContainer>
  );
}

export default Home;
