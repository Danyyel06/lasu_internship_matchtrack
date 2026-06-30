import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Optional title shown in the header */
  title?: string;
  /** Modal body content */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Width preset */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`
          relative w-full ${sizeClasses[size]} mx-4
          bg-white rounded-[var(--radius-card)] shadow-lg
          animate-[scaleIn_150ms_ease-out]
        `}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-neutral-700 transition-colors rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-neutral-200">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
