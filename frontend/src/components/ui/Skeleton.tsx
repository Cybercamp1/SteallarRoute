import React from 'react';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card';

export interface SkeletonProps {
  /** Shape variant */
  variant?: SkeletonVariant;
  /** CSS width value */
  width?: string | number;
  /** CSS height value */
  height?: string | number;
  /** CSS border-radius override */
  borderRadius?: string | number;
  /** Additional className */
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  borderRadius,
  className,
}) => {
  const classes = [styles.skeleton, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;
  if (borderRadius !== undefined)
    style.borderRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;

  // Circle defaults: equal width & height
  if (variant === 'circle') {
    const size = width ?? height ?? 40;
    style.width = typeof size === 'number' ? `${size}px` : size;
    style.height = style.width;
  }

  return (
    <div
      className={classes}
      style={style}
      role="presentation"
      aria-hidden="true"
    />
  );
};

Skeleton.displayName = 'Skeleton';
