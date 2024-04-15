import gear from "../../assets/gear.svg";

function AdminGear(setShowSettings) {
  return (
    <div
      style={{ position: "absolute", left: "16px", top: "24px" }}
      className="icon-with-rounded-border"
      onClick={() => {
        setShowSettings(true);
      }}
    >
      <img src={gear} />
    </div>
  );
}

export default AdminGear;
