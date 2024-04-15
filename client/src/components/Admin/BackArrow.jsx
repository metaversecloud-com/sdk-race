import backArrow from "../../assets/backArrow.svg";

function BackArrow({ setShowSettings }) {
  return (
    <div
      style={{ position: "absolute", left: "16px", top: "24px" }}
      className="icon-with-rounded-border"
      onClick={() => {
        setShowSettings(false);
      }}
    >
      <img src={backArrow} />
    </div>
  );
}
export default BackArrow;
