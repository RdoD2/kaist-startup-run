'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepShell } from './StepShell';
import { PixelModal } from '../ui/PixelModal';
import { usePlayer } from '../../hooks/usePlayer';
import { updatePlayer } from '../../lib/api';
import { PRIVACY_POLICY_TEXT } from '../../lib/privacyPolicy';

export function Step4Consent() {
  const router = useRouter();
  const { setPlayer } = usePlayer();
  const [agreed, setAgreed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (!agreed) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updatePlayer(4, { privacy_consent: true });
      setPlayer(updated);
      router.push('/play');
    } catch {
      setError('통신 실패. 잠깐 뒤에 다시.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StepShell
        step={4}
        title="STEP 4/4 · CONSENT"
        subtitle="개인정보 수집·이용에 동의해야 응모 가능"
        onNext={handleNext}
        nextLabel="READY TO RUN"
        nextDisabled={!agreed}
        loading={loading}
        backPath="/register/step3"
      >
        <div className="flex flex-col gap-6">
          {/* 체크박스 + 약관 링크 */}
          <div className="flex flex-col gap-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                className={`w-5 h-5 shrink-0 border-2 mt-0.5 flex items-center justify-center ${
                  agreed ? 'bg-kaist border-kaist' : 'bg-ink-1 border-ink-5'
                }`}
                onClick={() => setAgreed((v) => !v)}
                role="checkbox"
                aria-checked={agreed}
                tabIndex={0}
                onKeyDown={(e) => e.key === ' ' && setAgreed((v) => !v)}
              >
                {agreed && (
                  <span className="font-pixel text-[16px] text-ink-7">V</span>
                )}
              </div>
              <span className="font-kor text-[18px] text-ink-6 leading-relaxed">
                [필수] 개인정보 수집 및 이용에 동의합니다
              </span>
            </label>

            <button
              className="font-kor text-[18px] text-ink-12 underline text-left hover:text-ink-7"
              onClick={() => setModalOpen(true)}
            >
              전문 보기 &gt;
            </button>
          </div>

          {error && (
            <p className="font-kor text-[18px] text-ink-8">{error}</p>
          )}
        </div>
      </StepShell>

      {/* 약관 풀스크린 모달 */}
      <PixelModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="개인정보 처리방침"
      >
        <pre className="font-kor text-[14px] text-ink-6 whitespace-pre-wrap leading-relaxed">
          {PRIVACY_POLICY_TEXT}
        </pre>
      </PixelModal>
    </>
  );
}
