import React, { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Modal title shown in the header */
  title?: string;
  /** Modal body content */
  children: React.ReactNode;
  /** Width preset */
  size?: ModalSize;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // ---- Mount / Unmount lifecycle ----
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      setMounted(true);
      setExiting(false);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else if (mounted) {
      // Begin exit animation
      setExiting(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // After exit animation completes, unmount
  const handleAnimationEnd = useCallback(() => {
    if (exiting) {
      setMounted(false);
      setExiting(false);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    }
  }, [exiting]);

  // ---- Focus trap ----
  useEffect(() => {
    if (!mounted || exiting) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Focus the first focusable element
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusable = modal.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusables = modal.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mounted, exiting, onClose]);

  if (!mounted) return null;

  const overlayClasses = [
    styles.overlay,
    exiting ? styles.overlayExit : styles.overlayEnter,
  ].join(' ');

  const modalClasses = [
    styles.modal,
    styles[size],
    exiting ? styles.modalExit : styles.modalEnter,
  ].join(' ');

  return createPortal(
    <div
      className={overlayClasses}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
              type="button"
            >
              <svg
                className={styles.closeIcon}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

Modal.displayName = 'Modal';
