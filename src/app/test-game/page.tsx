'use client';
// =====================================================================
// /test-game — 등록 우회 게임 테스트 페이지
// 게임만 격리해서 동작 확인하는 용도. 프로덕션 배포 전 제거 가능.
// =====================================================================

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { GameOverResult } from '../../game';
import { pickDeathCopy } from '../../lib/deathCopy';

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
        <button
          className="btn-pixel font-pixel text-[18px] mt-6"
          onClick={() => {
            setResult(null);
            setRunId((n) => n + 1);
          }}
        >
          REPLAY
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
