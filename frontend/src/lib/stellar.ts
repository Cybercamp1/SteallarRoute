/**
 * Stellar SDK Wrapper
 * Provides a clean API for interacting with Stellar Horizon and executing transactions
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { ACTIVE_NETWORK } from './constants';
import type { AccountInfo, AccountBalance, PathRecord, TransactionResult, StellarAsset } from '../types/stellar';

// ============================================================
// Horizon Server Instance
// ============================================================

const server = new StellarSdk.Horizon.Server(ACTIVE_NETWORK.horizonUrl);

/**
 * Get the Horizon server instance
 */
export function getServer(): StellarSdk.Horizon.Server {
  return server;
}

// ============================================================
// Account Operations
// ============================================================

/**
 * Load account information from Horizon
 */
export async function loadAccount(publicKey: string): Promise<AccountInfo> {
  try {
    const account = await server.loadAccount(publicKey);
    const balances: AccountBalance[] = account.balances.map((b: any) => {
      if (b.asset_type === 'native') {
        return {
          assetType: 'native',
          assetCode: 'XLM',
          assetIssuer: '',
          balance: b.balance,
        };
      }
      return {
        assetType: b.asset_type,
        assetCode: b.asset_code || '',
        assetIssuer: b.asset_issuer || '',
        balance: b.balance,
        limit: b.limit,
      };
    });

    return {
      publicKey,
      sequence: account.sequenceNumber(),
      balances,
      isActive: true,
    };
  } catch (error: unknown) {
    if (error instanceof Error && 'response' in error) {
      const httpError = error as { response?: { status?: number } };
      if (httpError.response?.status === 404) {
        return {
          publicKey,
          sequence: '0',
          balances: [],
          isActive: false,
        };
      }
    }
    throw error;
  }
}

/**
 * Fund an account on testnet via Friendbot
 */
export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${ACTIVE_NETWORK.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`
    );
    if (!response.ok) {
      throw new Error(`Friendbot error: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to fund account:', error);
    return false;
  }
}

/**
 * Get XLM balance for an account
 */
export async function getXlmBalance(publicKey: string): Promise<string> {
  const accountInfo = await loadAccount(publicKey);
  if (!accountInfo.isActive) return '0';
  const xlmBalance = accountInfo.balances.find((b) => b.assetCode === 'XLM');
  return xlmBalance?.balance ?? '0';
}

// ============================================================
// Asset Helpers
// ============================================================

/**
 * Convert our StellarAsset type to the SDK Asset type
 */
export function toSdkAsset(asset: StellarAsset): StellarSdk.Asset {
  if (asset.isNative || !asset.issuer) {
    return StellarSdk.Asset.native();
  }
  return new StellarSdk.Asset(asset.code, asset.issuer);
}

/**
 * Convert an SDK asset to our StellarAsset type
 */
export function fromSdkAsset(asset: StellarSdk.Asset): StellarAsset {
  if (asset.isNative()) {
    return { code: 'XLM', issuer: null, isNative: true };
  }
  return {
    code: asset.getCode(),
    issuer: asset.getIssuer() ?? null,
    isNative: false,
  };
}

// ============================================================
// Path Finding
// ============================================================

/**
 * Find payment paths using strict-send (fixed source amount)
 */
export async function findPathsStrictSend(
  sourceAsset: StellarAsset,
  sourceAmount: string,
  destAsset: StellarAsset
): Promise<PathRecord[]> {
  try {
    const sdkSourceAsset = toSdkAsset(sourceAsset);
    const sdkDestAsset = toSdkAsset(destAsset);

    const response = await server
      .strictSendPaths(sdkSourceAsset, sourceAmount, [sdkDestAsset])
      .call();

    return response.records.map((record: any) => ({
      sourceAssetType: record.source_asset_type,
      sourceAssetCode: record.source_asset_type === 'native' ? 'XLM' : (record.source_asset_code || ''),
      sourceAssetIssuer: record.source_asset_issuer || '',
      sourceAmount: record.source_amount,
      destinationAssetType: record.destination_asset_type,
      destinationAssetCode: record.destination_asset_type === 'native' ? 'XLM' : (record.destination_asset_code || ''),
      destinationAssetIssuer: record.destination_asset_issuer || '',
      destinationAmount: record.destination_amount,
      path: (record.path || []).map((p: any) => ({
        code: p.asset_type === 'native' ? 'XLM' : (p.asset_code || ''),
        issuer: p.asset_issuer || null,
        isNative: p.asset_type === 'native',
      })),
    }));
  } catch (error) {
    console.error('Path finding (strict-send) failed:', error);
    return [];
  }
}

/**
 * Find payment paths using strict-receive (fixed destination amount)
 */
export async function findPathsStrictReceive(
  sourceAsset: StellarAsset,
  destAsset: StellarAsset,
  destAmount: string
): Promise<PathRecord[]> {
  try {
    const sdkSourceAsset = toSdkAsset(sourceAsset);
    const sdkDestAsset = toSdkAsset(destAsset);

    const response = await server
      .strictReceivePaths([sdkSourceAsset], sdkDestAsset, destAmount)
      .call();

    return response.records.map((record: any) => ({
      sourceAssetType: record.source_asset_type,
      sourceAssetCode: record.source_asset_type === 'native' ? 'XLM' : (record.source_asset_code || ''),
      sourceAssetIssuer: record.source_asset_issuer || '',
      sourceAmount: record.source_amount,
      destinationAssetType: record.destination_asset_type,
      destinationAssetCode: record.destination_asset_type === 'native' ? 'XLM' : (record.destination_asset_code || ''),
      destinationAssetIssuer: record.destination_asset_issuer || '',
      destinationAmount: record.destination_amount,
      path: (record.path || []).map((p: any) => ({
        code: p.asset_type === 'native' ? 'XLM' : (p.asset_code || ''),
        issuer: p.asset_issuer || null,
        isNative: p.asset_type === 'native',
      })),
    }));
  } catch (error) {
    console.error('Path finding (strict-receive) failed:', error);
    return [];
  }
}

// ============================================================
// Transaction Execution
// ============================================================

/**
 * Build a path payment strict-send transaction
 */
export async function buildPathPaymentStrictSend(
  senderPublicKey: string,
  destPublicKey: string,
  sourceAsset: StellarAsset,
  sendAmount: string,
  destAsset: StellarAsset,
  destMin: string,
  path: StellarAsset[]
): Promise<StellarSdk.Transaction> {
  const account = await server.loadAccount(senderPublicKey);
  const fee = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: ACTIVE_NETWORK.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: toSdkAsset(sourceAsset),
        sendAmount,
        destination: destPublicKey,
        destAsset: toSdkAsset(destAsset),
        destMin,
        path: path.map(toSdkAsset),
      })
    )
    .setTimeout(30)
    .build();

  return tx;
}

/**
 * Build a path payment strict-receive transaction
 */
export async function buildPathPaymentStrictReceive(
  senderPublicKey: string,
  destPublicKey: string,
  sourceAsset: StellarAsset,
  sendMax: string,
  destAsset: StellarAsset,
  destAmount: string,
  path: StellarAsset[]
): Promise<StellarSdk.Transaction> {
  const account = await server.loadAccount(senderPublicKey);
  const fee = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: ACTIVE_NETWORK.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.pathPaymentStrictReceive({
        sendAsset: toSdkAsset(sourceAsset),
        sendMax,
        destination: destPublicKey,
        destAsset: toSdkAsset(destAsset),
        destAmount,
        path: path.map(toSdkAsset),
      })
    )
    .setTimeout(30)
    .build();

  return tx;
}

/**
 * Submit a signed transaction to the network
 */
export async function submitTransaction(
  txXdr: string
): Promise<TransactionResult> {
  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(
      txXdr,
      ACTIVE_NETWORK.networkPassphrase
    );
    const response = await server.submitTransaction(tx as StellarSdk.Transaction) as any;

    return {
      hash: response.hash,
      ledger: response.ledger,
      successful: response.successful,
      createdAt: new Date().toISOString(),
      sourceAccount: response.source_account || '',
      fee: response.fee_charged || '0',
      operationCount: response.operation_count || 0,
      envelopeXdr: response.envelope_xdr || '',
      resultXdr: response.result_xdr || '',
    };
  } catch (error: unknown) {
    // Log the full error structure for debugging
    const err = error as any;
    console.error('Transaction submission failed:', error);
    if (err?.response?.data) {
      console.error('Horizon response:', JSON.stringify(err.response.data, null, 2));
    }

    // Extract detailed error from Horizon's 400 response
    const horizonError = extractHorizonError(error);
    if (horizonError) {
      throw new Error(horizonError);
    }

    // Fall back to a cleaner message than raw Axios error
    if (err?.message?.includes('status code 400')) {
      throw new Error('Transaction rejected by the Stellar network. The exchange rate or path may have changed — please find routes again.');
    }
    throw error;
  }
}

/**
 * Extract a human-readable error message from a Horizon API error
 */
function extractHorizonError(error: unknown): string | null {
  const err = error as any;

  // Horizon SDK wraps the error with response.data.extras
  const extras =
    err?.response?.data?.extras ||
    err?.extras ||
    err?.response?.extras;

  if (!extras) {
    // Check for generic status code error
    if (err?.response?.status === 400) {
      const title = err?.response?.data?.title;
      if (title) return title;
      return 'Transaction rejected by the network (400)';
    }
    return null;
  }

  const resultCodes = extras.result_codes;
  if (!resultCodes) return null;

  const txCode = resultCodes.transaction;
  const opCodes: string[] = resultCodes.operations || [];

  // Map operation error codes to human-readable messages
  const opMessages = opCodes
    .filter((code: string) => code !== 'op_success')
    .map((code: string) => HORIZON_OP_ERRORS[code] || code);

  if (opMessages.length > 0) {
    return opMessages.join('. ');
  }

  // Fall back to transaction-level error
  if (txCode && txCode !== 'tx_success') {
    return HORIZON_TX_ERRORS[txCode] || `Transaction error: ${txCode}`;
  }

  return null;
}

/** Human-readable messages for common Horizon operation errors */
const HORIZON_OP_ERRORS: Record<string, string> = {
  op_underfunded: 'Insufficient balance to complete this transfer. Please check your account balance.',
  op_no_trust: 'The destination account has not opted into the receiving asset. They need to add a trustline first.',
  op_no_source_account: 'Your account was not found on the network.',
  op_no_destination: 'The destination account does not exist on the Stellar network. They need to be funded first.',
  op_line_full: 'The destination account\'s trustline limit would be exceeded.',
  op_too_few_offers: 'Not enough liquidity on the DEX to complete this path payment. Try a smaller amount.',
  op_cross_self: 'This path payment would cross your own DEX offers. Try a different route.',
  op_over_source_max: 'The cost exceeded the maximum. The exchange rate may have changed — please try again.',
  op_under_dest_min: 'The received amount fell below the minimum due to rate changes. Please try again with fresh routes.',
  op_no_issuer: 'One of the assets in the path has an invalid issuer.',
  op_malformed: 'The payment operation is malformed. Please try a different route.',
};

/** Human-readable messages for common Horizon transaction errors */
const HORIZON_TX_ERRORS: Record<string, string> = {
  tx_failed: 'The transaction failed. See operation errors for details.',
  tx_bad_auth: 'Transaction signature is invalid. Please try signing again with Freighter.',
  tx_bad_seq: 'Account sequence number mismatch. Please refresh and try again.',
  tx_too_late: 'The transaction expired before it could be submitted. Please try again.',
  tx_too_early: 'The transaction was submitted too early.',
  tx_insufficient_fee: 'The network fee was too low. Please try again.',
  tx_insufficient_balance: 'Insufficient XLM balance to pay the network fee.',
  tx_internal_error: 'An internal Stellar network error occurred. Please try again.',
};

/**
 * Get a link to the transaction on Stellar Expert
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${ACTIVE_NETWORK.explorerUrl}/tx/${txHash}`;
}

/**
 * Get a link to the account on Stellar Expert
 */
export function getExplorerAccountUrl(publicKey: string): string {
  return `${ACTIVE_NETWORK.explorerUrl}/account/${publicKey}`;
}

/**
 * Truncate a Stellar public key for display
 */
export function truncateKey(key: string, chars: number = 4): string {
  if (key.length <= chars * 2 + 3) return key;
  return `${key.slice(0, chars)}...${key.slice(-chars)}`;
}
