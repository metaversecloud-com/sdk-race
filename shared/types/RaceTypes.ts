export interface VisitorProgress {
  checkpoints: Record<number, boolean>;
  elapsedTime: string | null;
  highScore: string | null;
  startTimestamp: number | null;
}

export interface SceneData {
  numberOfCheckpoints: number;
  leaderboard: Record<string, string>;
  trackName?: string;
  position?: { x: number; y: number };
  lastRaceStartedDate?: number | null;
  profiles?: Record<string, { username: string; highscore: string }>;
}

export interface LeaderboardEntry {
  displayName: string;
  highScore: string;
}

export interface Track {
  id: number;
  name: string;
  thumbnail: string;
  sceneId: string;
}

export interface BadgeRecord {
  [name: string]: { id: string; name: string; icon: string; description: string };
}

export interface VisitorInventory {
  [name: string]: { id: string; icon: string; name: string };
}
