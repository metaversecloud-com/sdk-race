import { useState, useContext } from "react";

// components
import { BackButton, Footer } from "@components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@context/GlobalContext";
import { SET_ERROR, SCREEN_MANAGER } from "@context/types";

// utils
import { backendAPI, getErrorMessage } from "@utils";

export const SwitchTrackScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { tracks } = useContext(GlobalStateContext);

  const [selectedTrack, setSelectedTrack] = useState(null);
  const [areAllButtonsDisabled, setAreAllButtonsDisabled] = useState(false);

  const updateTrack = async () => {
    setAreAllButtonsDisabled(true);

    await backendAPI
      .post(`/race/switch-track?trackSceneId=${selectedTrack.sceneId}`)
      .catch((error) => {
        dispatch({
          type: SET_ERROR,
          payload: { error: getErrorMessage("resetting", error) },
        });
      })
      .finally(() => {
        setAreAllButtonsDisabled(false);
      });
  };

  return (
    <>
      <BackButton onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN })} />

      <div className="text-center pb-8">
        <h2>Choose New Track</h2>
        <p className="pt-4">Updates will reflect for everyone</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {tracks?.map((track) => (
          <button
            key={track.id}
            className={`mb-2 ${selectedTrack === track.id ? "selected" : ""}`}
            onClick={() => setSelectedTrack(track)}
          >
            <div className="tooltip">
              <span className="tooltip-content">{track.name}</span>
              <img className="track object-cover" src={track?.thumbnail} alt={track.name} />
            </div>
          </button>
        ))}
      </div>

      <Footer>
        <button className="btn-primary" disabled={areAllButtonsDisabled || !selectedTrack} onClick={updateTrack}>
          Update Track
        </button>
      </Footer>
    </>
  );
};

export default SwitchTrackScreen;
