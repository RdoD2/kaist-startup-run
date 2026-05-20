'use client';
// =====================================================================
// DeathCard — 게임 오버 점수카드
// 점수 + 사망원인 랜덤 카피 + 응모권 + CTA 3개
// =====================================================================

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { DeathCause } from '../../lib/constants';
import { OFFICIAL_URL } from '../../lib/constants';
import { PixelButton } from '../ui/PixelButton';
import { usePlayer } from '../../hooks/usePlayer';

// ─── 사망원인 카피 풀 (copy.md §4) ──────────────────────────────────
const DEATH_COPY: Record<DeathCause, string[]> = {
  investor_pass: [
    '투자자한테 PASS 당했어요',
    'VC가 "다음 라운드에 봅시다" 했어요',
    '데모덱 3장에서 잘렸어요',
    '"팀이 너무 어리네요" 들었어요',
    '10번째 거절 메일을 받았어요',
    '시드 안 모이고 라운드 클로즈됐어요',
  ],
  burnout: [
    '번아웃으로 망했어요',
    '3일 연속 밤샘하다 쓰러졌어요',
    '자정에 키보드에 얼굴 박았어요',
    '월요일 출근을 못 했어요',
    '더는 못 하겠어요',
    '잠시 쉰다고 했다가 안 돌아왔어요',
  ],
  cofounder_left: [
    '코파운더가 떠났어요',
    'CTO가 대기업 갔어요',
    '공동대표가 잠수 탔어요',
    '지분 협상이 결렬됐어요',
    '팀 단톡방이 조용해졌어요',
    '"잠깐 생각 좀…" 후로 연락 끊겼어요',
  ],
  competitor: [
    '경쟁사가 똑같은 거 출시했어요',
    '유니콘이 무료로 풀어버렸어요',
    'YC 팀이 같은 시장에 들어왔어요',
    '카피캣한테 시장 뺏겼어요',
    '빅테크가 비슷한 기능 발표했어요',
  ],
  lawsuit: [
    '변호사한테 소장을 받았어요',
    '상표 침해 통보가 왔어요',
    '약관 위반으로 신고당했어요',
    '개인정보위에서 연락 왔어요',
    '라이선스 분쟁에 휘말렸어요',
  ],
  pivot_fail: [
    '피봇하다 길을 잃었어요',
    '5번째 피봇 끝에 헤맸어요',
    '타겟 시장이 다시 안 보여요',
    'PMF를 영영 못 찾았어요',
    '팀이 방향을 잃었어요',
  ],
  demo_day: [
    '데모데이 무대에서 망했어요',
    '심사위원 5명 다 무표정이었어요',
    '데모덱 30초 만에 잘렸어요',
    'Q&A에서 한 마디도 못 했어요',
    '"그래서 비즈니스 모델이 뭐죠?" 들었어요',
  ],
  cash_dry: [
    '월세 못 내고 사무실에서 쫓겨났어요',
    'AWS 청구서 6자리 찍혔어요',
    '런웨이 다 떨어졌어요',
    '카드값 막다가 신용불량 됐어요',
    '4대 보험비도 못 냈어요',
    '직원 월급 밀려서 다 나갔어요',
  ],
  regulation: [
    '국세청에서 세무조사 나왔어요',
    '개인정보위에 신고당했어요',
    '식약처/금감원이 멈추라고 했어요',
    '신사업이 갑자기 불법이 됐어요',
    '규제 샌드박스 떨어졌어요',
  ],
  product_fail: [
    '프로덕션에 치명적 버그가 났어요',
    '데이터베이스를 통째로 날렸어요',
    '핵심 기능이 작동을 안 해요',
    '유저들이 환불 폭주했어요',
    '리뷰가 별 한 개로 도배됐어요',
  ],
};

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
  const deathCopy = useMemo(() => {
    const pool = DEATH_COPY[deathCause];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [deathCause]);

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
