import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const inputClasses = [
      'ag-input',
      error ? 'ag-input-error' : '',
      leftIcon ? 'ag-input-has-left-icon' : '',
      rightIcon ? 'ag-input-has-right-icon' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="ag-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="ag-input-label">
            {label}
          </label>
        )}
        <div className="ag-input-container">
          {leftIcon && <div className="ag-input-icon-left">{leftIcon}</div>}
          <input ref={ref} id={inputId} className={inputClasses} {...props} />
          {rightIcon && <div className="ag-input-icon-right">{rightIcon}</div>}
        </div>
        {error ? (
          <span className="ag-input-message ag-input-message-error">{error}</span>
        ) : helperText ? (
          <span className="ag-input-message">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
