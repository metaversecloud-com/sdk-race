import React, { useState, useContext, useEffect, useRef } from "react";
import { backendAPI } from "@utils/backendAPI";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER, CANCEL_RACE } from "@context/types";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { completeRace } from "../../context/actions";
import { ClipLoader } from "react-spinners";
import "./RaceInProgressScreen.scss";

const Checkpoint = ({ number, completed }) => {
  return (
    <div className={`checkpoint ${completed ? "completed" : ""}`}>
      <span className="indicator">{completed ? "🟢" : "🔴"}</span>
      {number === "Finish" ? "Finish" : `Checkpoint ${number}`}
    </div>
  );
};

const RaceInProgressScreen = () => {
  const positiveAudioRef = useRef(null);
  const negativeAudioRef = useRef(null);
  const successAudioRef = useRef(null);

  useEffect(() => {
    positiveAudioRef.current = new Audio("https://sdk-scavenger-hunt.s3.amazonaws.com/positive.mp3");
    negativeAudioRef.current = new Audio("https://sdk-scavenger-hunt.s3.amazonaws.com/negative.mp3");
    successAudioRef.current = new Audio("https://sdk-scavenger-hunt.s3.amazonaws.com/success.mp3");
  }, []);
  const navigate = useNavigate();
  const dispatch = useContext(GlobalDispatchContext);
  const { checkpointsCompleted, startTimestamp, numberOfCheckpoints, elapsedTimeInSeconds } =
    useContext(GlobalStateContext);
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState(["event1"]);
  const [isFinishComplete, setIsFinishComplete] = useState(false);
  const [currentFinishedElapsedTime, setCurrentFinishedElapsedTime] = useState(null);

  const profileId = searchParams.get("profileId");

  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [counter, setCounter] = useState(0);

  const [checkpoints, setCheckpoints] = useState(
    Array.from({ length: numberOfCheckpoints }, (_, index) => ({
      id: index + 1,
      completed: checkpointsCompleted?.[index] || false,
    })),
  );

  useEffect(() => {
    setCheckpoints((prevCheckpoints) =>
      prevCheckpoints?.map((checkpoint, index) => ({
        ...checkpoint,
        completed: checkpointsCompleted?.[index] || false,
      })),
    );
  }, [checkpointsCompleted]);

  useEffect(() => {
    if (profileId) {
      const eventSource = new EventSource(`/api/events?profileId=${profileId}`);
      eventSource.onmessage = function (event) {
        console.log("hey");
        const newEvent = JSON.parse(event.data);
        setEvents((prevEvents) => [...prevEvents, newEvent]);
        setCheckpoints((prevCheckpoints) => {
          const currentCheckpointIndex = prevCheckpoints.findIndex(
            (checkpoint) => checkpoint?.id === newEvent?.checkpointNumber,
          );
          const isCheckpointInCorrectOrder =
            currentCheckpointIndex !== -1 &&
            newEvent?.checkpointNumber === currentCheckpointIndex + 1 &&
            (currentCheckpointIndex === 0 || prevCheckpoints[currentCheckpointIndex - 1].completed);

          const updatedCheckpoints = prevCheckpoints?.map((checkpoint, index) => {
            if (checkpoint?.id === newEvent?.checkpointNumber && isCheckpointInCorrectOrder) {
              if (
                newEvent?.checkpointNumber !== undefined &&
                newEvent?.checkpointNumber !== 0 &&
                !checkpoint.completed
              ) {
                positiveAudioRef.current.play();
              }
              return { ...checkpoint, completed: true };
            }
            return checkpoint;
          });

          const allCheckpointsCompleted = updatedCheckpoints?.every((checkpoint) => checkpoint.completed);
          if (newEvent?.checkpointNumber === 0 && allCheckpointsCompleted && newEvent?.currentRaceFinishedElapsedTime) {
            setIsFinishComplete(true);
            setCurrentFinishedElapsedTime(newEvent.currentRaceFinishedElapsedTime);
          }

          if (!isCheckpointInCorrectOrder) {
            if (newEvent?.checkpointNumber !== undefined && newEvent?.checkpointNumber !== 0) {
              negativeAudioRef.current.play();
            }
          }

          return updatedCheckpoints;
        });
      };
      eventSource.onerror = (event) => {
        console.error("Server Event error:", event);
      };
      return () => {
        eventSource.close();
      };
    }
  }, [profileId]);

  const completeRaceCalledRef = useRef(false);

  useEffect(() => {
    const allCompleted = checkpoints?.every((checkpoint) => checkpoint.completed) && isFinishComplete;
    if (allCompleted && !completeRaceCalledRef.current) {
      completeRaceCalledRef.current = true;
      successAudioRef.current.play();
      completeRace({ dispatch, currentFinishedElapsedTime });
    }
  }, [checkpoints, isFinishComplete, currentFinishedElapsedTime, dispatch]);

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
    return (
      <div className="loader">
        <ClipLoader color={"#123abc"} loading={true} size={150} />
      </div>
    );
  }

  return (
    <div className="race-in-progress-wrapper">
      <div className="checkpoints-container">
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
        <div className="checkpoints">
          {checkpoints?.map((checkpoint) => (
            <Checkpoint key={checkpoint.id} number={checkpoint.id} completed={checkpoint.completed} />
          ))}
          <Checkpoint key="finish" number="Finish" completed={isFinishComplete} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RaceInProgressScreen;
