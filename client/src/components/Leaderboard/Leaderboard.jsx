import { useContext } from "react";

// components
import { Footer } from "@components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

export const Leaderboard = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { leaderboard, highScore } = useContext(GlobalStateContext);

  return (
    <>
      <div className="grid gap-4 text-center">
        <div className="icon">🏆</div>
        <h2 className="text-white">
          <strong>Leaderboard</strong>
        </h2>
        <div className="card-primary grid gap-2">
          <h3>Personal Best</h3>
          <p>{highScore || "No highScore available"}</p>
        </div>
        <div className="card-outline">
          {leaderboard?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: "20px" }}></th>
                  <th className="text-left" style={{ minWidth: "200px" }}>
                    Name
                  </th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard?.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td className="text-left">{index + 1}</td>
                      <td className="text-left">{item.displayName}</td>
                      <td>{item.highScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center">There are no race finishes yet.</p>
          )}
        </div>
      </div>

      <Footer>
        <button className="btn-primary" onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_ON_YOUR_MARK_SCREEN })}>
          Start Race
        </button>
      </Footer>
    </>
  );
};

export default Leaderboard;
