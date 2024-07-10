import React, { useState } from "react";
import { backendAPI } from "@utils/backendAPI";

function TrackSwitcherModal({ track, handleToggleShowModal, setMessage }) {
  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);

  async function handleSwitchTrack() {
    try {
      setAreAllButtonsDisabled(true);
      const result = await backendAPI.post(`/race/switch-track?trackSceneId=${track.sceneId}`);
      if (result.data.success) {
        setMessage(`The track has been switched to ${track.name} successfully.`);
        // Dispatch any necessary actions here, if needed
      }
    } catch (error) {
      setMessage("There was an error switching the track. Try again later or contact support.");
      console.error(error);
    } finally {
      setAreAllButtonsDisabled(false);
      handleToggleShowModal();
    }
  }

  return (
    <div className="modal-container visible">
      <div className="modal">
        <h4>Switch Track</h4>
        <p>Are you sure you want to switch to {track.name}?</p>
        <p>Switching tracks will reset the game and clear the Leaderboard. This action cannot be undone.</p>

        <div className="actions">
          <button
            id="close"
            className="btn-outline"
            onClick={() => handleToggleShowModal()}
            disabled={areAllButtonsDisabled}
          >
            No
          </button>
          <button className="btn-danger-outline" disabled={areAllButtonsDisabled} onClick={() => handleSwitchTrack()}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrackSwitcherModal;
