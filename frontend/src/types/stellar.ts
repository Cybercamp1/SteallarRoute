/**
 * Stellar-specific TypeScript type definitions
 */

/** Represents a Stellar asset (native XLM or issued token) */
export interface StellarAsset {
  code: string;
  issuer: string | null;
  isNative: boolean;
}

/** Account information from Horizon */
export interface AccountInfo {
  publicKey: string;
  sequence: string;
  balances: AccountBalance[];
  isActive: boolean;
}

/** Individual balance entry */
export interface AccountBalance {
  assetType: string;
  assetCode: string;
  assetIssuer: string;
  balance: string;
  limit?: string;
}

/** Horizon path record from path-finding endpoints */
export interface PathRecord {
  sourceAssetType: string;
  sourceAssetCode: string;
  sourceAssetIssuer: string;
  sourceAmount: string;
  destinationAssetType: string;
  destinationAssetCode: string;
  destinationAssetIssuer: string;
  destinationAmount: string;
  path: StellarAsset[];
}

/** Transaction result from Horizon */
export interface TransactionResult {
  hash: string;
  ledger: number;
  successful: boolean;
  createdAt: string;
  sourceAccount: string;
  fee: string;
  operationCount: number;
  envelopeXdr: string;
  resultXdr: string;
}

/** Stellar.toml parsed data */
export interface StellarTomlData {
  transferServer?: string;
  transferServerSep24?: string;
  directPaymentServer?: string;
  kycServer?: string;
  currencies?: TomlCurrency[];
  documentation?: {
    orgName?: string;
    orgDescription?: string;
    orgUrl?: string;
  };
}

/** Currency entry from stellar.toml */
export interface TomlCurrency {
  code: string;
  issuer: string;
  displayDecimals: number;
  name: string;
  description?: string;
  image?: string;
}

/** Wallet connection state */
export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

/** Network type */
export type NetworkType = 'testnet' | 'mainnet';
