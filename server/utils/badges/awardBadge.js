import { Ecosystem } from "../topiaInit.js";

export const awardBadge = async ({ credentials, visitor, visitorInventory, badgeName, redisObj, profileId }) => {
  try {
    if (visitorInventory[badgeName]) return { success: true };

    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const inventoryItem = ecosystem.inventoryItems?.find((item) => item.name === badgeName);
    if (!inventoryItem) throw new Error(`Inventory item ${badgeName} not found in ecosystem`);

    await visitor.grantInventoryItem(inventoryItem, 1);

    await visitor
      .fireToast({
        title: "Badge Awarded",
        text: `You have earned the ${badgeName} badge!`,
      })
      .catch(() => console.error(`Failed to fire toast after awarding the ${badgeName} badge.`));

    try {
      await redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
        profileId,
        newBadgeName: badgeName,
      });
    } catch (error) {
      errorHandler({
        error,
        functionName: "awardBadge",
        message: "Error publishing new badge awarded to redis",
      });
    }

    return { success: true };
  } catch (error) {
    return new Error(error);
  }
};
