import PropTypes from "prop-types";

function SwitchRaceTrackButton({ track, handleToggleShowTrackModal }) {
  return (
    <div onClick={() => handleToggleShowTrackModal(track)}>
      <img src={track.thumbnail} alt={track.name} />
      <p>{track.name}</p>
    </div>
  );
}

SwitchRaceTrackButton.propTypes = {
  handleToggleShowTrackModal: PropTypes.func,
  track: {
    name: PropTypes.string,
    thumbnail: PropTypes.string,
  },
};

export default SwitchRaceTrackButton;
