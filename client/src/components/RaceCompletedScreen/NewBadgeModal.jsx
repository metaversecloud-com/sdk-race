import PropTypes from "prop-types";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";
import { useContext } from "react";

export const NewBadgeModal = ({ badge, handleToggleShowModal }) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { name, icon } = badge;

  return (
    <div className="modal-container">
      <div className="modal">
        <div className="modal-header flex gap-2 grid-cols-2">
          <h3 className="flex-grow text-left">New Badge Unlocked!</h3>
          <button onClick={handleToggleShowModal}>
            <img src="https://sdk-style.s3.amazonaws.com/icons/x.svg" style={{ width: "10px" }} />
          </button>
        </div>
        <div className="grid gap-6 text-center pt-2">
          <img src={icon} alt={name} style={{ width: "100px", height: "100px", margin: "auto" }} />
          <p>
            <strong>{name}</strong>
          </p>
          <button className="btn-secondary" onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_BADGES_SCREEN })}>
            View all Badges
          </button>
        </div>
      </div>
    </div>
  );
};

NewBadgeModal.propTypes = {
  badge: PropTypes.shape({
    name: PropTypes.string,
    icon: PropTypes.string,
  }),
  handleToggleShowModal: PropTypes.func,
};

export default NewBadgeModal;
