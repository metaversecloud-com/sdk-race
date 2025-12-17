import PropTypes from "prop-types";

export const AdminIconButton = ({ setShowSettings, showSettings }) => {
  return (
    <div className="icon-btn mb-4 text-right" onClick={() => setShowSettings(showSettings)}>
      {showSettings ? "←" : "⛭"}
    </div>
  );
};

AdminIconButton.propTypes = {
  setShowSettings: PropTypes.func,
  showSettings: PropTypes.bool,
};

export default AdminIconButton;
