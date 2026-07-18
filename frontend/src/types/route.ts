/**
 * Route scoring and comparison type definitions
 */

import type { StellarAsset } from './stellar';

/** A scored payment route */
export interface ScoredRoute {
  /** Unique ID for this route (hash of path) */
  id: string;

  /** Source asset */
  sourceAsset: StellarAsset;

  /** Destination asset */
  destAsset: StellarAsset;

  /** Amount being sent */
  sourceAmount: string;

  /** Amount to be received */
  destAmount: string;

  /** Intermediate path assets (the hops) */
  path: StellarAsset[];

  /** Exchange rate (1 source = X dest) */
  exchangeRate: number;

  /** Estimated total fee in source asset units */
  estimatedFee: number;

  /** Number of hops (path length) */
  hops: number;

  /** Estimated speed in seconds */
  estimatedSpeedSeconds: number;

  /** Composite score (0-100) from AI scoring engine */
  compositeScore: number;

  /** Individual factor scores */
  scores: RouteScoreBreakdown;

  /** Tags for UI display */
  tags: RouteTag[];

  /** Timestamp when this route was fetched */
  fetchedAt: number;

  /** Whether this route is still valid (within rate lock window) */
  isExpired: boolean;
}

/** Breakdown of individual scoring factors */
export interface RouteScoreBreakdown {
  exchangeRateScore: number;   // 0-100
  feeScore: number;            // 0-100
  speedScore: number;          // 0-100
  liquidityScore: number;      // 0-100
  reliabilityScore: number;    // 0-100
}

/** Tag applied to top routes */
export type RouteTag =
  | 'best-value'    // Highest composite score
  | 'cheapest'      // Lowest fee
  | 'fastest';      // Fewest hops / quickest

/** Display metadata for a route tag */
export interface RouteTagDisplay {
  tag: RouteTag;
  label: string;
  icon: string;
  color: string;
}

/** Route tag display configuration */
export const ROUTE_TAG_DISPLAY: Record<RouteTag, RouteTagDisplay> = {
  'best-value': {
    tag: 'best-value',
    label: 'Best Value',
    icon: '🏆',
    color: 'var(--color-warning)',
  },
  cheapest: {
    tag: 'cheapest',
    label: 'Cheapest',
    icon: '💰',
    color: 'var(--color-success)',
  },
  fastest: {
    tag: 'fastest',
    label: 'Fastest',
    icon: '⚡',
    color: 'var(--color-primary)',
  },
};

/** Anchor rating data (from Soroban contract) */
export interface RouteRating {
  routeHash: string;
  totalRatings: number;
  averageRating: number;  // 1-5 scale
  totalTransfers: number;
}

/** Fee breakdown for display */
export interface FeeBreakdown {
  networkFee: string;
  spread: string;
  anchorFee: string;
  totalFee: string;
  totalFeeUsd: string;
}
