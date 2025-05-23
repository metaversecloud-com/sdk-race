import { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Leaderboard.scss";

// components
import AdminGear from "@components/Admin/AdminGear";
import AdminView from "@components/Admin/AdminView";
import Loading from "@components/Shared/Loading";
import Footer from "@components/Shared/Footer";

// context
import { GlobalStateContext, GlobalDispatchContext } from "@context/GlobalContext";

// utils
import { backendAPI, loadGameState } from "@utils";

function Leaderboard() {
  const dispatch = useContext(GlobalDispatchContext);
  const { leaderboard, highscore, isAdmin } = useContext(GlobalStateContext);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();

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

  if (loading) return <Loading />;

  if (showSettings) return <AdminView setShowSettings={setShowSettings} />;

  const queryParams = new URLSearchParams(location.search);

  return (
    <>
      {isAdmin && <AdminGear setShowSettings={setShowSettings} />}
      <div className="px-4 my-6">
        <div className="highscore-container">
          <div className="icon">🏅</div>
          <h3>Personal Best</h3>
          <p>{highscore || "No highscore available"}</p>
        </div>
        <div className="icon pt-4">🏆</div>
        <div className="pb-4">
          <h3 className="text-center">Leaderboard</h3>
        </div>
        <table className="table">
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
      <Footer>
        <Link to={`/start?${queryParams.toString()}`}>
          <button style={{ width: "94%" }}>Start Race</button>
        </Link>
      </Footer>
    </>
  );
}

export default Leaderboard;
