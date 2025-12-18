import { Ecosystem } from "../topiaInit.js";

export const awardBadge = async ({ credentials, visitor, visitorInventory, badgeName, redisObj, profileId }) => {
  try {
    if (visitorInventory[badgeName]) return { success: true };

    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const inventoryItem = ecosystem.inventoryItems?.find((item) => item.name === badgeName);
    if (!inventoryItem) throw new Error(`Inventory item ${badgeName} not found in ecosystem`);

    await visitor.grantInventoryItem(inventoryItem, 1);

    redisObj.publish(`${process.env.INTERACTIVE_KEY}_RACE`, {
      profileId,
      newBadgeName: badgeName,
    });

    return { success: true };
  } catch (error) {
    return new Error(error);
  }
};
