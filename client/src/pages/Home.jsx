import React, { useContext, useState } from "react";
import racingMap from "../assets/racingMap.png";
import OnYourMarkScreen from "../components/OnYourMarkScreen/OnYourMarkScreen";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";
import RaceInProgressScreen from "../components/RaceInProgressScreen/RaceInProgressScreen";

function Home() {
  const { screenManager } = useContext(GlobalStateContext);
  const dispatch = useContext(GlobalDispatchContext);

  const startRace = () => {
    dispatch({ type: SCREEN_MANAGER.TOGGLE_ON_YOUR_MARK_SCREEN });
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
            🏁 Run through all <strong>waypoints</strong> in the correct order to complete the race!
          </li>
        </ol>

        <div className="rules">
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

  // return <RaceInProgressScreen />;

  return (
    <div className="app-wrapper">
      {screenManager?.showOnYourMarkScreen ? (
        <OnYourMarkScreen />
      ) : (
        <>
          <div className="">
            <img src={racingMap} alt="racing map" className="rounded-lg shadow-lg" />
          </div>
          <Instructions />
          <Footer />
        </>
      )}
    </div>
  );
}

export default Home;
