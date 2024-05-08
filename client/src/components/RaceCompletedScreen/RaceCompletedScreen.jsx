import React, { useContext, useState } from "react";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import Leaderboard from "../../pages/Leaderboard";
import { SCREEN_MANAGER } from "../../context/types";
import "./RaceCompletedScreen.scss";

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

  if (showLeaderboard) {
    return <Leaderboard />;
  }

  function Footer() {
    return (
      <div className="footer-fixed">
        <div>
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
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="race-completed-wrapper">
        <div className="race-completed-content">
          <h2>🏆 Congratulations!</h2>
          <p>You have successfully completed the race.</p>
          <div className="elapsed-time" style={{ paddingTop: "30px" }}>
            <h3>Elapsed Time: {elapsedTime}</h3>
            <p></p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RaceCompletedScreen;
