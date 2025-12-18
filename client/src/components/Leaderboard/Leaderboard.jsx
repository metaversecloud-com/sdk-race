import { useContext, useEffect, useState } from "react";

// components
import { Loading } from "@components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@context/GlobalContext";
import { SET_LEADERBOARD, SET_ERROR } from "@context/types";

// utils
import { backendAPI, getErrorMessage } from "@utils";

export const Leaderboard = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { leaderboard, highScore } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const getLeaderboard = async () => {
      await backendAPI
        .get("/leaderboard")
        .then((response) => {
          dispatch({ type: SET_LEADERBOARD, payload: response.data });
        })
        .catch((error) => {
          dispatch({
            type: SET_ERROR,
            payload: { error: getErrorMessage("getting visitor inventory", error) },
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    };
    getLeaderboard();
  }, []);

  if (isLoading) return <Loading />;

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
    </>
  );
};

export default Leaderboard;
