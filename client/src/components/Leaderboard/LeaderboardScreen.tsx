import { useContext } from "react";

// components
import { BackButton, Leaderboard, Footer } from "@components";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

export const LeaderboardScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);

  return (
    <>
      <BackButton onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN })} />

      <Leaderboard />

      <Footer>
        <button className="btn-primary" onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN })}>
          Start Race
        </button>
      </Footer>
    </>
  );
};

export default LeaderboardScreen;
