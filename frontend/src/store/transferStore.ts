/**
 * Transfer Flow State Store (Zustand)
 * Manages the entire transfer flow: input → route discovery → execution
 */

import { create } from 'zustand';
import type { TransferStep, TransferInput, TransferRecord } from '../types/transfer';
import type { ScoredRoute } from '../types/route';
import type { StellarAsset } from '../types/stellar';
import { findPathsStrictSend, buildPathPaymentStrictSend, submitTransaction, toSdkAsset, loadAccount } from '../lib/stellar';
import { scoreAndRankRoutes } from '../lib/scoring';
import { signWithFreighter } from '../lib/freighter';
import { KNOWN_ASSETS, APP_CONFIG } from '../lib/constants';

interface TransferState {
  // Flow state
  step: TransferStep;

  // Input
  input: TransferInput;

  // Routes
  routes: ScoredRoute[];
  selectedRoute: ScoredRoute | null;
  isLoadingRoutes: boolean;
  routeError: string | null;

  // Execution
  isExecuting: boolean;
  executionError: string | null;
  lastTransaction: TransferRecord | null;

  // Transfer history (local cache)
  history: TransferRecord[];

  // Actions
  setInput: (input: Partial<TransferInput>) => void;
  findRoutes: () => Promise<void>;
  selectRoute: (route: ScoredRoute) => void;
  executeTransfer: (senderPublicKey: string, destPublicKey: string) => Promise<void>;
  goToStep: (step: TransferStep) => void;
  reset: () => void;
  addToHistory: (record: TransferRecord) => void;
}

const DEFAULT_INPUT: TransferInput = {
  sourceAssetCode: 'XLM',
  destAssetCode: 'USDC',
  amount: '',
  direction: 'send',
};

export const useTransferStore = create<TransferState>()((set, get) => ({
  // Initial state
  step: 'input',
  input: DEFAULT_INPUT,
  routes: [],
  selectedRoute: null,
  isLoadingRoutes: false,
  routeError: null,
  isExecuting: false,
  executionError: null,
  lastTransaction: null,
  history: JSON.parse(localStorage.getItem('anchor-route-history') || '[]'),

  // Update input fields
  setInput: (input) => {
    set((state) => ({
      input: { ...state.input, ...input },
      routes: [], // Clear routes when input changes
      selectedRoute: null,
      routeError: null,
    }));
  },

  // Find and score routes
  findRoutes: async () => {
    const { input } = get();
    if (!input.amount || parseFloat(input.amount) <= 0) {
      set({ routeError: 'Please enter a valid amount' });
      return;
    }

    set({ isLoadingRoutes: true, routeError: null, step: 'comparing' });

    try {
      // Get asset definitions
      const sourceAssetDef = KNOWN_ASSETS.find((a) => a.code === input.sourceAssetCode);
      const destAssetDef = KNOWN_ASSETS.find((a) => a.code === input.destAssetCode);

      if (!sourceAssetDef || !destAssetDef) {
        throw new Error('Invalid asset selection');
      }

      const sourceAsset: StellarAsset = {
        code: sourceAssetDef.code,
        issuer: sourceAssetDef.issuer,
        isNative: sourceAssetDef.isNative ?? false,
      };

      const destAsset: StellarAsset = {
        code: destAssetDef.code,
        issuer: destAssetDef.issuer,
        isNative: destAssetDef.isNative ?? false,
      };

      // Find paths via Horizon
      const paths = await findPathsStrictSend(sourceAsset, input.amount, destAsset);

      if (paths.length === 0) {
        set({
          isLoadingRoutes: false,
          routeError: 'No routes found for this currency pair. Try a different amount or currency.',
          step: 'input',
        });
        return;
      }

      // Score and rank routes
      const scoredRoutes = scoreAndRankRoutes(paths);

      set({
        routes: scoredRoutes,
        isLoadingRoutes: false,
        step: 'routes',
      });
    } catch (error) {
      console.error('Route finding failed:', error);
      set({
        isLoadingRoutes: false,
        routeError: error instanceof Error ? error.message : 'Failed to find routes. Please try again.',
        step: 'input',
      });
    }
  },

  // Select a route for execution
  selectRoute: (route) => {
    set({ selectedRoute: route, step: 'confirming' });
  },

  // Execute the transfer
  executeTransfer: async (senderPublicKey, destPublicKey) => {
    const { selectedRoute, input } = get();
    if (!selectedRoute) {
      set({ executionError: 'No route selected' });
      return;
    }

    set({ isExecuting: true, executionError: null, step: 'executing' });

    try {
      // === PRE-FLIGHT CHECKS ===

      // 1. Validate destination address format
      if (!destPublicKey || destPublicKey.length !== 56 || !destPublicKey.startsWith('G')) {
        throw new Error('Invalid destination address. Stellar addresses start with G and are 56 characters long.');
      }

      // 2. Check destination account exists
      const destAccount = await loadAccount(destPublicKey);
      if (!destAccount.isActive) {
        throw new Error(
          'The destination account does not exist on the Stellar network. ' +
          'The recipient needs to fund their account first (minimum 1 XLM).'
        );
      }

      // 3. Check destination has trustline for non-native destination assets
      if (!selectedRoute.destAsset.isNative) {
        const hasTrustline = destAccount.balances.some(
          (b) =>
            b.assetCode === selectedRoute.destAsset.code &&
            b.assetIssuer === selectedRoute.destAsset.issuer
        );
        if (!hasTrustline) {
          throw new Error(
            `The destination account does not have a trustline for ${selectedRoute.destAsset.code}. ` +
            `The recipient needs to add a trustline for this asset before they can receive it.`
          );
        }
      }

      // 4. Check sender has sufficient balance for source asset
      const senderAccount = await loadAccount(senderPublicKey);
      const sourceBalance = senderAccount.balances.find(
        (b) =>
          (selectedRoute.sourceAsset.isNative && b.assetCode === 'XLM') ||
          (b.assetCode === selectedRoute.sourceAsset.code &&
            b.assetIssuer === selectedRoute.sourceAsset.issuer)
      );
      const sendAmountNum = parseFloat(selectedRoute.sourceAmount);
      const availableBalance = parseFloat(sourceBalance?.balance || '0');
      // XLM has a minimum reserve of ~1 XLM (base reserve) + 0.5 per trustline
      const reserveBuffer = selectedRoute.sourceAsset.isNative ? 2 : 0;
      if (availableBalance - reserveBuffer < sendAmountNum) {
        throw new Error(
          `Insufficient ${selectedRoute.sourceAsset.code} balance. ` +
          `You have ${availableBalance.toFixed(4)} but need ${sendAmountNum.toFixed(4)}` +
          (reserveBuffer > 0 ? ` (plus ~${reserveBuffer} XLM reserve).` : '.')
        );
      }

      // === BUILD & SUBMIT ===

      // Calculate minimum destination amount with slippage tolerance
      const destAmountNum = parseFloat(selectedRoute.destAmount);
      const slippageFactor = 1 - APP_CONFIG.defaultSlippageBps / 10000;
      const destMin = (destAmountNum * slippageFactor).toFixed(7);

      // Build the transaction
      const tx = await buildPathPaymentStrictSend(
        senderPublicKey,
        destPublicKey,
        selectedRoute.sourceAsset,
        selectedRoute.sourceAmount,
        selectedRoute.destAsset,
        destMin,
        selectedRoute.path
      );

      // Sign with Freighter
      const signedXdr = await signWithFreighter(tx.toXDR());

      // Submit to network
      const result = await submitTransaction(signedXdr);

      if (result.successful) {
        const record: TransferRecord = {
          id: result.hash,
          transactionHash: result.hash,
          sourceAsset: selectedRoute.sourceAsset,
          destAsset: selectedRoute.destAsset,
          sourceAmount: selectedRoute.sourceAmount,
          destAmount: selectedRoute.destAmount,
          exchangeRate: selectedRoute.exchangeRate,
          totalFee: selectedRoute.estimatedFee.toFixed(7),
          routeId: selectedRoute.id,
          routePath: selectedRoute.path,
          status: 'confirmed',
          createdAt: Date.now(),
          completedAt: Date.now(),
          score: selectedRoute.compositeScore,
          feedbackSubmitted: false,
        };

        set({
          isExecuting: false,
          lastTransaction: record,
          step: 'success',
        });

        // Add to history
        get().addToHistory(record);
      } else {
        throw new Error('Transaction failed on the network');
      }
    } catch (error) {
      console.error('Transfer execution failed:', error);
      set({
        isExecuting: false,
        executionError:
          error instanceof Error ? error.message : 'Transfer failed. No funds were sent.',
        step: 'failed',
      });
    }
  },

  // Navigate between steps
  goToStep: (step) => {
    set({ step });
  },

  // Reset the transfer flow
  reset: () => {
    set({
      step: 'input',
      input: DEFAULT_INPUT,
      routes: [],
      selectedRoute: null,
      isLoadingRoutes: false,
      routeError: null,
      isExecuting: false,
      executionError: null,
      lastTransaction: null,
    });
  },

  // Add a transfer to local history
  addToHistory: (record) => {
    set((state) => {
      const newHistory = [record, ...state.history].slice(0, APP_CONFIG.maxRecentTransfers);
      localStorage.setItem('anchor-route-history', JSON.stringify(newHistory));
      return { history: newHistory };
    });
  },
}));
