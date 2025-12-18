import { Ecosystem } from "../index.js";

export const getInventoryItems = async (credentials) => {
  try {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const badges = {};

    for (const item of ecosystem.inventoryItems) {
      badges[item.name] = {
        id: item.id,
        name: item.name || "Unknown",
        icon: item.image_path || "",
        description: item.description || "",
      };
    }

    // Sort items by sortOrder while keeping them as objects
    const sortedBadges = {};

    Object.values(badges)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((badge) => {
        sortedBadges[badge.name] = badge;
      });

    return {
      badges: sortedBadges,
    };
  } catch (error) {
    return standardizeError(error);
  }
};
