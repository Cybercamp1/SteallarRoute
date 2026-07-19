/**
 * RouteCard — Displays a single scored route as a glassmorphism card
 * Shows path visualization, score ring, metrics, and collapsible fee breakdown.
 */

import React, { useState, useMemo } from 'react';
import { ROUTE_TAG_DISPLAY } from '../../types/route';
import { formatExchangeRate, formatFee, getSpeedLabel, getScoreColor } from '../../lib/scoring';
import { KNOWN_ASSETS } from '../../lib/constants';
import type { ScoredRoute } from '../../types/route';
import type { StellarAsset } from '../../types/stellar';
import styles from './RouteCard.module.css';

/* ================================================================
   Types
   ================================================================ */

export interface RouteCardProps {
  /** The scored route to display */
  route: ScoredRoute;
  /** Callback when this route is selected */
  onSelect: (route: ScoredRoute) => void;
  /** Whether this route is currently selected */
  isSelected?: boolean;
  /** Stagger animation delay in ms */
  animationDelay?: number;
  /** Callback to show route details report */
  onShowDetails?: (route: ScoredRoute) => void;
}

/* ================================================================
   Helpers
   ================================================================ */

/** Look up the emoji icon for an asset code from KNOWN_ASSETS */
function getAssetIcon(code: string): string {
  return KNOWN_ASSETS.find((a) => a.code === code)?.icon ?? '🪙';
}

/** Build the full asset path: source → [hops] → destination */
function buildPathNodes(route: ScoredRoute): { code: string; icon: string }[] {
  const nodes: { code: string; icon: string }[] = [];
  nodes.push({ code: route.sourceAsset.code, icon: getAssetIcon(route.sourceAsset.code) });

  for (const hop of route.path) {
    nodes.push({ code: hop.code, icon: getAssetIcon(hop.code) });
  }

  nodes.push({ code: route.destAsset.code, icon: getAssetIcon(route.destAsset.code) });
  return nodes;
}

/** Map route tag to badge variant color string */
function tagBgColor(color: string): string {
  if (color.includes('warning')) return 'rgba(245, 158, 11, 0.15)';
  if (color.includes('success')) return 'rgba(16, 185, 129, 0.15)';
  if (color.includes('primary')) return 'rgba(99, 102, 241, 0.15)';
  return 'rgba(99, 102, 241, 0.1)';
}

/* ================================================================
   CircularScore — SVG ring score indicator
   ================================================================ */

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface CircularScoreProps {
  score: number;
  color: string;
}

const CircularScore: React.FC<CircularScoreProps> = ({ score, color }) => {
  const offset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;

  return (
    <div className={styles.scoreWrapper} aria-label={`Score: ${score} out of 100`}>
      <svg className={styles.scoreRing} viewBox="0 0 52 52">
        <circle
          className={styles.scoreRingBg}
          cx="26"
          cy="26"
          r={RING_RADIUS}
        />
        <circle
          className={styles.scoreRingFg}
          cx="26"
          cy="26"
          r={RING_RADIUS}
          stroke={color}
          strokeDasharray={`${RING_CIRCUMFERENCE}`}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={styles.scoreValue}>{score}</span>
    </div>
  );
};

/* ================================================================
   RouteCard Component
   ================================================================ */

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onSelect,
  isSelected = false,
  animationDelay = 0,
  onShowDetails,
}) => {
  const [feeOpen, setFeeOpen] = useState(false);

  const pathNodes = useMemo(() => buildPathNodes(route), [route]);
  const scoreColor = getScoreColor(route.compositeScore);

  const cardClasses = [
    styles.card,
    isSelected && styles.cardSelected,
  ].filter(Boolean).join(' ');

  // Calculate estimated fee breakdown
  const networkFee = 0.00001;
  const spread = route.estimatedFee - networkFee;
  const anchorFee = 0; // No anchor fee for path payments

  return (
    <div
      className={cardClasses}
      style={{ animationDelay: `${animationDelay}ms` }}
      role="article"
      aria-label={`Route: ${route.sourceAsset.code} to ${route.destAsset.code}, score ${route.compositeScore}`}
    >
      {/* ---- Header: tags + score ---- */}
      <div className={styles.header}>
        <div className={styles.tags}>
          {route.tags.map((tag) => {
            const display = ROUTE_TAG_DISPLAY[tag];
            return (
              <span
                key={tag}
                className={styles.tag}
                style={{
                  color: display.color,
                  backgroundColor: tagBgColor(display.color),
                }}
              >
                <span className={styles.tagIcon} aria-hidden="true">
                  {display.icon}
                </span>
                {display.label}
              </span>
            );
          })}
        </div>
        <CircularScore score={route.compositeScore} color={scoreColor} />
      </div>

      {/* ---- Path visualization ---- */}
      <div className={styles.pathSection}>
        <div className={styles.pathRow}>
          {pathNodes.map((node, idx) => (
            <React.Fragment key={`${node.code}-${idx}`}>
              {idx > 0 && (
                <span className={styles.pathArrow} aria-hidden="true">
                  →
                </span>
              )}
              <span className={styles.pathNode}>
                <span className={styles.pathNodeIcon} aria-hidden="true">
                  {node.icon}
                </span>
                {node.code}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ---- Key metrics ---- */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Rate</span>
          <span className={styles.metricValue}>
            {formatExchangeRate(route.exchangeRate, route.sourceAsset.code, route.destAsset.code)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Fee</span>
          <span className={styles.metricValue}>
            {formatFee(route.estimatedFee, route.sourceAsset.code)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Speed</span>
          <span className={styles.metricValue}>
            {getSpeedLabel(route.estimatedSpeedSeconds)}
          </span>
        </div>
      </div>

      {/* ---- Fee breakdown toggle ---- */}
      <button
        type="button"
        className={styles.feeToggle}
        onClick={(e) => {
          e.stopPropagation();
          setFeeOpen((prev) => !prev);
        }}
        aria-expanded={feeOpen}
      >
        <svg
          className={`${styles.feeChevron} ${feeOpen ? styles.feeChevronOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        View Fee Breakdown
      </button>

      <div
        className={`${styles.feeBreakdown} ${feeOpen ? styles.feeBreakdownOpen : ''}`}
        aria-hidden={!feeOpen}
      >
        <div className={styles.feeTable}>
          <div className={styles.feeRow}>
            <span className={styles.feeRowLabel}>Network fee</span>
            <span className={styles.feeRowValue}>
              {networkFee.toFixed(7)} XLM
            </span>
          </div>
          <div className={styles.feeRow}>
            <span className={styles.feeRowLabel}>Spread (est.)</span>
            <span className={styles.feeRowValue}>
              {spread.toFixed(7)} {route.sourceAsset.code}
            </span>
          </div>
          <div className={styles.feeRow}>
            <span className={styles.feeRowLabel}>Anchor fee</span>
            <span className={styles.feeRowValue}>
              {anchorFee.toFixed(7)} {route.sourceAsset.code}
            </span>
          </div>
          <div className={`${styles.feeRow} ${styles.feeRowTotal}`}>
            <span className={styles.feeRowLabel}>Total fee</span>
            <span className={styles.feeRowValue}>
              {formatFee(route.estimatedFee, route.sourceAsset.code)}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Actions ---- */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.aiInsightsBtn}
          onClick={(e) => {
            e.stopPropagation();
            onShowDetails?.(route);
          }}
        >
          💡 AI Insights
        </button>
        {isSelected ? (
          <span className={styles.selectedLabel}>
            <svg
              className={styles.selectedCheck}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Selected
          </span>
        ) : (
          <button
            type="button"
            className={styles.selectBtn}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(route);
            }}
          >
            Select Route
          </button>
        )}
      </div>
    </div>
  );
};

RouteCard.displayName = 'RouteCard';
