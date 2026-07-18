/**
 * AI Route Scoring Engine
 * Scores and ranks payment routes using a weighted multi-factor algorithm
 */

import type { PathRecord, ScoredRoute, RouteScoreBreakdown, RouteTag, RouteRating } from '../types';
import type { StellarAsset } from '../types/stellar';
import { SCORING_WEIGHTS, APP_CONFIG } from './constants';

// ============================================================
// Main Scoring Function
// ============================================================

/**
 * Score and rank a list of payment paths
 * Returns sorted array of ScoredRoute (best first)
 */
export function scoreAndRankRoutes(
  paths: PathRecord[],
  routeRatings: Map<string, RouteRating> = new Map()
): ScoredRoute[] {
  if (paths.length === 0) return [];

  // First, calculate raw metrics for all paths
  const routeMetrics = paths.map((path) => calculateMetrics(path));

  // Normalize scores relative to all routes in the set
  const normalizedRoutes = normalizeScores(routeMetrics, routeRatings);

  // Calculate composite scores
  const scoredRoutes = normalizedRoutes.map((route) => ({
    ...route,
    compositeScore: calculateCompositeScore(route.scores),
  }));

  // Sort by composite score (highest first)
  scoredRoutes.sort((a, b) => b.compositeScore - a.compositeScore);

  // Apply tags
  applyTags(scoredRoutes);

  // Set expiry based on rate lock duration
  const now = Date.now();
  scoredRoutes.forEach((route) => {
    route.fetchedAt = now;
    route.isExpired = false;
  });

  return scoredRoutes;
}

// ============================================================
// Metrics Calculation
// ============================================================

interface RawMetrics {
  path: PathRecord;
  exchangeRate: number;
  estimatedFee: number;
  hops: number;
  estimatedSpeedSeconds: number;
  sourceAsset: StellarAsset;
  destAsset: StellarAsset;
  routeId: string;
}

/**
 * Calculate raw metrics for a single path
 */
function calculateMetrics(path: PathRecord): RawMetrics {
  const sourceAmount = parseFloat(path.sourceAmount);
  const destAmount = parseFloat(path.destinationAmount);

  // Exchange rate: how many destination units per 1 source unit
  const exchangeRate = sourceAmount > 0 ? destAmount / sourceAmount : 0;

  // Estimate fee as the spread (difference from best theoretical rate)
  // For now, use network base fee (0.00001 XLM) + estimated spread
  const networkFee = 0.00001;
  const estimatedSpread = sourceAmount * 0.001 * (path.path.length + 1); // ~0.1% per hop
  const estimatedFee = networkFee + estimatedSpread;

  // Hops = number of intermediate assets
  const hops = path.path.length;

  // Speed estimate: ~5 seconds per hop (Stellar finalizes in ~5s per ledger)
  const estimatedSpeedSeconds = Math.max(5, 5 * (hops + 1));

  const sourceAsset: StellarAsset = {
    code: path.sourceAssetCode,
    issuer: path.sourceAssetIssuer || null,
    isNative: path.sourceAssetType === 'native',
  };

  const destAsset: StellarAsset = {
    code: path.destinationAssetCode,
    issuer: path.destinationAssetIssuer || null,
    isNative: path.destinationAssetType === 'native',
  };

  // Create a unique route ID from the path
  const routeId = generateRouteId(sourceAsset, destAsset, path.path.map((p) => ({
    code: p.code,
    issuer: p.issuer,
    isNative: p.isNative,
  })));

  return {
    path,
    exchangeRate,
    estimatedFee,
    hops,
    estimatedSpeedSeconds,
    sourceAsset,
    destAsset,
    routeId,
  };
}

// ============================================================
// Score Normalization
// ============================================================

/**
 * Normalize raw metrics to 0-100 scores relative to the route set
 */
function normalizeScores(
  metrics: RawMetrics[],
  routeRatings: Map<string, RouteRating>
): ScoredRoute[] {
  if (metrics.length === 0) return [];

  // Find min/max for each metric
  const rates = metrics.map((m) => m.exchangeRate);
  const fees = metrics.map((m) => m.estimatedFee);
  const hops = metrics.map((m) => m.hops);

  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);
  const maxFee = Math.max(...fees);
  const minFee = Math.min(...fees);
  const maxHops = Math.max(...hops);
  const minHops = Math.min(...hops);

  return metrics.map((m) => {
    // Exchange rate score: higher rate = better
    const exchangeRateScore =
      maxRate === minRate ? 100 : normalize(m.exchangeRate, minRate, maxRate) * 100;

    // Fee score: lower fee = better (invert)
    const feeScore =
      maxFee === minFee ? 100 : (1 - normalize(m.estimatedFee, minFee, maxFee)) * 100;

    // Speed score: fewer hops = better (invert)
    const speedScore =
      maxHops === minHops ? 100 : (1 - normalize(m.hops, minHops, maxHops)) * 100;

    // Liquidity score: for now, estimate based on path depth
    // Direct paths (0 hops) suggest deeper liquidity
    const liquidityScore = Math.max(0, 100 - m.hops * 20);

    // Reliability score: from on-chain feedback data
    const routeHash = generateRouteHash(m.sourceAsset, m.destAsset, m.path.path.map(p => ({
      code: p.code,
      issuer: p.issuer || null,
      isNative: p.isNative,
    })));
    const rating = routeRatings.get(routeHash);
    const reliabilityScore = rating
      ? (rating.averageRating / 5) * 100
      : 70; // Default to 70 for unrated routes

    const scores: RouteScoreBreakdown = {
      exchangeRateScore: Math.round(exchangeRateScore),
      feeScore: Math.round(feeScore),
      speedScore: Math.round(speedScore),
      liquidityScore: Math.round(liquidityScore),
      reliabilityScore: Math.round(reliabilityScore),
    };

    return {
      id: m.routeId,
      sourceAsset: m.sourceAsset,
      destAsset: m.destAsset,
      sourceAmount: m.path.sourceAmount,
      destAmount: m.path.destinationAmount,
      path: m.path.path.map((p) => ({
        code: p.code,
        issuer: p.issuer,
        isNative: p.isNative,
      })),
      exchangeRate: m.exchangeRate,
      estimatedFee: m.estimatedFee,
      hops: m.hops,
      estimatedSpeedSeconds: m.estimatedSpeedSeconds,
      compositeScore: 0, // Will be calculated next
      scores,
      tags: [],
      fetchedAt: Date.now(),
      isExpired: false,
    };
  });
}

// ============================================================
// Composite Score
// ============================================================

/**
 * Calculate weighted composite score from individual factor scores
 */
function calculateCompositeScore(scores: RouteScoreBreakdown): number {
  const composite =
    scores.exchangeRateScore * SCORING_WEIGHTS.EXCHANGE_RATE +
    scores.feeScore * SCORING_WEIGHTS.TOTAL_FEE +
    scores.speedScore * SCORING_WEIGHTS.SPEED +
    scores.liquidityScore * SCORING_WEIGHTS.LIQUIDITY +
    scores.reliabilityScore * SCORING_WEIGHTS.RELIABILITY;

  return Math.round(Math.min(100, Math.max(0, composite)));
}

// ============================================================
// Tag Assignment
// ============================================================

/**
 * Apply tags to the sorted routes
 */
function applyTags(routes: ScoredRoute[]): void {
  if (routes.length === 0) return;

  // Best Value = highest composite score (already sorted)
  routes[0].tags.push('best-value');

  // Cheapest = lowest estimated fee
  const cheapest = routes.reduce((min, r) =>
    r.estimatedFee < min.estimatedFee ? r : min
  );
  if (!cheapest.tags.includes('best-value')) {
    cheapest.tags.push('cheapest');
  }

  // Fastest = fewest hops
  const fastest = routes.reduce((min, r) =>
    r.hops < min.hops ? r : min
  );
  if (!fastest.tags.includes('best-value') && !fastest.tags.includes('cheapest')) {
    fastest.tags.push('fastest');
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Normalize a value to 0-1 range
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Generate a unique route ID from path components
 */
function generateRouteId(
  source: StellarAsset,
  dest: StellarAsset,
  path: StellarAsset[]
): string {
  const parts = [
    `${source.code}:${source.issuer || 'native'}`,
    ...path.map((p) => `${p.code}:${p.issuer || 'native'}`),
    `${dest.code}:${dest.issuer || 'native'}`,
  ];
  return parts.join('→');
}

/**
 * Generate a hash string for a route (for feedback matching)
 */
function generateRouteHash(
  source: StellarAsset,
  dest: StellarAsset,
  path: StellarAsset[]
): string {
  return generateRouteId(source, dest, path);
}

/**
 * Check if a scored route has expired (past rate lock window)
 */
export function isRouteExpired(route: ScoredRoute): boolean {
  return Date.now() - route.fetchedAt > APP_CONFIG.rateLockDurationMs;
}

/**
 * Get human-readable speed estimate
 */
export function getSpeedLabel(seconds: number): string {
  if (seconds <= 5) return 'Instant (~5s)';
  if (seconds <= 10) return 'Fast (~10s)';
  if (seconds <= 30) return 'Quick (~30s)';
  return `~${Math.round(seconds / 60)} min`;
}

/**
 * Format exchange rate for display
 */
export function formatExchangeRate(
  rate: number,
  sourceCode: string,
  destCode: string
): string {
  const precision = rate >= 100 ? 2 : rate >= 1 ? 4 : 6;
  return `1 ${sourceCode} = ${rate.toFixed(precision)} ${destCode}`;
}

/**
 * Format fee for display
 */
export function formatFee(fee: number, assetCode: string): string {
  if (fee < 0.001) return `< 0.001 ${assetCode}`;
  return `${fee.toFixed(4)} ${assetCode}`;
}

/**
 * Get score color based on value (for UI)
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-error)';
}
