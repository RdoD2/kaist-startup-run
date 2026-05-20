'use client';

import React from 'react';

type PixelInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const PixelInput = React.forwardRef<HTMLInputElement, PixelInputProps>(
function PixelInput({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}, ref) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="font-kor text-[18px] text-ink-6 tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          'font-kor text-[20px] text-ink-7 bg-ink-1',
          'border-2 border-ink-7',
          'px-3 py-3',
          'outline-none',
          'focus:border-ink-10 focus:bg-ink-0',
          'placeholder:text-ink-5',
          'pixel-shadow',
          'w-full',
          error ? 'border-ink-8' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {hint && !error && (
        <p className="font-kor text-[14px] text-ink-5">{hint}</p>
      )}
      {error && (
        <p className="font-kor text-[14px] text-ink-8">{error}</p>
      )}
    </div>
  );
});

PixelInput.displayName = 'PixelInput';
