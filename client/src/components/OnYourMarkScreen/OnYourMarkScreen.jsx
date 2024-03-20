import React, { useState, useEffect, useContext } from "react";
import { startRace, showRaceInProgressScreen } from "../../context/actions";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { useNavigate } from "react-router-dom";
import "./OnYourMarkScreen.scss";

const OnYourMarkScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const navigate = useNavigate();
  const { raceStarted } = useContext(GlobalStateContext);

  const countdown = ["3...", "2...", "1...", "0..."];
  const [currentMessage, setCurrentMessage] = useState(0);
  const initialMessages = ["On Your Mark...", "Get Set..."];
  const [raceInitiated, setRaceInitiated] = useState(false);

  useEffect(() => {
    if (currentMessage < countdown.length - 1) {
      const timerId = setTimeout(() => {
        setCurrentMessage(currentMessage + 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (currentMessage === countdown.length - 1 && !raceInitiated) {
      startRace({ dispatch, navigate });
      setRaceInitiated(true);
      setTimeout(() => {
        showRaceInProgressScreen(dispatch);
      }, 5000);
    }
  }, [currentMessage, raceInitiated, dispatch, navigate]);

  const isRunDisplayed = raceStarted && raceInitiated;

  return (
    <div className="container">
      {!isRunDisplayed && (
        <div style={{ paddingBottom: "50px" }}>
          {initialMessages.map((message, index) => (
            <div key={index} className="initialMessage">
              {message}
            </div>
          ))}
        </div>
      )}
      <div
        key={isRunDisplayed ? "run" : currentMessage}
        className={`countdown ${!isRunDisplayed ? "small-to-large" : "heartbeat"}`}
      >
        {isRunDisplayed ? "Run!" : countdown[currentMessage]}
      </div>
    </div>
  );
};

export default OnYourMarkScreen;
