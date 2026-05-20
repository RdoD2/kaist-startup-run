// =====================================================================
// STARTUP RUN — shared constants
// 모든 게임 메커니즘 캘리브레이션 수치는 여기서 단일 출처로 관리.
// =====================================================================

export const PALETTE = {
  ink0: 0x000000,
  ink1: 0x1d2b53,
  ink2: 0x7e2553,
  ink3: 0x008751,
  ink4: 0xab5236,
  ink5: 0x5f574f,
  ink6: 0xc2c3c7,
  ink7: 0xfff1e8,
  ink8: 0xff004d,
  ink9: 0xffa300,
  ink10: 0xffec27,
  ink11: 0x00e436,
  ink12: 0x29adff,
  ink13: 0x83769c,
  ink14: 0xff77a8,
  ink15: 0xffccaa,
  kaist: 0x003875,
} as const;

// 모바일 세로 캔버스 (논리적 해상도) — CSS로 풀스크린 스케일
export const CANVAS = {
  width: 360,
  height: 640,
  groundY: 580,       // 바닥 더 아래로 (점프 헤드룸↑)
  playerX: 90,
  playerW: 22,
  playerH: 32,
  playerDuckH: 18,
} as const;

export const MECHANICS = {
  // 속도 — 처음엔 천천히, 점진적으로 빨라짐
  startSpeed: 220,        // px/s — 시작 천천히
  speedRamp: 1.5,         // px/s² — 부드러운 가속
  speedCap: 860,
  milestoneBoost: { 100: 30, 365: 60, 1000: 100 },
  pxPerDay: 200,
  milestoneBonus: { 100: 50, 365: 200, 1000: 1000 },
  bossClearBonus: 100,
  // 장애물 간격 — 부드러운 곡선(power 1.5), 0일 3000ms → 800일 500ms
  obstacleInterval: {
    startMs: 3000,
    endMs: 500,
    endScore: 800,
    minimum: 450,
  },
  // 점프 — 살짝 높이 + 무거운 중력 (펀치감)
  jumpVelocity: -620,
  gravityY: 2400,
  boss: {
    triggerDays: [95, 360, 990],
    warningMs: 3000,
    patternMs: 5000,
  },
} as const;

export const DEATH_CAUSES = [
  'investor_pass',
  'burnout',
  'cofounder_left',
  'competitor',
  'lawsuit',
  'pivot_fail',
  'demo_day',
  'cash_dry',
  'regulation',
  'product_fail',
] as const;
export type DeathCause = (typeof DEATH_CAUSES)[number];

export const PRIZES = [
  { id: 'mac-mini', label: '맥미니', qty: 1 },
  { id: 'vesta', label: '베스타 2인 식사권', qty: 3 },
  { id: 'pulio', label: '풀리오 다리마사지기', qty: 3 },
  { id: 'baemin', label: '배민상품권 1만원', qty: 30 },
] as const;

export const STORAGE_KEYS = {
  anonToken: 'startup_run:anon_token',
  playerCache: 'startup_run:player_cache',
  lastSeenAt: 'startup_run:last_seen_at',
  soundEnabled: 'startup_run:sound_enabled',
} as const;

export const OFFICIAL_URL =
  process.env.NEXT_PUBLIC_OFFICIAL_URL ?? 'https://example.com';

// 대회 마감일 — 환경변수로 override 가능, 기본은 placeholder
// 대회 측 확정 시 .env.local의 NEXT_PUBLIC_CAMPAIGN_DEADLINE 또는 이 값 교체
export const CAMPAIGN_DEADLINE =
  process.env.NEXT_PUBLIC_CAMPAIGN_DEADLINE ?? '2026-12-31T23:59:59+09:00';
