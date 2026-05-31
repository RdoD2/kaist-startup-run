'use client';
// =====================================================================
// LeaderboardView — 탭(오늘/전체) + 리스트 + 내 위치 상단 고정
// =====================================================================

import React, { useState } from 'react';
import type { LeaderboardTab } from '../../hooks/useLeaderboard';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import type { LeaderboardEntry } from '../../lib/types';

type LeaderboardViewProps = {
  myPlayerId?: string;
  myScore?: number;
};

function RankRow({
  entry,
  isMe,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-ink-1 ${
        isMe ? 'bg-kaist' : 'bg-ink-0'
      }`}
    >
      {/* 순위 */}
      <span
        className={`font-pixel text-[16px] w-8 shrink-0 ${
          entry.rank <= 3 ? 'text-ink-10' : 'text-ink-5'
        }`}
      >
        {entry.rank <= 3 ? ['1ST', '2ND', '3RD'][entry.rank - 1] : `${entry.rank}`}
      </span>

      {/* 닉네임 */}
      <span className="font-kor text-[18px] text-ink-7 flex-1 truncate">
        {isMe ? `나 · ${entry.nickname}` : entry.nickname}
      </span>

      {/* 점수 */}
      <span className="font-pixel text-[16px] text-ink-10 shrink-0">
        {entry.score}일
      </span>
    </div>
  );
}

export function LeaderboardView({ myPlayerId, myScore }: LeaderboardViewProps) {
  const [tab, setTab] = useState<LeaderboardTab>('daily');
  const { entries, loading, error, myEntry } = useLeaderboard(tab, myPlayerId);

  const isEmpty = !loading && !error && entries.length === 0;

  // 내 위치를 상단에 별도 표시하는지 여부
  // (리스트에 이미 있으면 중복 표시 안 함)
  const myEntryInTop = myPlayerId
    ? entries.some((e) => e.id === myPlayerId)
    : false;

  return (
    <div className="flex flex-col min-h-screen bg-ink-0 max-w-[360px] mx-auto">
      {/* 헤더 */}
      <div className="px-4 py-4 border-b-2 border-ink-5">
        <h1 className="font-pixel text-[20px] text-ink-7">LEADERBOARD</h1>
        <p className="font-kor text-[14px] text-ink-5 mt-1">
          점수 = 응모권. 1점 = 추첨 1티켓.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex border-b-2 border-ink-5 shrink-0">
        {(['daily', 'all'] as LeaderboardTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 font-pixel text-[16px] tracking-wider border-r last:border-r-0 border-ink-5 ${
              tab === t
                ? 'bg-ink-7 text-ink-0'
                : 'bg-ink-0 text-ink-5 hover:text-ink-7'
            }`}
          >
            {t === 'daily' ? '오늘' : '전체'}
          </button>
        ))}
      </div>

      {/* 내 위치 고정 카드 (리스트 최상단에 없을 때) */}
      {myEntry && !myEntryInTop && (
        <div className="border-b-2 border-ink-10">
          <div className="px-4 py-2">
            <p className="font-kor text-[16px] text-ink-10 mb-1">내 위치</p>
          </div>
          <RankRow entry={myEntry} isMe />
        </div>
      )}

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="font-pixel text-[16px] text-ink-5 animate-pulse">
              LOADING...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="px-4 py-8 text-center">
            <p className="font-kor text-[18px] text-ink-8">{error}</p>
          </div>
        )}

        {isEmpty && (
          <div className="px-4 py-16 text-center">
            <p className="font-kor text-[20px] text-ink-5">
              오늘 아무도 안 뛰었네.
              <br />
              1등 자리 비어 있음.
            </p>
          </div>
        )}

        {!loading && !error && entries.map((entry) => (
          <RankRow
            key={entry.id}
            entry={entry}
            isMe={entry.id === myPlayerId}
          />
        ))}
      </div>

      {/* 내 응모권 하단 고정 */}
      {myScore !== undefined && (
        <div className="shrink-0 border-t-2 border-ink-5 px-4 py-4 bg-ink-1">
          <p className="font-kor text-[18px] text-ink-7">
            내 응모권 {myScore}장 · 한 판 더해서 +α 받기
          </p>
        </div>
      )}
    </div>
  );
}
