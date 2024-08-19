import { useContext } from "react";

// components
import racingMap from "../../assets/racingMap.png";
import Footer from "../Shared/Footer";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

const NewGameScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const startRace = () => {
    dispatch({ type: SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN });
  };

  const Instructions = () => (
    <>
      <h3 className="text-center p-6">🏎️ Welcome to the Race!</h3>
      <div className="p-4">
        <h4 className="pb-2">How to play:</h4>
        <ol style={{ marginLeft: "24px", listStyle: "auto" }}>
          <li>
            Click <span style={{ color: "green" }}>Start Race</span> to begin.
          </li>
          <li>🏁 Run through all checkpoints in the correct order to complete the race!</li>
        </ol>

        <h4 className="pt-6 pb-2">Important rules:</h4>
        <ul style={{ marginLeft: "24px", listStyle: "disc" }}>
          <li>
            Time starts when you click <span style={{ color: "green" }}>Start Race</span>.
          </li>
          <li>Check your rank by clicking the 🏆 leaderboard.</li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      <div className="">
        <img src={racingMap} alt="racing map" className="rounded-lg shadow-lg" />
      </div>
      <Instructions />
      <Footer>
        <button onClick={startRace} style={{ width: "94%" }}>
          {" "}
          Start Race
        </button>
      </Footer>
    </>
  );
};

export default NewGameScreen;
