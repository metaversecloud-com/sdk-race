import React from "react";

function RaceTrackSwitcherButton({ track, handleToggleShowRacetrackModal }) {
  return (
    <div className="track-item" onClick={() => handleToggleShowRacetrackModal(track)}>
      <img src={track.thumbnail} alt={track.name} className="track-thumbnail" />
      <p>{track.name}</p>
    </div>
  );
}

export default RaceTrackSwitcherButton;
