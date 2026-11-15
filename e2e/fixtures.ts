import { APIRequestContext, test as base, expect } from "@playwright/test";
import { INTERACTIVE_KEY, MOCK_TOPIA_URL } from "./constants";

/**
 * Id of the dropped asset the app is opened from. Per world instead with test.use({ uniqueAssetId: true })
 * (then use world.assetId): apps that match SSE connections or caches by assetId alone would otherwise mix
 * up parallel tests, since real asset ids are globally unique.
 */
export const KEY_ASSET_ID = "key-asset";
export const SCENE_DROP_ID = "scene-1";
export const VISITOR_ID = 42;

/** Where the race-track-start asset sits; start-race teleports the visitor here. */
export const START_POSITION = { x: 100, y: 200 };
/** Where the race-track-container asset sits; switch-track drops the new scene here. */
export const CONTAINER_POSITION = { x: 1000, y: 2000 };

/** Track scenes mock-topia drops on switch-track, matching TRACKS in app.config.ts. */
export const TRACK_SCENES: Record<string, { name: string; checkpoints: number }> = {
  "scene-beach": { name: "Beach Track", checkpoints: 3 },
  "scene-forest": { name: "Forest Track", checkpoints: 4 },
};

export const checkpointAssetId = (n: number) => `checkpoint-${n}`;

/** The race assets a track scene is made of: start/finish line, numbered checkpoints and container. */
const raceTrackAssets = (checkpoints: number, sceneDropId: string, prefix = "") => {
  const assets: Record<string, Record<string, unknown>> = {
    [`${prefix}start`]: {
      id: `${prefix}start`,
      uniqueName: "race-track-start",
      sceneDropId,
      position: START_POSITION,
    },
    [`${prefix}container`]: {
      id: `${prefix}container`,
      uniqueName: "race-track-container",
      sceneDropId,
      position: CONTAINER_POSITION,
    },
  };
  for (let n = 1; n <= checkpoints; n++) {
    assets[`${prefix}${checkpointAssetId(n)}`] = {
      id: `${prefix}${checkpointAssetId(n)}`,
      uniqueName: `race-track-checkpoint-${n}`,
      sceneDropId,
      position: { x: 300 + n * 100, y: 200 },
    };
  }
  return assets;
};

export type SeedOptions = {
  isAdmin?: boolean;
  /** Number of race-track-checkpoint-N assets in the race's scene drop. 0 = no race track at all. */
  checkpoints?: number;
  /** Leave out the race-track-container asset (switch-track needs its position). */
  withContainer?: boolean;
  /** Checkpoints of a second race dropped in the same world under another sceneDropId. */
  otherSceneCheckpoints?: number;
  /** Where the visitor stands in the world. */
  visitorPosition?: { x: number; y: number };
  /** Visitor is standing inside the asset's zone. */
  inZone?: boolean;
  /** false = the dropped asset the app was opened from doesn't exist in the world. */
  withAsset?: boolean;
  /** Extra dropped-asset fields (assetName, topLayerURL, uniqueName, ...). */
  asset?: Record<string, unknown>;
  /** The dropped asset's data object. */
  assetData?: Record<string, unknown>;
  /** The world's data object. */
  worldData?: Record<string, unknown>;
  /** The visitor's data object (the same record as its user data object, like the real API). */
  visitorData?: Record<string, unknown>;
  /** Badges the visitor already owns. */
  badges?: string[];
  /**
   * Catalog items the visitor already owns (any type), by catalog id or name, with their quantity
   * (default 1) and the user item's own metadata (default {}). Unknown items fail the seed.
   */
  inventory?: OwnedItem[];
  /** Extra fields on the visitor (expressions: ["emote-wave"] it owns, username, ...). */
  visitor?: Record<string, unknown>;
  /**
   * Other players in the world, keyed by visitorId. Act as one with world.as(id) / world.apiAs(id, path).
   * Their default profileIds are unique per world; an explicit profileId is shared by every test that uses
   * it (user data objects are global in the mock), so derive it from the world: world.scopedId("alice").
   */
  otherVisitors?: Record<number, OtherVisitor>;
  /** Data objects of profiles that aren't in the world, keyed by profileId (use world.scopedId(...) keys). */
  users?: Record<string, Record<string, unknown>>;
  /**
   * The ecosystem inventory catalog (GET /inventory, grants) for this world. Default: mock-topia/catalog.json
   * if the app has one, else four Quiz badges. Useless for apps that cache the catalog process-wide (they
   * keep the first world's): give those a catalog.json instead.
   */
  inventoryItems?: InventoryItem[];
  /** Unlockable expressions (GET /expressions, grant-expression). Default: the mock's Wave and Dance. */
  expressions?: Array<{ id: string; name: string } & Record<string, unknown>>;
  /**
   * The world's user group data objects, as Visitor.fetchUserGroupDataObject returns them (default none).
   */
  userGroupDataObjects?: Array<Record<string, unknown>>;
  /** Extra fields for GET /world-details (World.fetchDetails); default { urlSlug, name, width, height }. */
  worldDetails?: Record<string, unknown>;
  /** Further dropped assets in the world, keyed by id (their `id` defaults to the key). */
  extraAssets?: Record<string, Record<string, unknown>>;
  /**
   * Scenes GET /scenes/:sceneId (Scene.get / fetchSceneById) knows, keyed by scene id (their `id` is the key).
   * Read from the caller's world (the InteractiveJWT's urlSlug); an unknown id answers 200 with a null body,
   * like the real getSceneById.
   */
  scenes?: Record<string, Record<string, unknown>>;
  /** Delay for every public-API call into the world, so concurrent requests overlap. */
  latencyMs?: number;
  /**
   * Delay for matching public-API calls only: { "<substring of 'METHOD /api/v1/...'>": ms }, e.g.
   * { "PUT /api/v1/world": 300 } or { "/visitors/42/set-data-object": 400 }. Adds to latencyMs. Calls
   * outside /world/ (inventory, user data objects, ...) count for the world in the caller's JWT.
   */
  delays?: Record<string, number>;
  /**
   * Fail matching public-API calls: { "<substring of 'METHOD /api/v1/...'>": status }, e.g.
   * { "grant-visitor-inventory-item": 500 }. Matched like delays; logged as "injected-failure" events.
   */
  failures?: Record<string, number>;
  /**
   * Data-object writes with a lockId take the lock first and hold it for their delay (latencyMs + delays),
   * like a real write that takes time, so a concurrent write with the same lockId gets 409. Default false:
   * the delay runs before the write, which takes and frees the lock at once.
   */
  holdLocksDuringDelay?: boolean;
};

/** A catalog item a visitor owns: catalog id or name, quantity (default 1), user item metadata (default {}). */
export type OwnedItem = { item: string; quantity?: number; metadata?: Record<string, unknown> };

/**
 * Another player in the world. Defaults: profileId "<world.profileId>-v<id>", displayName "Player <id>",
 * username "player-<id>".
 */
export type OtherVisitor = {
  profileId?: string;
  displayName?: string;
  isAdmin?: boolean;
  /** Standing inside the asset's zone. Default true. */
  inZone?: boolean;
  visitorData?: Record<string, unknown>;
  badges?: string[];
  inventory?: OwnedItem[];
} & Record<string, unknown>;

/** An ecosystem inventory item as GET /inventory returns it. */
export type InventoryItem = {
  id: string;
  name: string;
  type: string;
  status?: string;
  description?: string;
  image_path?: string;
  metadata?: Record<string, unknown>;
} & Record<string, unknown>;

/** A visitor inventory entry shaped like GET get-visitor-inventory-items returns it. */
const ownedBadge = (name: string) => ({
  id: `owned-${name}`,
  item_id: `owned-${name}`,
  itemId: `owned-${name}`,
  name,
  type: "BADGE",
  image_url: "",
  quantity: 1,
  status: "ACTIVE",
  item: { id: `owned-${name}`, name, type: "BADGE", image_url: "" },
});

/** One isolated Topia world in mock-topia, plus helpers to open the app inside it. */
export class TopiaWorld {
  readonly displayName = "E2E Player";

  private others: Record<number, OtherVisitor> = {};

  constructor(
    readonly urlSlug: string,
    readonly profileId: string,
    private request: APIRequestContext,
    /** Id of the dropped asset the app is opened from (KEY_ASSET_ID unless the test uses uniqueAssetId). */
    readonly assetId = KEY_ASSET_ID,
  ) {}

  /** Visitor data-object key Race keeps the run under. */
  get progressKey() {
    return `${this.urlSlug}-${SCENE_DROP_ID}`;
  }

  async seed({
    isAdmin = false,
    checkpoints = 2,
    withContainer = true,
    otherSceneCheckpoints = 0,
    visitorPosition = START_POSITION,
    inZone = true,
    withAsset = true,
    asset = {},
    assetData = {},
    worldData = {},
    visitorData = {},
    badges = [],
    inventory = [],
    visitor = {},
    otherVisitors = {},
    users = {},
    inventoryItems,
    expressions,
    worldDetails,
    userGroupDataObjects,
    extraAssets = {},
    scenes,
    latencyMs = 0,
    delays = {},
    failures = {},
    holdLocksDuringDelay = false,
  }: SeedOptions = {}) {
    this.others = otherVisitors;
    // The race track: start/finish line, checkpoints and container in the key asset's scene drop.
    const race: Record<string, Record<string, unknown>> = {};
    if (checkpoints > 0) Object.assign(race, raceTrackAssets(checkpoints, SCENE_DROP_ID));
    if (!withContainer) delete race.container;
    if (otherSceneCheckpoints > 0) Object.assign(race, raceTrackAssets(otherSceneCheckpoints, "scene-2", "other-"));
    extraAssets = { ...race, ...extraAssets };
    asset = { assetName: "Race Key", position: { x: 50, y: 50 }, ...asset };
    visitor = { moveTo: visitorPosition, ...visitor };
    // The track scenes switch-track drops (mock-topia's Race drop-scene).
    const sceneAssets: Record<string, any[]> = {};
    for (const [sceneId, { checkpoints: count }] of Object.entries(TRACK_SCENES)) {
      sceneAssets[sceneId] = Object.values(raceTrackAssets(count, "", `${sceneId}-`)).map(({ sceneDropId, ...a }) => a);
    }
    const assets: Record<string, any> = Object.fromEntries(
      Object.entries(extraAssets).map(([id, fields]) => [id, { id, ...fields }]),
    );
    if (withAsset) {
      assets[this.assetId] = {
        id: this.assetId,
        assetName: "E2E Asset",
        position: { x: 500, y: 500 },
        uniqueName: "e2e-asset",
        sceneDropId: SCENE_DROP_ID,
        topLayerURL: "https://example.invalid/e2e-asset.png",
        ...asset,
        dataObject: assetData,
      };
    }

    const response = await this.request.post(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`, {
      data: {
        dataObject: worldData,
        latencyMs,
        delays,
        failures,
        holdLocksDuringDelay,
        worldDetails,
        userGroupDataObjects,
        scenes,
        sceneAssets,
        assets,
        users,
        inventoryItems,
        expressions,
        visitors: {
          ...Object.fromEntries(
            Object.entries(otherVisitors).map(
              ([
                id,
                {
                  inZone: zoned = true,
                  visitorData: data = {},
                  badges: owned = [],
                  inventory: items = [],
                  isAdmin: admin = false,
                  ...rest
                },
              ]) => [
                id,
                {
                  ...this.player(Number(id)),
                  // Real visitors always have one; the same as world.as(id) sends.
                  username: `player-${id}`,
                  isAdmin: admin,
                  landmarkZonesString: zoned ? Object.keys(assets).join(",") : "",
                  privateZoneId: "",
                  dataObject: data,
                  inventory: owned.map(ownedBadge),
                  ownedItems: items,
                  ...rest,
                },
              ],
            ),
          ),
          [VISITOR_ID]: {
            isAdmin,
            profileId: this.profileId,
            displayName: this.displayName,
            // The same as world.credentials() sends.
            username: "e2e-player",
            landmarkZonesString: inZone ? Object.keys(assets).join(",") : "",
            privateZoneId: "",
            dataObject: visitorData,
            inventory: badges.map(ownedBadge),
            ownedItems: inventory,
            ...visitor,
          },
        },
      },
    });
    if (!response.ok()) throw new Error(`Seeding mock world failed: ${response.status()} ${await response.text()}`);
  }

  /**
   * Replaces the injected failures mid-test (same format as seed's `failures`); no argument stops them,
   * e.g. to check the app recovers once Topia answers again.
   */
  async setFailures(failures: Record<string, number> = {}) {
    const response = await this.request.patch(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`, { data: { failures } });
    if (!response.ok()) throw new Error(`Changing mock failures failed: ${response.status()}`);
  }

  /**
   * An id unique to this world, e.g. an explicit profileId for otherVisitors or a `users` key: profiles are
   * global in the mock, so a fixed "alice" would be shared by every test running in parallel.
   */
  scopedId(name: string) {
    return `${this.profileId}-${name}`;
  }

  /** Changes visitor fields mid-test (moveTo, isAdmin, landmarkZonesString, ...). */
  async updateVisitor(fields: Record<string, unknown>, visitorId = VISITOR_ID) {
    const response = await this.request.patch(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}/visitors/${visitorId}`, {
      data: fields,
    });
    if (!response.ok()) throw new Error(`Updating mock visitor failed: ${response.status()}`);
  }

  async state() {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`);
    return (await response.json()) as {
      dataObject: Record<string, any>;
      assets: Record<string, any>;
      visitors: Record<string, any>;
      events: Array<Record<string, any>>;
      unhandled: string[];
    };
  }

  async assetData(assetId = this.assetId) {
    return (await this.state()).assets[assetId]?.dataObject;
  }

  async visitorData(visitorId = VISITOR_ID) {
    return (await this.state()).visitors[visitorId].dataObject;
  }

  /** A profile's user data object (for a visitor, the same record as visitorData). */
  async userData(profileId = this.profileId) {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/users/${profileId}`);
    return (await response.json()).dataObject as Record<string, any>;
  }

  /** Objects in mock-topia's fake S3, from every test: filter by key. */
  async s3Objects() {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/s3`);
    return (await response.json()) as Array<{ bucket: string; key: string; size: number; contentType?: string }>;
  }

  /** Identity of a player in this world: VISITOR_ID or one seeded with otherVisitors. */
  player(visitorId: number) {
    if (visitorId === VISITOR_ID) return { visitorId, profileId: this.profileId, displayName: this.displayName };
    const seeded = this.others[visitorId] ?? {};
    return {
      visitorId,
      profileId: seeded.profileId ?? `${this.profileId}-v${visitorId}`,
      displayName: seeded.displayName ?? `Player ${visitorId}`,
    };
  }

  /**
   * Credential overrides that make a request come from another player, with their own nonce like a
   * separate drawer: world.url("/", world.as(43)), world.credentials(world.as(43)).
   */
  as(visitorId: number): Record<string, string> {
    if (visitorId === VISITOR_ID) return {};
    const { profileId, displayName } = this.player(visitorId);
    return {
      visitorId: String(visitorId),
      profileId,
      displayName,
      identityId: `identity-${visitorId}`,
      username: `player-${visitorId}`,
      interactiveNonce: `e2e-nonce-${this.urlSlug}-v${visitorId}`,
    };
  }

  /** App API path as another player's iframe calls it. */
  apiAs(visitorId: number, path: string, overrides: Record<string, string> = {}) {
    return this.api(path, { ...this.as(visitorId), ...overrides });
  }

  /** The race's entry in the world data object (leaderboard, numberOfCheckpoints, ...). */
  async sceneData(sceneDropId = SCENE_DROP_ID) {
    return (await this.state()).dataObject?.[sceneDropId];
  }

  /** This visitor's run for the race (checkpoints, startTimestamp, elapsedTime, highScore). */
  async progress() {
    return (await this.visitorData())?.[this.progressKey];
  }

  /** Names of the inventory items the visitor owns. */
  async badges() {
    const inventory: any[] = (await this.state()).visitors[VISITOR_ID].inventory || [];
    return inventory.map((i) => i.item?.name ?? i.name);
  }

  async analytics() {
    return (await this.events("analytics")).map((e) => e.analyticName);
  }

  async events(type?: string) {
    const { events } = await this.state();
    return type ? events.filter((e) => e.type === type) : events;
  }

  /** Session credentials Topia appends to the app's iframe URL. */
  credentials(overrides: Record<string, string> = {}) {
    return new URLSearchParams({
      assetId: this.assetId,
      displayName: this.displayName,
      identityId: "identity-1",
      // Unique per world: apps that key state by nonce across worlds (SSE connections, caches) would
      // otherwise mix up parallel tests.
      interactiveNonce: `e2e-nonce-${this.urlSlug}`,
      interactivePublicKey: INTERACTIVE_KEY,
      profileId: this.profileId,
      sceneDropId: SCENE_DROP_ID,
      uniqueName: "e2e-asset",
      urlSlug: this.urlSlug,
      username: "e2e-player",
      visitorId: String(VISITOR_ID),
      ...overrides,
    });
  }

  /** App page URL as Topia opens it in the iframe. */
  url(path = "/", overrides: Record<string, string> = {}) {
    return `${path}?${this.credentials(overrides)}`;
  }

  /** App API path carrying the session credentials, as the client's backendAPI sends them. */
  api(path: string, overrides: Record<string, string> = {}) {
    return `/api${path}?${this.credentials(overrides)}`;
  }

  /**
   * Body of the walk-onto webhook a checkpoint asset sends to /api/race/checkpoint-entered: the
   * visitor's session credentials plus the asset's uniqueName (race-track-start = finish line).
   */
  webhookBody(uniqueName: string, overrides: Record<string, string> = {}) {
    const n = uniqueName.match(/(\d+)$/)?.[1];
    return {
      ...Object.fromEntries(this.credentials({ assetId: n ? checkpointAssetId(Number(n)) : "start" })),
      uniqueName,
      ...overrides,
    };
  }

  /** Moves the visitor in the world, as walking there would. */
  async moveTo(position: { x: number; y: number }) {
    const response = await this.request.patch(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}/visitors/${VISITOR_ID}`, {
      data: { moveTo: position },
    });
    if (!response.ok()) throw new Error(`Moving the visitor failed: ${response.status()}`);
  }

  /**
   * Walks onto a checkpoint (1..N) or the finish line (0): the visitor moves onto the asset and the
   * asset fires its walk-onto webhook. Times out after `timeout` ms (some webhook paths never answer).
   */
  async enter(checkpoint: number, { overrides = {}, timeout = 10_000 }: { overrides?: Record<string, string>; timeout?: number } = {}) {
    const assetId = checkpoint === 0 ? "start" : checkpointAssetId(checkpoint);
    const asset = (await this.state()).assets[assetId];
    if (asset?.position) await this.moveTo(asset.position);
    const uniqueName = checkpoint === 0 ? "race-track-start" : `race-track-checkpoint-${checkpoint}`;
    return this.request.post("/api/race/checkpoint-entered", { data: this.webhookBody(uniqueName, overrides), timeout });
  }

  /**
   * Like enter(), for the paths where the app never answers the webhook (EXP-441): fires it, gives the
   * app `ms` to act on it, then drops the request.
   */
  async enterUnanswered(checkpoint: number, ms = 2_000) {
    await this.enter(checkpoint, { timeout: ms }).catch(() => undefined);
  }

  /** Loads the game state and starts a race through the API, as the app's Start Race button does. */
  async startRace() {
    const load = await this.request.post(this.api("/race/game-state"), { data: {} });
    if (!load.ok()) throw new Error(`Loading the game state failed: ${load.status()}`);
    const start = await this.request.post(this.api("/race/start-race"));
    if (!start.ok()) throw new Error(`Starting the race failed: ${start.status()}`);
    return (await start.json()).startTimestamp as number;
  }
}

// A 24x24 stand-in for the SDK style's CDN icons (stubSdkIcons).
const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24"/></svg>';

export const test = base.extend<{ world: TopiaWorld; uniqueAssetId: boolean; stubSdkIcons: boolean }>({
  uniqueAssetId: [false, { option: true }],
  /**
   * test.use({ stubSdkIcons: true }) answers https://sdk-style.s3.amazonaws.com/icons/* with a 24x24 SVG
   * instead of aborting it. A button whose only content is such an icon is otherwise 0x0 and Playwright
   * can't click it (or use press() from helpers/press.ts).
   */
  stubSdkIcons: [false, { option: true }],
  // The browser may only talk to the app: anything else (CDNs, analytics, real Topia) is aborted, so a
  // test can't pass or flake on the network.
  context: async ({ context, stubSdkIcons }, use) => {
    await context.route(
      (url) => !["localhost", "127.0.0.1"].includes(url.hostname),
      (route) => route.abort(),
    );
    // Registered last, so it's matched first.
    if (stubSdkIcons) {
      await context.route("https://sdk-style.s3.amazonaws.com/icons/**", (route) =>
        route.fulfill({ contentType: "image/svg+xml", body: ICON_SVG }),
      );
    }
    await use(context);
  },
  world: async ({ request, uniqueAssetId }, use, testInfo) => {
    const id = `${testInfo.testId}-${testInfo.repeatEachIndex}-${testInfo.retry}`.replace(/[^a-zA-Z0-9-]/g, "");
    const world = new TopiaWorld(
      `world-${id}`,
      `profile-${id}`,
      request,
      uniqueAssetId ? `key-asset-${id}` : KEY_ASSET_ID,
    );
    await use(world);

    // Fail the test if the app called a public-API endpoint the mock doesn't implement (e.g. after an
    // @rtsdk/topia upgrade): it would otherwise pass against a 501 the real API never returns.
    expect((await world.state()).unhandled, "public-API calls mock-topia doesn't implement").toEqual([]);
    const outside = await (await request.get(`${MOCK_TOPIA_URL}/__mock/unhandled`)).json();
    expect(outside, "public-API calls mock-topia doesn't implement").toEqual([]);
  },
});

export { expect } from "@playwright/test";
