import { Ecosystem } from "./topiaInit.js";

// Cache duration: 6 hours in milliseconds
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

// In-memory cache
let inventoryCache = null;

/**
 * Get ecosystem inventory items with caching.
 * - Returns cached data if available and not expired.
 * - Refreshes cache if expired or missing.
 * - Falls back to stale cache on API failure.
 */
export const getCachedInventoryItems = async ({ credentials, forceRefresh = false }) => {
  try {
    const now = Date.now();
    const isCacheValid = inventoryCache !== null && !forceRefresh && now - inventoryCache.timestamp < CACHE_DURATION_MS;

    if (isCacheValid) {
      return inventoryCache.items;
    }

    console.log("Fetching fresh inventory items from ecosystem");
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    inventoryCache = {
      items: [...ecosystem.inventoryItems].sort((a, b) => (a.metadata?.sortOrder ?? 0) - (b.metadata?.sortOrder ?? 0)),
      timestamp: now,
    };

    return inventoryCache.items;
  } catch (error) {
    if (inventoryCache !== null) {
      console.warn("Failed to fetch fresh inventory, using stale cache", error);
      return inventoryCache.items;
    }
    throw error;
  }
};

export const clearInventoryCache = () => {
  inventoryCache = null;
};
