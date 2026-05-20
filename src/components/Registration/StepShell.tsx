'use client';
// =====================================================================
// StepShell — 등록 4-step 공통 레이아웃
// 진행률 바 + 헤더 + 뒤로/다음 버튼
// =====================================================================

import React from 'react';
import { useRouter } from 'next/navigation';
import { PixelButton } from '../ui/PixelButton';

type StepShellProps = {
  step: 1 | 2 | 3 | 4;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  onNext?: () => void | Promise<void>;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
  backPath?: string;
  children: React.ReactNode;
};

export function StepShell({
  step,
  totalSteps = 4,
  title,
  subtitle,
  onNext,
  nextLabel = 'NEXT',
  nextDisabled = false,
  loading = false,
  showBack = true,
  backPath,
  children,
}: StepShellProps) {
  const router = useRouter();
  const progress = (step / totalSteps) * 100;

  const handleBack = () => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-ink-0 max-w-[360px] mx-auto">
      {/* 진행률 바 */}
      <div className="w-full h-2 bg-ink-1 shrink-0">
        <div
          className="h-full bg-kaist transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 스텝 표시 */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <p className="font-pixel text-[16px] text-ink-5 tracking-widest">
          STEP {step}/{totalSteps}
        </p>
      </div>

      {/* 헤더 */}
      <div className="px-4 pb-4 shrink-0 border-b-2 border-ink-1">
        <h1 className="font-pixel text-[18px] text-ink-7 leading-relaxed">
          {title}
        </h1>
        {subtitle && (
          <p className="font-kor text-[18px] text-ink-5 mt-2">{subtitle}</p>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 px-4 py-6 flex flex-col gap-6">
        {children}
      </div>

      {/* 하단 버튼 */}
      <div className="px-4 pb-8 pt-4 flex flex-col gap-3 shrink-0 border-t-2 border-ink-1">
        {onNext && (
          <PixelButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={onNext}
            disabled={nextDisabled || loading}
          >
            {loading ? '...' : nextLabel}
          </PixelButton>
        )}
        {showBack && (
          <PixelButton
            variant="secondary"
            size="sm"
            fullWidth
            onClick={handleBack}
            disabled={loading}
          >
            BACK
          </PixelButton>
        )}
      </div>
    </div>
  );
}
