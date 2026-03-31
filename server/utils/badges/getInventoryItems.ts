import { Credentials, BadgeRecord } from "../../../shared/types/index.js";
import { getCachedInventoryItems } from "../inventoryCache.js";

export const getInventoryItems = async (credentials: Credentials, { forceRefresh = false } = {}): Promise<{ badges: BadgeRecord }> => {
  try {
    const items = await getCachedInventoryItems({ credentials, forceRefresh });

    const badges: BadgeRecord = {};
    for (const item of items) {
      badges[item.name] = {
        id: item.id,
        name: item.name || "Unknown",
        icon: item.image_path || "",
        description: item.description || "",
      };
    }

    return { badges };
  } catch (error) {
    throw error;
  }
};
