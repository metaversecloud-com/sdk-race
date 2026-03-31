import { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// components
import { PageContainer, Leaderboard, Footer } from "@components";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";

// utils
import { backendAPI, loadGameState } from "@utils";

export const LeaderboardPage = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

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

  return (
    <PageContainer isLoading={loading}>
      <Leaderboard />

      <Footer>
        <Link to={`/start?${queryParams.toString()}`}>
          <button className="btn-primary">Start Race</button>
        </Link>
      </Footer>
    </PageContainer>
  );
};

export default LeaderboardPage;
