import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";

// components
import Footer from "@components/Shared/Footer";

// context
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

const RaceCompletedScreen = () => {
  const queryParams = new URLSearchParams(location.search);
  const dispatch = useContext(GlobalDispatchContext);
  const { elapsedTime } = useContext(GlobalStateContext);

  function handlePlayAgain() {
    dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
  }

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
        <Link to={`/leaderboard?${queryParams.toString()}`}>
          <button className="btn-success mb-2" style={{ width: "94%" }}>
            🏆 View Leaderboard
          </button>
        </Link>
        <button style={{ width: "94%" }} onClick={() => handlePlayAgain()}>
          Play Again
        </button>
      </Footer>
    </>
  );
};

export default RaceCompletedScreen;
