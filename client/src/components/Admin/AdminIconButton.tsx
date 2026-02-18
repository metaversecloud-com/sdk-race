interface AdminIconButtonProps {
  setShowSettings: (show: boolean) => void;
  showSettings: boolean;
}

export const AdminIconButton = ({ setShowSettings, showSettings }: AdminIconButtonProps) => {
  return (
    <div className="icon-btn mb-4 text-right" onClick={() => setShowSettings(showSettings)}>
      {showSettings ? "←" : "⛭"}
    </div>
  );
};

export default AdminIconButton;
