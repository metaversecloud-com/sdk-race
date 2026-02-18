import { useState, useContext, useEffect } from "react";

// components
import { BackButton, ConfirmationModal, Footer } from "@components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@context/GlobalContext";
import { SET_ERROR, SCREEN_MANAGER, SET_SCENE_DATA } from "@context/types";

// utils
import { backendAPI, getErrorMessage } from "@utils";

export const SwitchTrackScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { tracks, lastRaceStartedDate, isAdmin } = useContext(GlobalStateContext);

  const [selectedTrack, setSelectedTrack] = useState(null);
  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);
  const [showRaceWarning, setShowRaceWarning] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    if (lastRaceStartedDate) {
      const now = Date.now();
      const diffMinutes = (now - lastRaceStartedDate) / (1000 * 60);
      const isRecentRace = diffMinutes < 5;

      if (isRecentRace) {
        if (isAdmin) {
          setAreAllButtonsDisabled(false);
          setShowRaceWarning(true);
        } else {
          setAreAllButtonsDisabled(true);
          setShowRaceWarning(false);
        }
      } else {
        setAreAllButtonsDisabled(false);
        setShowRaceWarning(false);
      }
    } else {
      setAreAllButtonsDisabled(false);
      setShowRaceWarning(false);
    }
  }, [lastRaceStartedDate, isAdmin]);

  const updateTrack = async () => {
    setAreAllButtonsDisabled(true);

    await backendAPI
      .post("/race/switch-track", { selectedTrack })
      .then((response) => {
        const { leaderboard, numberOfCheckpoints } = response.data.sceneData;

        dispatch({
          type: SET_SCENE_DATA,
          payload: {
            leaderboard,
            numberOfCheckpoints,
            tracks,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: SET_ERROR,
          payload: { error: getErrorMessage("resetting", error) },
        });
        setAreAllButtonsDisabled(false);
      });
  };

  const handleUpdateTrackClick = () => {
    if (showRaceWarning) {
      setShowConfirmationModal(true);
    } else {
      updateTrack();
    }
  };

  return (
    <>
      <BackButton onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN })} />

      <div className="text-center pb-8">
        <h2>Choose New Track</h2>
        <p className="pt-4">Updates will reflect for everyone</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {tracks?.map((track) => {
          return (
            <button key={track.id} className="mb-2" onClick={() => setSelectedTrack(track)}>
              <div className="tooltip">
                <span className="tooltip-content">{track.name}</span>
                <img
                  className={`track object-cover ${selectedTrack && selectedTrack.id === track.id ? "selected" : ""}`}
                  src={track?.thumbnail}
                  alt={track.name}
                />
              </div>
            </button>
          );
        })}
      </div>

      <Footer>
        {areAllButtonsDisabled && !isAdmin ? (
          <div className="tooltip">
            <span className="tooltip-content">A race was recently started. Please try again in a few minutes.</span>
            <button
              className="btn-primary"
              disabled={areAllButtonsDisabled || !selectedTrack}
              onClick={handleUpdateTrackClick}
            >
              Update Track
            </button>
          </div>
        ) : (
          <button
            className="btn-primary"
            disabled={areAllButtonsDisabled || !selectedTrack}
            onClick={handleUpdateTrackClick}
          >
            Update Track
          </button>
        )}
      </Footer>

      {showConfirmationModal && (
        <ConfirmationModal
          title="Switch Track"
          message="A race may currently be in progress. Are you sure you want to switch tracks?"
          handleOnConfirm={updateTrack}
          handleToggleShowConfirmationModal={() => setShowConfirmationModal(false)}
        />
      )}
    </>
  );
};

export default SwitchTrackScreen;
