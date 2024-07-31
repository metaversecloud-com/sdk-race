import PropTypes from "prop-types";
import backArrow from "../../assets/backArrow.svg";

function BackArrow({ setShowSettings }) {
  return (
    <div
      style={{ marginLeft: "16px", marginTop: "24px", marginBottom: "20px" }}
      className="icon-with-rounded-border"
      onClick={() => {
        setShowSettings(false);
      }}
    >
      <img src={backArrow} />
    </div>
  );
}

BackArrow.propTypes = {
  setShowSettings: PropTypes.boolean,
};

export default BackArrow;
