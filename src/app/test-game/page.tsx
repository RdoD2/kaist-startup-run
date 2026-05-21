'use client';
// =====================================================================
// /test-game — 등록 우회 게임 테스트 페이지
// 게임만 격리해서 동작 확인하는 용도. 프로덕션 배포 전 제거 가능.
// =====================================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { GameOverResult } from '../../game';
import { pickDeathCopy } from '../../lib/deathCopy';
import { GRAVITY_URL, REPLAY_LOCK_MS } from '../../lib/constants';

const GameCanvas = dynamic(() => import('../../components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-ink-0">
      <p className="font-pixel text-[16px] text-ink-5 animate-pulse">
        LOADING GAME...
      </p>
    </div>
  ),
});

export default function TestGamePage() {
  const [result, setResult] = useState<GameOverResult | null>(null);
  const [runId, setRunId] = useState(0);

  const handleGameOver = useCallback((r: GameOverResult) => {
    setResult(r);
  }, []);

  const deathCopy = useMemo(
    () => (result ? pickDeathCopy(result.deathCause) : ''),
    [result],
  );

  // REPLAY 잠금 + Gravity 홍보 슬라이드
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(REPLAY_LOCK_MS / 1000),
  );
  const replayReady = secondsLeft <= 0;

  useEffect(() => {
    if (!result) return;
    setSecondsLeft(Math.ceil(REPLAY_LOCK_MS / 1000));
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  if (result) {
    return (
      <div className="min-h-screen bg-ink-0 flex flex-col items-center justify-center gap-6 max-w-[360px] mx-auto px-6">
        <h1 className="font-pixel text-[24px] text-ink-8 tracking-widest">
          GAME OVER
        </h1>
        <div className="flex flex-col gap-2 text-center">
          <p className="font-kor text-[20px] text-ink-7">
            창업 {result.score}일차
          </p>
          <p className="font-kor text-[18px] text-ink-6 leading-relaxed">
            {deathCopy}
          </p>
          <p className="font-kor text-[16px] text-ink-5">
            플레이 시간: {(result.durationMs / 1000).toFixed(1)}s
          </p>
        </div>

        {/* Gravity 홍보 — 3초 후 스으윽 슬라이드 다운 */}
        <a
          href={GRAVITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden w-full"
          style={{
            maxHeight: replayReady ? '220px' : '0px',
            opacity: replayReady ? 1 : 0,
            transition:
              'max-height 500ms ease-out, opacity 400ms ease-out 100ms',
            pointerEvents: replayReady ? 'auto' : 'none',
          }}
        >
          <div className="border-2 border-kaist bg-kaist px-4 py-5 flex flex-col gap-2 pixel-shadow text-center">
            <p className="font-pixel text-[18px] text-ink-10 tracking-widest">
              GRAVITY 2026
            </p>
            <p className="font-kor text-[18px] text-ink-7 leading-relaxed">
              KAIST 창업의 중력, 그래비티.
              <br />
              너의 창업도 여기서 시작돼.
            </p>
            <p className="font-pixel text-[14px] text-ink-15">
              gravity2026.io 바로가기 &gt;
            </p>
          </div>
        </a>

        <button
          className="btn-pixel font-pixel text-[18px] mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!replayReady}
          onClick={() => {
            setResult(null);
            setRunId((n) => n + 1);
          }}
        >
          {replayReady ? 'REPLAY' : `REPLAY (${secondsLeft})`}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-ink-0">
      <GameCanvas
        key={runId}
        sessionId={`test-${runId}`}
        onGameOver={handleGameOver}
      />
    </div>
  );
}
