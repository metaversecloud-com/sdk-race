// Per-app settings for the shared platform tests in tests/platform. Every app edits this file;
// the platform specs themselves stay identical across SDK apps.
import type { Page } from "@playwright/test";
import type { TopiaWorld } from "./fixtures";

/**
 * Bugs a route still has, each set to its tracking reason (e.g. "EXP-429: ..."). The matching
 * platform test is marked test.fail: it passes while the bug exists and fails once it's fixed, so
 * the entry is removed together with the fix. Leave out what the route doesn't have.
 */
export type KnownBugs = {
  /** The response contains the interactive secret or a signed InteractiveJWT. */
  leaksSecret?: string;
  /** A request without session credentials succeeds. */
  acceptsMissingCredentials?: string;
  /** Credentials signed for another app's public key are accepted. */
  acceptsForeignCredentials?: string;
  /** Bad credentials fail later on a Topia call instead of with a credential error. */
  unnamedCredentialError?: string;
  /**
   * A request without session credentials takes the app process down (e.g. getCredentials throws
   * outside any try/catch, and @rtsdk/topia's unhandledRejection hook calls process.exit(1)). All three
   * credential tests then run against private app instances (helpers/privateServer.ts) instead of the
   * shared one, so they can't kill the server mid-suite. The missing-credentials test fails while the bug
   * exists; the foreign-credentials ones count an instance that went down as this bug and otherwise check
   * as usual (so foreign credentials that crash the route, e.g. getCredentials' { error } thrown later,
   * are covered too). If the suite collapses with ECONNREFUSED right after one of the credential tests,
   * that route needs this.
   */
  crashesServer?: string;
  /**
   * With valid credentials the route never answers (e.g. a webhook handler with a path that returns without
   * res.send). Platform calls give up after ANSWER_TIMEOUT_MS (tests/platform/callRoute.ts); this marks the
   * secrets test, which needs the answer, as test.fail. A route that also hangs on missing or foreign
   * credentials fails those tests on the timeout too: mark them with acceptsMissingCredentials /
   * acceptsForeignCredentials / unnamedCredentialError (it doesn't reject them).
   */
  answersNever?: string;
};

export type RouteSpec = {
  method: "get" | "post" | "put" | "delete";
  /** Path under basePath, without the query string. */
  path: string;
  /** Where the router is mounted. Default "/api"; e.g. "/webhook" for a separate webhook router. */
  basePath?: string;
  /**
   * Where the route reads the session credentials. "query" (default) is the iframe's backendAPI call.
   * "body": webhooks (asset clicks, zone events) get them as top-level fields of the JSON body, and
   * read them with getCredentials(req.body). The platform tests then merge them into `data`.
   */
  credentialsIn?: "query" | "body";
  /**
   * Body key the route reads the credentials from, for routes that take them nested, e.g.
   * "interactiveParams" for getCredentials(req.body.interactiveParams). Implies credentialsIn: "body".
   */
  credentialsKey?: string;
  /**
   * Query parameters the route needs besides the credentials (GET routes that answer early without them,
   * which would make the secrets scan vacuous).
   */
  query?: Record<string, string>;
  data?: Record<string, unknown>;
  knownBugs?: KnownBugs;
};

// Race's getCredentials does throw, but errorHandler sends the Error object itself, which JSON
// serializes to {}: every route answers "Error <doing X>" and the credential problem is lost.
const ERROR_MESSAGE_LOST = "EXP-441: errorHandler serializes the credential Error as {}";

/**
 * API routes that read the session credentials (getCredentials). Each one must reject missing or
 * foreign credentials and must never send the interactive secret to the browser. List them all.
 *
 * Except server-sent-event streams (GET /events): covered in tests/app/security.spec.ts.
 */
export const CREDENTIALED_ROUTES: RouteSpec[] = [
  { method: "post", path: "/race/game-state", knownBugs: { unnamedCredentialError: ERROR_MESSAGE_LOST } },
  { method: "post", path: "/race/start-race", knownBugs: { unnamedCredentialError: ERROR_MESSAGE_LOST } },
  { method: "post", path: "/race/cancel-race", knownBugs: { unnamedCredentialError: ERROR_MESSAGE_LOST } },
  { method: "post", path: "/race/reset-game", knownBugs: { unnamedCredentialError: ERROR_MESSAGE_LOST } },
  {
    method: "post",
    path: "/race/switch-track",
    data: { selectedTrack: { id: 1, name: "Beach Track", thumbnail: "", sceneId: "scene-beach" } },
    knownBugs: { unnamedCredentialError: ERROR_MESSAGE_LOST },
  },
  { method: "get", path: "/leaderboard", knownBugs: { unnamedCredentialError: ERROR_MESSAGE_LOST } },
  { method: "get", path: "/visitor-inventory", knownBugs: { unnamedCredentialError: ERROR_MESSAGE_LOST } },
  // Walk-onto webhook from the checkpoint assets: the credentials come in the request body.
  {
    method: "post",
    path: "/race/checkpoint-entered",
    credentialsIn: "body",
    data: { uniqueName: "race-track-checkpoint-1" },
    knownBugs: {
      unnamedCredentialError: ERROR_MESSAGE_LOST,
      // No race is running in the shared specs' world.
      answersNever: "EXP-441: checkpoint-entered never responds when no race is running",
    },
  },
];

/**
 * Page the app opens in its iframe; the platform tests load it with valid credentials. null if the app
 * has no page (no client/, driven only by webhooks): the platform tests that load a page are skipped.
 */
export const ENTRY_PAGE: string | null = "/start";

/**
 * Bugs seen when loading ENTRY_PAGE. leaksSecret: a response to the page carries the secret. callsOtherOrigin:
 * the page sends /api (or any localhost) requests somewhere other than the app's own origin, typically a
 * hardcoded API base such as http://localhost:3000 that only works in local development.
 */
export const ENTRY_PAGE_KNOWN_BUGS: Pick<KnownBugs, "leaksSecret"> & { callsOtherOrigin?: string } = {};

/**
 * What the page-load secret scan reads. "api" (default): the page's /api responses, at least one required.
 * "all": every response from the app (document, scripts, /api) plus WebSocket frames, none required, for
 * pages that talk over a socket or call /api only after the player acts.
 */
export const ENTRY_PAGE_SCAN: "api" | "all" = "api";

/**
 * Runs after ENTRY_PAGE loads and before the scan (e.g. click "Join" so the page opens its socket or calls
 * /api). Optional. Wait inside it for what it triggers (e.g. expect the game board to show): the scan only
 * reads what arrived by the time it returns and the page went network-idle.
 */
export const ENTRY_PAGE_ACTION: ((page: Page, world: TopiaWorld) => Promise<void>) | undefined = undefined;

/** Text the app shell's HTML must contain. Change it if the app isn't a React root (e.g. Unity). */
export const APP_SHELL_MARKER = 'id="root"';

/**
 * Whether unknown paths serve the app shell (an SPA with client-side routing). false for apps with real
 * page routes that answer unknown paths with a proper 404 (e.g. Next.js): the fallback test is skipped.
 */
export const APP_SHELL_FALLBACK: boolean = true;

/** The app's health endpoint, for the shared server's readiness check, private instances and system.spec. */
export const HEALTH_PATH: string = "/api/system/health";

/**
 * Bugs of the health endpoint (HEALTH_PATH), e.g. { incompleteContract: "EXP-123: no
 * COMMIT_HASH/BUILD_TIME in envs" } for apps forked before the contract had them. Marks the contract
 * test test.fail instead of changing app code in the e2e PR.
 */
export const HEALTH_KNOWN_BUGS: { incompleteContract?: string } = {};

/**
 * Bugs of the app process as a whole.
 * exitsOnUnhandledRejection: a promise rejection nobody handles exits the process, so any route that
 * forgets a try/catch lets one request restart the server for every player. @rtsdk/topia registers an
 * unhandledRejection hook that calls process.exit(1) when it's imported, which runs even when the app
 * registers its own logging handler. Fix: process.removeAllListeners("unhandledRejection") before
 * registering the app's handler.
 */
export const PROCESS_KNOWN_BUGS: { exitsOnUnhandledRejection?: string } = {};

/**
 * The request system.spec sends a malformed JSON body to. Default: the first POST/PUT route in
 * CREDENTIALED_ROUTES, else POST /api/e2e-malformed-json (which reaches the parser when express.json() is
 * registered app-wide). null skips the test, for apps that never parse JSON bodies.
 */
export const MALFORMED_JSON_REQUEST: { method: "post" | "put"; path: string } | null | undefined = undefined;

/**
 * Bugs of the app's error responses.
 * malformedJson: a malformed JSON body doesn't get a clean 400: typically Express' default error page, which
 * shows the stack trace and server file paths unless NODE_ENV=production (there's no error-handling
 * middleware after express.json()). Fix: an error middleware that answers body-parser errors
 * (err.type === "entity.parse.failed") with res.status(400).json({ success: false, error: "Invalid JSON" }).
 */
export const ERROR_KNOWN_BUGS: { malformedJson?: string } = {};

/**
 * true starts mock-redis/server.mjs (an in-memory Redis) next to mock-topia and points REDIS_URL at it
 * (REDIS_CLUSTER_MODE "false"; appEnv.ts), for apps that keep state or fan live updates out through Redis.
 * Default false. An app reading another variable sets it in APP_ENV from mock.redisUrl.
 */
export const MOCK_REDIS: boolean = true;

/**
 * Further processes to start before the app, as Playwright webServer entries (e.g. a fake of an external
 * service that can't live in mock-topia). Default none.
 */
export const EXTRA_WEB_SERVERS: Array<{
  command: string;
  url?: string;
  port?: number;
  env?: Record<string, string>;
  reuseExistingServer?: boolean;
  timeout?: number;
}> = [];

/**
 * Extra environment for the app under test (merged over the defaults in appEnv.ts; also passed to
 * private instances and the Docker image). A function gets the mock's address as the app reaches it
 * ({ host: "localhost:3101" or "host.docker.internal:3101", url: "http://<host>", redisUrl }), for fakes of
 * external APIs served by mock-topia. Fake S3 opt-in: { S3_BUCKET: FAKE_S3_BUCKET } (constants.ts).
 * Blank every variable that would point the app at a real service.
 */
export const APP_ENV:
  | Record<string, string>
  | ((mock: { host: string; url: string; redisUrl: string }) => Record<string, string>) = {
  // Track picker options. Each sceneId has a matching scene in fixtures.ts that mock-topia drops.
  TRACKS: JSON.stringify([
    { id: 1, name: "Beach Track", thumbnail: "https://example.invalid/beach.png", sceneId: "scene-beach" },
    { id: 2, name: "Forest Track", thumbnail: "https://example.invalid/forest.png", sceneId: "scene-forest" },
  ]),
  // Never let a test reach a real service: race starts append a row to Google Sheets when this is set.
  GOOGLESHEETS_SHEET_ID: "",
  GOOGLESHEETS_CLIENT_EMAIL: "",
  GOOGLESHEETS_PRIVATE_KEY: "",
};
