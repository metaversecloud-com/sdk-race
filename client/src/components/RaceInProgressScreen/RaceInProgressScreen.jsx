import { useState, useContext, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// components
import Checkpoint from "./Checkpoint";
import Footer from "@components/Shared/Footer";
import Loading from "@components/Shared/Loading";

// context
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { cancelRace, completeRace } from "@context/actions";

const RaceInProgressScreen = () => {
  const positiveAudioRef = useRef(null);
  const negativeAudioRef = useRef(null);
  const successAudioRef = useRef(null);

  useEffect(() => {
    positiveAudioRef.current = new Audio("https://sdk-race.s3.amazonaws.com/audio/positive.mp3");
    negativeAudioRef.current = new Audio("https://sdk-race.s3.amazonaws.com/audio/negative.mp3");
    successAudioRef.current = new Audio("https://sdk-race.s3.amazonaws.com/audio/success.mp3");
  }, []);

  const dispatch = useContext(GlobalDispatchContext);
  const { checkpointsCompleted, numberOfCheckpoints, elapsedTimeInSeconds } = useContext(GlobalStateContext);
  const [searchParams] = useSearchParams();
  const [isFinishComplete, setIsFinishComplete] = useState(false);
  const [currentFinishedElapsedTime, setCurrentFinishedElapsedTime] = useState(null);

  const profileId = searchParams.get("profileId");

  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [audioQueue, setAudioQueue] = useState([]);

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
        const newEvent = JSON.parse(event.data);
        setCheckpoints((prevCheckpoints) => {
          const currentCheckpointIndex = prevCheckpoints.findIndex(
            (checkpoint) => checkpoint?.id === newEvent?.checkpointNumber,
          );
          const isCheckpointInCorrectOrder =
            currentCheckpointIndex !== -1 &&
            newEvent?.checkpointNumber === currentCheckpointIndex + 1 &&
            (currentCheckpointIndex === 0 || prevCheckpoints[currentCheckpointIndex - 1].completed);

          const updatedCheckpoints = prevCheckpoints?.map((checkpoint) => {
            if (checkpoint?.id === newEvent?.checkpointNumber && isCheckpointInCorrectOrder) {
              if (
                newEvent?.checkpointNumber !== undefined &&
                newEvent?.checkpointNumber !== 0 &&
                !checkpoint.completed
              ) {
                setAudioQueue((prevQueue) => [...prevQueue, positiveAudioRef.current]);
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
              setAudioQueue((prevQueue) => [...prevQueue, negativeAudioRef.current]);
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
    let startTime = Date.now() - elapsedTimeInSeconds * 1000;

    const interval = setInterval(() => {
      const elapsedMilliseconds = Date.now() - startTime;
      const minutes = Math.floor(elapsedMilliseconds / 60000);
      const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
      const centiseconds = Math.floor((elapsedMilliseconds % 1000) / 10);

      setElapsedTime(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${centiseconds.toString().padStart(2, "0")}`,
      );
    }, 50);

    return () => clearInterval(interval);
  }, [elapsedTimeInSeconds]);

  const playAudioQueue = () => {
    if (audioQueue.length > 0) {
      const audio = audioQueue[0];
      audio.play();
      audio.onended = () => {
        setAudioQueue((prevQueue) => prevQueue.slice(1));
      };
    }
  };

  useEffect(() => {
    playAudioQueue();
  }, [audioQueue]);

  const handleCancelRace = async () => {
    try {
      setAreAllButtonsDisabled(true);
      cancelRace(dispatch);
    } catch (error) {
      console.error(error);
    } finally {
      setAreAllButtonsDisabled(false);
    }
  };

  if (elapsedTime == "00:00") return <Loading />;

  return (
    <div className="text-center pb-16">
      <div style={{ textAlign: "center" }}>
        <div className="mt-4">⌛ {elapsedTime}</div>
      </div>
      <h2 className="py-6">Race in progress!</h2>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "10px" }}>
        <h2 key={"run"} className={`heartbeat`}>
          Run!
        </h2>
      </div>
      <div className="p-4 text-left">
        {checkpoints?.map((checkpoint) => (
          <Checkpoint key={checkpoint.id} number={checkpoint.id} completed={checkpoint.completed} />
        ))}
        <Checkpoint key="finish" number="Finish" completed={isFinishComplete} />
      </div>
      <Footer>
        <button style={{ width: "94%" }} disabled={areAllButtonsDisabled} onClick={() => handleCancelRace()}>
          Cancel Race
        </button>
      </Footer>
    </div>
  );
};

export default RaceInProgressScreen;
