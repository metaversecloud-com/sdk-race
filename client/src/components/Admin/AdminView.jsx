import { useState, useContext } from "react";
import PropTypes from "prop-types";

// components
import BackArrow from "./BackArrow";
import ResetGameButton from "../ResetGame/ResetGameButton";
import ResetGameModal from "../ResetGame/ResetGameModal";
import SwitchRaceTrackModal from "../SwitchRace/SwitchRaceTrackModal";
import Footer from "../Shared/Footer";

// context
import { GlobalStateContext } from "@context/GlobalContext";

function AdminView({ setShowSettings }) {
  const { tracks } = useContext(GlobalStateContext);
  const [message, setMessage] = useState(false);
  const [showResetGameModal, setShowResetGameModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  function handleToggleShowResetGameModal() {
    setShowResetGameModal(!showResetGameModal);
  }

  function handleToggleShowTrackModal(track) {
    setSelectedTrack(track);
    setShowTrackModal(!showTrackModal);
  }

  function handleTrackSelect(track) {
    setSelectedTrack(track.id);
    setShowTrackModal(true);
  }

  return (
    <>
      {showResetGameModal && (
        <ResetGameModal handleToggleShowModal={handleToggleShowResetGameModal} setMessage={setMessage} />
      )}
      {showTrackModal && selectedTrack && (
        <SwitchRaceTrackModal
          track={tracks?.find((track) => track.id === selectedTrack)}
          handleToggleShowModal={() => handleToggleShowTrackModal(null)}
          setMessage={setMessage}
        />
      )}
      <BackArrow setShowSettings={setShowSettings} />
      <div className="px-4 pb-20">
        <div className="text-center pb-8">
          <h2>Settings</h2>
          <p className="pt-4">Select a track to change the current one.</p>
          <p>{message}</p>
        </div>
        {tracks?.map((track) => (
          <div
            key={track.id}
            className={`mb-2 ${selectedTrack === track.id ? "selected" : ""}`}
            onClick={() => handleTrackSelect(track)}
          >
            <div className="card small">
              <div className="card-image heigh-auto">
                <img src={track?.thumbnail} alt={track.name} />
              </div>
              <div className="card-details">
                <h4 className="card-title h4">{track.name}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Footer>
        <ResetGameButton handleToggleShowModal={handleToggleShowResetGameModal} />
      </Footer>
    </>
  );
}

AdminView.propTypes = {
  setShowSettings: PropTypes.boolean,
};

export default AdminView;
