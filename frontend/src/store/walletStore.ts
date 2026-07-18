/**
 * Wallet State Store (Zustand)
 * Manages Freighter wallet connection state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletConnectionStatus, AccountBalance } from '../types/stellar';
import {
  connectFreighter,
  getConnectedPublicKey,
  isFreighterInstalled,
  getFreighterErrorMessage,
} from '../lib/freighter';
import { loadAccount, fundWithFriendbot } from '../lib/stellar';

interface WalletState {
  // State
  publicKey: string | null;
  status: WalletConnectionStatus;
  balances: AccountBalance[];
  isAccountActive: boolean;
  error: string | null;
  isFreighterAvailable: boolean;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  checkExistingConnection: () => Promise<void>;
  checkFreighter: () => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      publicKey: null,
      status: 'disconnected',
      balances: [],
      isAccountActive: false,
      error: null,
      isFreighterAvailable: false,

      // Check if Freighter extension is available
      checkFreighter: async () => {
        const available = await isFreighterInstalled();
        set({ isFreighterAvailable: available });
      },

      // Connect to Freighter wallet
      connect: async () => {
        set({ status: 'connecting', error: null });

        try {
          const publicKey = await connectFreighter();

          // Load account info
          const accountInfo = await loadAccount(publicKey);

          // If account doesn't exist on testnet, fund it
          if (!accountInfo.isActive) {
            set({ status: 'connecting', error: null });
            const funded = await fundWithFriendbot(publicKey);
            if (!funded) {
              set({
                status: 'error',
                error: 'Failed to activate your testnet account. Please try again.',
              });
              return;
            }
            // Reload after funding
            const refreshedInfo = await loadAccount(publicKey);
            set({
              publicKey,
              status: 'connected',
              balances: refreshedInfo.balances,
              isAccountActive: refreshedInfo.isActive,
              error: null,
            });
          } else {
            set({
              publicKey,
              status: 'connected',
              balances: accountInfo.balances,
              isAccountActive: accountInfo.isActive,
              error: null,
            });
          }
        } catch (error) {
          const message = getFreighterErrorMessage(error);
          set({
            status: 'error',
            error: message,
          });
        }
      },

      // Disconnect wallet
      disconnect: () => {
        set({
          publicKey: null,
          status: 'disconnected',
          balances: [],
          isAccountActive: false,
          error: null,
        });
      },

      // Refresh balance from Horizon
      refreshBalance: async () => {
        const { publicKey } = get();
        if (!publicKey) return;

        try {
          const accountInfo = await loadAccount(publicKey);
          set({
            balances: accountInfo.balances,
            isAccountActive: accountInfo.isActive,
          });
        } catch (error) {
          console.error('Failed to refresh balance:', error);
        }
      },

      // Check if already connected (on app load)
      checkExistingConnection: async () => {
        try {
          const publicKey = await getConnectedPublicKey();
          if (publicKey) {
            const accountInfo = await loadAccount(publicKey);
            set({
              publicKey,
              status: 'connected',
              balances: accountInfo.balances,
              isAccountActive: accountInfo.isActive,
            });
          }
        } catch {
          // Silently fail — user will connect manually
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'anchor-route-wallet',
      partialize: (state) => ({
        publicKey: state.publicKey,
      }),
    }
  )
);
