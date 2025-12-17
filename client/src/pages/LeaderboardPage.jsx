import { useContext, useState, useEffect } from "react";

// components
import { PageContainer, Leaderboard } from "@components";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";

// utils
import { backendAPI, loadGameState } from "@utils";

export const LeaderboardPage = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const [loading, setLoading] = useState(true);

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
    </PageContainer>
  );
};

export default LeaderboardPage;
