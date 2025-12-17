import { useContext } from "react";

// components
import { BackButton, Leaderboard } from "@components";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

export const LeaderboardScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);

  return (
    <>
      <BackButton onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN })} />

      <Leaderboard />
    </>
  );
};

export default LeaderboardScreen;
