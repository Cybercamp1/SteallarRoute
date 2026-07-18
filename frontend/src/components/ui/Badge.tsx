import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  /** Semantic color variant */
  variant?: BadgeVariant;
  /** Badge text */
  children: React.ReactNode;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  icon,
  className,
}) => {
  const classes = [styles.badge, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
