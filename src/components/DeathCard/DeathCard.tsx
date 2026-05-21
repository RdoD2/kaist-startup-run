'use client';
// =====================================================================
// DeathCard — 게임 오버 점수카드
// 점수 + 사망원인 랜덤 카피 + 응모권 + CTA 3개
// =====================================================================

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { DeathCause } from '../../lib/constants';
import { OFFICIAL_URL } from '../../lib/constants';
import { pickDeathCopy } from '../../lib/deathCopy';
import { PixelButton } from '../ui/PixelButton';
import { usePlayer } from '../../hooks/usePlayer';

type DeathCardProps = {
  score: number;
  deathCause: DeathCause;
  tickets: number;
  ticketDelta: number;
  dailyRank?: number;
  totalRank?: number;
  onPlayAgain: () => void;
};

// Toast 컴포넌트 (공유 피드백용)
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 font-kor text-[18px] text-ink-7 bg-ink-1 border-2 border-ink-7 px-4 py-3 pixel-shadow transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
}

export function DeathCard({
  score,
  deathCause,
  tickets,
  ticketDelta,
  dailyRank,
  totalRank,
  onPlayAgain,
}: DeathCardProps) {
  const router = useRouter();
  const { player } = usePlayer();
  const nickname = player?.nickname ?? '익명창업가';

  // 랜덤 사망 카피 — 렌더 시 한 번만 결정
  const deathCopy = useMemo(() => pickDeathCopy(deathCause), [deathCause]);

  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({
    msg: '',
    visible: false,
  });

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  };

  const handleShare = async () => {
    const base =
      process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
    const ogUrl = `${base}/api/og?score=${encodeURIComponent(score)}&cause=${encodeURIComponent(deathCause)}&nickname=${encodeURIComponent(nickname)}&tickets=${tickets}`;
    const shareText = `나는 ${score}일 버텼다\n너는?\nSTARTUP RUN · KAIST 창업대회`;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: ogUrl });
      } catch {
        // 취소됨 — 무시
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${ogUrl}`);
        showToast('클립보드에 복사했어');
      } catch {
        showToast('복사 실패. 직접 복사해줘.');
      }
    }
  };

  return (
    <>
      <div
        className="flex flex-col min-h-screen bg-ink-0 max-w-[360px] mx-auto px-4 py-6 gap-6"
        style={{
          animation: 'deathcard-in 280ms ease-out both',
        }}
      >
        {/* 헤더 */}
        <div className="border-2 border-ink-8 px-4 py-3 text-center">
          <p className="font-pixel text-[24px] text-ink-8 tracking-widest animate-pulse">
            GAME OVER
          </p>
        </div>

        {/* 점수 카드 */}
        <div className="border-2 border-ink-5 px-4 py-5 flex flex-col gap-3">
          <p className="font-kor text-[28px] text-ink-7">
            창업 {score}일차
          </p>
          <p className="font-kor text-[20px] text-ink-6 leading-relaxed">
            {deathCopy}
          </p>

          {/* 구분선 */}
          <div className="border-t border-ink-5 my-1" />

          {/* 응모권 */}
          <div className="flex items-baseline gap-2">
            <span className="font-pixel text-[16px] text-ink-10">
              응모권 {tickets}장
            </span>
            {ticketDelta > 0 && (
              <span className="font-pixel text-[16px] text-ink-11">
                (+ {ticketDelta})
              </span>
            )}
          </div>

          {/* 순위 */}
          {(dailyRank !== undefined || totalRank !== undefined) && (
            <p className="font-kor text-[18px] text-ink-5">
              {dailyRank !== undefined && `오늘 순위 ${dailyRank}위`}
              {dailyRank !== undefined && totalRank !== undefined && ' · '}
              {totalRank !== undefined && `전체 ${totalRank}위`}
            </p>
          )}
        </div>

        {/* CTA 버튼들 */}
        <div className="flex flex-col gap-3">
          {/* 1순위: 한 판 더 */}
          <PixelButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={onPlayAgain}
          >
            한 판 더
          </PixelButton>

          {/* 2순위: 결과 공유 */}
          <PixelButton
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleShare}
          >
            결과 공유
          </PixelButton>

          {/* 3순위: 리더보드 */}
          <PixelButton
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => router.push('/leaderboard')}
          >
            리더보드 보기
          </PixelButton>

          {/* 공식홈 링크 */}
          <a
            href={OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pixel font-pixel text-[16px] text-center w-full block py-3 bg-kaist text-ink-7 border-ink-0"
            style={{ display: 'block', textAlign: 'center' }}
          >
            KAIST 창업대회 신청하러 가기 &gt;
          </a>
        </div>
      </div>

      <Toast message={toast.msg} visible={toast.visible} />
    </>
  );
}
