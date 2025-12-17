import { useContext, useState } from "react";
import PropTypes from "prop-types";

// components
import { AdminIconButton, Loading, AdminView } from "@/components";

// context
import { GlobalStateContext } from "@context/GlobalContext";

export const PageContainer = ({ children, isLoading }) => {
  const { error, isAdmin } = useContext(GlobalStateContext);

  const [showSettings, setShowSettings] = useState(false);

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="page-container" />
      <div className="p-4 mb-28">
        {isAdmin && (
          <AdminIconButton setShowSettings={() => setShowSettings(!showSettings)} showSettings={showSettings} />
        )}
        {showSettings ? <AdminView /> : children}
        {error && <p className="p3 pt-10 text-center text-error">{error}</p>}
      </div>
    </>
  );
};

PageContainer.propTypes = {
  children: PropTypes.node,
  isLoading: PropTypes.bool,
};

export default PageContainer;
