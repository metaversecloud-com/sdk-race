import { Credentials, VisitorInventory } from "../../../shared/types/index.js";
import { getCachedInventoryItems } from "../inventoryCache.js";
import { errorHandler } from "../errorHandler.js";

interface AwardBadgeParams {
  credentials: Credentials;
  visitor: any;
  visitorInventory: VisitorInventory;
  badgeName: string;
  redisObj: any;
  profileId: string;
}

export const awardBadge = async ({ credentials, visitor, visitorInventory, badgeName, redisObj, profileId }: AwardBadgeParams) => {
  try {
    if (visitorInventory[badgeName]) return { success: true };

    const inventoryItems = await getCachedInventoryItems({ credentials });
    const inventoryItem = inventoryItems?.find((item: any) => item.name === badgeName);
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
    return new Error(error as string);
  }
};
