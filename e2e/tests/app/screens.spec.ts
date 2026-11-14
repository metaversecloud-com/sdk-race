// What the drawer shows outside a race: first-load setup, leaderboard and badges.
import { SCENE_DROP_ID, expect, test } from "../../fixtures";
import { openApp } from "./helpers";

const leaderboardRows = (page: import("@playwright/test").Page) => page.locator("table tbody tr");

test("first load counts this race's checkpoints and sets up the player's run", async ({ page, world }) => {
  // A second race dropped elsewhere in the same world must not change this race's checkpoint count.
  await world.seed({ checkpoints: 3, otherSceneCheckpoints: 5 });

  await openApp(page, world.url("/start"));

  await expect(page.getByText("How to Play")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Race" })).toBeVisible();
  expect(await world.sceneData()).toEqual({ numberOfCheckpoints: 3, leaderboard: {} });
  expect(await world.progress()).toEqual({ checkpoints: {}, elapsedTime: null, highScore: null, startTimestamp: null });
  expect((await world.visitorData()).racesCompleted).toBe(0);
});

test("the leaderboard tab lists finishers fastest first and the player's personal best", async ({ page, world }) => {
  await world.seed({
    worldData: {
      [SCENE_DROP_ID]: {
        numberOfCheckpoints: 2,
        leaderboard: {
          "p-slow": "Slow Sam|01:10:00",
          [world.profileId]: "E2E Player|00:42:15",
          "p-fast": "Fast Fran|00:31:50",
        },
      },
    },
  });
  await openApp(page, world.url("/start"));

  await page.getByRole("button", { name: "Leaderboard" }).click();

  await expect(leaderboardRows(page)).toHaveCount(3);
  await expect(leaderboardRows(page).nth(0)).toContainText("Fast Fran00:31:50");
  await expect(leaderboardRows(page).nth(1)).toContainText("E2E Player00:42:15");
  await expect(leaderboardRows(page).nth(2)).toContainText("Slow Sam01:10:00");
  await expect(page.locator(".card-primary")).toContainText("00:42:15");
});

test("an empty leaderboard says so", async ({ page, world }) => {
  await world.seed();
  await openApp(page, world.url("/start"));

  await page.getByRole("button", { name: "Leaderboard" }).click();

  await expect(page.getByText("There are no race finishes yet.")).toBeVisible();
  await expect(page.getByText("No high score available")).toBeVisible();
});

test("times are ranked by their hundredths too", async ({ page, world }) => {
  test.fail(true, "EXP-441: leaderboard sorts MM:SS:CC as if it were HH:MM:SS");
  await world.seed({
    worldData: {
      [SCENE_DROP_ID]: {
        numberOfCheckpoints: 2,
        leaderboard: { "p-a": "Eleven|00:11:00", "p-b": "Ten|00:10:99" },
      },
    },
  });
  await openApp(page, world.url("/start"));

  await page.getByRole("button", { name: "Leaderboard" }).click();

  await expect(leaderboardRows(page).nth(0)).toContainText("Ten00:10:99");
});

test("the leaderboard shows the top 20", async ({ page, world }) => {
  test.fail(true, "EXP-441: formatLeaderboard discards its .slice(0, 20)");
  const leaderboard: Record<string, string> = {};
  for (let i = 10; i < 35; i++) leaderboard[`p-${i}`] = `Racer ${i}|00:${i}:00`;
  await world.seed({ worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard } } });
  await openApp(page, world.url("/start"));

  await page.getByRole("button", { name: "Leaderboard" }).click();

  await expect(leaderboardRows(page).first()).toContainText("Racer 10");
  await expect(leaderboardRows(page)).toHaveCount(20);
});

test("the standalone leaderboard page links back to the race", async ({ page, world }) => {
  await world.seed({
    worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 2, leaderboard: { "p-1": "Fast Fran|00:31:50" } } },
  });
  await openApp(page, world.url("/leaderboard"));

  await expect(leaderboardRows(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Start Race" }).click();

  await expect(page).toHaveURL(/\/start\?/);
  await expect(page.getByText("How to Play")).toBeVisible();
});

test("an old-format leaderboard is migrated on load", async ({ page, world }) => {
  await world.seed({
    worldData: {
      [SCENE_DROP_ID]: {
        numberOfCheckpoints: 2,
        profiles: { "p-old": { username: "Veteran", highscore: "00:50:00" } },
      },
    },
  });
  await openApp(page, world.url("/start"));

  await page.getByRole("button", { name: "Leaderboard" }).click();

  await expect(leaderboardRows(page).nth(0)).toContainText("Veteran00:50:00");
  expect(await world.sceneData()).toEqual({ numberOfCheckpoints: 2, leaderboard: { "p-old": "Veteran|00:50:00" } });
});

test("the badges tab shows owned badges in colour and the rest greyed out", async ({ page, world }) => {
  await world.seed({ badges: ["Race Rookie"] });
  await openApp(page, world.url("/start"));

  await page.getByRole("button", { name: "Badges" }).click();

  await expect(page.getByRole("heading", { name: "Badges" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Race Rookie" })).toHaveCSS("filter", "none");
  await expect(page.getByRole("img", { name: "Speed Demon" })).toHaveCSS("filter", "grayscale(1)");
  await expect(page.locator(".tooltip img")).toHaveCount(8);
});

test("the app's root path isn't a page", async ({ page, world }) => {
  await world.seed();
  await page.goto(world.url("/"));

  await expect(page.getByRole("heading", { name: "Under Construction" })).toBeVisible();
});
