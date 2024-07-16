import React from "react";

function SwitchRaceTrackButton({ track, handleToggleShowTrackModal }) {
  return (
    <div className="race-track-item" onClick={() => handleToggleShowTrackModal(track)}>
      <img src={track.thumbnail} alt={track.name} className="race-track-thumbnail" />
      <p>{track.name}</p>
    </div>
  );
}

export default SwitchRaceTrackButton;
