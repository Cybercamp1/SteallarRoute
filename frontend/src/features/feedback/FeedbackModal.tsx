/**
 * FeedbackModal — Post-transfer user feedback
 * Star rating, quick-select tags, optional comment, animated thank-you state.
 */

import { useState, useCallback, useEffect } from 'react';
import styles from './FeedbackModal.module.css';
import { Modal, Button } from '../../components/ui';
import {
  FEEDBACK_TAG_DISPLAY,
  type FeedbackTag,
} from '../../types/transfer';
import { APP_CONFIG } from '../../lib/constants';

/* ─── Props ─── */
export interface FeedbackModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** The transfer this feedback pertains to */
  transferId: string;
  /** The route that was used */
  routeId: string;
}

/* ─── Constants ─── */
const ALL_TAGS = Object.keys(FEEDBACK_TAG_DISPLAY) as FeedbackTag[];
const MAX_COMMENT = APP_CONFIG.feedbackMaxCommentLength; // 500

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'] as const;

/* ─── Star SVG (reused for both filled & empty) ─── */
const StarSVG: React.FC<{ filled: boolean; className?: string }> = ({ filled, className }) => (
  <svg
    className={`${styles.starIcon} ${className ?? ''}`}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

/* ═══════════════════════════════════════════
   FEEDBACK MODAL COMPONENT
   ═══════════════════════════════════════════ */

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  transferId,
  routeId,
}) => {
  /* ---- State ---- */
  const [rating, setRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  /* ---- Reset on open ---- */
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoveredStar(0);
      setSelectedTags([]);
      setComment('');
      setIsSubmitting(false);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  /* ---- Auto-close after thank-you ---- */
  useEffect(() => {
    if (!isSubmitted) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isSubmitted, onClose]);

  /* ---- Handlers ---- */
  const handleTagToggle = useCallback((tag: FeedbackTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length <= MAX_COMMENT) {
        setComment(e.target.value);
      }
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    setIsSubmitting(true);

    try {
      // Persist feedback locally
      const feedback = {
        transferId,
        routeId,
        rating,
        tags: selectedTags,
        comment: comment.trim(),
        submittedAt: Date.now(),
      };

      // Save to localStorage as simple persistence
      const stored = JSON.parse(localStorage.getItem('anchor-route-feedback') || '[]');
      stored.push(feedback);
      localStorage.setItem('anchor-route-feedback', JSON.stringify(stored));

      // Short delay for UX polish
      await new Promise((r) => setTimeout(r, 600));
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setIsSubmitting(false);
    }
  }, [rating, selectedTags, comment, transferId, routeId]);

  /* ---- Derived ---- */
  const displayRating = hoveredStar || rating;
  const charCount = comment.length;
  const charCounterClass =
    charCount >= MAX_COMMENT
      ? styles.charCounterError
      : charCount >= MAX_COMMENT * 0.9
        ? styles.charCounterWarning
        : '';

  /* ========================================
     THANK YOU STATE
     ======================================== */
  if (isSubmitted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Feedback Submitted">
        <div className={styles.thankYou}>
          <div className={styles.checkmarkCircle}>
            <svg className={styles.checkmarkIcon} viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className={styles.thankYouTitle}>Thanks for your feedback!</h3>
          <p className={styles.thankYouSubtitle}>
            Your rating helps improve route recommendations for everyone.
          </p>
        </div>
      </Modal>
    );
  }

  /* ========================================
     FEEDBACK FORM
     ======================================== */
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Your Transfer">
      <div className={styles.content}>
        {/* ── Star Rating ── */}
        <div>
          <span className={styles.sectionLabel}>How was your experience?</span>
          <div
            className={styles.starRating}
            role="radiogroup"
            aria-label="Rating"
            onMouseLeave={() => setHoveredStar(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= displayRating;
              const isHovered = hoveredStar > 0 && star <= hoveredStar;
              const isSelected = star <= rating;

              return (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${isSelected ? styles.starSelected : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  role="radio"
                  aria-checked={star === rating}
                  aria-label={`${star} star${star > 1 ? 's' : ''} — ${RATING_LABELS[star]}`}
                >
                  <StarSVG
                    filled={isFilled}
                    className={
                      isFilled
                        ? isHovered
                          ? styles.starHovered
                          : styles.starFilled
                        : styles.starEmpty
                    }
                  />
                </button>
              );
            })}
          </div>
          <div className={styles.ratingHint} aria-live="polite">
            {displayRating > 0 ? RATING_LABELS[displayRating] : 'Tap a star to rate'}
          </div>
        </div>

        {/* ── Quick Tags ── */}
        <div className={styles.tagsSection}>
          <span className={styles.sectionLabel}>Quick feedback</span>
          <div className={styles.tagsGrid} role="group" aria-label="Feedback tags">
            {ALL_TAGS.map((tag) => {
              const { label, emoji, positive } = FEEDBACK_TAG_DISPLAY[tag];
              const isSelected = selectedTags.includes(tag);
              const selectedClass = isSelected
                ? positive
                  ? styles.tagPositiveSelected
                  : styles.tagNegativeSelected
                : '';

              return (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tag} ${selectedClass}`}
                  onClick={() => handleTagToggle(tag)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.tagEmoji} aria-hidden="true">
                    {emoji}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Comment ── */}
        <div className={styles.commentSection}>
          <label className={styles.sectionLabel} htmlFor="feedback-comment">
            Comments (optional)
          </label>
          <textarea
            id="feedback-comment"
            className={styles.textarea}
            value={comment}
            onChange={handleCommentChange}
            placeholder="Tell us about your experience..."
            maxLength={MAX_COMMENT}
            rows={4}
          />
          <span className={`${styles.charCounter} ${charCounterClass}`}>
            {charCount}/{MAX_COMMENT}
          </span>
        </div>

        {/* ── Actions ── */}
        <div className={styles.actions}>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Skip
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={rating === 0}
          >
            Submit Feedback
          </Button>
        </div>
      </div>
    </Modal>
  );
};

FeedbackModal.displayName = 'FeedbackModal';
