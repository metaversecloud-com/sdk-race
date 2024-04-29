import React, { useState } from "react";
import { backendAPI } from "@utils/backendAPI";
import BackArrow from "./BackArrow";

function AdminView({ setShowSettings }) {
  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);
  const [message, setMessage] = useState(false);

  async function handleResetGame() {
    try {
      setAreAllButtonsDisabled(true);
      const result = await backendAPI.post("/race/reset-game");
      if (result?.data?.success) {
        setMessage("The game reset successfully");
      }
    } catch (error) {
      setMessage("There was an error reseting the game. Try again later or contact support.");
      console.error(error);
    } finally {
      setAreAllButtonsDisabled(false);
    }
  }

  return (
    <div className="app-wrapper">
      <BackArrow setShowSettings={setShowSettings} />
      <div className="admin-wrapper" style={{ padding: "16px 24px" }}>
        <div style={{ textAlign: "center" }}>
          <button disabled={areAllButtonsDisabled} onClick={() => handleResetGame()}>
            Reset Game
          </button>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminView;
