/**
 * Freighter Wallet Adapter
 * Wraps @stellar/freighter-api for wallet connection, signing, and network management
 */

import {
  isConnected,
  getAddress,
  signTransaction,
  isAllowed,
  requestAccess,
  getNetwork,
} from '@stellar/freighter-api';
import { ACTIVE_NETWORK } from './constants';

// ============================================================
// Connection Status
// ============================================================

/**
 * Check if Freighter browser extension is installed
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * Check if this app is already allowed/connected in Freighter
 */
export async function isFreighterAllowed(): Promise<boolean> {
  try {
    const result = await isAllowed();
    return result.isAllowed;
  } catch {
    return false;
  }
}

// ============================================================
// Connection
// ============================================================

/**
 * Request connection to Freighter and get the user's public key
 * This will prompt the user to allow the app in Freighter
 */
export async function connectFreighter(): Promise<string> {
  // Check if Freighter is installed
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterError(
      'Freighter wallet is not installed. Please install it from https://freighter.app',
      'NOT_INSTALLED'
    );
  }

  // Request permission if not already allowed
  const allowed = await isFreighterAllowed();
  if (!allowed) {
    try {
      await requestAccess();
    } catch {
      throw new FreighterError(
        'User denied permission to connect wallet',
        'PERMISSION_DENIED'
      );
    }
  }

  // Get the public key
  try {
    const result = await getAddress();
    if (!result.address) {
      throw new FreighterError(
        'Failed to get public key from Freighter',
        'NO_PUBLIC_KEY'
      );
    }
    return result.address;
  } catch (error) {
    if (error instanceof FreighterError) throw error;
    throw new FreighterError(
      'Failed to connect to Freighter wallet',
      'CONNECTION_FAILED'
    );
  }
}

/**
 * Get the currently connected public key (without prompting)
 */
export async function getConnectedPublicKey(): Promise<string | null> {
  try {
    const allowed = await isFreighterAllowed();
    if (!allowed) return null;

    const result = await getAddress();
    return result.address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Transaction Signing
// ============================================================

/**
 * Sign a transaction XDR using Freighter
 * The user will be prompted to approve in the Freighter popup
 */
export async function signWithFreighter(
  transactionXdr: string,
  networkPassphrase?: string
): Promise<string> {
  try {
    const result = await signTransaction(transactionXdr, {
      networkPassphrase: networkPassphrase ?? ACTIVE_NETWORK.networkPassphrase,
    });

    if (!result.signedTxXdr) {
      throw new FreighterError(
        'Transaction signing was cancelled or failed',
        'SIGNING_FAILED'
      );
    }

    return result.signedTxXdr;
  } catch (error) {
    if (error instanceof FreighterError) throw error;
    throw new FreighterError(
      'User rejected the transaction signature request',
      'SIGNING_REJECTED'
    );
  }
}

// ============================================================
// Network
// ============================================================

/**
 * Get the current network selected in Freighter
 */
export async function getFreighterNetwork(): Promise<string> {
  try {
    const result = await getNetwork();
    return result.network || 'TESTNET';
  } catch {
    return 'TESTNET';
  }
}

/**
 * Check if Freighter is on the correct network
 */
export async function isCorrectNetwork(): Promise<boolean> {
  const network = await getFreighterNetwork();
  const expected = ACTIVE_NETWORK.name === 'Testnet' ? 'TESTNET' : 'PUBLIC';
  return network.toUpperCase() === expected;
}

// ============================================================
// Error Handling
// ============================================================

export type FreighterErrorCode =
  | 'NOT_INSTALLED'
  | 'PERMISSION_DENIED'
  | 'NO_PUBLIC_KEY'
  | 'CONNECTION_FAILED'
  | 'SIGNING_FAILED'
  | 'SIGNING_REJECTED'
  | 'WRONG_NETWORK';

export class FreighterError extends Error {
  public code: FreighterErrorCode;

  constructor(message: string, code: FreighterErrorCode) {
    super(message);
    this.name = 'FreighterError';
    this.code = code;
  }
}

/**
 * Get user-friendly error message for Freighter errors
 */
export function getFreighterErrorMessage(error: unknown): string {
  if (error instanceof FreighterError) {
    switch (error.code) {
      case 'NOT_INSTALLED':
        return 'Please install the Freighter wallet extension to continue.';
      case 'PERMISSION_DENIED':
        return 'Wallet connection was denied. Please allow AnchorRoute in Freighter.';
      case 'NO_PUBLIC_KEY':
        return 'Could not retrieve your wallet address. Please try again.';
      case 'CONNECTION_FAILED':
        return 'Failed to connect to Freighter. Please try again.';
      case 'SIGNING_FAILED':
        return 'Transaction signing failed. Please try again.';
      case 'SIGNING_REJECTED':
        return 'You rejected the transaction. No funds were sent.';
      case 'WRONG_NETWORK':
        return `Please switch Freighter to ${ACTIVE_NETWORK.name} network.`;
      default:
        return 'An unexpected wallet error occurred.';
    }
  }
  return 'An unexpected error occurred with your wallet.';
}

/**
 * Get the Freighter download URL
 */
export const FREIGHTER_DOWNLOAD_URL = 'https://www.freighter.app/';
