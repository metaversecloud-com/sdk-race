import { useContext, useState } from "react";

// components
import { ConfirmationModal, Footer } from "@components";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { RESET_GAME, SCREEN_MANAGER, SET_ERROR } from "@context/types";

// utils
import { backendAPI, getErrorMessage } from "@utils";

export const AdminView = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const [showResetGameModal, setShowResetGameModal] = useState(false);

  function handleToggleShowResetGameModal() {
    setShowResetGameModal(!showResetGameModal);
  }

  const handleResetGame = async () => {
    await backendAPI
      .post("/race/reset-game")
      .then(() => {
        dispatch({ type: RESET_GAME });
        dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN });
      })
      .catch((error) => {
        dispatch({
          type: SET_ERROR,
          payload: { error: getErrorMessage("resetting", error) },
        });
      })
      .finally(() => {
        handleToggleShowResetGameModal();
      });
  };

  return (
    <>
      <h2 className="text-white">Settings</h2>

      <Footer>
        <button className="btn-primary" onClick={handleToggleShowResetGameModal}>
          Reset Game
        </button>
      </Footer>

      {showResetGameModal && (
        <ConfirmationModal
          title="Reset Game"
          message="If you reset the game, the leaderboard will be removed. Are you sure that you would like to continue?"
          handleOnConfirm={handleResetGame}
          handleToggleShowConfirmationModal={handleToggleShowResetGameModal}
        />
      )}
    </>
  );
};

export default AdminView;
