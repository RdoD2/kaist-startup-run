// =====================================================================
// STARTUP RUN — 장애물 정의 + 패턴 풀 (v5: 라벨 명확화 + 3종 추가)
// 15종, 전부 사망 트리거.
// =====================================================================

import { PALETTE, type DeathCause } from '@/lib/constants';

export type ObstacleType =
  | 'investor_pass'
  | 'burnout'
  | 'cofounder_left'
  | 'pivot'
  | 'rent_due'
  | 'product_bug'
  | 'regulation'
  | 'office_drama'
  | 'domain_expired';

export type ObstacleAction = 'jump' | 'duck';

export type ObstacleDef = {
  type: ObstacleType;
  action: ObstacleAction;
  label: string;
  color: number;
  width: number;
  height: number;
  offsetY: number;
  deathCause: DeathCause;
};

export const OBSTACLE_DEFS: Record<ObstacleType, ObstacleDef> = {
  // ── 점프류 ────────────────────────────────────────────
  investor_pass: {
    type: 'investor_pass',
    action: 'jump',
    label: 'VC의 거절',
    color: PALETTE.ink8,
    width: 32,
    height: 46,
    offsetY: 0,
    deathCause: 'investor_pass',
  },
  burnout: {
    type: 'burnout',
    action: 'jump',
    label: '주말의 번아웃',
    color: PALETTE.ink2,
    width: 38,
    height: 52,
    offsetY: 0,
    deathCause: 'burnout',
  },
  cofounder_left: {
    type: 'cofounder_left',
    action: 'jump',
    label: '코파운더의 잠적',
    color: PALETTE.ink4,
    width: 50,
    height: 64,
    offsetY: 0,
    deathCause: 'cofounder_left',
  },
  pivot: {
    type: 'pivot',
    action: 'jump',
    label: '또 다른 피봇',
    color: PALETTE.ink10,
    width: 32,
    height: 54,
    offsetY: 0,
    deathCause: 'pivot_fail',
  },
  rent_due: {
    type: 'rent_due',
    action: 'jump',
    label: '밀린 월세',
    color: PALETTE.ink6,
    width: 42,
    height: 52,
    offsetY: 0,
    deathCause: 'cash_dry',
  },
  product_bug: {
    type: 'product_bug',
    action: 'jump',
    label: '치명적 버그',
    color: PALETTE.ink14,
    width: 26,
    height: 36,
    offsetY: 0,
    deathCause: 'product_fail',
  },
  regulation: {
    type: 'regulation',
    action: 'jump',
    label: '갑작스런 규제',
    color: PALETTE.ink3,
    width: 46,
    height: 68,
    offsetY: 0,
    deathCause: 'regulation',
  },
  office_drama: {
    type: 'office_drama',
    action: 'jump',
    label: '지분 다툼',
    color: PALETTE.ink13,
    width: 46,
    height: 56,
    offsetY: 0,
    deathCause: 'cofounder_left',
  },
  domain_expired: {
    type: 'domain_expired',
    action: 'jump',
    label: '만료된 도메인',
    color: PALETTE.ink5,
    width: 36,
    height: 48,
    offsetY: 0,
    deathCause: 'cash_dry',
  },
};

// =====================================================================
// 패턴 풀
// =====================================================================

export type ObstaclePattern = {
  name: string;
  sequence: ObstacleType[];
  innerGapMs?: number;
};

export const OBSTACLE_PATTERNS: ObstaclePattern[] = [
  // 단일 (9종)
  { name: 'investor_pass', sequence: ['investor_pass'] },
  { name: 'burnout', sequence: ['burnout'] },
  { name: 'cofounder', sequence: ['cofounder_left'] },
  { name: 'pivot', sequence: ['pivot'] },
  { name: 'rent_due', sequence: ['rent_due'] },
  { name: 'product_bug', sequence: ['product_bug'] },
  { name: 'regulation', sequence: ['regulation'] },
  { name: 'office_drama', sequence: ['office_drama'] },
  { name: 'domain_expired', sequence: ['domain_expired'] },
  // 더블 점프
  { name: 'double_a', sequence: ['investor_pass', 'burnout'], innerGapMs: 340 },
  { name: 'double_b', sequence: ['rent_due', 'product_bug'], innerGapMs: 320 },
  { name: 'double_c', sequence: ['investor_pass', 'rent_due'], innerGapMs: 360 },
  { name: 'double_d', sequence: ['domain_expired', 'product_bug'], innerGapMs: 320 },
  { name: 'double_e', sequence: ['burnout', 'pivot'], innerGapMs: 340 },
  { name: 'double_f', sequence: ['office_drama', 'rent_due'], innerGapMs: 360 },
  // 트리플
  { name: 'triple_a', sequence: ['investor_pass', 'product_bug', 'burnout'], innerGapMs: 300 },
  { name: 'triple_b', sequence: ['burnout', 'rent_due', 'pivot'], innerGapMs: 340 },
  { name: 'triple_c', sequence: ['rent_due', 'domain_expired', 'product_bug'], innerGapMs: 320 },
  { name: 'triple_d', sequence: ['investor_pass', 'office_drama', 'regulation'], innerGapMs: 360 },
];

export const BOSS_SEQUENCE: ObstacleType[] = [
  'cofounder_left',
  'burnout',
  'regulation',
  'office_drama',
  'investor_pass',
];

// 점수별 허용 콤보 길이 — 초반엔 단일만, 점차 콤보 해금
//   < 150일: 단일 장애물만 (겹침/콤보 없음, 학습 구간)
//   < 400일: 단일 + 더블까지
//   >= 400일: 트리플 포함 전체
function maxSequenceLenForScore(score: number): number {
  if (score < 150) return 1;
  if (score < 400) return 2;
  return 3;
}

export function pickRandomPattern(score = 0): ObstaclePattern {
  const maxLen = maxSequenceLenForScore(score);
  const allowed = OBSTACLE_PATTERNS.filter((p) => p.sequence.length <= maxLen);
  const pool = allowed.length > 0 ? allowed : OBSTACLE_PATTERNS;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx]!;
}
