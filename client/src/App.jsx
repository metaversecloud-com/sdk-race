import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Route, Routes, useSearchParams } from "react-router-dom";

// pagrs
import Home from "@pages/Home";
import Leaderboard from "@pages/Leaderboard";
import Error from "@pages/Error";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { SET_INTERACTIVE_PARAMS } from "@context/types";

// utils
import { setupBackendAPI } from "@utils/backendAPI";

const App = () => {
  const [searchParams] = useSearchParams();
  const [hasInitBackendAPI, setHasInitBackendAPI] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);

  const interactiveParams = useMemo(() => {
    return {
      assetId: searchParams.get("assetId"),
      displayName: searchParams.get("displayName"),
      interactiveNonce: searchParams.get("interactiveNonce"),
      interactivePublicKey: searchParams.get("interactivePublicKey"),
      profileId: searchParams.get("profileId"),
      sceneDropId: searchParams.get("sceneDropId"),
      uniqueName: searchParams.get("uniqueName"),
      urlSlug: searchParams.get("urlSlug"),
      username: searchParams.get("username"),
      visitorId: searchParams.get("visitorId"),
      identityId: searchParams.get("identityId"),
    };
  }, [searchParams]);

  const setInteractiveParams = useCallback(
    ({
      assetId,
      displayName,
      interactiveNonce,
      interactivePublicKey,
      profileId,
      sceneDropId,
      uniqueName,
      urlSlug,
      username,
      visitorId,
      identityId,
    }) => {
      const isInteractiveIframe = visitorId && interactiveNonce && interactivePublicKey && assetId;
      dispatch({
        type: SET_INTERACTIVE_PARAMS,
        payload: {
          assetId,
          displayName,
          interactiveNonce,
          interactivePublicKey,
          isInteractiveIframe,
          profileId,
          sceneDropId,
          uniqueName,
          urlSlug,
          username,
          visitorId,
          identityId,
        },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    if (interactiveParams.assetId) {
      setInteractiveParams({
        ...interactiveParams,
      });
    }
  }, [interactiveParams, setInteractiveParams]);

  useEffect(() => {
    if (!hasInitBackendAPI) {
      setupBackendAPI(interactiveParams);
      setHasInitBackendAPI(true);
    }
  }, [hasInitBackendAPI, interactiveParams]);

  return (
    <Routes>
      <Route path="/start" element={<Home />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="*" element={<Error />} />
    </Routes>
  );
};

export default App;
