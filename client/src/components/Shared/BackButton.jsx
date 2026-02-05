import PropTypes from "prop-types";

export const BackButton = ({ onClick }) => {
  return (
    <div className="icon-btn mb-4" onClick={onClick}>
      ←
    </div>
  );
};

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default BackButton;
