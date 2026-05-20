'use client';

import React, { useEffect } from 'react';

type PixelModalProps = {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  /** 닫기 버튼 숨기기 */
  hideClose?: boolean;
};

export function PixelModal({
  open,
  onClose,
  title,
  children,
  hideClose = false,
}: PixelModalProps) {
  // 열려있을 때 body scroll 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-ink-0 flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink-5 shrink-0">
        {title && (
          <span className="font-pixel text-[16px] text-ink-7">{title}</span>
        )}
        {!hideClose && onClose && (
          <button
            onClick={onClose}
            className="font-pixel text-[16px] text-ink-6 hover:text-ink-7 ml-auto"
            aria-label="닫기"
          >
            [X]
          </button>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </div>
  );
}
