import React from 'react';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'highlighted' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Inner padding preset */
  padding?: CardPadding;
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Card body */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Click handler (makes card focusable) */
  onClick?: () => void;
}

const paddingMap: Record<CardPadding, string | undefined> = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  header,
  footer,
  children,
  className,
  onClick,
}) => {
  const hasSlots = Boolean(header || footer);

  const classes = [
    styles.card,
    variant !== 'default' && styles[variant],
    paddingMap[padding],
    hasSlots && styles.hasSlots,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Tag = onClick ? 'button' : 'div';

  const interactiveProps = onClick
    ? {
        onClick,
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <Tag className={classes} {...(interactiveProps as React.HTMLAttributes<HTMLElement>)}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={hasSlots ? styles.body : undefined}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </Tag>
  );
};

Card.displayName = 'Card';
