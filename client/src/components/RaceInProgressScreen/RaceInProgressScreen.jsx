import React, { useState, useContext, useEffect } from "react";
import { backendAPI } from "@utils/backendAPI";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER, CANCEL_RACE } from "@context/types";
import { useSearchParams } from "react-router-dom";
import "./RaceInProgressScreen.scss";

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
  const { completedWaypoints, startTimestamp } = useContext(GlobalStateContext);
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState(["event1"]);

  const profileId = searchParams.get("profileId");

  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("...");

  const [waypoints, setWaypoints] = useState([
    { id: 1, completed: false },
    { id: 2, completed: false },
    { id: 3, completed: false },
    { id: 4, completed: false },
    { id: 5, completed: false },
  ]);

  useEffect(() => {
    if (profileId) {
      const eventSource = new EventSource(`http://localhost:3000/api/events?profileId=${profileId}`);
      eventSource.onmessage = function (event) {
        const newEvent = JSON.parse(event.data);
        setEvents((prevEvents) => [...prevEvents, newEvent]);
        setWaypoints((prevWaypoints) => {
          const updatedWaypoints = prevWaypoints.map((waypoint, index) => {
            if (waypoint.id === newEvent.waypointNumber && (index === 0 || prevWaypoints[index - 1].completed)) {
              return { ...waypoint, completed: true };
            }
            return waypoint;
          });
          return updatedWaypoints;
        });
      };
      return () => {
        eventSource.close();
      };
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - startTimestamp;
      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setElapsedTime(`${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTimestamp]);

  const handleCancelRace = async () => {
    try {
      setAreAllButtonsDisabled(true);
      const result = await backendAPI.post("/race/cancel-race");
      if (result.data.success) {
        dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
        dispatch({ type: CANCEL_RACE });
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

  {
    console.log("events", events);
  }

  return (
    <div className="race-in-progress-wrapper">
      <div className="waypoints-container">
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h2>Race in progress!</h2>
        </div>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div className="timer">⌛ {elapsedTime}</div>
        </div>
        <div className="waypoints">
          {waypoints.map((waypoint) => (
            <Waypoint key={waypoint.id} number={waypoint.id} completed={waypoint.completed} />
          ))}
        </div>
      </div>
      <ul>
        {/* {events.map((event, index) => (
          <li key={index}>{event?.waypointNumber}</li>
        ))} */}
      </ul>
      <Footer />
    </div>
  );
};

export default RaceInProgressScreen;
