import PropTypes from "prop-types";

function AdminGear({ setShowSettings }) {
  return (
    <div className="icon-with-rounded-border m-4" onClick={() => setShowSettings(true)}>
      <img src="https://sdk-style.s3.amazonaws.com/icons/cog.svg" />
    </div>
  );
}

AdminGear.propTypes = {
  setShowSettings: PropTypes.func,
};

export default AdminGear;
