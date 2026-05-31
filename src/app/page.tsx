'use client';
// =====================================================================
// 랜딩 페이지
// - PrizeRain 연출 + START 버튼 + 깜빡이는 픽셀 네온
// - localStorage player_cache 확인 → 라우팅 결정
//   인증 완료 → /play
//   중간 이탈 → /register/stepN
//   새 유저  → /register/step1
// =====================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PrizeRain } from '../components/PrizeRain/PrizeRain';
import { usePlayer } from '../hooks/usePlayer';
import { OFFICIAL_URL } from '../lib/constants';

export default function LandingPage() {
  const router = useRouter();
  const { hydrated, isVerified, step } = usePlayer();
  const [blink, setBlink] = useState(true);

  // START 버튼 깜빡임
  useEffect(() => {
    const id = setInterval(() => setBlink((v) => !v), 600);
    return () => clearInterval(id);
  }, []);

  const handleStart = () => {
    if (!hydrated) return;

    if (isVerified) {
      router.push('/play');
    } else if (step > 0) {
      // 중간 이탈 — 마지막 스텝부터 재개
      router.push(`/register/step${step + 1}`);
    } else {
      router.push('/register/step1');
    }
  };

  return (
    <div className="relative min-h-screen bg-ink-0 flex flex-col items-center justify-center max-w-[360px] mx-auto overflow-hidden">
      {/* 배경 PrizeRain 캔버스 */}
      <PrizeRain />

      {/* 공식 홈페이지 바로가기 — 우상단 고정 */}
      <div className="absolute top-5 right-4 z-10">
        <a
          href={OFFICIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border-2 border-kaist bg-ink-1 px-3 py-2 pixel-shadow"
        >
          <span className="font-pixel text-[14px] text-ink-6">GRAVITY</span>
          <span className="font-pixel text-[14px] text-ink-10">홈 &gt;</span>
        </a>
      </div>

      {/* 전면 UI — z-index 올려서 캔버스 위에 */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 pointer-events-none">
        {/* 메인 타이틀 */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-pixel text-[32px] text-ink-7 tracking-widest pixel-shadow text-center leading-relaxed">
            STARTUP
            <br />
            RUN
          </h1>
          <p className="font-kor text-[20px] text-ink-6 text-center leading-relaxed">
            KAIST 창업가의 N일을 버텨라
          </p>
        </div>

        {/* 픽셀 구분선 */}
        <div className="w-full border-t-2 border-ink-5" />

        {/* 상품 힌트 */}
        <p className="font-kor text-[18px] text-ink-9 text-center leading-relaxed">
          맥미니 · 식사권 · 마사지기 · 배민상품권
          <br />
          <span className="text-ink-5 text-[16px]">아이콘 탭해서 상품 확인</span>
        </p>
      </div>

      {/* START 버튼 — pointer-events: auto 별도 처리 */}
      <div className="relative z-10 mt-8">
        <button
          className={`font-pixel text-[24px] px-8 py-5 border-2 border-ink-7 pixel-shadow cursor-pointer transition-opacity duration-75 ${
            blink ? 'opacity-100 bg-ink-7 text-ink-0' : 'opacity-70 bg-ink-0 text-ink-7'
          }`}
          onClick={handleStart}
          disabled={!hydrated}
          aria-label="게임 시작"
        >
          {hydrated ? 'START' : '...'}
        </button>
      </div>

      {/* 하단 링크 */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 z-10">
        <span className="font-kor text-[16px] text-ink-5">
          &copy; 2026 KAIST 창업원
        </span>
        <Link
          href="/privacy"
          className="font-kor text-[16px] text-ink-5 underline hover:text-ink-7"
        >
          개인정보처리방침
        </Link>
      </div>
    </div>
  );
}
