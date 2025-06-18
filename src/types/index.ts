// Team entity
export interface Team {
  id?: number;
  name: string;
  venue: string;
  schedule: {
    dayOfWeek: number; // 0-6, where 0 is Sunday
    timeStart: string; // HH:MM format
    timeEnd: string; // HH:MM format
  };
  startDate: Date;
  endDate?: Date;
  createdAt?: Date;
}

// Player entity
export interface Player {
  id?: number;
  name: string;
  teamId: number;
  gender: 'male' | 'female';
  joinDate: Date;
  leaveDate?: Date;
}

// Match entity
export interface Match {
  id?: number;
  date: Date;
  homeTeamId: number;
  awayTeamId: number;
  venue: string;
  season: string; // e.g., "2024/2025"
  completed: boolean;
  homeTeam?: Team;
  awayTeam?: Team;
}

// Player performance in a match
export interface PlayerPerformance {
  id?: number;
  matchId: number;
  playerId: number;
  teamId: number;
  opponentId: number; // The opposing player
  position: number; // Player's position in the team (1-4)
  full: number; // Total pins in "full"
  spare: number; // Total pins in "spare"
  errors: number; // Total errors
  totalPins: number; // Total pins knocked down
  points: number; // Points earned in duel (0, 1, or 2)
}

// Team performance in a match
export interface TeamPerformance {
  id?: number;
  matchId: number;
  teamId: number;
  totalPins: number; // Total pins knocked down by the team
  points: number; // Match points (0, 1, or 2)
  auxiliaryPoints: number; // Total auxiliary points (player duels + team total)
}

// Standing entry in the league table
export interface Standing {
  teamId: number;
  teamName: string;
  season: string;
  matchesPlayed: number;
  points: number; // Match points (2 for win, 1 for draw)
  auxiliaryPoints: number; // Total auxiliary points
  lostPoints: number; // Theoretical max - achieved
  totalPins: number;
  avgPins: number;
  rank: number;
}

// Player statistics
export interface PlayerStat {
  playerId: number;
  playerName: string;
  teamName: string;
  gender: 'male' | 'female';
  season: string;
  gamesPlayed: number;
  maxTotal: number;
  avgTotal: number;
  maxFulls: number;
  avgFulls: number;
  maxSpares: number;
  avgSpares: number;
  maxErrors: number;
  avgErrors: number;
}

// Match player selection
export interface MatchPlayerSelection {
  playerId: number;
  position: number; // 1-4 position in the team
  teamId: number;
}

// Season entity
export interface Season {
  id?: number;
  name: string; // e.g., "2024/2025"
  startDate: Date;
  endDate: Date;
  active: boolean;
}

// Player history record
export interface PlayerHistory {
  id?: number;
  playerId: number;
  teamId: number;
  joinDate: Date;
  leaveDate?: Date;
}

// User role
export type UserRole = 'admin' | 'manager' | 'reader';

// Local user entity for IndexedDB
export interface LocalUser {
  id?: number;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}