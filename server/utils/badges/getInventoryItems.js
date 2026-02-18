import { getCachedInventoryItems } from "../inventoryCache.js";

export const getInventoryItems = async (credentials, { forceRefresh = false } = {}) => {
  try {
    const items = await getCachedInventoryItems({ credentials, forceRefresh });

    const badges = {};
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
    return standardizeError(error);
  }
};
