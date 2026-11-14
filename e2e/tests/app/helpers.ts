import { Page } from "@playwright/test";
import { expect } from "../../fixtures";

/**
 * Opens the app and waits until it has loaded the game state. The page first renders the start screen
 * before its axios client exists and then reloads the state, which would reset a click made before.
 */
export async function openApp(page: Page, url: string) {
  const loaded = page.waitForResponse((r) => r.url().includes("/api/race/game-state"));
  await page.goto(url);
  await loaded;
  await expect(page.locator('img[alt="Loading"]')).toHaveCount(0);
}

/** The checkpoint indicator on the race-in-progress screen ("Checkpoint N" or "Finish"). */
export const checkpointDot = (page: Page, label: string) =>
  page
    .locator("div")
    .filter({ has: page.getByText(label, { exact: true }) })
    .last()
    .locator(".checkpoint");

/**
 * Presses Start Race and waits through the countdown until the race screen is live: the start-race
 * call has answered and the screen's live-update stream (SSE) is connected, so webhooks fired from
 * here on reach the UI.
 */
export async function startRaceInUi(page: Page) {
  const started = page.waitForResponse((r) => r.url().includes("/api/race/start-race"));
  const stream = page.waitForResponse((r) => r.url().includes("/api/events"));
  await page.getByRole("button", { name: "Start Race" }).click();
  await expect(page.getByText("On Your Mark...")).toBeVisible();
  expect((await started).ok()).toBe(true);
  await stream;
  await expect(page.getByRole("button", { name: "Cancel Race" })).toBeVisible();
}

/** "MM:SS:CC" as Race formats times. */
export const RACE_TIME = /^\d{2}:\d{2}:\d{2}$/;
