import React from "react";

function ResetGameButton({ handleToggleShowModal }) {
  return (
    <button className="btn-danger" style={{ width: "94%" }} onClick={handleToggleShowModal}>
      <span>Reset Game and Clear Leaderboard</span>
    </button>
  );
}

export default ResetGameButton;
