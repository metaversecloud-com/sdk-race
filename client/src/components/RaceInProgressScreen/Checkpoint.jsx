import PropTypes from "prop-types";

export const Checkpoint = ({ number, completed }) => {
  return (
    <div>
      <span className={`px-2 mt-2 mx-2 checkpoint ${completed ? "completed" : ""}`}></span>
      <span className="align-super p2">{number === "Finish" ? "Finish" : `Checkpoint ${number}`}</span>
    </div>
  );
};

Checkpoint.propTypes = {
  completed: PropTypes.bool,
  number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default Checkpoint;
