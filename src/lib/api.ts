'use client';
// =====================================================================
// STARTUP RUN — Edge Function 호출 wrapper
// Edge Function 계약과 1:1 매칭. env 없으면 mock (localStorage 누적).
// =====================================================================

import type { Player, SubmitScoreResult, RegistrationStep } from './types';
import { STORAGE_KEYS, type DeathCause } from './constants';

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
  : null;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

const STORAGE_MOCK_PLAYER = 'startup_run:mock_player';

function isMock(): boolean {
  return !BASE_URL || !ANON_KEY;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getAnonToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.anonToken);
}

function setAnonToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.anonToken, token);
}

function readMockPlayer(): Player | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_MOCK_PLAYER);
    return raw ? (JSON.parse(raw) as Player) : null;
  } catch {
    return null;
  }
}

function writeMockPlayer(player: Player): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_MOCK_PLAYER, JSON.stringify(player));
}

function computeVerified(p: Player): boolean {
  return (
    !!p.nickname &&
    !!p.student_id &&
    !!p.real_name &&
    !!p.department &&
    !!p.privacy_consent_at
  );
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function edgeFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!BASE_URL || !ANON_KEY) {
    throw new ApiError('SUPABASE env vars not set', 0);
  }
  const token = getAnonToken();
  const res = await fetch(`${BASE_URL}/${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status);
  }
  return (await res.json()) as T;
}

// =====================================================================
// POST /register-player
// =====================================================================

export async function registerPlayer(nickname: string): Promise<Player> {
  if (isMock()) {
    const existing = readMockPlayer();
    if (existing) {
      // 이미 등록된 mock player가 있으면 닉네임만 갱신
      const next: Player = {
        ...existing,
        nickname,
        registration_step: Math.max(
          existing.registration_step,
          1,
        ) as RegistrationStep,
        updated_at: new Date().toISOString(),
      };
      next.is_verified = computeVerified(next);
      writeMockPlayer(next);
      setAnonToken(next.anon_token);
      return next;
    }
    const player: Player = {
      id: uuid(),
      anon_token: uuid(),
      nickname,
      student_id: null,
      real_name: null,
      department: null,
      privacy_consent_at: null,
      registration_step: 1,
      is_verified: false,
      best_score: 0,
      best_score_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    writeMockPlayer(player);
    setAnonToken(player.anon_token);
    return player;
  }
  const res = await edgeFetch<{ player_id: string; anon_token: string }>(
    'register-player',
    {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    },
  );
  setAnonToken(res.anon_token);
  // 서버는 최소 응답 — 클라이언트가 후속 update + cache 갱신을 통해 채움
  return {
    id: res.player_id,
    anon_token: res.anon_token,
    nickname,
    student_id: null,
    real_name: null,
    department: null,
    privacy_consent_at: null,
    registration_step: 1,
    is_verified: false,
    best_score: 0,
    best_score_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// =====================================================================
// PATCH /update-player
// =====================================================================

export type UpdatePlayerFields = {
  student_id?: string;
  real_name?: string;
  department?: string;
  privacy_consent?: true;
};

export async function updatePlayer(
  step: 2 | 3 | 4,
  fields: UpdatePlayerFields,
): Promise<Player> {
  if (isMock()) {
    const existing = readMockPlayer();
    if (!existing) {
      throw new ApiError('Mock: register player first', 401);
    }
    const merged: Player = { ...existing };
    if (fields.student_id !== undefined) merged.student_id = fields.student_id;
    if (fields.real_name !== undefined) merged.real_name = fields.real_name;
    if (fields.department !== undefined) merged.department = fields.department;
    if (fields.privacy_consent) {
      merged.privacy_consent_at = new Date().toISOString();
    }
    merged.registration_step = step as RegistrationStep;
    merged.updated_at = new Date().toISOString();
    merged.is_verified = computeVerified(merged);
    writeMockPlayer(merged);
    return merged;
  }
  const res = await edgeFetch<{ player: Player; is_verified: boolean }>(
    'update-player',
    {
      method: 'PATCH',
      body: JSON.stringify({ step, fields }),
    },
  );
  return res.player;
}

// =====================================================================
// POST /start-game
// =====================================================================

export type StartGameResponse = {
  game_session_id: string;
  expires_at: string;
};

export async function startGame(): Promise<StartGameResponse> {
  if (isMock()) {
    return {
      game_session_id: `mock-session-${uuid()}`,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
  }
  return edgeFetch<StartGameResponse>('start-game', { method: 'POST' });
}

// =====================================================================
// POST /submit-score
// =====================================================================

export type SubmitScorePayload = {
  game_session_id: string;
  score: number;
  duration_ms: number;
  death_cause: DeathCause;
  milestones: { 100: boolean; 365: boolean; 1000: boolean };
};

export async function submitScore(
  payload: SubmitScorePayload,
): Promise<SubmitScoreResult> {
  if (isMock()) {
    const existing = readMockPlayer();
    let new_best = false;
    let tickets = payload.score;
    if (existing) {
      tickets = Math.max(existing.best_score, payload.score);
      if (payload.score > existing.best_score) {
        const merged: Player = {
          ...existing,
          best_score: payload.score,
          best_score_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        writeMockPlayer(merged);
        new_best = true;
      }
    }
    return {
      accepted: true,
      new_best,
      current_rank: Math.floor(Math.random() * 50) + 1,
      tickets,
    };
  }
  return edgeFetch<SubmitScoreResult>('submit-score', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// =====================================================================
// GET /me
// =====================================================================

export type MeResponse = {
  player: Player;
  current_rank_daily?: number;
  current_rank_all?: number;
  tickets: number;
};

export async function getMe(): Promise<MeResponse | null> {
  if (isMock()) {
    const p = readMockPlayer();
    if (!p) return null;
    return {
      player: p,
      tickets: p.best_score,
    };
  }
  try {
    return await edgeFetch<MeResponse>('me');
  } catch {
    return null;
  }
}

export { ApiError };
