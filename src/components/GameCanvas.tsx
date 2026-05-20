'use client';

// =====================================================================
// STARTUP RUN — GameCanvas React 컴포넌트
// Phaser는 SSR 불가 → useEffect 내부에서 dynamic import
// =====================================================================

import { useEffect, useRef } from 'react';
import type { GameOverResult } from '@/game/index';

export type { GameOverResult };

export type GameCanvasProps = {
  /** 현재 게임 세션 ID (UI 레이어가 채워줌, 빈 문자열 허용) */
  sessionId: string;
  /** 게임 종료 시 호출되는 콜백 */
  onGameOver: (result: GameOverResult) => void;
  /** 추가 CSS 클래스 */
  className?: string;
};

/**
 * Phaser 게임 캔버스를 마운트하는 React 컴포넌트.
 *
 * Props:
 *   sessionId:   string                          — 세션 ID (빈 문자열 OK)
 *   onGameOver:  (result: GameOverResult) => void — 종료 콜백
 *   className?:  string                           — 추가 CSS
 *
 * GameOverResult 구조:
 *   {
 *     score:      number;
 *     durationMs: number;
 *     deathCause: DeathCause;
 *     milestones: { 100: boolean; 365: boolean; 1000: boolean };
 *     sessionId:  string;
 *   }
 */
export default function GameCanvas({
  sessionId,
  onGameOver,
  className,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // destroy 함수를 ref로 보관 (클로저 최신 값 유지)
  const destroyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let cancelled = false;

    // Phaser는 SSR에서 window를 참조하므로 useEffect 내부에서 동적 import
    void (async () => {
      const { startGame } = await import('@/game/index');
      if (cancelled) return;

      const { destroy } = startGame(container, sessionId, onGameOver);
      destroyRef.current = destroy;
    })();

    return () => {
      cancelled = true;
      if (destroyRef.current) {
        destroyRef.current();
        destroyRef.current = null;
      }
    };
    // sessionId / onGameOver 변경 시 게임 재시작하지 않음
    // 의도적: 게임 도중 props 변경은 없음 (한 판 = 한 마운트)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100dvw',
        height: '100dvh',
        margin: 0,
        overflow: 'hidden',
        imageRendering: 'pixelated',
        background: '#000',
        touchAction: 'none',
      }}
    />
  );
}
