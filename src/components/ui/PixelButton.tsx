'use client';

import React from 'react';

type PixelButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
};

const variantStyles: Record<string, string> = {
  primary: 'bg-ink-7 text-ink-0 border-ink-0 hover:bg-ink-6',
  secondary: 'bg-ink-0 text-ink-7 border-ink-7 hover:bg-ink-1',
  danger: 'bg-ink-8 text-ink-7 border-ink-0 hover:bg-ink-2',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-2 text-[16px]',
  md: 'px-5 py-3 text-[16px]',
  lg: 'px-6 py-4 text-[18px]',
};

export function PixelButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: PixelButtonProps) {
  return (
    <button
      className={[
        'btn-pixel font-pixel',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
