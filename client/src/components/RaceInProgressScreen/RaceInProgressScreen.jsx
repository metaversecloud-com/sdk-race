import React, { useState, useContext } from "react";
import { backendAPI } from "@utils/backendAPI";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";
import "./RaceInProgressScreen.scss"; // Importe seu arquivo CSS aqui

const Waypoint = ({ number, completed }) => {
  return (
    <div className={`waypoint ${completed ? "completed" : ""}`}>
      <span className="indicator">{completed ? "🟢" : "🔴"}</span>
      Waypoint {number}
    </div>
  );
};

const RaceInProgressScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { completedWaypoints } = useContext(GlobalStateContext);

  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);

  console.log(completedWaypoints, "completedWaypoints");

  const [waypoints, setWaypoints] = useState([
    { id: 1, completed: true },
    { id: 2, completed: false },
    { id: 3, completed: false },
    { id: 4, completed: false },
    { id: 5, completed: false },
  ]);

  const handleCancelRace = async () => {
    try {
      setAreAllButtonsDisabled(true);
      const result = await backendAPI.post("/race/cancel-race");
      if (result.data.success) {
        dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAreAllButtonsDisabled(false);
    }
  };

  function Footer() {
    return (
      <div className="footer-fixed">
        <div>
          <button style={{ width: "94%" }} disabled={areAllButtonsDisabled} onClick={() => handleCancelRace()}>
            Cancel Race
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="race-in-progress-wrapper">
      <div className="waypoints-container">
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h2>Race in progress!</h2>
        </div>
        {/* <div className="timer">TIME ELAPSED 00:01:23</div> */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div className="timer">⌛ 12:34</div>
        </div>
        <div className="waypoints">
          {waypoints.map((waypoint) => (
            <Waypoint key={waypoint.id} number={waypoint.id} completed={waypoint.completed} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RaceInProgressScreen;
