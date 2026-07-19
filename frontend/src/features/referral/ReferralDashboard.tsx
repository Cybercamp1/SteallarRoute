import React, { useState, useCallback } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { Button } from '../../components/ui';
import styles from './ReferralDashboard.module.css';

export const ReferralDashboard: React.FC = () => {
  const { address, activeNetwork } = useWalletStore();
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);

  // Generate Referral Link
  const displayAddress = address || 'G...CONNECT_WALLET';
  const referralLink = `https://stellarroute.netlify.app/#/send?ref=${displayAddress}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  const handleClaim = useCallback(() => {
    if (!address) return;
    setClaiming(true);
    // Simulate claiming cashbacks from Soroban on-chain contract
    setTimeout(() => {
      setClaiming(false);
      setClaimedAmount((prev) => prev + 24.25);
    }, 1500);
  }, [address]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Banner Section */}
        <div className={styles.heroBanner}>
          <div className={styles.badge}>GROWTH PROGRAM</div>
          <h1 className={styles.title}>Earn Gas Cashback</h1>
          <p className={styles.subtitle}>
            Invite your friends to send payments via AnchorRoute. Earn 0.05% of their transaction volume directly back into your wallet as XLM gas savings.
          </p>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Referred Friends</span>
            <span className={styles.statValue}>{address ? '12' : '0'}</span>
            <span className={styles.statSub}>+3 this week</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Volume Driven (USDC)</span>
            <span className={styles.statValue}>{address ? '$4,850.00' : '$0.00'}</span>
            <span className={styles.statSub}>Across 4 corridors</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Earned Cashback</span>
            <span className={styles.statValue}>
              {address ? (24.25 - claimedAmount).toFixed(2) : '0.00'} XLM
            </span>
            <span className={styles.statSub}>Accumulated automatically</span>
          </div>
        </div>

        {/* Action Panel */}
        <div className={styles.actionPanel}>
          <div className={styles.linkSection}>
            <h3>Your Unique Referral Link</h3>
            <p>Share this link on Twitter, Telegram, or directly with your users.</p>
            <div className={styles.inputGroup}>
              <input
                type="text"
                readOnly
                value={referralLink}
                className={styles.linkInput}
              />
              <Button
                variant={copied ? 'success' : 'primary'}
                onClick={handleCopy}
                disabled={!address}
              >
                {copied ? 'Copied! ✓' : 'Copy Link'}
              </Button>
            </div>
            {!address && (
              <span className={styles.warningText}>
                ⚠️ Please connect your wallet in the top bar to activate your referral link.
              </span>
            )}
          </div>

          <div className={styles.claimSection}>
            <h3>Cashback Rewards</h3>
            <p>Accumulate cashback on every successful swap and redeem to cover your gas costs.</p>
            <div className={styles.claimActions}>
              <div className={styles.claimedStat}>
                <span className={styles.claimedLabel}>Total Redeemed:</span>
                <span className={styles.claimedValue}>{claimedAmount.toFixed(2)} XLM</span>
              </div>
              <Button
                variant="primary"
                onClick={handleClaim}
                disabled={!address || claiming || claimedAmount >= 24.25}
                fullWidth
              >
                {claiming ? 'Processing on Soroban...' : 'Claim Cashback'}
              </Button>
            </div>
          </div>
        </div>

        {/* Onboarding List */}
        <div className={styles.referralListSection}>
          <h3>Active Referrals</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Wallet Address</th>
                  <th>Network</th>
                  <th>Joined Date</th>
                  <th>Volume Tracked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {address ? (
                  <>
                    <tr>
                      <td className={styles.mono}>GBKJA...CLHD</td>
                      <td>Testnet</td>
                      <td>2026-07-16</td>
                      <td>$1,250.00</td>
                      <td><span className={styles.statusActive}>Active</span></td>
                    </tr>
                    <tr>
                      <td className={styles.mono}>GDUQ3...64KV</td>
                      <td>Testnet</td>
                      <td>2026-07-17</td>
                      <td>$800.00</td>
                      <td><span className={styles.statusActive}>Active</span></td>
                    </tr>
                    <tr>
                      <td className={styles.mono}>GBTHM...CJO4</td>
                      <td>Testnet</td>
                      <td>2026-07-18</td>
                      <td>$2,800.00</td>
                      <td><span className={styles.statusActive}>Active</span></td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={5} className={styles.emptyRow}>
                      No referred wallets detected yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
