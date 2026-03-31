import { useContext } from "react";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

export const Tabs = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const goToLeaderboardScreen = () => {
    dispatch({ type: SCREEN_MANAGER.SHOW_LEADERBOARD_SCREEN });
  };

  const goToBadgesScreen = () => {
    dispatch({ type: SCREEN_MANAGER.SHOW_BADGES_SCREEN });
  };

  return (
    <div className="grid grid-cols-2 gap-4 mx-4">
      <button className="tab" onClick={goToLeaderboardScreen}>
        Leaderboard
      </button>
      <button className="tab" onClick={goToBadgesScreen}>
        Badges
      </button>
    </div>
  );
};

export default Tabs;
