// A player's race: start from the drawer, walk the checkpoints in order (their walk-onto webhooks hit
// /api/race/checkpoint-entered), cross the start line again to finish.
import { KEY_ASSET_ID, SCENE_DROP_ID, START_POSITION, VISITOR_ID, expect, test } from "../../fixtures";
import { RACE_TIME, checkpointDot, openApp, startRaceInUi } from "./helpers";

test("starting a race teleports the player to the start line and starts the clock", async ({ page, world }) => {
  await world.seed({ visitorPosition: { x: 5000, y: 5000 } });
  await openApp(page, world.url("/start"));

  await startRaceInUi(page);

  await expect(checkpointDot(page, "Checkpoint 1")).toBeVisible();
  await expect(checkpointDot(page, "Checkpoint 2")).toBeVisible();
  await expect(checkpointDot(page, "Finish")).toBeVisible();
  expect(await world.events("move")).toContainEqual(
    expect.objectContaining({ visitorId: String(VISITOR_ID), teleport: true, moveTo: START_POSITION }),
  );
  expect(await world.events("set-activity")).toContainEqual(expect.objectContaining({ webhookType: "GAME_ON", assetId: KEY_ASSET_ID }));
  const progress = await world.progress();
  expect(progress.startTimestamp).toEqual(expect.any(Number));
  expect(progress.checkpoints).toEqual({});
  expect((await world.sceneData()).lastRaceStartedDate).toBe(progress.startTimestamp);
  expect(await world.analytics()).toContain("starts");
});

test("checkpoints entered in order light up live and congratulate the player", async ({ page, world }) => {
  await world.seed({ checkpoints: 3 });
  await openApp(page, world.url("/start"));
  await startRaceInUi(page);

  expect((await world.enter(1)).ok()).toBe(true);
  await expect(checkpointDot(page, "Checkpoint 1")).toHaveClass(/completed/);
  expect((await world.enter(2)).ok()).toBe(true);
  await expect(checkpointDot(page, "Checkpoint 2")).toHaveClass(/completed/);

  await expect(checkpointDot(page, "Checkpoint 3")).not.toHaveClass(/completed/);
  const toasts = (await world.events("fire-toast")).map((t) => t.title);
  expect(toasts).toEqual(expect.arrayContaining(["✅ Checkpoint 1", "✅ Checkpoint 2"]));
  expect(await world.analytics()).toEqual(expect.arrayContaining(["checkpointEntered1", "checkpointEntered2"]));
  expect((await world.progress()).checkpoints).toEqual({ 0: true, 1: true });
});

test("finishing records the time, the personal best and the leaderboard entry", async ({ page, world }) => {
  await world.seed();
  await openApp(page, world.url("/start"));
  await startRaceInUi(page);

  await world.enter(1);
  await world.enter(2);
  expect((await world.enter(0)).ok()).toBe(true);

  await expect(page.getByRole("heading", { name: "Congratulations!" })).toBeVisible();
  const shownTime = await page.locator("h2 strong").last().textContent();
  expect(shownTime).toMatch(RACE_TIME);

  const progress = await world.progress();
  expect(progress).toMatchObject({ highScore: shownTime, elapsedTime: shownTime, startTimestamp: null, checkpoints: {} });
  expect((await world.visitorData()).racesCompleted).toBe(1);
  expect((await world.sceneData()).leaderboard).toEqual({ [world.profileId]: `E2E Player|${shownTime}` });

  expect(await world.events("fire-toast")).toContainEqual(
    expect.objectContaining({ title: "🏁 Finish", text: `You finished the race! Your time: ${shownTime}` }),
  );
  expect(await world.events("particles")).toContainEqual(expect.objectContaining({ particleId: "particle-1", duration: 3 }));
  expect((await world.events("set-activity")).map((e) => e.webhookType)).toEqual(["GAME_ON", "GAME_HIGH_SCORE"]);
  expect(await world.analytics()).toContain("completions");
});

test("the finish line doesn't count until every checkpoint is done", async ({ page, world }) => {
  await world.seed({ checkpoints: 2 });
  await openApp(page, world.url("/start"));
  await startRaceInUi(page);

  await world.enter(1);
  expect((await world.enter(0)).ok()).toBe(true);

  await expect(checkpointDot(page, "Finish")).not.toHaveClass(/completed/);
  await expect(page.getByRole("button", { name: "Cancel Race" })).toBeVisible();
  expect((await world.sceneData()).leaderboard).toEqual({});
  expect((await world.progress()).startTimestamp).toEqual(expect.any(Number));
  expect((await world.events("fire-toast")).map((t) => t.title)).not.toContain("🏁 Finish");
});

test("a checkpoint out of order is rejected with a warning and doesn't advance the race", async ({ page, world }) => {
  await world.seed({ checkpoints: 3 });
  await openApp(page, world.url("/start"));
  await startRaceInUi(page);

  await world.enterUnanswered(2);

  await expect
    .poll(async () => (await world.events("fire-toast")).map((t) => t.title))
    .toContain("❌ Wrong checkpoint");
  await expect(checkpointDot(page, "Checkpoint 2")).not.toHaveClass(/completed/);
  expect((await world.progress()).checkpoints).toEqual({});
  expect(await world.analytics()).not.toContain("checkpointEntered2");
});

test("cancelling a race clears the run and returns to the start screen", async ({ page, world }) => {
  await world.seed();
  await openApp(page, world.url("/start"));
  await startRaceInUi(page);
  await world.enter(1);

  await page.getByRole("button", { name: "Cancel Race" }).click();

  await expect(page.getByText("How to Play")).toBeVisible();
  expect(await world.progress()).toMatchObject({ checkpoints: {}, elapsedTime: null, startTimestamp: null });
});

test("reopening the drawer mid-race resumes the clock and the checkpoints done", async ({ page, world }) => {
  await world.seed({
    worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard: {} } },
    visitorData: {
      racesCompleted: 0,
      [world.progressKey]: { checkpoints: { 0: true }, elapsedTime: null, highScore: null, startTimestamp: Date.now() - 20_000 },
    },
  });

  await openApp(page, world.url("/start"));

  await expect(page.getByRole("button", { name: "Cancel Race" })).toBeVisible();
  await expect(checkpointDot(page, "Checkpoint 1")).toHaveClass(/completed/);
  await expect(checkpointDot(page, "Checkpoint 2")).not.toHaveClass(/completed/);
  await expect(page.locator("h2.text-yellow")).toHaveText(/^00:2\d:\d{2}$/);
});

test("a run abandoned more than 3 minutes ago is reset when the drawer opens", async ({ page, world }) => {
  await world.seed({
    worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard: {} } },
    visitorData: {
      racesCompleted: 0,
      [world.progressKey]: { checkpoints: { 0: true }, elapsedTime: null, highScore: "00:40:00", startTimestamp: Date.now() - 200_000 },
    },
  });

  await openApp(page, world.url("/start"));

  await expect(page.getByText("How to Play")).toBeVisible();
  expect(await world.progress()).toMatchObject({ checkpoints: {}, startTimestamp: null, highScore: "00:40:00" });
});

test("a slower run keeps the personal best; a faster one replaces it", async ({ world }) => {
  const seededRun = (highScore: string) => ({
    worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 1, leaderboard: { [world.profileId]: `E2E Player|${highScore}` } } },
    visitorData: {
      racesCompleted: 3,
      [world.progressKey]: { checkpoints: { 0: true }, elapsedTime: null, highScore, startTimestamp: Date.now() - 5_000 },
    },
    checkpoints: 1,
  });

  // ~5 s run against a 1 s best: nothing changes but the race count.
  await world.seed(seededRun("00:01:00"));
  expect((await world.enter(0)).ok()).toBe(true);
  expect((await world.progress()).highScore).toBe("00:01:00");
  expect((await world.sceneData()).leaderboard[world.profileId]).toBe("E2E Player|00:01:00");
  expect((await world.visitorData()).racesCompleted).toBe(4);
  expect(await world.events("set-activity")).toEqual([]);

  // ~5 s run against a 1 min best: new personal best, leaderboard updated, high-score activity.
  await world.seed(seededRun("01:00:00"));
  expect((await world.enter(0)).ok()).toBe(true);
  const { highScore } = await world.progress();
  expect(highScore).toMatch(/^00:0[5-9]:\d{2}$/);
  expect((await world.sceneData()).leaderboard[world.profileId]).toBe(`E2E Player|${highScore}`);
  expect((await world.events("set-activity")).map((e) => e.webhookType)).toEqual(["GAME_HIGH_SCORE"]);
});
