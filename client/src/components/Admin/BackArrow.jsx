import backArrow from "../../assets/backArrow.svg";

function BackArrow({ setShowSettings }) {
  return (
    <div
      style={{ marginLeft: "16px", marginTop: "24px", marginBottom: "20px" }}
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
