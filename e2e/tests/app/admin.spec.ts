// Admin settings (reset game) and the track switcher.
import { Page } from "@playwright/test";
import { CONTAINER_POSITION, KEY_ASSET_ID, SCENE_DROP_ID, expect, test } from "../../fixtures";
import { openApp } from "./helpers";

const RACE_WITH_RESULTS = {
  [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard: { "p-1": "Fast Fran|00:31:50", "p-2": "Slow Sam|01:10:00" } },
};

async function switchTrackInUi(page: Page, trackName: string) {
  await page.getByRole("button", { name: "Update Track" }).click();
  await expect(page.getByRole("heading", { name: "Choose New Track" })).toBeVisible();
  await page.getByRole("img", { name: trackName }).click();
  const switched = page.waitForResponse((r) => r.url().includes("/api/race/switch-track"));
  await page.getByRole("button", { name: "Update Track" }).click();
  return switched;
}

test("only admins get the settings button", async ({ page, world }) => {
  await world.seed({ isAdmin: false });
  await openApp(page, world.url("/start"));
  await expect(page.getByText("How to Play")).toBeVisible();
  await expect(page.getByText("⛭")).toHaveCount(0);

  await world.seed({ isAdmin: true });
  await openApp(page, world.url("/start"));
  await page.getByText("⛭").click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});

test("an admin resets the game: leaderboard cleared after confirming", async ({ page, world }) => {
  await world.seed({
    isAdmin: true,
    worldData: RACE_WITH_RESULTS,
    visitorData: {
      racesCompleted: 4,
      [world.progressKey]: { checkpoints: {}, elapsedTime: "00:31:50", highScore: "00:31:50", startTimestamp: null },
    },
  });
  await openApp(page, world.url("/start"));
  await page.getByText("⛭").click();

  await page.getByRole("button", { name: "Reset Game" }).click();
  await expect(page.getByText("If you reset the game, the leaderboard will be removed.")).toBeVisible();
  const reset = page.waitForResponse((r) => r.url().includes("/api/race/reset-game"));
  await page.getByRole("button", { name: "Yes" }).click();
  expect((await reset).ok()).toBe(true);

  expect(await world.sceneData()).toEqual({ numberOfCheckpoints: 2, leaderboard: {} });
  expect(await world.progress()).toEqual({ checkpoints: { 0: false }, elapsedTime: null, highScore: null, startTimestamp: null });
});

test("resetting recounts only this race's checkpoints", async ({ request, world }) => {
  test.fail(true, "EXP-441: reset-game/switch-track count checkpoints of every race in the world");
  await world.seed({ isAdmin: true, checkpoints: 2, otherSceneCheckpoints: 4, worldData: RACE_WITH_RESULTS });

  expect((await request.post(world.api("/race/reset-game"))).ok()).toBe(true);

  expect((await world.sceneData()).numberOfCheckpoints).toBe(2);
});

test("switching the track replaces the race's assets with the new scene and clears the leaderboard", async ({ page, world }) => {
  await world.seed({ isAdmin: true, worldData: RACE_WITH_RESULTS });
  await openApp(page, world.url("/start"));

  const response = await switchTrackInUi(page, "Beach Track");

  expect(response.ok()).toBe(true);
  const deleted = (await world.events("delete-asset")).map((e) => e.assetId);
  expect([...deleted].sort()).toEqual(["checkpoint-1", "checkpoint-2", "container", KEY_ASSET_ID, "start"].sort());
  expect(deleted.at(-1)).toBe(KEY_ASSET_ID); // the key asset goes last, after the drawer is closed
  expect(await world.events("close-iframe")).toContainEqual(expect.objectContaining({ droppedAssetId: KEY_ASSET_ID }));
  expect(await world.events("drop-scene")).toEqual([
    expect.objectContaining({ sceneId: "scene-beach", sceneDropId: SCENE_DROP_ID, position: CONTAINER_POSITION }),
  ]);
  const { assets } = await world.state();
  expect(Object.values(assets).filter((a: any) => a.sceneDropId === SCENE_DROP_ID).map((a: any) => a.uniqueName).sort()).toEqual([
    "race-track-checkpoint-1",
    "race-track-checkpoint-2",
    "race-track-checkpoint-3",
    "race-track-container",
    "race-track-start",
  ]);
  expect(await world.sceneData()).toEqual({
    trackName: "Beach Track",
    numberOfCheckpoints: 3,
    leaderboard: {},
    position: CONTAINER_POSITION,
  });
  expect(await world.analytics()).toContain("trackUpdates");
});

test("switching the track counts only the new track's checkpoints", async ({ request, world }) => {
  test.fail(true, "EXP-441: reset-game/switch-track count checkpoints of every race in the world");
  await world.seed({ isAdmin: true, otherSceneCheckpoints: 4 });

  const response = await request.post(world.api("/race/switch-track"), {
    data: { selectedTrack: { id: 1, name: "Beach Track", thumbnail: "", sceneId: "scene-beach" } },
  });

  expect(response.ok()).toBe(true);
  expect((await world.sceneData()).numberOfCheckpoints).toBe(3);
});

test("switching needs the race-track-container to know where to drop the track", async ({ page, world }) => {
  await world.seed({ isAdmin: true, withContainer: false, worldData: RACE_WITH_RESULTS });
  await openApp(page, world.url("/start"));

  const response = await switchTrackInUi(page, "Forest Track");

  expect(response.status()).toBe(404);
  await expect(page.locator(".text-error")).toHaveText("An error occurred while resetting the race.");
  expect(await world.events("delete-asset")).toEqual([]);
  expect(await world.events("drop-scene")).toEqual([]);
  expect((await world.sceneData()).leaderboard).toEqual(RACE_WITH_RESULTS[SCENE_DROP_ID].leaderboard);
});

test("right after a race starts, players can't switch the track and admins must confirm", async ({ page, world }) => {
  const recentlyStarted = { [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard: {}, lastRaceStartedDate: Date.now() - 60_000 } };

  await world.seed({ isAdmin: false, worldData: recentlyStarted });
  await openApp(page, world.url("/start"));
  await page.getByRole("button", { name: "Update Track" }).click();
  await page.getByRole("img", { name: "Beach Track" }).click();
  await expect(page.getByRole("button", { name: "Update Track" })).toBeDisabled();
  await expect(page.getByText("A race was recently started.")).toBeAttached();

  await world.seed({ isAdmin: true, worldData: recentlyStarted });
  await openApp(page, world.url("/start"));
  await page.getByRole("button", { name: "Update Track" }).click();
  await page.getByRole("img", { name: "Beach Track" }).click();
  await page.getByRole("button", { name: "Update Track" }).click();
  await expect(page.getByText("A race may currently be in progress.")).toBeVisible();
  const switched = page.waitForResponse((r) => r.url().includes("/api/race/switch-track"));
  await page.getByRole("button", { name: "Yes" }).click();
  expect((await switched).ok()).toBe(true);
  expect((await world.sceneData()).trackName).toBe("Beach Track");
});
