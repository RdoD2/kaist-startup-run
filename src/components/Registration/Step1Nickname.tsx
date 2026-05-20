'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StepShell } from './StepShell';
import { PixelInput } from '../ui/PixelInput';
import { usePlayer } from '../../hooks/usePlayer';
import { registerPlayer, ApiError } from '../../lib/api';

// 금칙어 리스트 (임시)
const BLOCKED_WORDS = ['욕설', 'admin', 'null', 'undefined'];

function validateNickname(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 12) return '1~12자 한글/영문/숫자만';
  if (!/^[가-힣a-zA-Z0-9_]+$/.test(trimmed)) return '1~12자 한글/영문/숫자만';
  if (BLOCKED_WORDS.some((w) => trimmed.toLowerCase().includes(w))) return '그건 좀…';
  return null;
}

export function Step1Nickname() {
  const router = useRouter();
  const { cache, updateCache, setPlayer } = usePlayer();
  const [nickname, setNickname] = useState(cache.draftNickname ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNickname(val);
    updateCache({ draftNickname: val });
    if (error) setError(null);
  };

  const handleNext = async () => {
    const trimmed = nickname.trim();
    const validationError = validateNickname(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const player = await registerPlayer(trimmed);
      setPlayer(player);
      router.push('/register/step2');
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        setError('이미 누가 쓰고 있어 ㅋㅋ 다른 거');
      } else {
        setError('통신 실패. 잠깐 뒤에 다시.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNext();
  };

  return (
    <StepShell
      step={1}
      title="PLAYER REGISTRATION"
      subtitle="STEP 1/4 · CALL SIGN"
      onNext={handleNext}
      nextLabel="NEXT"
      nextDisabled={nickname.trim().length === 0}
      loading={loading}
      showBack={false}
    >
      <div className="flex flex-col gap-2">
        <p className="font-kor text-[18px] text-ink-6 leading-relaxed">
          리더보드에 표시될 이름이야.
        </p>
        <PixelInput
          ref={inputRef}
          label="닉네임"
          placeholder="예: 김창업러"
          value={nickname}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          error={error ?? undefined}
          maxLength={12}
          autoComplete="off"
        />
      </div>
    </StepShell>
  );
}
