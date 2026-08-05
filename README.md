<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Race

## Introduction / Summary

Race is a timed lap game for Topia worlds. A visitor clicks the race key asset to open the drawer, presses **Start Race** to be teleported onto the start line, then runs a loop through numbered checkpoint pads (`race-track-checkpoint-1`, `-2`, …) in order and crosses the start line one more time to finish. The elapsed time is stamped, compared against the visitor's previous best, and — if it beats their current high score — written to a per-scene leaderboard keyed by `sceneDropId`.

The app supports multiple pluggable tracks: a `TRACKS` env-var JSON array feeds a track picker that drops a new scene into the same `race-track-container` position and wipes the leaderboard on switch. Ecosystem badges are granted from `finishLineEntered` (first completion, top-3 finish, sub-30-seconds, slow-finish, 100th/1000th race, redemption-after-wrong-checkpoint, plus a per-track completion badge whose ecosystem-item name must match the track's `name`).

Real-time checkpoint UI updates flow server→client over a Redis pub/sub channel bridged to an SSE stream at `/api/events`.

## Key Features

- **Loop race:** start line doubles as the finish line — `race-track-start` fires `checkpointNumber = 0`, which is treated as "finish" only when every intermediate checkpoint has been hit.
- **In-order enforcement:** entering checkpoint N when N−1 wasn't completed fires a `❌ Wrong checkpoint` toast, publishes a rollback to SSE, and flags the run's `wasWrongCheckpointEntered` in Redis (used to gate the Never Give Up badge).
- **Live timer:** client-side 50 ms tick renders `MM:SS:CC` in `RaceInProgressScreen`; the authoritative elapsed time is computed server-side from `startTimestamp` at finish.
- **Per-visitor high score:** stored on the visitor data object, keyed by `${urlSlug}-${sceneDropId}`. Only new personal bests overwrite `highScore`.
- **Per-scene leaderboard:** stored on the world data object under `${sceneDropId}.leaderboard`, sorted top 20 by time.
- **Track switcher:** any visitor can pick from `TRACKS`; drops the new scene, deletes old assets, resets leaderboard and visitor progress. Admins can override the 5-minute "race just started" cooldown.
- **Admin reset:** wipes the leaderboard for the current `sceneDropId` and re-counts checkpoints. Route is not admin-gated — `isAdmin` is only enforced in the UI.
- **Ecosystem badges:** 8 catalogued badges granted through `Ecosystem.fetchInventoryItems`, cached 6 h in memory.
- **Google Sheets analytics (optional):** one row per race start, appended only if `GOOGLESHEETS_SHEET_ID` is set.
- **Real-time updates:** Redis pub/sub `${INTERACTIVE_KEY}_RACE` channel → SSE at `/api/events?profileId=…` — used for both checkpoint UI sync and new-badge popups.

## Required Assets with Unique Names

Checkpoint assets fire the `POST /api/race/checkpoint-entered` webhook (with their `uniqueName` in the body) when a visitor walks onto them; the numeric suffix of the unique name is the checkpoint's ordinal.

| Unique Name                 | Description                                                                                                                                                                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `race-track-start`          | Start / finish line. Race-start teleports the visitor to this asset's position, and walking back onto it triggers `checkpointNumber = 0` — which is only treated as "finish" if every checkpoint has been hit.                                                  |
| `race-track-checkpoint-{N}` | Numbered checkpoints on the loop. Looked up via `isPartial: true` on `race-track-checkpoint`; the ordinal is parsed from the trailing digit (`race-track-checkpoint-1`, `-2`, …). Their count is stored on `world.dataObject[sceneDropId].numberOfCheckpoints`. |
| `race-track-container`      | Big rectangle surrounding the track. Its `position` is captured on first load and reused when `handleSwitchTrack` calls `world.dropScene({ sceneId, position, sceneDropId })`. Without it, `switch-track` returns HTTP 404.                                     |

## Technical Architecture

### Data Objects

#### Visitor

Keyed by `${urlSlug}-${sceneDropId}` so multiple parallel scene drops in one world each get their own run.

```ts
{
  racesCompleted: number;                // incremented once per finish, drives Race Pro / Expert badges
  [`${urlSlug}-${sceneDropId}`]: {
    checkpoints: Record<number, boolean>; // { 0: false } on start; not primary source of truth for order-checking (Redis is)
    elapsedTime: string | null;           // "MM:SS:CC" at finish; also updated on each checkpoint
    highScore: string | null;             // "MM:SS:CC" personal best
    startTimestamp: number | null;        // ms epoch; nulled on finish or cancel
  };
}
```

If `startTimestamp` is older than **3 minutes** at load time, `getVisitor` auto-clears the run.

#### World

Keyed by `sceneDropId`.

```ts
{
  [sceneDropId]: {
    numberOfCheckpoints: number;
    leaderboard: Record<profileId, `${displayName}|${highScore}`>;
    trackName?: string;                   // set on switch-track; used as the per-track badge name
    position?: { x: number; y: number };  // captured from race-track-container on first load
    lastRaceStartedDate?: number | null;  // ms epoch of last start; drives the switch-track cooldown
  };
}
```

Legacy `profiles: { [profileId]: { username, highscore } }` shape is auto-migrated to `leaderboard` on next load.

#### Redis

| Key                                       | Value                                                                                                     | Purpose                                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `${profileId}`                            | `{ checkpoints: Record<n, bool>, wasWrongCheckpointEntered: bool }`                                       | Per-race hot state used to enforce checkpoint order and gate the Never Give Up badge. |
| Pub/sub channel `${INTERACTIVE_KEY}_RACE` | `{ profileId, checkpointNumber?, checkpointsCompleted?, currentRaceFinishedElapsedTime?, newBadgeName? }` | Fanned out to matching SSE connections.                                               |

## API Endpoints

All routes mount under `/api`. Credentials come from query string on GET/POST-with-query and from `req.body` on `checkpoint-entered`; `getCredentials` requires `interactiveNonce`, `interactivePublicKey`, `urlSlug`, `visitorId` and rejects when `INTERACTIVE_KEY !== interactivePublicKey`.

| Method | Route                      | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/system/health`           | Version + which env vars are set.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `GET`  | `/visitor-inventory`       | Current visitor's ecosystem inventory keyed by name.                                                                                                                                                                                                                                                                                                                                                                                                |
| `GET`  | `/leaderboard`             | Sorted leaderboard for this `sceneDropId` + this visitor's own `highScore`.                                                                                                                                                                                                                                                                                                                                                                         |
| `GET`  | `/events?profileId=…`      | SSE stream of Redis pub/sub messages filtered to this `profileId`.                                                                                                                                                                                                                                                                                                                                                                                  |
| `POST` | `/race/game-state`         | Full snapshot: `checkpointsCompleted`, `elapsedTimeInSeconds`, `highScore`, `isAdmin`, `leaderboard`, `numberOfCheckpoints`, `startTimestamp`, `tracks`, `visitorInventory`, `badges`, `lastRaceStartedDate`. Body `{ forceRefreshInventory?: boolean }` busts the 6 h ecosystem cache. On first load also lazily writes `sceneData` to the world object and migrates the legacy `profiles` leaderboard shape.                                      |
| `POST` | `/race/start-race`         | Resets Redis run state, teleports visitor to `race-track-start`, triggers `WorldActivityType.GAME_ON`, stamps `startTimestamp` on the visitor, sets `lastRaceStartedDate` on the world, fires the `starts` analytic + Google Sheets row.                                                                                                                                                                                                            |
| `POST` | `/race/checkpoint-entered` | Body `{ uniqueName, …credentials }`. Called from the walk-onto webhook on each checkpoint. `uniqueName === "race-track-start"` ⇒ checkpoint 0 (finish if all done); other names parse the trailing integer. Out-of-order = toast + rollback publish. In-order = ✅ toast + `checkpointEntered${N}` analytic. Checkpoint 0 with all others complete = finish flow (see `finishLineEntered`).                                                         |
| `POST` | `/race/cancel-race`        | Clears the visitor's `checkpoints`, `elapsedTime`, `startTimestamp`.                                                                                                                                                                                                                                                                                                                                                                                |
| `POST` | `/race/reset-game`         | Recounts checkpoints and wipes `leaderboard` on `world.dataObject[sceneDropId]`; resets the calling visitor's progress to `DEFAULT_PROGRESS`. **Not admin-gated at the route layer** — UI-only.                                                                                                                                                                                                                                                     |
| `POST` | `/race/switch-track`       | Body `{ selectedTrack: Track }`. Deletes every dropped asset for this `sceneDropId` except the caller's own, drops `selectedTrack.sceneId` at the previously-captured container position, updates `sceneData` (with new `trackName`, `numberOfCheckpoints`, empty leaderboard), fires `trackUpdates` analytic, resets the caller's visitor progress, and deletes the calling asset. Returns 404 if no `race-track-container` position is available. |

## Analytics

All analytics are attached to `visitor.updateDataObject` / `world.updateDataObject` calls via the SDK's `analytics: [...]` option. `uniqueKey` is always `profileId`.

| Event                   | Fired when                                                            | Where                                                        |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `starts`                | Race is started.                                                      | `POST /race/start-race`                                      |
| `checkpointEntered${N}` | Visitor enters checkpoint `N` in-order (`N = 1, 2, …`).               | `checkpointEntered.ts` (via `POST /race/checkpoint-entered`) |
| `completions`           | Race is finished — every checkpoint hit and start line crossed again. | `finishLineEntered.ts` (via `POST /race/checkpoint-entered`) |
| `trackUpdates`          | Track is switched.                                                    | `POST /race/switch-track`                                    |

Race starts additionally append a row to Google Sheets (`appName: "Race"`, `event: "starts"`) via `addNewRowToGoogleSheets` when `GOOGLESHEETS_SHEET_ID` is set. No other analytic is mirrored to Sheets.

**Particles + toasts:** race start triggers `WorldActivityType.GAME_ON`; a new personal best triggers `WorldActivityType.GAME_HIGH_SCORE`; finish fires `trophy_float` (duration 3) and a 🏁 finish toast. Checkpoint hits fire ✅ / ❌ toasts under `groupId: "race"`.

## Badges

Granted from `finishLineEntered.ts` via `awardBadge`, which looks the badge up by exact name from the cached ecosystem inventory. If the ecosystem item is missing the badge is silently skipped.

| Badge           | Trigger                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Race Rookie`   | First-ever race completion (previous `highScore` was null).                                                                   |
| `Top 3 Racer`   | New high score lands in the top 3 of the current leaderboard (`isNewHighScoreTop3`).                                          |
| `Speed Demon`   | Completion time < 30 seconds.                                                                                                 |
| `Slow & Steady` | Completion time > 120 seconds.                                                                                                |
| `Race Pro`      | `racesCompleted + 1 === 100` (exact threshold).                                                                               |
| `Race Expert`   | `racesCompleted + 1 === 1000` (exact threshold).                                                                              |
| `Never Give Up` | Finished after having entered at least one wrong checkpoint during the run.                                                   |
| `${trackName}`  | Ecosystem item whose name matches the current `trackName` — awarded on every finish; skipped silently if no such item exists. |

## Environment Variables

Create a `.env` at the app root. See `.env-example` for a template. `checkEnvVariables` at boot only enforces `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`; everything else fails lazily at first use.

| Variable                    | Description                                                                                                                                    | Required |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `INTERACTIVE_KEY`           | Topia interactive app key. Compared against `interactivePublicKey` on every request.                                                           | Yes      |
| `INTERACTIVE_SECRET`        | Topia interactive app secret.                                                                                                                  | Yes      |
| `INSTANCE_DOMAIN`           | Topia API domain (`api.topia.io` / `api-stage.topia.io`).                                                                                      | Yes      |
| `REDIS_URL`                 | Redis connection URL (e.g. `redis://localhost:6379`, `rediss://…` for TLS). Powers per-race state + SSE fanout.                                | Yes      |
| `REDIS_CLUSTER_MODE`        | `"true"` to connect via cluster client; defaults to standalone.                                                                                | No       |
| `TRACKS`                    | JSON array of track configs (`{ id, name, thumbnail, sceneId }`). Falls back to the two hard-coded `TRACKS` in `server/constants.ts` if unset. | No       |
| `NODE_ENV`                  | Toggles dev CORS (`localhost:3000/5173`) + serves the built client in production.                                                              | No       |
| `PORT`                      | Server port. Defaults to `3000`.                                                                                                               | No       |
| `COMMIT_HASH`               | Surfaced by `/system/health`.                                                                                                                  | No       |
| `GOOGLESHEETS_SHEET_ID`     | Google Sheet ID. Presence enables the Sheets row-append on race starts.                                                                        | No       |
| `GOOGLESHEETS_CLIENT_EMAIL` | Google service account email.                                                                                                                  | No       |
| `GOOGLESHEETS_PRIVATE_KEY`  | Google service account private key (with escaped `\n`).                                                                                        | No       |

### Track Configuration

`TRACKS` is a JSON array; each entry must satisfy the `Track` interface in `shared/types/RaceTypes.ts`:

```json
[
  {
    "id": 1,
    "name": "Beach",
    "thumbnail": "https://example.com/thumbnails/beach.png",
    "sceneId": "your_scene_id"
  }
]
```

`name` is also used as the per-track badge lookup — if you want a track-completion badge, create an ecosystem inventory item whose name matches this string exactly.

## Getting Started

```bash
# from the app root
npm install
cd client && npm install && cd ..

# create a .env at the app root (see Environment Variables above)
cp .env-example .env

# run the dev server (client + server together)
npm run dev
```

The client hits `/api` and expects to be served either behind the same host as the server (production build in `client/build`) or via the dev CORS allowlist (`http://localhost:3000` and `http://localhost:5173`).

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

## For Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### App-specific notes

- **Real-time transport:** Server-Sent Events at `GET /api/events?profileId=…`, backed by a single Redis pub/sub channel `${INTERACTIVE_KEY}_RACE`. Every server-side event (`checkpoint-entered`, wrong-checkpoint rollback, badge awarded) is published there; connections are filtered client-side by `profileId`. Stale SSE connections are pruned every 60 s.
- **Order enforcement lives in Redis, not the data object.** `handleCheckpointEntered` reads/writes `redis.get(profileId)` on every walk-onto. If Redis is down after startup the race will not correctly gate order — the process logs `Redis will not be available for this session` and keeps serving.
- **Auto-recover stuck runs:** `getVisitor` clears any run whose `startTimestamp` is > 3 minutes old at load time.
- **Ecosystem inventory cache** (`inventoryCache.ts`): 6-hour in-memory TTL with stale-fallback on error. `POST /race/game-state` with `{ forceRefreshInventory: true }` busts it.
- **Admin route gap:** `POST /race/reset-game` and `POST /race/switch-track` are **not** admin-gated at the API layer; `isAdmin` only affects the client UI. Anyone with a valid `interactiveNonce` can call them.
- **Race cooldown:** `SwitchTrackScreen` blocks non-admins from switching if `lastRaceStartedDate` is < 5 minutes old; admins get a confirmation modal instead.
- **`cleanReturnPayload` middleware** in `server/index.ts` strips fields from every JSON response before send.
- **Legacy leaderboard migration:** `handleLoadGameState` transparently rewrites the old `sceneData.profiles` shape into the current `sceneData.leaderboard`.
- **Unhandled-rejection guard:** `server/index.ts` swallows `ERR_HTTP_HEADERS_SENT` and logs everything else — the process only exits on non-headers uncaught exceptions.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- View it in action: [Dev](https://topia.io/race-dev), [Prod](https://topia.io/race-prod)
- [Notion One Pager](https://app.notion.com/p/topiaio/Race-4a010ff4c95a45a6a6e9c6c03a701659?v=71f6c3828d3b4f33960326f9bde24781)
