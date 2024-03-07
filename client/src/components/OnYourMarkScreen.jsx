import React, { useState, useEffect } from "react";

const OnYourMarkScreen = () => {
  const [countdown, setCountdown] = useState(["On Your Mark...", "Get Set...", "3...", "2...", "1...", "Run!"]);
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    if (currentMessage < countdown.length - 1) {
      const timerId = setTimeout(() => {
        setCurrentMessage(currentMessage + 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else {
      startRace(); // new
    }
  }, [currentMessage, countdown]);

  const startRace = () => {
    // Placeholder function to start the race
    // TODO: Implement the race start logic here
  };

  return <div>{countdown[currentMessage]}</div>;
};

export default OnYourMarkScreen;
