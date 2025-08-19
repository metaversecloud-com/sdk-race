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
  const { leaderboard, highScore, isAdmin } = useContext(GlobalStateContext);
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

  if (loading) return <Loading />;

  if (showSettings) return <AdminView setShowSettings={setShowSettings} />;

  const queryParams = new URLSearchParams(location.search);

  return (
    <>
      {isAdmin && <AdminGear setShowSettings={setShowSettings} />}
      <div className="px-4 my-6">
        <div className="highScore-container">
          <div className="icon">🏅</div>
          <h3>Personal Best</h3>
          <p>{highScore || "No highScore available"}</p>
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
            {leaderboard?.length === 0 ? (
              <tr>
                <td colSpan="3">There are no race finishes yet.</td>
              </tr>
            ) : (
              leaderboard?.map((item, index) => {
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.displayName}</td>
                    <td>{item.highScore}</td>
                  </tr>
                );
              })
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
