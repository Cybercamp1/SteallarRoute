/**
 * AnchorRoute — Application Constants
 * Network configuration, asset definitions, and endpoint URLs
 */

// ============================================================
// Network Configuration
// ============================================================

export const STELLAR_NETWORKS = {
  TESTNET: {
    name: 'Testnet',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    friendbotUrl: 'https://friendbot.stellar.org',
    explorerUrl: 'https://stellar.expert/explorer/testnet',
  },
  MAINNET: {
    name: 'Public',
    horizonUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://mainnet.sorobanrpc.com',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    explorerUrl: 'https://stellar.expert/explorer/public',
  },
} as const;

// Active network — switch to MAINNET for production
export const ACTIVE_NETWORK = STELLAR_NETWORKS.TESTNET;

// ============================================================
// Smart Contract
// ============================================================

// Deployed AnchorRoute Soroban contract ID (testnet)
export const ANCHOR_ROUTE_CONTRACT_ID = 'CDW3LGL5L3G737V4DHYF64AECZMXG45MHTKDRN5YGLQ24RCRB64QZMXG';

// ============================================================
// Well-Known Assets (Testnet)
// ============================================================

export interface AssetDefinition {
  code: string;
  issuer: string | null; // null for native XLM
  name: string;
  symbol: string;
  decimals: number;
  icon: string;
  isNative?: boolean;
}

export const KNOWN_ASSETS: AssetDefinition[] = [
  {
    code: 'XLM',
    issuer: null,
    name: 'Stellar Lumens',
    symbol: 'XLM',
    decimals: 7,
    icon: '✦',
    isNative: true,
  },
  {
    code: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    name: 'USD Coin',
    symbol: '$',
    decimals: 2,
    icon: '💵',
  },
  {
    code: 'EURC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    name: 'Euro Coin',
    symbol: '€',
    decimals: 2,
    icon: '💶',
  },
  {
    code: 'BRL',
    issuer: 'GDVKY2GU2DRBE3EUUR3EBLQFAV6MSMDHDTJAEVKL6MZG2FCPGYPLFO5F',
    name: 'Brazilian Real',
    symbol: 'R$',
    decimals: 2,
    icon: '🇧🇷',
  },
  {
    code: 'NGN',
    issuer: 'GCKWU55HNKPJAP2RSGCXKYNLQAOEACDH7JBWZGESGWD6EFGHFP2SJP6Z',
    name: 'Nigerian Naira',
    symbol: '₦',
    decimals: 2,
    icon: '🇳🇬',
  },
  {
    code: 'PHP',
    issuer: 'GCKWU55HNKPJAP2RSGCXKYNLQAOEACDH7JBWZGESGWD6EFGHFP2SJP6Z',
    name: 'Philippine Peso',
    symbol: '₱',
    decimals: 2,
    icon: '🇵🇭',
  },
  {
    code: 'GHS',
    issuer: 'GCKWU55HNKPJAP2RSGCXKYNLQAOEACDH7JBWZGESGWD6EFGHFP2SJP6Z',
    name: 'Ghanaian Cedi',
    symbol: 'GH₵',
    decimals: 2,
    icon: '🇬🇭',
  },
  {
    code: 'KES',
    issuer: 'GCKWU55HNKPJAP2RSGCXKYNLQAOEACDH7JBWZGESGWD6EFGHFP2SJP6Z',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimals: 2,
    icon: '🇰🇪',
  },
  {
    code: 'ARS',
    issuer: 'GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS',
    name: 'Argentine Peso',
    symbol: 'AR$',
    decimals: 2,
    icon: '🇦🇷',
  },
  {
    code: 'INR',
    issuer: 'GCKWU55HNKPJAP2RSGCXKYNLQAOEACDH7JBWZGESGWD6EFGHFP2SJP6Z',
    name: 'Indian Rupee',
    symbol: '₹',
    decimals: 2,
    icon: '🇮🇳',
  },
];

// ============================================================
// Known Anchors (for stellar.toml discovery)
// ============================================================

export interface AnchorDefinition {
  name: string;
  domain: string;
  description: string;
  supportedAssets: string[];
  region: string;
}

export const KNOWN_ANCHORS: AnchorDefinition[] = [
  {
    name: 'Circle (USDC)',
    domain: 'centre.io',
    description: 'USD Coin issuer',
    supportedAssets: ['USDC'],
    region: 'Global',
  },
  {
    name: 'Anclap',
    domain: 'anclap.com',
    description: 'Argentine peso anchor',
    supportedAssets: ['ARS'],
    region: 'Latin America',
  },
  {
    name: 'Cowrie Exchange',
    domain: 'cowrie.exchange',
    description: 'Nigerian Naira anchor',
    supportedAssets: ['NGN'],
    region: 'Africa',
  },
  {
    name: 'Flutterwave',
    domain: 'flutterwave.com',
    description: 'Multi-currency African anchor',
    supportedAssets: ['NGN', 'GHS', 'KES'],
    region: 'Africa',
  },
  {
    name: 'Coins.ph',
    domain: 'coins.ph',
    description: 'Philippine peso anchor',
    supportedAssets: ['PHP'],
    region: 'Southeast Asia',
  },
];

// ============================================================
// Route Scoring Weights (AI Configuration)
// ============================================================

export const SCORING_WEIGHTS = {
  EXCHANGE_RATE: 0.35,   // How close to mid-market rate
  TOTAL_FEE: 0.30,       // All-in cost (network + spread + anchor)
  SPEED: 0.15,           // Estimated time (fewer hops = faster)
  LIQUIDITY: 0.10,       // Order book depth
  RELIABILITY: 0.10,     // Historical success rate from user feedback
} as const;

// ============================================================
// Application Config
// ============================================================

export const APP_CONFIG = {
  name: 'AnchorRoute',
  tagline: 'AI-Powered Cross-Border Remittance on Stellar',
  description: 'Find the cheapest, fastest path for cross-border payments using Stellar\'s anchor network.',
  version: '1.0.0',
  github: 'https://github.com/stellarrouter/anchor-route',
  maxPathHops: 6,
  rateLockDurationMs: 60_000, // 60 seconds rate lock
  maxRecentTransfers: 20,
  defaultSlippageBps: 100, // 1% slippage tolerance (in basis points)
  feedbackMaxCommentLength: 500,
  transferPollingIntervalMs: 3_000,
} as const;

// ============================================================
// Analytics Event Names
// ============================================================

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_DISCONNECTED: 'wallet_disconnected',
  TRANSFER_STARTED: 'transfer_started',
  AMOUNT_ENTERED: 'amount_entered',
  CURRENCY_SELECTED: 'currency_selected',
  ROUTES_COMPARED: 'routes_compared',
  ROUTE_SELECTED: 'route_selected',
  TRANSFER_CONFIRMED: 'transfer_confirmed',
  TRANSFER_COMPLETED: 'transfer_completed',
  TRANSFER_FAILED: 'transfer_failed',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  FEE_BREAKDOWN_VIEWED: 'fee_breakdown_viewed',
  DASHBOARD_VIEWED: 'dashboard_viewed',
} as const;
