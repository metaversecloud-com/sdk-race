import { useContext, useEffect, useState } from "react";

// components
import { BackButton, Loading } from "@components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@context/GlobalContext";
import { SCREEN_MANAGER, SET_VISITOR_INVENTORY, SET_ERROR } from "@context/types";

// utils
import { backendAPI, getErrorMessage } from "@utils";

export const BadgesScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { badges, visitorInventory } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const getVisitorInventory = async () => {
      await backendAPI
        .get("/visitor-inventory")
        .then((response) => {
          dispatch({ type: SET_VISITOR_INVENTORY, payload: response.data });
        })
        .catch((error) => {
          dispatch({
            type: SET_ERROR,
            payload: { error: getErrorMessage("getting visitor inventory", error) },
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    };
    getVisitorInventory();
  }, []);

  if (isLoading) return <Loading />;

  return (
    <>
      <BackButton onClick={() => dispatch({ type: SCREEN_MANAGER.SHOW_HOME_SCREEN })} />

      <div className="grid gap-4 text-center">
        <h2 className="text-white">
          <strong>Badges</strong>
        </h2>

        <div className="grid grid-cols-3 gap-6 pt-4">
          {Object.values(badges).map((badge) => {
            const hasBadge = visitorInventory && Object.keys(visitorInventory).includes(badge.name);
            const style = { width: "90px" };
            if (!hasBadge) style.filter = "grayscale(1)";
            return (
              <div className="tooltip" key={badge.id}>
                <span className="tooltip-content">{badge.name}</span>
                <img src={badge.icon} alt={badge.name} style={style} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BadgesScreen;
