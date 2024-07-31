import PropTypes from "prop-types";
import { SCREEN_MANAGER } from "@context/types";

function AdminGear({ screenManager, setShowSettings }) {
  function getStyle() {
    if (screenManager === SCREEN_MANAGER.SHOW_RACE_IN_PROGRESS_SCREEN) {
      return {
        position: "absolute",
        top: "24px",
        left: "16px",
      };
    }
    return { marginLeft: "16px", marginTop: "24px", marginBottom: "20px" };
  }

  return (
    <div style={getStyle()} className="icon-with-rounded-border" onClick={() => setShowSettings(true)}>
      <img src="https://sdk-style.s3.amazonaws.com/icons/cog.svg" />
    </div>
  );
}

AdminGear.propTypes = {
  screenManager: PropTypes.string,
  setShowSettings: PropTypes.boolean,
};

export default AdminGear;
