import { Ecosystem } from "./topiaInit.js";
import { Credentials } from "../../shared/types/index.js";

// Cache duration: 6 hours in milliseconds
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

interface InventoryCache {
  items: any[];
  timestamp: number;
}

// In-memory cache
let inventoryCache: InventoryCache | null = null;

/**
 * Get ecosystem inventory items with caching.
 * - Returns cached data if available and not expired.
 * - Refreshes cache if expired or missing.
 * - Falls back to stale cache on API failure.
 */
export const getCachedInventoryItems = async ({ credentials, forceRefresh = false }: { credentials: Credentials; forceRefresh?: boolean }): Promise<any[]> => {
  try {
    const now = Date.now();
    const isCacheValid = inventoryCache !== null && !forceRefresh && now - inventoryCache.timestamp < CACHE_DURATION_MS;

    if (isCacheValid) {
      return inventoryCache!.items;
    }

    console.log("Fetching fresh inventory items from ecosystem");
    const ecosystem = await (Ecosystem as any).create({ credentials });
    await ecosystem.fetchInventoryItems();

    inventoryCache = {
      items: [...ecosystem.inventoryItems].sort((a: any, b: any) => (a.metadata?.sortOrder ?? 0) - (b.metadata?.sortOrder ?? 0)),
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
