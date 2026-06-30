import React from 'react';

interface BadgeProps {
  /** Colour variant */
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  /** Size preset */
  size?: 'sm' | 'md';
  /** Label content */
  children: React.ReactNode;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: 'bg-primary-50 text-primary',
  success: 'bg-success-50 text-success',
  warning: 'bg-warning-50 text-warning',
  danger: 'bg-danger-50 text-danger',
  neutral: 'bg-neutral-100 text-neutral-600',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium leading-tight
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {children}
    </span>
  );
}
