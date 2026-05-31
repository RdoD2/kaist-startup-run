'use client';
// =====================================================================
// /privacy — 개인정보 처리방침 전문 페이지
// 랜딩 푸터 링크 + 등록 동의 단계에서 진입.
// =====================================================================

import React from 'react';
import { useRouter } from 'next/navigation';
import { PixelButton } from '../../components/ui/PixelButton';
import { PRIVACY_POLICY_TEXT } from '../../lib/privacyPolicy';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-ink-0 max-w-[360px] mx-auto flex flex-col">
      {/* 상단 뒤로가기 */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <PixelButton variant="secondary" size="sm" onClick={() => router.back()}>
          &lt; BACK
        </PixelButton>
      </div>

      {/* 헤더 */}
      <div className="px-4 py-4 border-b-2 border-ink-5 shrink-0">
        <h1 className="font-pixel text-[20px] text-ink-7">개인정보 처리방침</h1>
      </div>

      {/* 전문 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <pre className="font-kor text-[14px] text-ink-6 whitespace-pre-wrap leading-relaxed">
          {PRIVACY_POLICY_TEXT}
        </pre>
      </div>
    </div>
  );
}
