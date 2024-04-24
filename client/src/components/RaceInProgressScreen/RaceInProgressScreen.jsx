import React, { useState, useContext, useEffect, useRef } from "react";
import { backendAPI } from "@utils/backendAPI";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER, CANCEL_RACE } from "@context/types";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { completeRace } from "../../context/actions";
import "./RaceInProgressScreen.scss";

const Waypoint = ({ number, completed }) => {
  return (
    <div className={`waypoint ${completed ? "completed" : ""}`}>
      <span className="indicator">{completed ? "🟢" : "🔴"}</span>
      {number === "Finish" ? "Finish" : `Waypoint ${number}`}
    </div>
  );
};

const RaceInProgressScreen = () => {
  const navigate = useNavigate();
  const dispatch = useContext(GlobalDispatchContext);
  const { waypointsCompleted, startTimestamp, numberOfWaypoints, elapsedTimeInSeconds } =
    useContext(GlobalStateContext);
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState(["event1"]);
  const [isFinishComplete, setIsFinishComplete] = useState(false);
  const [currentFinishedElapsedTime, setCurrentFinishedElapsedTime] = useState(null);

  const profileId = searchParams.get("profileId");

  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [counter, setCounter] = useState(0);

  const [waypoints, setWaypoints] = useState(
    Array.from({ length: numberOfWaypoints }, (_, index) => ({
      id: index + 1,
      completed: waypointsCompleted?.[index] || false,
    })),
  );

  useEffect(() => {
    setWaypoints((prevWaypoints) =>
      prevWaypoints?.map((waypoint, index) => ({
        ...waypoint,
        completed: waypointsCompleted?.[index] || false,
      })),
    );
  }, [waypointsCompleted]);

  useEffect(() => {
    if (profileId) {
      const eventSource = new EventSource(`/api/events?profileId=${profileId}`);
      eventSource.onmessage = function (event) {
        const newEvent = JSON.parse(event.data);
        setEvents((prevEvents) => [...prevEvents, newEvent]);
        setWaypoints((prevWaypoints) => {
          const updatedWaypoints = prevWaypoints?.map((waypoint, index) => {
            if (
              waypoint?.id === newEvent?.waypointNumber &&
              newEvent?.waypointNumber === index + 1 &&
              (index === 0 || prevWaypoints[index - 1].completed)
            ) {
              return { ...waypoint, completed: true };
            }
            return waypoint;
          });

          const allWaypointsCompleted = updatedWaypoints?.every((waypoint) => waypoint.completed);
          if (newEvent?.waypointNumber === 0 && allWaypointsCompleted && newEvent?.currentRaceFinishedElapsedTime) {
            setIsFinishComplete(true);
            setCurrentFinishedElapsedTime(newEvent.currentRaceFinishedElapsedTime);
          }

          return updatedWaypoints;
        });
      };
      return () => {
        eventSource.close();
      };
    }
  }, [profileId]);

  const completeRaceCalledRef = useRef(false);

  useEffect(() => {
    const allCompleted = waypoints?.every((waypoint) => waypoint.completed) && isFinishComplete;
    if (allCompleted && !completeRaceCalledRef.current) {
      completeRaceCalledRef.current = true;
      completeRace({ dispatch, currentFinishedElapsedTime });
    }
  }, [waypoints, isFinishComplete, currentFinishedElapsedTime, dispatch]);

  // Timer
  useEffect(() => {
    let elapsedSeconds = elapsedTimeInSeconds;

    const interval = setInterval(() => {
      elapsedSeconds++;
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      setElapsedTime(`${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  if (elapsedTime == "00:00") {
    return <div>Loading...</div>;
  }

  return (
    <div className="race-in-progress-wrapper">
      <div className="waypoints-container">
        <h2 style={{ textAlign: "center" }}>Race in progress!</h2>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" }}>
          <div
            key={"run"}
            className={`countdown heartbeat`}
            style={{ marginRight: "16px", display: "flex", alignItems: "center" }}
          >
            Run!
          </div>
          <div className="timer" style={{ display: "flex", alignItems: "center", marginTop: "11px" }}>
            ⌛ {elapsedTime}
          </div>
        </div>
        <div className="waypoints">
          {waypoints?.map((waypoint) => (
            <Waypoint key={waypoint.id} number={waypoint.id} completed={waypoint.completed} />
          ))}
          <Waypoint key="finish" number="Finish" completed={isFinishComplete} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RaceInProgressScreen;
