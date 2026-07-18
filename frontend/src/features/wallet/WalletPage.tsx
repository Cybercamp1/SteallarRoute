import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../../store/walletStore';
import { useTransferStore } from '../../store/transferStore';
import { KNOWN_ASSETS } from '../../lib/constants';
import { truncateKey, getExplorerAccountUrl, fundWithFriendbot } from '../../lib/stellar';
import { Card, Button, Modal, Spinner } from '../../components/ui';
import styles from './WalletPage.module.css';

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    publicKey,
    status: walletStatus,
    balances,
    isAccountActive,
    connect,
    refreshBalance,
  } = useWalletStore();

  const { establishTrustline } = useTransferStore();

  // ---- Local state ----
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isClaimingFaucet, setIsClaimingFaucet] = useState(false);
  const [isAddingTrustlineCode, setIsAddingTrustlineCode] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Auto-refresh balance on page load if connected
  useEffect(() => {
    if (publicKey) {
      refreshBalance();
    }
  }, [publicKey, refreshBalance]);

  const isConnected = walletStatus === 'connected' && !!publicKey;

  // ---- Copy Address Helper ----
  const handleCopyAddress = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // ---- Faucet Handler ----
  const handleClaimFaucet = async () => {
    if (!publicKey) return;
    setIsClaimingFaucet(true);
    try {
      const success = await fundWithFriendbot(publicKey);
      if (success) {
        await refreshBalance();
        alert('Successfully claimed 10,000 Testnet XLM! Your balances have been refreshed.');
      } else {
        alert('Friendbot was unable to fund your account. Please try again later.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to Friendbot.');
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  // ---- Add Trustline Handler ----
  const handleAddTrustline = async (assetCode: string, assetIssuer: string) => {
    if (!publicKey) return;
    setIsAddingTrustlineCode(assetCode);
    try {
      const success = await establishTrustline(publicKey, {
        code: assetCode,
        issuer: assetIssuer,
        isNative: false,
      });
      if (success) {
        await refreshBalance();
      } else {
        alert(`Failed to add trustline for ${assetCode}. Make sure you have at least 0.5 XLM available for the trustline reserve.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingTrustlineCode(null);
    }
  };

  // =====================================================================
  // RENDER: Disconnected State
  // =====================================================================
  if (!isConnected) {
    return (
      <div className={styles.page}>
        <div className={styles.disconnectedContainer}>
          <div className={styles.walletIconContainer}>
            <span className={styles.walletLargeIcon}>👛</span>
          </div>
          <h1 className={styles.disconnectedTitle}>Connect Your Wallet</h1>
          <p className={styles.disconnectedSubtitle}>
            Connect your Freighter browser wallet extension to view your asset portfolio, manage trustlines, and execute real-time path payments.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={connect}
            loading={walletStatus === 'connecting'}
          >
            {walletStatus === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      </div>
    );
  }

  // Calculate total XLM balance
  const xlmBalanceObj = balances.find((b) => b.assetCode === 'XLM');
  const xlmBalance = parseFloat(xlmBalanceObj?.balance || '0');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Stellar Wallet</h1>
            <div className={styles.addressBar}>
              <span className={styles.addressText} title={publicKey || ''}>
                {publicKey ? truncateKey(publicKey, 12) : ''}
              </span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={handleCopyAddress}
                title="Copy full address"
              >
                {copyFeedback ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClaimFaucet}
              loading={isClaimingFaucet}
            >
              Claim 10k XLM Faucet 🚰
            </Button>
          </div>
        </header>

        {/* Portfolio Summary Card */}
        <Card variant="highlighted" className={styles.portfolioCard}>
          <div className={styles.portfolioInner}>
            <div>
              <span className={styles.portfolioLabel}>XLM Balance</span>
              <div className={styles.portfolioBalance}>
                {xlmBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{' '}
                <span className={styles.xlmDenomination}>XLM</span>
              </div>
              <span className={styles.networkBadge}>Stellar Testnet</span>
            </div>

            <div className={styles.portfolioActions}>
              <Button variant="primary" size="md" onClick={() => navigate('/send')}>
                Send / Swap Assets 🚀
              </Button>
              <Button variant="secondary" size="md" onClick={() => setIsReceiveOpen(true)}>
                Receive Assets 📥
              </Button>
            </div>
          </div>
        </Card>

        {/* Portfolio Assets Section */}
        <section className={styles.assetsSection}>
          <h2 className={styles.sectionTitle}>Asset Balances & Trustlines</h2>
          <p className={styles.sectionSubtitle}>
            Add trustlines to opt-in to hold and receive stablecoins or local fiat currencies.
          </p>

          <div className={styles.assetsGrid}>
            {KNOWN_ASSETS.map((asset) => {
              // XLM is native, always has trustline implicitly
              if (asset.isNative) {
                return (
                  <Card key={asset.code} variant="default" className={styles.assetCard}>
                    <div className={styles.assetHeader}>
                      <div className={styles.assetBadgeIcon}>{asset.icon}</div>
                      <div>
                        <h3 className={styles.assetCode}>{asset.code}</h3>
                        <p className={styles.assetName}>{asset.name}</p>
                      </div>
                    </div>
                    <div className={styles.assetDetails}>
                      <div className={styles.assetBalance}>
                        {xlmBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </div>
                      <span className={styles.trustlineBadgeActive}>Native Asset</span>
                    </div>
                  </Card>
                );
              }

              // Check if trustline is established
              const userBalanceObj = balances.find(
                (b) => b.assetCode === asset.code && b.assetIssuer === asset.issuer
              );
              const hasTrustline = !!userBalanceObj;
              const balance = parseFloat(userBalanceObj?.balance || '0');

              return (
                <Card key={asset.code} variant="default" className={styles.assetCard}>
                  <div className={styles.assetHeader}>
                    <div className={styles.assetBadgeIcon}>{asset.icon}</div>
                    <div>
                      <h3 className={styles.assetCode}>{asset.code}</h3>
                      <p className={styles.assetName}>{asset.name}</p>
                    </div>
                  </div>
                  <div className={styles.assetDetails}>
                    {hasTrustline ? (
                      <>
                        <div className={styles.assetBalance}>
                          {balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <span className={styles.trustlineBadgeActive}>✓ Trustline Active</span>
                      </>
                    ) : (
                      <>
                        <div className={styles.assetBalanceEmpty}>Not Established</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={styles.addTrustlineBtn}
                          loading={isAddingTrustlineCode === asset.code}
                          onClick={() => handleAddTrustline(asset.code, asset.issuer!)}
                        >
                          + Add Trustline
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Receive Assets Modal */}
        <Modal
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
          title="Receive Assets"
          size="sm"
        >
          <div className={styles.receiveModalContent}>
            <div className={styles.qrContainer}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${publicKey}`}
                alt="Stellar Address QR Code"
                className={styles.qrImage}
              />
            </div>

            <p className={styles.receiveModalText}>
              Scan this QR code or copy the address below to receive XLM or established assets on the Stellar Testnet.
            </p>

            <div className={styles.modalAddressBar}>
              <input
                type="text"
                readOnly
                value={publicKey || ''}
                className={styles.modalAddressInput}
              />
              <button
                type="button"
                className={styles.modalCopyBtn}
                onClick={handleCopyAddress}
              >
                {copyFeedback ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className={styles.modalWarning}>
              ⚠️ <strong>Warning:</strong> Only send Stellar <strong>Testnet</strong> assets to this address. Sending mainnet assets will result in permanent loss.
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
