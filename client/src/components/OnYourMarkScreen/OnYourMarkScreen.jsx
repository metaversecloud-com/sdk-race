import { useState, useEffect, useContext, useRef } from "react";
import { startRace } from "../../context/actions";
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

  const beepAudioRef = useRef(null);
  const beep2AudioRef = useRef(null);

  useEffect(() => {
    beepAudioRef.current = new Audio("https://sdk-race.s3.amazonaws.com/audio/beep1.mp3");
    beep2AudioRef.current = new Audio("https://sdk-race.s3.amazonaws.com/audio/beep2.mp3");

    beepAudioRef.current.addEventListener("canplaythrough", () => {
      beepAudioRef.current.play();
    });
  }, []);

  useEffect(() => {
    if (currentMessage < countdown.length) {
      if (currentMessage === 0) {
        beepAudioRef.current.load();
      } else {
        beepAudioRef.current.play();
      }
      const timerId = setTimeout(() => {
        setCurrentMessage(currentMessage + 1);
      }, 1000);

      return () => clearTimeout(timerId);
    } else if (currentMessage === countdown.length && !raceInitiated) {
      beep2AudioRef.current.play();
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
        {currentMessage < countdown.length ? countdown[currentMessage] : "Go!"}
      </div>
    </div>
  );
};

export default OnYourMarkScreen;
