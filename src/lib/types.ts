import type { DeathCause } from './constants';

export type Player = {
  id: string;
  anon_token: string;
  nickname: string | null;
  student_id: string | null;
  real_name: string | null;
  department: string | null;
  privacy_consent_at: string | null;
  registration_step: 0 | 1 | 2 | 3 | 4;
  is_verified: boolean;
  best_score: number;
  best_score_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Score = {
  id: string;
  player_id: string;
  game_session_id: string;
  score: number;
  duration_ms: number;
  death_reason: DeathCause;
  milestones: { 100?: boolean; 365?: boolean; 1000?: boolean };
  played_at: string;
};

export type GameSession = {
  id: string;
  player_id: string;
  started_at: string;
  expires_at: string;
  consumed: boolean;
};

export type LeaderboardEntry = {
  id: string;
  nickname: string;
  score: number;
  rank: number;
  best_score_at?: string | null;
  best_at?: string | null;
};

export type SubmitScoreResult = {
  accepted: boolean;
  new_best: boolean;
  current_rank?: number;
  tickets?: number;
  reason?: string;
};

export type RegistrationStep = 1 | 2 | 3 | 4;
