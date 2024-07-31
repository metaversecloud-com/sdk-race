import { useContext, useState } from "react";

// components
import Leaderboard from "@pages/Leaderboard";
import Footer from "@components/Shared/Footer";

// context
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

const RaceCompletedScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { elapsedTime } = useContext(GlobalStateContext);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  function handleViewLeaderboard() {
    setShowLeaderboard(true);
  }

  function handlePlayAgain() {
    dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
  }

  if (showLeaderboard) return <Leaderboard />;

  return (
    <>
      <div className="container p-6">
        <h2>🏆 Congratulations!</h2>
        <p className="my-10">You have successfully completed the race.</p>
        <div className="pt-30">
          <h3>Elapsed Time: {elapsedTime}</h3>
        </div>
      </div>
      <Footer>
        <button
          className="btn-success"
          style={{ width: "94%", marginBottom: "6px" }}
          onClick={() => handleViewLeaderboard()}
        >
          🏆 View Leaderboard
        </button>
        <button style={{ width: "94%" }} onClick={() => handlePlayAgain()}>
          Play Again
        </button>
      </Footer>
    </>
  );
};

export default RaceCompletedScreen;
