interface BackButtonProps {
  onClick: () => void;
}

export const BackButton = ({ onClick }: BackButtonProps) => {
  return (
    <div className="icon-btn mb-4" onClick={onClick}>
      ←
    </div>
  );
};

export default BackButton;
