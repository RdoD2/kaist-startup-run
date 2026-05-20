'use client';

import React from 'react';

export type DDayCounterProps = {
  deadline: string; // ISO 문자열
  className?: string;
};

// KST 자정 컷오프 기반 D-day 계산
function calcDDay(deadlineIso: string): { label: string; status: 'future' | 'today' | 'past' } {
  const deadline = new Date(deadlineIso);
  const now = new Date();

  // KST 자정으로 정규화 (Asia/Seoul, UTC+9)
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstDeadline = new Date(deadline.getTime() + 9 * 60 * 60 * 1000);
  const nowDay = Math.floor(kstNow.getTime() / 86400000);
  const deadlineDay = Math.floor(kstDeadline.getTime() / 86400000);
  const diff = deadlineDay - nowDay;

  if (diff > 0) return { label: `D-${diff}`, status: 'future' };
  if (diff === 0) return { label: 'D-DAY', status: 'today' };
  return { label: '마감', status: 'past' };
}

export function DDayCounter({ deadline, className }: DDayCounterProps) {
  const { label, status } = calcDDay(deadline);
  // KAIST 블루 박스, 픽셀 폰트
  // status별 색: future = ink10 (yellow), today = ink8 (red), past = ink5 (gray)
  const color =
    status === 'today' ? 'text-ink-8' : status === 'past' ? 'text-ink-5' : 'text-ink-10';

  return (
    <div
      className={`inline-flex items-center gap-2 border-2 border-kaist bg-ink-1 px-3 py-2 pixel-shadow ${className ?? ''}`}
    >
      <span className="font-pixel text-[14px] text-ink-6">CONTEST</span>
      <span className={`font-pixel text-[18px] ${color}`}>{label}</span>
    </div>
  );
}
