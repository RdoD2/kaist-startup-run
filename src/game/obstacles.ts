// =====================================================================
// STARTUP RUN — 장애물 정의 + 패턴 풀 (v5: 라벨 명확화 + 3종 추가)
// 15종, 전부 사망 트리거.
// =====================================================================

import { PALETTE, type DeathCause } from '@/lib/constants';

export type ObstacleType =
  | 'investor_pass'
  | 'burnout'
  | 'cofounder_left'
  | 'competitor'
  | 'lawsuit'
  | 'pivot'
  | 'rent_due'
  | 'tax_audit'
  | 'product_bug'
  | 'aws_bill'
  | 'regulation'
  | 'office_drama'
  | 'claude_bill'
  | 'domain_expired'
  | 'press_leak';

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
  // ── 숙이기류 ───────────────────────────────────────────
  competitor: {
    type: 'competitor',
    action: 'duck',
    label: 'YC의 카피캣',
    color: PALETTE.ink12,
    width: 56,
    height: 22,
    offsetY: 22,
    deathCause: 'competitor',
  },
  lawsuit: {
    type: 'lawsuit',
    action: 'duck',
    label: '동료의 고소장',
    color: PALETTE.ink9,
    width: 46,
    height: 26,
    offsetY: 20,
    deathCause: 'lawsuit',
  },
  tax_audit: {
    type: 'tax_audit',
    action: 'duck',
    label: '국세청 출장',
    color: PALETTE.ink10,
    width: 42,
    height: 24,
    offsetY: 20,
    deathCause: 'regulation',
  },
  aws_bill: {
    type: 'aws_bill',
    action: 'duck',
    label: '미납된 AWS 비용',
    color: PALETTE.ink11,
    width: 52,
    height: 22,
    offsetY: 22,
    deathCause: 'cash_dry',
  },
  claude_bill: {
    type: 'claude_bill',
    action: 'duck',
    label: '미친 Claude 비용',
    color: PALETTE.ink14,
    width: 54,
    height: 22,
    offsetY: 22,
    deathCause: 'cash_dry',
  },
  press_leak: {
    type: 'press_leak',
    action: 'duck',
    label: '익명 제보 폭로',
    color: PALETTE.ink15,
    width: 48,
    height: 24,
    offsetY: 20,
    deathCause: 'product_fail',
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
  // 단일 (전 15종 골고루)
  { name: 'investor_pass', sequence: ['investor_pass'] },
  { name: 'burnout', sequence: ['burnout'] },
  { name: 'rent_due', sequence: ['rent_due'] },
  { name: 'product_bug', sequence: ['product_bug'] },
  { name: 'competitor', sequence: ['competitor'] },
  { name: 'lawsuit', sequence: ['lawsuit'] },
  { name: 'tax_audit', sequence: ['tax_audit'] },
  { name: 'aws_bill', sequence: ['aws_bill'] },
  { name: 'pivot', sequence: ['pivot'] },
  { name: 'office_drama', sequence: ['office_drama'] },
  { name: 'regulation', sequence: ['regulation'] },
  { name: 'cofounder', sequence: ['cofounder_left'] },
  { name: 'claude_bill', sequence: ['claude_bill'] },
  { name: 'domain_expired', sequence: ['domain_expired'] },
  { name: 'press_leak', sequence: ['press_leak'] },

  // 점프-숙이기 콤보
  { name: 'jump_duck_a', sequence: ['investor_pass', 'competitor'], innerGapMs: 420 },
  { name: 'jump_duck_b', sequence: ['burnout', 'lawsuit'], innerGapMs: 400 },
  { name: 'jump_duck_c', sequence: ['rent_due', 'tax_audit'], innerGapMs: 440 },
  { name: 'jump_duck_d', sequence: ['product_bug', 'aws_bill'], innerGapMs: 380 },
  { name: 'jump_duck_e', sequence: ['pivot', 'competitor'], innerGapMs: 450 },
  { name: 'jump_duck_f', sequence: ['domain_expired', 'claude_bill'], innerGapMs: 420 },
  { name: 'jump_duck_g', sequence: ['rent_due', 'press_leak'], innerGapMs: 440 },

  // 숙이기-점프
  { name: 'duck_jump_a', sequence: ['lawsuit', 'burnout'], innerGapMs: 400 },
  { name: 'duck_jump_b', sequence: ['competitor', 'investor_pass'], innerGapMs: 420 },
  { name: 'duck_jump_c', sequence: ['aws_bill', 'rent_due'], innerGapMs: 440 },
  { name: 'duck_jump_d', sequence: ['tax_audit', 'product_bug'], innerGapMs: 380 },
  { name: 'duck_jump_e', sequence: ['claude_bill', 'domain_expired'], innerGapMs: 420 },
  { name: 'duck_jump_f', sequence: ['press_leak', 'pivot'], innerGapMs: 460 },

  // 더블 점프
  { name: 'double_jump_a', sequence: ['investor_pass', 'burnout'], innerGapMs: 340 },
  { name: 'double_jump_b', sequence: ['rent_due', 'product_bug'], innerGapMs: 320 },
  { name: 'double_jump_c', sequence: ['investor_pass', 'rent_due'], innerGapMs: 360 },
  { name: 'double_jump_d', sequence: ['domain_expired', 'product_bug'], innerGapMs: 320 },

  // 더블 숙이기
  { name: 'double_duck_a', sequence: ['competitor', 'lawsuit'], innerGapMs: 320 },
  { name: 'double_duck_b', sequence: ['tax_audit', 'aws_bill'], innerGapMs: 340 },
  { name: 'double_duck_c', sequence: ['aws_bill', 'claude_bill'], innerGapMs: 320 },
  { name: 'double_duck_d', sequence: ['press_leak', 'lawsuit'], innerGapMs: 360 },

  // 트리플
  { name: 'triple_jump', sequence: ['investor_pass', 'product_bug', 'burnout'], innerGapMs: 300 },
  { name: 'triple_mix', sequence: ['burnout', 'competitor', 'rent_due'], innerGapMs: 360 },
  { name: 'triple_cash', sequence: ['rent_due', 'aws_bill', 'claude_bill'], innerGapMs: 380 },
];

export const BOSS_SEQUENCE: ObstacleType[] = [
  'competitor',
  'cofounder_left',
  'burnout',
  'regulation',
  'press_leak',
];

export function pickRandomPattern(): ObstaclePattern {
  const idx = Math.floor(Math.random() * OBSTACLE_PATTERNS.length);
  return OBSTACLE_PATTERNS[idx]!;
}
