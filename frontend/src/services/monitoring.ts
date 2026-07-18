/**
 * Error Monitoring Service — Sentry Integration
 * Tracks errors, performance, and user breadcrumbs
 */

import * as Sentry from '@sentry/react';

// ============================================================
// Initialization
// ============================================================

/**
 * Initialize Sentry error monitoring
 * Call once at app startup
 */
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Monitoring] Sentry DSN not set. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: `anchor-route@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.2, // Sample 20% of transactions for performance
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out known non-critical errors
    beforeSend(event) {
      // Don't report user-rejected wallet signatures
      if (event.exception?.values?.some((e) =>
        e.value?.includes('User rejected') ||
        e.value?.includes('SIGNING_REJECTED')
      )) {
        return null;
      }
      return event;
    },
  });

  console.log('[Monitoring] Sentry initialized');
}

// ============================================================
// Error Reporting
// ============================================================

/**
 * Report an error to Sentry with context
 */
export function reportError(
  error: Error,
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Report a message to Sentry
 */
export function reportMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  Sentry.captureMessage(message, level);
}

// ============================================================
// User Context
// ============================================================

/**
 * Set user context in Sentry (after wallet connection)
 */
export function setUserContext(publicKey: string): void {
  Sentry.setUser({
    id: publicKey,
    username: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
  });
}

/**
 * Clear user context (on disconnect)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

// ============================================================
// Breadcrumbs
// ============================================================

/**
 * Add a breadcrumb for transfer flow tracking
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

// ============================================================
// Performance
// ============================================================

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({ name, op });
}

// ============================================================
// Error Boundary Component
// ============================================================

export const SentryErrorBoundary = Sentry.ErrorBoundary;
