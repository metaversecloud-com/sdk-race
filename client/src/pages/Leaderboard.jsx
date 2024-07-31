import { useContext, useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { backendAPI } from "@utils/backendAPI";
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";
import "./Leaderboard.scss";
import AdminGear from "../components/Admin/AdminGear";
import { loadGameState } from "../context/actions";
import AdminView from "../components/Admin/AdminView";

function Home() {
  const dispatch = useContext(GlobalDispatchContext);
  const { leaderboard, profile, screenManager, visitor } = useContext(GlobalStateContext);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        setLoading(true);
        await loadGameState(dispatch);
      } catch (error) {
        console.error("error in loadGameState action");
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();
  }, [dispatch, backendAPI]);

  const sortedLeaderboard = leaderboard
    ? Object.entries(leaderboard)
        .filter(([, playerData]) => playerData && playerData.highscore)
        .sort(([, a], [, b]) => {
          const aScore = a.highscore.split(":").map(Number);
          const bScore = b.highscore.split(":").map(Number);

          for (let i = 0; i < 3; i++) {
            if (aScore[i] !== bScore[i]) {
              return aScore[i] - bScore[i];
            }
          }
          return 0;
        })
        .slice(0, 20)
    : [];

  if (loading) {
    return (
      <div className="loader">
        <ClipLoader color={"#123abc"} loading={loading} size={150} />
      </div>
    );
  }

  if (showSettings) {
    return <AdminView setShowSettings={setShowSettings} />;
  }

  return (
    <>
      <div className="app-wrapper leaderboard-container">
        {visitor?.isAdmin && <AdminGear screenManager={screenManager} setShowSettings={setShowSettings} />}
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
                  <td>{entry.highscore}</td>
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
