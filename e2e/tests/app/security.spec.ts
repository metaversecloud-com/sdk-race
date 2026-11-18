// What a player can do by calling the app's API directly with the session credentials from their
// own iframe URL, and how the checkpoint webhook holds up.
import { SCENE_DROP_ID, START_POSITION, TopiaWorld, VISITOR_ID, expect, test } from "../../fixtures";

const LEADERBOARD = { "p-1": "Fast Fran|00:31:50", "p-2": "Slow Sam|01:10:00" };

/** Raw webhook call: no walking onto the asset first. */
const postCheckpoint = (world: TopiaWorld, request: import("@playwright/test").APIRequestContext, uniqueName: string, overrides = {}) =>
  request.post("/api/race/checkpoint-entered", { data: world.webhookBody(uniqueName, overrides), timeout: 5_000 });

test("a player can't wipe the leaderboard by calling reset-game", async ({ request, world }) => {
  test.fail(true, "EXP-441: reset-game isn't admin-gated on the server");
  await world.seed({ isAdmin: false, worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard: LEADERBOARD } } });

  const response = await request.post(world.api("/race/reset-game"));

  expect(response.ok()).toBe(false);
  expect((await world.sceneData()).leaderboard).toEqual(LEADERBOARD);
});

test("a player can't switch the track mid-race by calling switch-track", async ({ request, world }) => {
  test.fail(true, "EXP-441: the 5-minute switch-track cooldown is only enforced in the UI");
  await world.seed({
    isAdmin: false,
    worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard: LEADERBOARD, lastRaceStartedDate: Date.now() - 60_000 } },
  });

  const response = await request.post(world.api("/race/switch-track"), {
    data: { selectedTrack: { id: 1, name: "Beach Track", thumbnail: "", sceneId: "scene-beach" } },
  });

  expect(response.ok()).toBe(false);
  expect(await world.events("delete-asset")).toEqual([]);
  expect(await world.events("drop-scene")).toEqual([]);
});

test("switch-track only drops the configured tracks", async ({ request, world }) => {
  test.fail(true, "EXP-441: switch-track drops any client-sent sceneId (after deleting the race)");
  await world.seed({ isAdmin: true, worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard: LEADERBOARD } } });

  const response = await request.post(world.api("/race/switch-track"), {
    data: { selectedTrack: { id: 99, name: "Anything", thumbnail: "", sceneId: "any-scene-in-topia" } },
  });

  expect(response.ok()).toBe(false);
  expect(await world.events("delete-asset")).toEqual([]);
  expect(await world.events("drop-scene")).toEqual([]);
});

test("checkpoint webhooks sent while the player isn't on the checkpoint don't count", async ({ request, world }) => {
  test.fail(true, "EXP-441: checkpoint-entered trusts the client-sent uniqueName, so a lap can be posted from anywhere");
  await world.seed({ checkpoints: 2 });
  await world.startRace(); // teleports the player onto the start line

  // Straight from the start line, without walking the track:
  await postCheckpoint(world, request, "race-track-checkpoint-1");
  await postCheckpoint(world, request, "race-track-checkpoint-2");
  await postCheckpoint(world, request, "race-track-start");

  expect((await world.state()).visitors[VISITOR_ID].moveTo).toEqual(START_POSITION);
  expect((await world.sceneData()).leaderboard).toEqual({});
  expect(await world.events("grant-item")).toEqual([]);
});

test("a display name can't forge a leaderboard time", async ({ request, world }) => {
  test.fail(true, "EXP-441: leaderboard entries are 'name|time' strings, so a '|' in the name replaces the time");
  await world.seed({
    checkpoints: 1,
    worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 1, leaderboard: {} } },
    visitorData: {
      racesCompleted: 0,
      [world.progressKey]: { checkpoints: { 0: true }, elapsedTime: null, highScore: null, startTimestamp: Date.now() - 65_000 },
    },
  });

  await world.enter(0, { overrides: { displayName: "Speedy|00:00:01" } });

  const { leaderboard } = await (await request.get(world.api("/leaderboard"))).json();
  expect(leaderboard).toHaveLength(1);
  expect(leaderboard[0].highScore).toMatch(/^01:0\d:\d{2}$/);
});

test("checkpoint webhook with another app's public key is rejected", async ({ request, world }) => {
  await world.seed({ checkpoints: 2 });
  await world.startRace();

  const response = await postCheckpoint(world, request, "race-track-checkpoint-1", { interactivePublicKey: "someone-else" });

  expect(response.ok()).toBe(false);
  expect((await response.json()).success).toBe(false);
  expect((await world.progress()).checkpoints).toEqual({});
  expect(await world.events("fire-toast")).toEqual([]);
});

test("the checkpoint webhook is answered when no race is running", async ({ world }) => {
  test.fail(true, "EXP-441: checkpoint-entered never responds when no race is running");
  await world.seed({ checkpoints: 2 });

  const response = await world.enter(1, { timeout: 5_000 });

  expect(response.status()).toBeLessThan(500);
  expect((await world.progress())?.checkpoints ?? {}).toEqual({});
});

test("the checkpoint webhook is answered for a checkpoint out of order", async ({ world }) => {
  test.fail(true, "EXP-441: checkpoint-entered never responds to a wrong checkpoint");
  await world.seed({ checkpoints: 3 });
  await world.startRace();

  const response = await world.enter(3, { timeout: 5_000 });

  expect(response.status()).toBeLessThan(500);
});

test("the live-update stream needs a session", async ({ baseURL, world }) => {
  test.fail(true, "EXP-441: /api/events streams any profileId's race updates without credentials");
  await world.seed();

  const abort = new AbortController();
  const response = await fetch(`${baseURL}/api/events?profileId=${world.profileId}`, { signal: abort.signal });
  abort.abort();

  expect(response.status).toBeGreaterThanOrEqual(400);
});
