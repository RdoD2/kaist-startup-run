'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepShell } from './StepShell';
import { PixelModal } from '../ui/PixelModal';
import { usePlayer } from '../../hooks/usePlayer';
import { updatePlayer } from '../../lib/api';

// 개인정보 처리방침 텍스트 (privacy-policy.md 내용을 인라인으로 포함)
// TODO: 법무 검토 후 정식 텍스트로 교체 + 대회 측 컨펌 항목 채우기
const PRIVACY_POLICY_TEXT = `개인정보 처리방침 (초안)

[!] 법무 검토 필수. 대회 주최(KAIST 창업원) 명칭/연락처/책임자 채워야 정식 게시 가능.

서비스명: STARTUP RUN (KAIST 창업대회 홍보 미니게임)
시행일: 2026-XX-XX (확정 필요)

1. 수집하는 개인정보 항목

[필수 입력]
- 닉네임
- KAIST 학번 (8자리)
- 이름
- 학과

[자동 수집]
- 게임 점수 및 사망 사유
- 플레이 시간(duration), 플레이 시각
- 익명 식별 토큰(anon_token)

본 서비스는 민감정보 및 고유식별정보를 수집하지 않습니다.

2. 개인정보의 이용 목적

1. KAIST 창업대회 캠페인 참여자 식별
2. 리더보드 표시 (닉네임만 외부 노출)
3. 추첨 응모자 자격 확인 및 시상 처리, 시상 안내 연락
4. 부정행위 탐지 및 통계 분석 (개인 식별 없는 집계 한정)

3. 보유 및 이용 기간

수집된 개인정보는 시상 종료 후 30일 이내 전량 파기합니다.

4. 제3자 제공

제공받는 자: KAIST 창업원 시상 담당자
제공 항목: 이름, 학번, 학과
제공 목적: 시상 처리 및 안내
보유·이용 기간: 시상 종료 후 30일

위 외 외부에 제공하지 않습니다.

5. 개인정보 처리의 위탁

수탁자: Supabase Inc. (데이터베이스 호스팅, 미국)
수탁자: Vercel Inc. (웹 호스팅, 미국)

6. 정보주체의 권리와 행사 방법

이용자는 언제든지 열람, 정정, 삭제, 처리 정지, 동의 철회를 요청할 수 있습니다.
동의를 철회하는 경우 즉시 응모 자격을 상실하며 관련 데이터가 삭제됩니다.

담당자: (미정 - 확정 필요)
이메일: (미정 - 확정 필요)

7. 안전성 확보 조치

- 전송 구간 TLS 암호화
- 접근 권한 최소화 (Supabase Row-Level Security)
- 점수 위변조 방지 (HMAC 서명 및 게임 세션 토큰)
- 침해 사고 발생 시 정보주체에 통지 및 관계 기관 신고

8. 개인정보 자동 수집 도구

본 서비스는 로그인 유지 및 응모 식별을 위해 localStorage에 익명 토큰을 저장합니다.
이 토큰은 추적 광고에 사용되지 않으며, 브라우저 데이터 삭제 시 함께 삭제됩니다.

9. 개인정보 보호 책임자

성명: (미정 - 대회 주최 측 확정 필요)
직책: (미정)
이메일: (미정)

10. 고지의 의무

본 처리방침은 법령·정책 변경에 따라 변경될 수 있으며,
변경 시 시행일 7일 전부터 서비스 내 공지합니다.

시행일: 2026-XX-XX`;

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
