'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StepShell } from './StepShell';
import { PixelInput } from '../ui/PixelInput';
import { usePlayer } from '../../hooks/usePlayer';
import { updatePlayer } from '../../lib/api';

// TODO: KAIST 학과 마스터 리스트 확정 후 교체 (대회 측 컨펌 필요)
const DEPARTMENTS = [
  '전산학부',
  '전기및전자공학부',
  '기계공학과',
  '항공우주공학과',
  '물리학과',
  '수리과학과',
  '화학과',
  '바이오및뇌공학과',
  '산업및시스템공학과',
  '산업디자인학과',
  '경영공학부',
  '문화기술대학원',
  '건설및환경공학과',
  '신소재공학과',
  '원자력및양자공학과',
];

export function Step3Identity() {
  const router = useRouter();
  const { cache, updateCache, setPlayer } = usePlayer();
  const [realName, setRealName] = useState(cache.draftRealName ?? '');
  const [department, setDepartment] = useState(cache.draftDepartment ?? '');
  const [deptQuery, setDeptQuery] = useState(cache.draftDepartment ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<{ realName?: string; department?: string }>({});
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const filtered = DEPARTMENTS.filter((d) =>
    d.includes(deptQuery) && deptQuery.length > 0 && d !== department,
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRealName(val);
    updateCache({ draftRealName: val });
    if (errors.realName) setErrors((prev) => ({ ...prev, realName: undefined }));
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDeptQuery(val);
    setDepartment(val);
    updateCache({ draftDepartment: val });
    setShowSuggestions(true);
    if (errors.department) setErrors((prev) => ({ ...prev, department: undefined }));
  };

  const selectDept = (d: string) => {
    setDepartment(d);
    setDeptQuery(d);
    updateCache({ draftDepartment: d });
    setShowSuggestions(false);
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!realName.trim()) newErrors.realName = '이름을 입력해줘';
    if (!department.trim()) newErrors.department = '학과를 입력해줘';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const updated = await updatePlayer(3, {
        real_name: realName.trim(),
        department: department.trim(),
      });
      setPlayer(updated);
      router.push('/register/step4');
    } catch {
      setErrors({ realName: '통신 실패. 잠깐 뒤에 다시.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      step={3}
      title="STEP 3/4 · IDENTITY"
      subtitle="시상 처리용. 외부에 안 보여."
      onNext={handleNext}
      nextLabel="NEXT"
      nextDisabled={!realName.trim() || !department.trim()}
      loading={loading}
      backPath="/register/step2"
    >
      <div className="flex flex-col gap-6">
        {/* 이름 */}
        <PixelInput
          ref={nameRef}
          label="이름"
          placeholder="예: 홍길동"
          value={realName}
          onChange={handleNameChange}
          error={errors.realName}
          autoComplete="name"
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
        />

        {/* 학과 자동완성 */}
        <div className="relative">
          <PixelInput
            label="학과"
            placeholder="예: 산업디자인학과"
            value={deptQuery}
            onChange={handleDeptChange}
            error={errors.department}
            autoComplete="off"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-10 w-full top-full mt-0 border-2 border-ink-5 bg-ink-1 max-h-40 overflow-y-auto">
              {filtered.map((d) => (
                <button
                  key={d}
                  className="w-full text-left px-3 py-2 font-kor text-[18px] text-ink-7 hover:bg-ink-5 border-b border-ink-5 last:border-b-0"
                  onMouseDown={() => selectDept(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </StepShell>
  );
}
