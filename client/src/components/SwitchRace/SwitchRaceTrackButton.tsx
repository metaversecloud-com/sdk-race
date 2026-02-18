import { Track } from "../../../../shared/types/index.js";

interface SwitchRaceTrackButtonProps {
  track: Track;
  handleToggleShowTrackModal: (track: Track) => void;
}

export const SwitchRaceTrackButton = ({ track, handleToggleShowTrackModal }: SwitchRaceTrackButtonProps) => {
  return (
    <div onClick={() => handleToggleShowTrackModal(track)}>
      <img src={track.thumbnail} alt={track.name} />
      <p>{track.name}</p>
    </div>
  );
};

export default SwitchRaceTrackButton;
