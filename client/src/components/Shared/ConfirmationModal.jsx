import { useState } from "react";
import PropTypes from "prop-types";

export const ConfirmationModal = ({ title, message, handleOnConfirm, handleToggleShowConfirmationModal }) => {
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const onConfirm = async () => {
    setAreButtonsDisabled(true);
    await handleOnConfirm();
    handleToggleShowConfirmationModal();
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <h4>{title}</h4>
        <p>{message}</p>
        <div className="actions">
          <button
            id="close"
            className="btn btn-outline"
            onClick={handleToggleShowConfirmationModal}
            disabled={areButtonsDisabled}
          >
            No
          </button>
          <button className="btn btn-danger-outline" onClick={onConfirm} disabled={areButtonsDisabled}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  handleOnConfirm: PropTypes.func,
  handleToggleShowConfirmationModal: PropTypes.func,
};

export default ConfirmationModal;
