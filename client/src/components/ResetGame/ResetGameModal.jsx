import { useState, useContext } from "react";
import PropTypes from "prop-types";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { RESET_GAME, SCREEN_MANAGER, SET_ERROR } from "@context/types";

// utils
import { backendAPI, getErrorMessage } from "@utils";

function ResetGameModal({ handleToggleShowModal, setMessage }) {
  const dispatch = useContext(GlobalDispatchContext);
  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);

  async function handleResetGame() {
    try {
      setAreAllButtonsDisabled(true);
      const result = await backendAPI.post("/race/reset-game");
      if (result.data.success) {
        dispatch({ type: RESET_GAME });
        dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
        setMessage("The game and leaderboard have been reset successfully.");
      }
    } catch (error) {
      dispatch({
        type: SET_ERROR,
        payload: { error: getErrorMessage("resetting", error) },
      });
    } finally {
      setAreAllButtonsDisabled(false);
      handleToggleShowModal();
    }
  }

  return (
    <div className="modal-container visible">
      <div className="modal">
        <h4>Reset Game</h4>
        <p>If you reset the game, the leaderboard will be removed. Are you sure that you would like to continue?</p>
        <div className="actions">
          <button
            id="close"
            className="btn-outline"
            onClick={() => handleToggleShowModal()}
            disabled={areAllButtonsDisabled}
          >
            No
          </button>
          <button className="btn-danger-outline" disabled={areAllButtonsDisabled} onClick={() => handleResetGame()}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

ResetGameModal.propTypes = {
  handleToggleShowModal: PropTypes.func,
  setMessage: PropTypes.func,
};

export default ResetGameModal;
