import React, { useId, useState, useCallback } from 'react';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message (also sets error styling) */
  error?: string;
  /** Helper / description text shown below input */
  helperText?: string;
  /** Leading icon */
  icon?: React.ReactNode;
  /** Size preset */
  size?: InputSize;
}

const sizeMap: Record<InputSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      error,
      helperText,
      icon,
      size = 'md',
      disabled = false,
      className,
      id: idProp,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const [focused, setFocused] = useState(false);

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    const containerClasses = [
      styles.inputContainer,
      sizeMap[size],
      focused && styles.isFocused,
      error && styles.isError,
      disabled && styles.isDisabled,
      icon && styles.hasIcon,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(' ');

    const describedBy = [error && errorId, helperText && !error && helperId]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}

        <div className={containerClasses}>
          {icon && <span className={styles.iconWrapper} aria-hidden="true">{icon}</span>}
          <input
            ref={ref}
            id={id}
            className={styles.inputField}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />
        </div>

        {error && (
          <span id={errorId} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
