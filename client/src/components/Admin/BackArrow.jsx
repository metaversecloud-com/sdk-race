import PropTypes from "prop-types";

function BackArrow({ setShowSettings }) {
  return (
    <div
      style={{ marginLeft: "16px", marginTop: "24px", marginBottom: "20px" }}
      className="icon-with-rounded-border"
      onClick={() => {
        setShowSettings(false);
      }}
    >
      <img src="https://sdk-style.s3.amazonaws.com/icons/arrow.svg" />
    </div>
  );
}

BackArrow.propTypes = {
  setShowSettings: PropTypes.boolean,
};

export default BackArrow;
