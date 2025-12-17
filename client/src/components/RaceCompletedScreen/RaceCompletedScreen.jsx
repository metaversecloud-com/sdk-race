import { useContext } from "react";

// components
import { Footer, Tabs } from "@components";

// context
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

export const RaceCompletedScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { elapsedTime } = useContext(GlobalStateContext);

  function handlePlayAgain() {
    dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
  }

  return (
    <>
      <div className="grid gap-6">
        <Tabs />

        <div className="card">
          <div className="grid gap-2 p-4 text-center">
            <h2>
              <strong>Congratulations!</strong>
            </h2>
            <div style={{ fontSize: "50px" }}>🏁</div>
            <h3>Your Time</h3>
            <h2>
              <strong>{elapsedTime}</strong>
            </h2>
          </div>
        </div>
      </div>

      <Footer>
        <button className="btn-primary" onClick={() => handlePlayAgain()}>
          Play Again
        </button>
      </Footer>
    </>
  );
};

export default RaceCompletedScreen;
