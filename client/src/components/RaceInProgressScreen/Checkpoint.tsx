interface CheckpointProps {
  completed?: boolean;
  number: string | number;
}

export const Checkpoint = ({ number, completed }: CheckpointProps) => {
  return (
    <div>
      <span className={`px-2 mt-2 mx-2 checkpoint ${completed ? "completed" : ""}`}></span>
      <span className="align-super p2">{number === "Finish" ? "Finish" : `Checkpoint ${number}`}</span>
    </div>
  );
};

export default Checkpoint;
