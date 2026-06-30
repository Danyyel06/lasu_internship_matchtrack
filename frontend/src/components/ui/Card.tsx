import React from 'react';

interface CardProps {
  /** Additional CSS classes to merge onto the outer wrapper */
  className?: string;
  /** Optional header rendered above the body with a bottom border */
  header?: React.ReactNode;
  /** Optional footer rendered below the body with a top border */
  footer?: React.ReactNode;
  /** Card body content */
  children: React.ReactNode;
}

export function Card({ className = '', header, footer, children }: CardProps) {
  return (
    <div
      className={`
        bg-white border border-neutral-200 rounded-[var(--radius-card)] shadow-sm
        ${className}
      `}
    >
      {header && (
        <div className="border-b border-neutral-200 px-6 py-4 font-medium text-neutral-800">
          {header}
        </div>
      )}

      <div className="px-6 py-6">{children}</div>

      {footer && (
        <div className="border-t border-neutral-200 px-6 py-4">{footer}</div>
      )}
    </div>
  );
}
