import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above the input */
  label?: string;
  /** Error message — turns the border red and shows below the input */
  error?: string;
  /** Neutral helper text shown below the input (hidden when error is present) */
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...rest }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;

    const borderClass = error
      ? 'border-danger focus:ring-danger/20 focus:border-danger'
      : 'border-neutral-300 focus:ring-primary/20 focus:border-primary';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`
            block w-full rounded-lg px-3 py-2
            border ${borderClass}
            bg-white text-neutral-900 placeholder:text-neutral-400
            focus:outline-none focus:ring-2
            transition-colors duration-150
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...rest}
        />

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
