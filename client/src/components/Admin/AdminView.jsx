import React, { useContext, useState, useEffect } from "react";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import BackArrow from "./BackArrow";

function AdminView({ setShowSettings }) {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitor } = useContext(GlobalStateContext);

  return (
    <div className="app-wrapper">
      <BackArrow setShowSettings={setShowSettings} />
      {/* <div style={{ marginTop: "80px" }}>
        <p>Admin View</p>
      </div> */}
    </div>
  );
}

export default AdminView;
