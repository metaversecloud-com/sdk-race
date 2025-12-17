import { useContext } from "react";

// components
import { BackButton } from "@components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@context/GlobalContext";
import { SCREEN_MANAGER } from "@context/types";

export const BadgesScreen = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { badges, visitorInventory } = useContext(GlobalStateContext);

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
            const style = hasBadge ? {} : { filter: "grayscale(1)" };
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
