import React, { useContext } from "react";
import { GlobalStateContext } from "@context/GlobalContext";
import "./RaceCompletedScreen.scss";

const RaceCompletedScreen = () => {
  const { elapsedTime } = useContext(GlobalStateContext);

  return (
    <div className="race-completed-wrapper">
      <div className="race-completed-content">
        <h2>Congratulations!</h2>
        <p>You have successfully completed the race.</p>
        <div className="elapsed-time">
          <h3>Elapsed Time: {elapsedTime}</h3>
          <p></p>
        </div>
        <p>Thank you for participating and pushing yourself to the limit!</p>
      </div>
    </div>
  );
};

export default RaceCompletedScreen;
