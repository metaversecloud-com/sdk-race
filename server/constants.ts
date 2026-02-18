import { Track, VisitorProgress } from "../shared/types/index.js";

export const ENCOURAGEMENT_MESSAGES = [
  "Keep going! 🏁",
  "You're doing great! 🌟",
  "Stay strong! 💪",
  "Keep pushing! 🔥",
  "Stay focused! 🚀",
] as const;

export const CHECKPOINT_NAMES = {
  START: "race-track-start",
} as const;

export const RACE_EVENTS = {
  CHECKPOINT_ENTERED: "checkpoint-entered",
} as const;

export const TOAST_GROUPS = {
  RACE: "race",
} as const;

export const TIME_FORMATS = {
  PERFECT: "00:00:00",
} as const;

export const ANALYTICS = {
  COMPLETIONS: "completions",
} as const;

export const TRACKS: Track[] = [
  {
    id: 1,
    name: "Missing env variables",
    thumbnail: "https://i.pinimg.com/originals/ee/db/19/eedb1919a7f5d003bb56a401f6b4a886.png",
    sceneId: "YCY9S4JpiIZswkQV8sx8",
  },
  {
    id: 2,
    name: "Example track",
    thumbnail: "https://i.pinimg.com/originals/ee/db/19/eedb1919a7f5d003bb56a401f6b4a886.png",
    sceneId: "oXghmgohNPuaICPA9Ne5",
  },
];

export const DEFAULT_PROGRESS: VisitorProgress = {
  checkpoints: { 0: false },
  elapsedTime: null,
  highScore: null,
  startTimestamp: null,
};
