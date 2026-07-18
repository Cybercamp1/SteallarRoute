/**
 * Analytics Service — PostHog Integration
 * Tracks user behavior and product metrics
 */

import posthog from 'posthog-js';

// ============================================================
// Initialization
// ============================================================

let isInitialized = false;

/**
 * Initialize PostHog analytics
 * Call once at app startup
 */
export function initAnalytics(): void {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('[Analytics] PostHog API key not set. Analytics disabled.');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false, // We track events manually for precision
      persistence: 'localStorage',
      loaded: () => {
        isInitialized = true;
        console.log('[Analytics] PostHog initialized');
      },
    });
  } catch (error) {
    console.error('[Analytics] Failed to initialize PostHog:', error);
  }
}

// ============================================================
// Event Tracking
// ============================================================

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!isInitialized) return;

  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[Analytics] Failed to track event "${eventName}":`, error);
  }
}

/**
 * Track a page view
 */
export function trackPageView(pageName: string): void {
  trackEvent('page_view', { page: pageName });
}

// ============================================================
// User Identity
// ============================================================

/**
 * Identify user by their wallet public key
 */
export function identifyUser(publicKey: string): void {
  if (!isInitialized) return;

  try {
    posthog.identify(publicKey, {
      wallet_type: 'freighter',
      network: 'testnet',
    });
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
}

/**
 * Reset user identity (on disconnect)
 */
export function resetIdentity(): void {
  if (!isInitialized) return;

  try {
    posthog.reset();
  } catch (error) {
    console.error('[Analytics] Failed to reset identity:', error);
  }
}

// ============================================================
// Transfer Funnel Events
// ============================================================

export const TransferAnalytics = {
  started: (sourceAsset: string, destAsset: string) =>
    trackEvent('transfer_started', { sourceAsset, destAsset }),

  amountEntered: (amount: string, assetCode: string) =>
    trackEvent('amount_entered', { amount, assetCode }),

  currencySelected: (type: 'source' | 'destination', code: string) =>
    trackEvent('currency_selected', { type, code }),

  routesCompared: (routeCount: number) =>
    trackEvent('routes_compared', { routeCount }),

  routeSelected: (routeId: string, score: number, tag?: string) =>
    trackEvent('route_selected', { routeId, score, tag }),

  confirmed: (amount: string, sourceAsset: string, destAsset: string) =>
    trackEvent('transfer_confirmed', { amount, sourceAsset, destAsset }),

  completed: (txHash: string, amount: string) =>
    trackEvent('transfer_completed', { txHash, amount }),

  failed: (error: string) =>
    trackEvent('transfer_failed', { error }),

  feeBreakdownViewed: (routeId: string) =>
    trackEvent('fee_breakdown_viewed', { routeId }),
};

export const WalletAnalytics = {
  connected: (publicKey: string) =>
    trackEvent('wallet_connected', { publicKey: publicKey.slice(0, 8) + '...' }),

  disconnected: () =>
    trackEvent('wallet_disconnected', {}),

  connectionFailed: (error: string) =>
    trackEvent('wallet_connection_failed', { error }),
};

export const FeedbackAnalytics = {
  submitted: (transferId: string, rating: number) =>
    trackEvent('feedback_submitted', { transferId, rating }),

  skipped: (transferId: string) =>
    trackEvent('feedback_skipped', { transferId }),
};
