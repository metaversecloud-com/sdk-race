import PropTypes from "prop-types";

export const Checkpoint = ({ number, completed }) => {
  return (
    <div className={`pb-2 ${completed ? "completed" : ""}`}>
      <span className="px-2">{completed ? "🟢" : "⚪"}</span>
      <span>{number === "Finish" ? "Finish" : `Checkpoint ${number}`}</span>
    </div>
  );
};

Checkpoint.propTypes = {
  completed: PropTypes.bool,
  number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default Checkpoint;
