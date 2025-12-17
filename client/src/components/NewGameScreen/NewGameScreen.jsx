import { useContext } from "react";

// components
import racingMap from "../../assets/racingMap.png";
import { Footer, Tabs } from "@components";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

export const NewGameScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const goToSwitchTrackScreen = () => {
    dispatch({ type: SCREEN_MANAGER.SHOW_SWITCH_TRACK_SCREEN });
  };

  const startRace = () => {
    dispatch({ type: SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN });
  };

  return (
    <>
      <div className="grid gap-6">
        <Tabs />
        <img src={racingMap} alt="racing map" className="rounded-lg shadow-lg" />
        <div className="card p-4">
          <strong>How to Play</strong>
          <ol style={{ marginLeft: "18px", listStyle: "auto" }}>
            <li>Click Start Race to begin.</li>
            <li>Run through all checkpoints in the correct order to complete the race!</li>
          </ol>
        </div>
      </div>

      <Footer>
        <button className="btn-primary-outline" onClick={goToSwitchTrackScreen}>
          Update Track
        </button>
        <button className="btn-primary" onClick={startRace}>
          Start Race
        </button>
      </Footer>
    </>
  );
};

export default NewGameScreen;
