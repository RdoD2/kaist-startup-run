'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DeathCard } from '../../components/DeathCard/DeathCard';
import { usePlayer } from '../../hooks/usePlayer';
import { startGame, submitScore, type StartGameResponse } from '../../lib/api';
import type { SubmitScoreResult } from '../../lib/types';
import type { GameOverResult } from '../../game';

const GameCanvas = dynamic(() => import('../../components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <p className="font-pixel text-[16px] text-ink-5 animate-pulse">
        LOADING GAME...
      </p>
    </div>
  ),
});

type PlayState =
  | { phase: 'loading' }
  | { phase: 'interstitial'; session: StartGameResponse }
  | { phase: 'playing'; session: StartGameResponse }
  | { phase: 'dead'; result: GameOverResult; submitResult: SubmitScoreResult };

function fallbackSession(): StartGameResponse {
  return {
    game_session_id: `fallback-${Date.now()}`,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
}

export default function PlayPage() {
  const router = useRouter();
  const { isVerified } = usePlayer();
  const [state, setState] = useState<PlayState>({ phase: 'loading' });

  useEffect(() => {
    if (!isVerified) {
      router.replace('/register/step1');
    }
  }, [isVerified, router]);

  useEffect(() => {
    if (!isVerified) return;
    let cancelled = false;

    startGame()
      .then((session) => {
        if (!cancelled) setState({ phase: 'interstitial', session });
      })
      .catch((e) => {
        console.error('[play] startGame failed:', e);
        if (!cancelled) {
          setState({ phase: 'interstitial', session: fallbackSession() });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isVerified]);

  // 인터스티셜 → 400ms 후 playing
  useEffect(() => {
    if (state.phase !== 'interstitial') return;
    const t = setTimeout(() => {
      setState((s) => (s.phase === 'interstitial' ? { phase: 'playing', session: s.session } : s));
    }, 400);
    return () => clearTimeout(t);
  }, [state.phase]);

  const handleGameOver = useCallback(
    async (result: GameOverResult) => {
      if (state.phase !== 'playing') return;
      const { session } = state;

      let submitResult: SubmitScoreResult = {
        accepted: false,
        new_best: false,
      };
      try {
        submitResult = await submitScore({
          game_session_id: session.game_session_id,
          score: result.score,
          duration_ms: result.durationMs,
          death_cause: result.deathCause,
          milestones: result.milestones,
        });
      } catch (e) {
        console.error('[play] submitScore failed:', e);
        submitResult = {
          accepted: false,
          new_best: false,
          reason: '이상하게 빨라. 다시 한번?',
        };
      }

      setState({ phase: 'dead', result, submitResult });
    },
    [state],
  );

  const handlePlayAgain = useCallback(() => {
    setState({ phase: 'loading' });
    startGame()
      .then((session) => setState({ phase: 'interstitial', session }))
      .catch((e) => {
        console.error('[play] restart failed:', e);
        setState({ phase: 'interstitial', session: fallbackSession() });
      });
  }, []);

  if (state.phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-ink-0 flex items-center justify-center">
        <p className="font-pixel text-[16px] text-ink-5 animate-pulse">
          LOADING...
        </p>
      </div>
    );
  }

  if (state.phase === 'interstitial') {
    return (
      <div className="fixed inset-0 bg-ink-0 flex items-center justify-center">
        <p className="font-kor text-[24px] text-ink-7 animate-pulse">
          창업 시작합니다…
        </p>
      </div>
    );
  }

  if (state.phase === 'dead') {
    const { result, submitResult } = state;
    return (
      <DeathCard
        score={result.score}
        deathCause={result.deathCause}
        tickets={submitResult.tickets ?? result.score}
        ticketDelta={submitResult.new_best ? result.score : 0}
        dailyRank={submitResult.current_rank}
        totalRank={submitResult.current_rank}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-ink-0">
      <GameCanvas
        sessionId={state.session.game_session_id}
        onGameOver={handleGameOver}
      />
    </div>
  );
}
