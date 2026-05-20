'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LeaderboardView } from '../../components/Leaderboard/LeaderboardView';
import { usePlayer } from '../../hooks/usePlayer';
import { PixelButton } from '../../components/ui/PixelButton';

export default function LeaderboardPage() {
  const router = useRouter();
  const { player } = usePlayer();

  return (
    <div className="min-h-screen bg-ink-0 max-w-[360px] mx-auto flex flex-col">
      {/* 상단 뒤로가기 */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <PixelButton
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
        >
          &lt; BACK
        </PixelButton>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <LeaderboardView
          myPlayerId={player?.id}
          myScore={player?.best_score}
        />
      </div>
    </div>
  );
}
