/**
 * Transfer flow type definitions
 */

import type { StellarAsset } from './stellar';

/** Transfer flow step */
export type TransferStep =
  | 'input'        // Entering amount and currencies
  | 'comparing'    // Fetching and comparing routes
  | 'routes'       // Viewing route comparison
  | 'confirming'   // Review and confirmation
  | 'executing'    // Transaction in progress
  | 'success'      // Transfer completed
  | 'failed';      // Transfer failed

/** Transfer input data */
export interface TransferInput {
  sourceAssetCode: string;
  destAssetCode: string;
  amount: string;
  direction: 'send' | 'receive'; // strict-send vs strict-receive
}

/** A completed or pending transfer */
export interface TransferRecord {
  id: string;
  transactionHash: string;
  sourceAsset: StellarAsset;
  destAsset: StellarAsset;
  sourceAmount: string;
  destAmount: string;
  exchangeRate: number;
  totalFee: string;
  routeId: string;
  routePath: StellarAsset[];
  status: TransferStatus;
  createdAt: number;
  completedAt?: number;
  score: number;
  feedbackSubmitted: boolean;
}

/** Transfer status */
export type TransferStatus =
  | 'pending'
  | 'submitted'
  | 'confirmed'
  | 'failed';

/** User feedback for a transfer */
export interface TransferFeedback {
  transferId: string;
  rating: number;       // 1-5
  tags: FeedbackTag[];
  comment: string;
  submittedAt: number;
}

/** Quick feedback tags */
export type FeedbackTag =
  | 'fast'
  | 'good-rate'
  | 'smooth'
  | 'reliable'
  | 'expensive'
  | 'slow'
  | 'confusing';

/** Feedback tag display */
export const FEEDBACK_TAG_DISPLAY: Record<FeedbackTag, { label: string; emoji: string; positive: boolean }> = {
  fast: { label: 'Fast', emoji: '⚡', positive: true },
  'good-rate': { label: 'Good Rate', emoji: '💰', positive: true },
  smooth: { label: 'Smooth', emoji: '✨', positive: true },
  reliable: { label: 'Reliable', emoji: '🛡️', positive: true },
  expensive: { label: 'Expensive', emoji: '💸', positive: false },
  slow: { label: 'Slow', emoji: '🐌', positive: false },
  confusing: { label: 'Confusing', emoji: '😕', positive: false },
};

/** Dashboard statistics */
export interface DashboardStats {
  totalTransfers: number;
  totalVolume: string;
  averageSavings: string;
  favoriteRoute: string;
  successRate: number;
}
