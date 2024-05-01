import gear from "../../assets/gear.svg";

function AdminGear(setShowSettings) {
  return (
    <div
      style={{ marginLeft: "16px", marginTop: "24px", marginBottom: "20px" }}
      className="icon-with-rounded-border"
      onClick={() => {
        setShowSettings(true);
      }}
    >
      <img src={gear} alt="Configurações" />
    </div>
  );
}

export default AdminGear;
