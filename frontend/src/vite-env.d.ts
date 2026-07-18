/**
 * Environment variable declarations for Vite
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_ANCHOR_ROUTE_CONTRACT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
