import React, { useState, useContext, useEffect } from "react";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { useSearchParams } from "react-router-dom";
import "./RaceCompletedScreen.scss";

const RaceCompletedScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { completedWaypoints, startTimestamp, endTimestamp, elapsedTime } = useContext(GlobalStateContext);
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("profileId");

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  const timeDisplay = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="race-completed-wrapper">
      <div className="race-completed-content">
        <h2>Congratulations!</h2>
        <p>You have successfully completed the race.</p>
        <div className="elapsed-time">
          <h3>Elapsed Time: {timeDisplay}</h3>
          <p></p>
        </div>
        <p>Thank you for participating and pushing yourself to the limit!</p>
      </div>
    </div>
  );
};

export default RaceCompletedScreen;
