import { useState, useContext } from "react";
import PropTypes from "prop-types";
import BackArrow from "./BackArrow";
import { GlobalStateContext } from "@context/GlobalContext";
import ResetGameButton from "../ResetGame/ResetGameButton";
import ResetGameModal from "../ResetGame/ResetGameModal";
import SwitchRaceTrackModal from "../SwitchRace/SwitchRaceTrackModal";
import "./AdminView.scss";
import Footer from "../Shared/Footer";

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
      <div className="admin-wrapper">
        <div>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2>{"Settings"}</h2>
            <p style={{ textAlign: "left" }}>Select a track to change the current one.</p>
            <p>{message}</p>
          </div>
          <div className="tracks-container">
            {tracks?.map((track) => (
              <div
                key={track.id}
                className={`track-container ${selectedTrack === track.id ? "selected" : ""}`}
                onClick={() => handleTrackSelect(track)}
              >
                <img className="track-thumbnail" src={track?.thumbnail} alt={track.name} />
                <div className="track-info">
                  <h3>{track.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
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
