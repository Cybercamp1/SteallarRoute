import React from 'react';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  /** Diameter preset */
  size?: SpinnerSize;
  /** Additional className */
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
}) => {
  const classes = [styles.spinner, styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading…</span>
    </span>
  );
};

Spinner.displayName = 'Spinner';
