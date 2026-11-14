// Ecosystem badges granted when a race is finished (finishLineEntered → awardBadge).
import { SCENE_DROP_ID, TopiaWorld, expect, test } from "../../fixtures";

/** A world where the player has done every checkpoint of a 1-checkpoint race and only has to finish. */
function seedFinishingRun(
  world: TopiaWorld,
  {
    startedAgo = 5_000,
    highScore = null as string | null,
    racesCompleted = 0,
    leaderboard = {} as Record<string, string>,
    trackName = undefined as string | undefined,
    badges = [] as string[],
  } = {},
) {
  return world.seed({
    checkpoints: 1,
    badges,
    worldData: { [SCENE_DROP_ID]: { numberOfCheckpoints: 1, leaderboard, ...(trackName && { trackName }) } },
    visitorData: {
      racesCompleted,
      [world.progressKey]: { checkpoints: { 0: true }, elapsedTime: null, highScore, startTimestamp: Date.now() - startedAgo },
    },
  });
}

const granted = async (world: TopiaWorld) => (await world.events("grant-item")).map((e) => e.name);

test("a first race under 30 seconds earns Race Rookie, Speed Demon and Top 3 Racer", async ({ world }) => {
  await world.seed({ checkpoints: 2 });
  await world.startRace();

  await world.enter(1);
  await world.enter(2);
  expect((await world.enter(0)).ok()).toBe(true);

  expect((await granted(world)).sort()).toEqual(["Race Rookie", "Speed Demon", "Top 3 Racer"]);
  expect(await world.badges()).toEqual(expect.arrayContaining(["Race Rookie", "Speed Demon", "Top 3 Racer"]));
  const badgeToasts = (await world.events("fire-toast")).filter((t) => t.title === "Badge Awarded").map((t) => t.text);
  expect(badgeToasts).toContain("You have earned the Speed Demon badge!");
});

test("finishing after missing a checkpoint earns Never Give Up", async ({ world }) => {
  await world.seed({ checkpoints: 3 });
  await world.startRace();

  await world.enter(1);
  await world.enterUnanswered(3);
  await world.enter(2);
  await world.enter(3);
  expect((await world.enter(0)).ok()).toBe(true);

  expect(await granted(world)).toContain("Never Give Up");
});

test("a clean race doesn't earn Never Give Up", async ({ world }) => {
  await world.seed({ checkpoints: 2 });
  await world.startRace();

  await world.enter(1);
  await world.enter(2);
  await world.enter(0);

  expect(await granted(world)).not.toContain("Never Give Up");
});

test("a race over two minutes earns Slow & Steady, not Speed Demon", async ({ world }) => {
  await seedFinishingRun(world, { startedAgo: 125_000, highScore: "00:20:00" });

  expect((await world.enter(0)).ok()).toBe(true);

  const badges = await granted(world);
  expect(badges).toContain("Slow & Steady");
  expect(badges).not.toContain("Speed Demon");
  expect(badges).not.toContain("Race Rookie"); // not the first finish
  expect((await world.progress()).elapsedTime).toMatch(/^02:0\d:\d{2}$/);
});

test("the 100th finished race earns Race Pro", async ({ world }) => {
  test.fail(true, "EXP-441: Race Pro/Expert are checked after racesCompleted was already incremented");
  await seedFinishingRun(world, { racesCompleted: 99, highScore: "00:01:00" });

  await world.enter(0);

  expect((await world.visitorData()).racesCompleted).toBe(100);
  expect(await granted(world)).toContain("Race Pro");
});

test("the 99th finished race doesn't earn Race Pro yet", async ({ world }) => {
  test.fail(true, "EXP-441: Race Pro/Expert are checked after racesCompleted was already incremented");
  await seedFinishingRun(world, { racesCompleted: 98, highScore: "00:01:00" });

  await world.enter(0);

  expect((await world.visitorData()).racesCompleted).toBe(99);
  expect(await granted(world)).not.toContain("Race Pro");
});

test("finishing a track with its own badge earns that badge", async ({ world }) => {
  await seedFinishingRun(world, { trackName: "Beach Track", highScore: "00:01:00" });

  await world.enter(0);

  expect(await granted(world)).toContain("Beach Track");
});

test("Top 3 Racer needs a top-3 time, and owned badges aren't granted again", async ({ world }) => {
  await seedFinishingRun(world, {
    badges: ["Speed Demon"],
    leaderboard: { a: "A|00:00:01", b: "B|00:00:02", c: "C|00:00:03" },
  });

  await world.enter(0);

  expect((await granted(world)).sort()).toEqual(["Race Rookie"]);
  expect((await world.sceneData()).leaderboard[world.profileId]).toMatch(/^E2E Player\|00:0[5-9]:\d{2}$/);
});
