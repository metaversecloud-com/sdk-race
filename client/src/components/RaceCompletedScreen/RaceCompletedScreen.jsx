import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { Footer, NewBadgeModal, Tabs } from "@components";

// context
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

export const RaceCompletedScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { elapsedTime, badges } = useContext(GlobalStateContext);

  const [newBadgeKey, setNewBadgeKey] = useState();

  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("profileId");

  useEffect(() => {
    if (profileId) {
      const eventSource = new EventSource(`/api/events?profileId=${profileId}`);
      eventSource.onmessage = function (event) {
        const newEvent = JSON.parse(event.data);
        if (newEvent.badgeKey) setNewBadgeKey(newEvent.badgeKey);
      };
      eventSource.onerror = (event) => {
        console.error("Server Event error:", event);
      };
      return () => {
        eventSource.close();
      };
    }
  }, [profileId]);

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
        <button className="btn-primary" onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN })}>
          Play Again
        </button>
      </Footer>

      {newBadgeKey && <NewBadgeModal badge={badges[newBadgeKey]} handleToggleShowModal={() => {}} />}
    </>
  );
};

export default RaceCompletedScreen;
