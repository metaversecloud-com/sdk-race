import React, { useContext, useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { backendAPI } from "@utils/backendAPI";
import { LOAD_GAME_STATE } from "../context/types";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import "./Leaderboard.scss";

function Home() {
  const dispatch = useContext(GlobalDispatchContext);
  const { leaderboard, profile } = useContext(GlobalStateContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        await loadGameState({ dispatch });
      } catch (error) {
        console.error("error in loadGameState action");
      }
    };
    fetchGameState();
  }, [dispatch, backendAPI]);

  const loadGameState = async ({ dispatch }) => {
    try {
      setLoading(true);
      const result = await backendAPI?.post("/race/game-state");
      if (result?.data?.success) {
        await dispatch({
          type: LOAD_GAME_STATE,
          payload: {
            checkpointsCompleted: result.data.checkpointsCompleted,
            startTimestamp: result.data.startTimestamp,
            leaderboard: result.data.leaderboard,
            profile: result.data.profile,
          },
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("error in loadGameState action");
      console.error(error);
    }
  };

  const sortedLeaderboard = Object.entries(leaderboard || {})
    .sort(([, a], [, b]) => {
      const [aMinutes, aSeconds, aMilliseconds] = a.elapsedTime.split(":").map(Number);
      const [bMinutes, bSeconds, bMilliseconds] = b.elapsedTime.split(":").map(Number);

      if (aMinutes === bMinutes) {
        if (aSeconds === bSeconds) {
          return aMilliseconds - bMilliseconds;
        }
        return aSeconds - bSeconds;
      }
      return aMinutes - bMinutes;
    })
    .slice(0, 20);

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
        <div className="highscore-container">
          <div className="medal">
            <h2>🏅</h2>
          </div>
          <h2>Personal Best</h2>
          <p>{profile?.highscore || "No highscore available"}</p>
        </div>
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
            {sortedLeaderboard?.length === 0 ? (
              <tr>
                <td colSpan="3">There are no race finishes yet.</td>
              </tr>
            ) : (
              sortedLeaderboard?.map(([userId, entry], index) => (
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
