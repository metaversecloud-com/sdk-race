import React, { useState, useEffect, useContext } from "react";
import { startRace, showRaceInProgressScreen } from "../../context/actions";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { useNavigate } from "react-router-dom";
import "./OnYourMarkScreen.scss";

const OnYourMarkScreen = () => {
  const navigate = useNavigate();
  const dispatch = useContext(GlobalDispatchContext);
  const { raceStarted, visitor } = useContext(GlobalStateContext);
  const countdown = ["3...", "2...", "1..."];
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
    }
  }, [currentMessage, raceInitiated, dispatch, navigate]);

  return (
    <div className="container" style={{ height: visitor?.isAdmin ? "90vh" : "100vh" }}>
      {!raceStarted && (
        <div style={{ paddingBottom: "50px" }}>
          {initialMessages?.map((message, index) => (
            <div key={index} className="initialMessage">
              {message}
            </div>
          ))}
        </div>
      )}
      <div key={currentMessage} className={`countdown ${!raceStarted ? "small-to-large" : ""}`}>
        {countdown[currentMessage]}
      </div>
    </div>
  );
};

export default OnYourMarkScreen;
