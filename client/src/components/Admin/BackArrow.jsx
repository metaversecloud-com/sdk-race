import PropTypes from "prop-types";

function BackArrow({ setShowSettings }) {
  return (
    <div className="icon-with-rounded-border m-4" onClick={() => setShowSettings(false)}>
      <img src="https://sdk-style.s3.amazonaws.com/icons/arrow.svg" />
    </div>
  );
}

BackArrow.propTypes = {
  setShowSettings: PropTypes.func,
};

export default BackArrow;
