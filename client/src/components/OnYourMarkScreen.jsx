import React, { useState, useEffect } from "react";
import "./OnYourMarkScreen.scss";

const OnYourMarkScreen = () => {
  const countdown = ["3...", "2...", "1..."];
  const [currentMessage, setCurrentMessage] = useState(0);
  const initialMessages = ["On Your Mark...", "Get Set..."];
  const [animationKey, setAnimationKey] = useState(Date.now());

  useEffect(() => {
    if (currentMessage < countdown.length) {
      const timerId = setTimeout(() => {
        setCurrentMessage(currentMessage + 1);
        setAnimationKey(Date.now());
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [currentMessage]);

  const isRunDisplayed = currentMessage === countdown.length;

  return (
    <div className="container">
      <div style={{ paddingTop: "300px", paddingBottom: "50px" }}>
        {initialMessages.map((message, index) => (
          <div key={index} className="initialMessage">
            {message}
          </div>
        ))}
      </div>
      <div
        key={isRunDisplayed ? "run" : animationKey}
        className={`countdown ${!isRunDisplayed ? "small-to-large" : "heartbeat"}`}
      >
        {isRunDisplayed ? "Run!" : countdown[currentMessage]}
      </div>
    </div>
  );
};

export default OnYourMarkScreen;
