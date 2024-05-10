import React, { useContext } from "react";
import { GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";
import racingMap from "../../assets/racingMap.png";

const NewGameScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const startRace = () => {
    dispatch({ type: SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN });
  };

  const Instructions = () => (
    <>
      <div style={{ marginTop: "24px", marginBottom: "24px" }}>
        <h4 style={{ textAlign: "center" }}>🏎️ Welcome to the Race game!</h4>
      </div>
      <div className="instructions" style={{ padding: "0px 16px" }}>
        <div className="title">
          <b>How to play:</b>
        </div>
        <ol style={{ marginTop: "5px" }}>
          <li>
            Click <b style={{ color: "green" }}>Start Race</b> to begin..
          </li>
          <li>
            🏁 Run through all <strong>checkpoints</strong> in the correct order to complete the race!
          </li>
        </ol>

        <div className="rules" style={{ paddingBottom: "40px" }}>
          <div className="title">
            <b>Important Rules:</b>
          </div>
          <ul style={{ marginTop: "5px" }}>
            <li>
              <b>Time</b> starts when you click <b style={{ color: "green" }}>Start Race</b>.
            </li>
            <li>Check your rank by clicking the 🏆 leaderboard.</li>
          </ul>
        </div>
      </div>
    </>
  );

  function Footer() {
    return (
      <div className="footer-fixed">
        <div>
          <button onClick={startRace} style={{ width: "94%" }}>
            {" "}
            Start Race
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="">
        <img src={racingMap} alt="racing map" className="rounded-lg shadow-lg" />
      </div>
      <Instructions />
      <Footer />
    </>
  );
};

export default NewGameScreen;
