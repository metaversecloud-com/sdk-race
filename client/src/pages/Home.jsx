import { GlobalStateContext } from "@context/GlobalContext";
import { backendAPI } from "@utils/backendAPI";
import React, { useContext, useState } from "react";

const Home = () => {
  const [droppedAsset, setDroppedAsset] = useState();

  const { hasInteractiveParams } = useContext(GlobalStateContext);

  const handleGetDroppedAsset = async () => {
    try {
      const result = await backendAPI.get("/dropped-asset");
      if (result.data.success) {
        setDroppedAsset(result.data.droppedAsset);
      } else return console.log("Error getting data object");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="app-wrapper">
      test
    </div>
  );
};

export default Home;
