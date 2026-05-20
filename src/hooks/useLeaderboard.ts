'use client';
// =====================================================================
// useLeaderboard — Supabase view SELECT (env 없으면 mock 데이터)
// =====================================================================

import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry } from '../lib/types';

export type LeaderboardTab = 'daily' | 'all';

// ─── mock 데이터 ────────────────────────────────────────────────────

const MOCK_ENTRIES: LeaderboardEntry[] = [
  { id: '1', nickname: '김창업러', score: 1247, rank: 1 },
  { id: '2', nickname: 'PIVOT_KING', score: 998, rank: 2 },
  { id: '3', nickname: '번아웃생존자', score: 872, rank: 3 },
  { id: '4', nickname: '시드없이살기', score: 743, rank: 4 },
  { id: '5', nickname: 'YC_REJECT', score: 601, rank: 5 },
  { id: '6', nickname: '밤샘코딩러', score: 522, rank: 6 },
  { id: '7', nickname: 'PMF탐색중', score: 465, rank: 7 },
  { id: '8', nickname: '데모데이통과', score: 387, rank: 8 },
  { id: '9', nickname: '엔젤받은자', score: 314, rank: 9 },
  { id: '10', nickname: '생존주의자', score: 248, rank: 10 },
];

const MOCK_DAILY: LeaderboardEntry[] = [
  { id: '3', nickname: '번아웃생존자', score: 872, rank: 1 },
  { id: '7', nickname: 'PMF탐색중', score: 465, rank: 2 },
  { id: '10', nickname: '생존주의자', score: 248, rank: 3 },
];

export function useLeaderboard(tab: LeaderboardTab, myPlayerId?: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      // mock 모드
      console.warn('[useLeaderboard] mock: SUPABASE env vars not set');
      await new Promise((r) => setTimeout(r, 300)); // 로딩 feel
      setEntries(tab === 'daily' ? MOCK_DAILY : MOCK_ENTRIES);
      setLoading(false);
      return;
    }

    try {
      // 뷰: leaderboard_daily / leaderboard_all
      const viewName =
        tab === 'daily' ? 'leaderboard_daily' : 'leaderboard_all';
      const res = await fetch(
        `${url}/rest/v1/${viewName}?select=*&order=rank.asc&limit=100`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as LeaderboardEntry[];
      setEntries(data);
    } catch (e) {
      setError('통신 실패. 잠깐 뒤에 다시.');
      console.error('[useLeaderboard]', e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // 내 위치 찾기
  const myEntry = myPlayerId
    ? entries.find((e) => e.id === myPlayerId)
    : undefined;

  return { entries, loading, error, myEntry, refetch: fetchLeaderboard };
}
