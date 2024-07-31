import PropTypes from "prop-types";

function ResetGameButton({ handleToggleShowModal }) {
  return (
    <button className="btn-danger" style={{ width: "94%" }} onClick={handleToggleShowModal}>
      <span>Reset Game</span>
    </button>
  );
}

ResetGameButton.propTypes = {
  handleToggleShowModal: PropTypes.func,
};

export default ResetGameButton;
