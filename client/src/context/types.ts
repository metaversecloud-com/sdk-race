import { LeaderboardEntry, Track, VisitorInventory, BadgeRecord } from "../../../shared/types/index.js";

export const SET_ERROR = "SET_ERROR";
export const LOAD_GAME_STATE = "LOAD_GAME_STATE";
export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const START_RACE = "START_RACE";
export const COMPLETE_RACE = "COMPLETE_RACE";
export const CANCEL_RACE = "CANCEL_RACE";
export const RESET_GAME = "RESET_GAME";
export const SET_VISITOR_INVENTORY = "SET_VISITOR_INVENTORY";
export const SET_SCENE_DATA = "SET_SCENE_DATA";
export const SET_LEADERBOARD = "SET_LEADERBOARD";
export const SCREEN_MANAGER = {
  SHOW_HOME_SCREEN: "SHOW_HOME_SCREEN",
  SHOW_LEADERBOARD_SCREEN: "SHOW_LEADERBOARD_SCREEN",
  SHOW_BADGES_SCREEN: "SHOW_BADGES_SCREEN",
  SHOW_SWITCH_TRACK_SCREEN: "SHOW_SWITCH_TRACK_SCREEN",
  SHOW_ON_YOUR_MARK_SCREEN: "SHOW_ON_YOUR_MARK_SCREEN",
  SHOW_RACE_IN_PROGRESS_SCREEN: "SHOW_RACE_IN_PROGRESS_SCREEN",
  SHOW_RACE_COMPLETED_SCREEN: "SHOW_RACE_COMPLETED_SCREEN",
} as const;

export type ScreenManagerValue = (typeof SCREEN_MANAGER)[keyof typeof SCREEN_MANAGER];

export interface InteractiveParams {
  assetId: string;
  displayName: string;
  identityId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: number;
}

export interface InitialState {
  hasInteractiveParams: boolean;
  selectedWorld: Record<string, any>;
  urlSlug: string;
  showOnYourMarkScreen: boolean;
  screenManager: ScreenManagerValue;
  tracks: Track[];
  checkpoints?: Record<number, boolean>;
  checkpointsCompleted?: Record<number, boolean>;
  startTimestamp?: number | null;
  elapsedTime?: string | null;
  elapsedTimeInSeconds?: number;
  highScore?: string | null;
  isAdmin?: boolean;
  leaderboard?: LeaderboardEntry[];
  numberOfCheckpoints?: number;
  raceStarted?: boolean;
  visitorInventory?: VisitorInventory;
  badges?: BadgeRecord;
  lastRaceStartedDate?: number | null;
  error?: string;
  [key: string]: any;
}

export interface ActionType {
  type: string;
  payload?: any;
}
