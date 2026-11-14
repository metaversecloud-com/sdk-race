import { APIRequestContext, test as base, expect } from "@playwright/test";
import { INTERACTIVE_KEY, MOCK_TOPIA_URL } from "./constants";

export const KEY_ASSET_ID = "key-asset";
export const SCENE_DROP_ID = "scene-1";
export const VISITOR_ID = 42;

/** Where the race-track-start asset sits; start-race teleports the visitor here. */
export const START_POSITION = { x: 100, y: 200 };
/** Where the race-track-container asset sits; switch-track drops the new scene here. */
export const CONTAINER_POSITION = { x: 1000, y: 2000 };

/** Track scenes mock-topia drops on switch-track, matching TRACKS in playwright.config.ts. */
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
  /** The world's data object. */
  worldData?: Record<string, unknown>;
  /** The visitor's data object. */
  visitorData?: Record<string, unknown>;
  /** Where the visitor stands in the world. */
  visitorPosition?: { x: number; y: number };
  /** Badges the visitor already owns. */
  badges?: string[];
};

/** One isolated Topia world in mock-topia, plus helpers to open the app inside it. */
export class TopiaWorld {
  readonly displayName = "E2E Player";

  constructor(
    readonly urlSlug: string,
    readonly profileId: string,
    private request: APIRequestContext,
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
    worldData = {},
    visitorData = {},
    visitorPosition = START_POSITION,
    badges = [],
  }: SeedOptions = {}) {
    const assets: Record<string, any> = {
      [KEY_ASSET_ID]: {
        id: KEY_ASSET_ID,
        assetName: "Race Key",
        uniqueName: "e2e-asset",
        sceneDropId: SCENE_DROP_ID,
        position: { x: 50, y: 50 },
      },
    };
    if (checkpoints > 0) Object.assign(assets, raceTrackAssets(checkpoints, SCENE_DROP_ID));
    if (!withContainer) delete assets.container;
    if (otherSceneCheckpoints > 0) Object.assign(assets, raceTrackAssets(otherSceneCheckpoints, "scene-2", "other-"));
    for (const asset of Object.values(assets)) asset.dataObject = {};

    const scenes: Record<string, any[]> = {};
    for (const [sceneId, { checkpoints: count }] of Object.entries(TRACK_SCENES)) {
      scenes[sceneId] = Object.values(raceTrackAssets(count, "", `${sceneId}-`)).map(({ sceneDropId, ...a }) => a);
    }

    const response = await this.request.post(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`, {
      data: {
        dataObject: worldData,
        assets,
        scenes,
        visitors: {
          [VISITOR_ID]: {
            isAdmin,
            profileId: this.profileId,
            displayName: this.displayName,
            moveTo: visitorPosition,
            landmarkZonesString: "",
            privateZoneId: "",
            dataObject: visitorData,
            inventory: badges.map((name) => ({
              id: `owned-${name}`,
              item_id: `owned-${name}`,
              status: "ACTIVE",
              item: { name, type: "BADGE", image_url: "" },
            })),
          },
        },
      },
    });
    if (!response.ok()) throw new Error(`Seeding mock world failed: ${response.status()}`);
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

  /** The race's entry in the world data object (leaderboard, numberOfCheckpoints, ...). */
  async sceneData(sceneDropId = SCENE_DROP_ID) {
    return (await this.state()).dataObject?.[sceneDropId];
  }

  async visitorData() {
    return (await this.state()).visitors[VISITOR_ID].dataObject;
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

  async events(type?: string) {
    const { events } = await this.state();
    return type ? events.filter((e) => e.type === type) : events;
  }

  async analytics() {
    return (await this.events("analytics")).map((e) => e.analyticName);
  }

  /** Session credentials Topia appends to the app's iframe URL. */
  credentials(overrides: Record<string, string> = {}) {
    return new URLSearchParams({
      assetId: KEY_ASSET_ID,
      displayName: this.displayName,
      identityId: "identity-1",
      interactiveNonce: "e2e-nonce",
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

export const test = base.extend<{ world: TopiaWorld }>({
  // The app loads fonts, styles, images and sounds from CDNs: nothing outside the local app is fetched.
  page: async ({ page }, use) => {
    await page.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1[:/])/, (route) => route.abort());
    await use(page);
  },
  world: async ({ request }, use, testInfo) => {
    const id = `${testInfo.testId}-${testInfo.repeatEachIndex}-${testInfo.retry}`.replace(/[^a-zA-Z0-9-]/g, "");
    const world = new TopiaWorld(`world-${id}`, `profile-${id}`, request);
    await use(world);

    // Fail the test if the app called a public-API endpoint the mock doesn't implement (e.g. after an
    // @rtsdk/topia upgrade): it would otherwise pass against a 501 the real API never returns.
    expect((await world.state()).unhandled, "public-API calls mock-topia doesn't implement").toEqual([]);
    const outside = await (await request.get(`${MOCK_TOPIA_URL}/__mock/unhandled`)).json();
    expect(outside, "public-API calls mock-topia doesn't implement").toEqual([]);
  },
});

export { expect } from "@playwright/test";
