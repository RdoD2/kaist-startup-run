'use client';
// =====================================================================
// usePlayer — localStorage player_cache 읽기/쓰기, 진행 상태 관리
// =====================================================================

import { useState, useEffect, useCallback } from 'react';
import type { Player } from '../lib/types';
import { STORAGE_KEYS } from '../lib/constants';

export type PlayerCache = {
  player: Player | null;
  /** 마지막으로 완료한 등록 스텝 (0 = 미시작, 4 = 완료) */
  step: 0 | 1 | 2 | 3 | 4;
  /** 닉네임 임시 저장 (step 1 미완료 시) */
  draftNickname?: string;
  /** 학번 임시 저장 */
  draftStudentId?: string;
  /** 이름 임시 저장 */
  draftRealName?: string;
  /** 학과 임시 저장 */
  draftDepartment?: string;
};

function readCache(): PlayerCache {
  if (typeof window === 'undefined') {
    return { player: null, step: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.playerCache);
    if (!raw) return { player: null, step: 0 };
    return JSON.parse(raw) as PlayerCache;
  } catch {
    return { player: null, step: 0 };
  }
}

function writeCache(cache: PlayerCache): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.playerCache, JSON.stringify(cache));
    localStorage.setItem(STORAGE_KEYS.lastSeenAt, new Date().toISOString());
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

export function usePlayer() {
  const [cache, setCache] = useState<PlayerCache>({ player: null, step: 0 });
  const [hydrated, setHydrated] = useState(false);

  // 클라이언트 hydration 후 localStorage 읽기
  useEffect(() => {
    const stored = readCache();
    setCache(stored);
    setHydrated(true);
  }, []);

  /** 플레이어 + 스텝 정보 업데이트 및 localStorage 동기화 */
  const updateCache = useCallback((updates: Partial<PlayerCache>) => {
    setCache((prev) => {
      const next = { ...prev, ...updates };
      writeCache(next);
      return next;
    });
  }, []);

  /** 플레이어 객체만 업데이트 */
  const setPlayer = useCallback(
    (player: Player) => {
      updateCache({
        player,
        step: player.registration_step,
      });
    },
    [updateCache],
  );

  /** draft 필드 미러 (입력 중간 이탈 보호) */
  const setDraft = useCallback(
    (
      field:
        | 'draftNickname'
        | 'draftStudentId'
        | 'draftRealName'
        | 'draftDepartment',
      value: string,
    ) => {
      setCache((prev) => {
        const next = { ...prev, [field]: value };
        writeCache(next);
        return next;
      });
    },
    [],
  );

  /** 전체 캐시 초기화 (재등록 시) */
  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.playerCache);
      localStorage.removeItem(STORAGE_KEYS.anonToken);
      localStorage.removeItem(STORAGE_KEYS.lastSeenAt);
    }
    setCache({ player: null, step: 0 });
  }, []);

  /** 인증 완료 여부 (step 4 완료 + privacy_consent_at 존재) */
  const isVerified =
    cache.player?.registration_step === 4 &&
    !!cache.player?.privacy_consent_at;

  return {
    cache,
    player: cache.player,
    step: cache.step,
    hydrated,
    isVerified,
    updateCache,
    setPlayer,
    setDraft,
    clearCache,
  };
}
