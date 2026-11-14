// Per-app settings for the shared platform tests in tests/platform. Every app edits this file;
// the platform specs themselves stay identical across SDK apps.

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
};

export type RouteSpec = {
  method: "get" | "post" | "put" | "delete";
  /** Path under /api, without the query string. */
  path: string;
  data?: Record<string, unknown>;
  knownBugs?: KnownBugs;
};

// Race's getCredentials does throw, but errorHandler sends the Error object itself, which JSON
// serializes to {}: every route answers "Error <doing X>" and the credential problem is lost.
const ERROR_MESSAGE_LOST = "EXP-441: errorHandler serializes the credential Error as {}";

/**
 * API routes that read the session credentials (getCredentials). Each one must reject missing or
 * foreign credentials and must never send the interactive secret to the browser. List them all.
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
  // Walk-onto webhook from the checkpoint assets: it reads the credentials from the request BODY, which
  // the shared specs can't fill per world, so here they only prove a query-string session isn't enough.
  // tests/app/security.spec.ts covers its body credentials.
  {
    method: "post",
    path: "/race/checkpoint-entered",
    data: { uniqueName: "race-track-checkpoint-1" },
    knownBugs: { unnamedCredentialError: ERROR_MESSAGE_LOST },
  },
];

/** Page the app opens in its iframe; the platform tests load it with valid credentials. */
export const ENTRY_PAGE = "/start";

/** Bugs seen when loading ENTRY_PAGE (only leaksSecret applies). */
export const ENTRY_PAGE_KNOWN_BUGS: Pick<KnownBugs, "leaksSecret"> = {};

/** Text the app shell's HTML must contain. Change it if the app isn't a React root (e.g. Unity). */
export const APP_SHELL_MARKER = 'id="root"';
