'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StepShell } from './StepShell';
import { PixelInput } from '../ui/PixelInput';
import { usePlayer } from '../../hooks/usePlayer';
import { updatePlayer, ApiError } from '../../lib/api';

function validateStudentId(value: string): string | null {
  if (!/^\d{8}$/.test(value)) return '학번은 8자리 숫자야';
  return null;
}

export function Step2StudentId() {
  const router = useRouter();
  const { cache, updateCache, setPlayer } = usePlayer();
  const [studentId, setStudentId] = useState(cache.draftStudentId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 허용, 최대 8자리
    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
    setStudentId(val);
    updateCache({ draftStudentId: val });
    if (error) setError(null);

    // 8자리 채워지면 자동 다음
    if (val.length === 8) {
      handleNext(val);
    }
  };

  const handleNext = async (sid?: string) => {
    const value = sid ?? studentId;
    const validationError = validateStudentId(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const updated = await updatePlayer(2, { student_id: value });
      setPlayer(updated);
      router.push('/register/step3');
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        setError('이미 등록된 학번이야 (1인 1계정)');
      } else {
        setError('통신 실패. 잠깐 뒤에 다시.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      step={2}
      title="STEP 2/4 · STUDENT ID"
      onNext={() => handleNext()}
      nextLabel="NEXT"
      nextDisabled={studentId.length !== 8}
      loading={loading}
      backPath="/register/step1"
    >
      <div className="flex flex-col gap-2">
        <p className="font-kor text-[18px] text-ink-6 leading-relaxed">
          KAIST 학번 8자리. 응모권 받으려면 필요해.
        </p>
        <PixelInput
          ref={inputRef}
          label="학번"
          placeholder="20XXXXXX"
          value={studentId}
          onChange={handleChange}
          error={error ?? undefined}
          inputMode="numeric"
          pattern="\d{8}"
          maxLength={8}
          autoComplete="off"
        />
        {/* 진행 도트 표시 */}
        <div className="flex gap-1 mt-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 border border-ink-5 ${
                i < studentId.length ? 'bg-kaist' : 'bg-ink-1'
              }`}
            />
          ))}
        </div>
      </div>
    </StepShell>
  );
}
