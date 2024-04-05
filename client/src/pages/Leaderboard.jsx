import React, { useContext, useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { backendAPI } from "@utils/backendAPI";
import { LOAD_GAME_STATE } from "../context/types";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import "./Leaderboard.scss";

function Home() {
  const dispatch = useContext(GlobalDispatchContext);
  const { leaderboard } = useContext(GlobalStateContext);
  const [loading, setLoading] = useState(true);

  console.log("leaderboard", leaderboard);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        await loadGameState({ dispatch });
      } catch (error) {
        console.error("error in loadGameState action");
      }
    };
    fetchGameState();
  }, [dispatch]);

  const loadGameState = async ({ dispatch }) => {
    try {
      setLoading(true);
      const result = await backendAPI.get("/race/game-state");
      if (result.data.success) {
        await dispatch({
          type: LOAD_GAME_STATE,
          payload: {
            waypointsCompleted: result.data.waypointsCompleted,
            startTimestamp: result.data.startTimestamp,
            leaderboard: result.data.leaderboard,
          },
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("error in loadGameState action");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="loader">
        <ClipLoader color={"#123abc"} loading={loading} size={150} />
      </div>
    );
  }

  return (
    <>
      <div className="app-wrapper leaderboard-container">
        <h1 className="trophy">🏆</h1>
        <div style={{ marginBottom: "20px" }}>
          <h3>Leaderboard</h3>
        </div>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(leaderboard || {}).length === 0 ? (
              <tr>
                <td colSpan="3">There are no race finishes yet.</td>
              </tr>
            ) : (
              Object.entries(leaderboard || {}).map(([userId, entry], index) => (
                <tr key={userId}>
                  <td>{index + 1}</td>
                  <td>{entry.username}</td>
                  <td>{entry.elapsedTime}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Home;
