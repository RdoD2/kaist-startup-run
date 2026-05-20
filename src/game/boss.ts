// =====================================================================
// STARTUP RUN — 데모데이 보스 패턴
// 트리거: 95/360/990일 직전 5초 일반 패턴 중지 → warningMs → patternMs
// =====================================================================

import { MECHANICS } from '@/lib/constants';
import { BOSS_SEQUENCE, type ObstacleType } from './obstacles';

export type BossPhase =
  | 'idle'        // 비활성
  | 'freeze'      // 일반 패턴 정지 (5초)
  | 'warning'     // "DEMO DAY IN ▮▮▮" 경고 (3초)
  | 'pattern'     // 보스 패턴 진행 (5초)
  | 'cleared'     // 클리어
  | 'failed';     // 실패(사망)

export type BossState = {
  phase: BossPhase;
  timerMs: number;          // 현재 페이즈 남은 시간
  spawnQueue: ObstacleType[]; // 패턴 스폰 대기열
  nextSpawnMs: number;      // 다음 장애물 스폰까지 남은 ms
  triggerIndex: number;     // 몇 번째 보스인지 (0/1/2)
};

// 일반 패턴 정지 시작은 triggerDay 이전 5초 동안
const FREEZE_DURATION_MS = 5000;
// 보스 패턴 내 장애물 간격
const BOSS_INNER_GAP_MS = 600;

export class BossManager {
  private state: BossState = {
    phase: 'idle',
    timerMs: 0,
    spawnQueue: [],
    nextSpawnMs: 0,
    triggerIndex: 0,
  };

  // 아직 발동하지 않은 보스 트리거 인덱스
  private pendingTriggerIdx: number = 0;

  // 마지막으로 시작한 triggerDay
  private activeTriggerDay: number = 0;

  get phase(): BossPhase {
    return this.state.phase;
  }

  get isActive(): boolean {
    return (
      this.state.phase === 'freeze' ||
      this.state.phase === 'warning' ||
      this.state.phase === 'pattern'
    );
  }

  get isFreezeOrWarning(): boolean {
    return this.state.phase === 'freeze' || this.state.phase === 'warning';
  }

  // 경고 텍스트 (warning 페이즈에서 사용)
  get warningText(): string {
    const blocks = Math.ceil(
      (this.state.timerMs / MECHANICS.boss.warningMs) * 3,
    );
    const bar = '▮'.repeat(Math.max(0, blocks));
    return `DEMO DAY IN ${bar}`;
  }

  // 매 프레임 업데이트
  // day: 현재 게임 일수
  // deltaMs: 프레임 delta
  // onSpawn: 장애물 스폰 콜백
  // onCleared: 클리어 콜백
  update(
    day: number,
    deltaMs: number,
    onSpawn: (type: ObstacleType) => void,
    onCleared: () => void,
  ): void {
    // idle 상태에서 트리거 체크
    if (this.state.phase === 'idle') {
      this.checkTrigger(day);
      return;
    }

    this.state.timerMs -= deltaMs;

    switch (this.state.phase) {
      case 'freeze':
        if (this.state.timerMs <= 0) {
          this.enterWarning();
        }
        break;

      case 'warning':
        if (this.state.timerMs <= 0) {
          this.enterPattern();
        }
        break;

      case 'pattern':
        // 장애물 스폰 타이밍
        this.state.nextSpawnMs -= deltaMs;
        if (
          this.state.nextSpawnMs <= 0 &&
          this.state.spawnQueue.length > 0
        ) {
          const next = this.state.spawnQueue.shift()!;
          onSpawn(next);
          this.state.nextSpawnMs = BOSS_INNER_GAP_MS;
        }

        // 패턴 시간 끝 → 클리어
        if (this.state.timerMs <= 0) {
          this.state.phase = 'cleared';
          onCleared();
        }
        break;

      default:
        break;
    }
  }

  // 보스 실패 (사망 시 외부에서 호출)
  markFailed(): void {
    this.state.phase = 'failed';
  }

  // 클리어/실패 후 idle로 복귀 (GameScene 리셋 시 사용)
  reset(): void {
    this.state = {
      phase: 'idle',
      timerMs: 0,
      spawnQueue: [],
      nextSpawnMs: 0,
      triggerIndex: 0,
    };
    this.pendingTriggerIdx = 0;
    this.activeTriggerDay = 0;
  }

  private checkTrigger(day: number): void {
    const triggers = MECHANICS.boss.triggerDays;
    if (this.pendingTriggerIdx >= triggers.length) return;

    const triggerDay = triggers[this.pendingTriggerIdx]!;
    // triggerDay 5초 전 = 거리 기준이 아니라 일수 기준으로 근사
    // "직전 5초" → triggerDay - 5 지나면 freeze 시작
    // (1일=200px, 시작속도~280px/s → 1일≈0.7s, 정밀하지 않지만 근사)
    const freezeStartDay = triggerDay - 5; // 보스 5일 전 freeze (더 직관적)
    if (day >= freezeStartDay) {
      this.activeTriggerDay = triggerDay;
      this.enterFreeze();
      this.state.triggerIndex = this.pendingTriggerIdx;
      this.pendingTriggerIdx += 1;
    }
  }

  private enterFreeze(): void {
    this.state.phase = 'freeze';
    this.state.timerMs = FREEZE_DURATION_MS;
  }

  private enterWarning(): void {
    this.state.phase = 'warning';
    this.state.timerMs = MECHANICS.boss.warningMs;
  }

  private enterPattern(): void {
    this.state.phase = 'pattern';
    this.state.timerMs = MECHANICS.boss.patternMs;
    // 보스 시퀀스 복사
    this.state.spawnQueue = [...BOSS_SEQUENCE];
    this.state.nextSpawnMs = 200; // 첫 스폰은 약간 뒤에
  }

  get activeTrigger(): number {
    return this.activeTriggerDay;
  }
}
