/**
 * TransferPage — Multi-step cross-border transfer flow
 *
 * Steps: input → comparing → routes → confirming → executing → success | failed
 *
 * This is the core feature page for AnchorRoute where users:
 * 1. Enter source/destination assets & amount
 * 2. Discover and compare routes (AI-scored)
 * 3. Confirm transfer details with rate lock countdown
 * 4. Sign with Freighter wallet and submit to Stellar
 * 5. View result (success or failure)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTransferStore } from '../../store/transferStore';
import { useWalletStore } from '../../store/walletStore';
import { KNOWN_ASSETS } from '../../lib/constants';
import { getExplorerTxUrl, truncateKey } from '../../lib/stellar';
import { formatExchangeRate, formatFee, getSpeedLabel, getScoreColor } from '../../lib/scoring';
import { ROUTE_TAG_DISPLAY } from '../../types/route';
import { Select } from '../../components/ui';
import { Button } from '../../components/ui';
import { RouteCard } from './RouteCard';
import { RouteDetailsModal } from './RouteDetailsModal';
import type { SelectOption } from '../../components/ui';
import styles from './TransferPage.module.css';

/* ================================================================
   Constants
   ================================================================ */

const QUICK_AMOUNTS = ['50', '100', '500', '1000'];
const RATE_LOCK_SECONDS = 60;
const COUNTDOWN_RADIUS = 26;
const COUNTDOWN_CIRCUMFERENCE = 2 * Math.PI * COUNTDOWN_RADIUS;

/** Build select options from KNOWN_ASSETS */
const ASSET_OPTIONS: SelectOption[] = KNOWN_ASSETS.map((a) => ({
  value: a.code,
  label: `${a.code} — ${a.name}`,
  icon: <span>{a.icon}</span>,
}));

/* ================================================================
   TransferPage
   ================================================================ */

export const TransferPage: React.FC = () => {
  // ---- Local state ----
  const [detailsRoute, setDetailsRoute] = useState<any | null>(null);

  // ---- Stores ----
  const {
    step,
    input,
    routes,
    selectedRoute,
    isLoadingRoutes,
    routeError,
    isExecuting,
    executionError,
    lastTransaction,
    setInput,
    findRoutes,
    selectRoute,
    executeTransfer,
    establishTrustline,
    goToStep,
    reset,
  } = useTransferStore();

  const { publicKey, status: walletStatus, connect } = useWalletStore();

  // ---- Local state ----
  const [destAddress, setDestAddress] = useState('');
  const [countdown, setCountdown] = useState(RATE_LOCK_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [execSubStep, setExecSubStep] = useState(0); // 0: building, 1: signing, 2: submitting
  const [isAddingTrustline, setIsAddingTrustline] = useState(false);

  const isConnected = walletStatus === 'connected' && !!publicKey;

  // ---- Countdown timer for rate lock ----
  useEffect(() => {
    if (step === 'confirming') {
      setCountdown(RATE_LOCK_SECONDS);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [step]);

  // ---- Simulate execution sub-steps ----
  useEffect(() => {
    if (step === 'executing') {
      setExecSubStep(0);
      const t1 = setTimeout(() => setExecSubStep(1), 1200);
      const t2 = setTimeout(() => setExecSubStep(2), 3000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [step]);

  // ---- Handlers ----
  const handleSwapCurrencies = useCallback(() => {
    setInput({
      sourceAssetCode: input.destAssetCode,
      destAssetCode: input.sourceAssetCode,
    });
  }, [input, setInput]);

  const handleFindRoutes = useCallback(() => {
    if (!destAddress.trim()) return;
    findRoutes();
  }, [destAddress, findRoutes]);

  const handleConfirmSend = useCallback(async () => {
    if (!publicKey || !destAddress.trim()) return;
    await executeTransfer(publicKey, destAddress.trim());
  }, [publicKey, destAddress, executeTransfer]);

  const handleAddTrustline = useCallback(async () => {
    if (!publicKey || !selectedRoute) return;
    setIsAddingTrustline(true);
    const success = await establishTrustline(publicKey, selectedRoute.destAsset);
    setIsAddingTrustline(false);
    if (success) {
      goToStep('confirming');
    } else {
      alert('Failed to establish trustline. Please make sure you have enough XLM in your wallet to cover the trustline reserve (0.5 XLM).');
    }
  }, [publicKey, selectedRoute, establishTrustline, goToStep]);

  const handleReset = useCallback(() => {
    setDestAddress('');
    reset();
  }, [reset]);

  // ---- Derived ----
  const isSourceUSDC = input.sourceAssetCode === 'USDC';
  const canFindRoutes =
    !!input.amount &&
    parseFloat(input.amount) > 0 &&
    !!destAddress.trim() &&
    input.sourceAssetCode !== input.destAssetCode;

  const countdownOffset =
    COUNTDOWN_CIRCUMFERENCE - (countdown / RATE_LOCK_SECONDS) * COUNTDOWN_CIRCUMFERENCE;

  // =====================================================================
  // RENDER: Connect Wallet Prompt
  // =====================================================================
  if (!isConnected) {
    return (
      <div className={styles.page}>
        <div className={`${styles.connectPrompt} ${styles.stepContainer}`}>
          <span className={styles.connectIcon} aria-hidden="true">🔗</span>
          <h2 className={styles.connectTitle}>Connect Your Wallet</h2>
          <p className={styles.connectSubtitle}>
            Connect your Freighter wallet to start sending cross-border payments
            on the Stellar network.
          </p>
          <Button size="lg" onClick={connect}>
            Connect Freighter
          </Button>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: Step 1 — Input
  // =====================================================================
  if (step === 'input') {
    return (
      <div className={styles.page}>
        <div className={`${styles.stepContainer}`} key="input">
          <div className={styles.inputCard}>
            <h2 className={styles.inputTitle}>Send Payment</h2>

            {/* Currency selectors */}
            <div className={styles.currencyPair}>
              <div className={styles.currencySelect}>
                <Select
                  label="From"
                  options={ASSET_OPTIONS}
                  value={input.sourceAssetCode}
                  onChange={(val) => setInput({ sourceAssetCode: val })}
                />
              </div>

              <button
                type="button"
                className={styles.swapBtn}
                onClick={handleSwapCurrencies}
                aria-label="Swap source and destination currencies"
                title="Swap currencies"
              >
                <svg
                  className={styles.swapIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="7 16 3 12 7 8" />
                  <line x1="21" y1="12" x2="3" y2="12" />
                  <polyline points="17 8 21 12 17 16" />
                </svg>
              </button>

              <div className={styles.currencySelect}>
                <Select
                  label="To"
                  options={ASSET_OPTIONS}
                  value={input.destAssetCode}
                  onChange={(val) => setInput({ destAssetCode: val })}
                />
              </div>
            </div>

            {/* Amount input */}
            <div className={styles.amountGroup}>
              <label className={styles.amountLabel} htmlFor="send-amount">
                You Send
              </label>
              <div className={styles.amountInputWrapper}>
                <input
                  id="send-amount"
                  type="number"
                  className={styles.amountInput}
                  placeholder="0.00"
                  value={input.amount}
                  onChange={(e) => setInput({ amount: e.target.value })}
                  min="0"
                  step="any"
                  autoComplete="off"
                  inputMode="decimal"
                />
              </div>
            </div>

            {/* Quick amount buttons (USDC only) */}
            {isSourceUSDC && (
              <div className={styles.quickAmounts}>
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`${styles.quickAmountBtn} ${
                      input.amount === amount ? styles.quickAmountBtnActive : ''
                    }`}
                    onClick={() => setInput({ amount })}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            )}

            {/* Destination address */}
            <div className={styles.destGroup}>
              <label className={styles.destLabel} htmlFor="dest-address">
                Recipient Stellar Address
              </label>
              <input
                id="dest-address"
                type="text"
                className={styles.destInput}
                placeholder="G... (Stellar public key)"
                value={destAddress}
                onChange={(e) => setDestAddress(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Error message */}
            {routeError && (
              <div className={styles.errorMsg} role="alert">
                <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
                {routeError}
              </div>
            )}

            {/* Find routes button */}
            <Button
              size="lg"
              fullWidth
              onClick={handleFindRoutes}
              disabled={!canFindRoutes}
              loading={isLoadingRoutes}
            >
              Find Best Routes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: Step 2 — Comparing (loading)
  // =====================================================================
  if (step === 'comparing') {
    return (
      <div className={styles.page}>
        <div className={`${styles.comparingContainer} ${styles.stepContainer}`} key="comparing">
          {/* Double spinner */}
          <div className={styles.comparingSpinner}>
            <div className={styles.comparingRing} />
            <div className={styles.comparingRingInner} />
          </div>

          <div>
            <p className={styles.comparingText}>
              Scanning Stellar network<span className={styles.comparingDots} />
            </p>
            <p className={styles.comparingSub}>
              Finding the best routes for {input.amount} {input.sourceAssetCode} → {input.destAssetCode}
            </p>
          </div>

          {/* Pulsing route nodes */}
          <div className={styles.pulseNodes}>
            <div className={styles.pulseNode} />
            <div className={styles.pulseLine} />
            <div className={styles.pulseNode} />
            <div className={styles.pulseLine} />
            <div className={styles.pulseNode} />
            <div className={styles.pulseLine} />
            <div className={styles.pulseNode} />
            <div className={styles.pulseLine} />
            <div className={styles.pulseNode} />
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: Step 3 — Routes
  // =====================================================================
  if (step === 'routes') {
    return (
      <>
        <div className={styles.page}>
          <div className={`${styles.stepContainer}`} key="routes">
            <div className={styles.routesHeader}>
              <h2 className={styles.routesTitle}>Available Routes</h2>
              <span className={styles.routesCount}>
                {routes.length} route{routes.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className={styles.routesList}>
              {routes.map((route, idx) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onSelect={selectRoute}
                  isSelected={selectedRoute?.id === route.id}
                  animationDelay={idx * 80}
                  onShowDetails={(r) => setDetailsRoute(r)}
                />
              ))}
            </div>

            <button
              type="button"
              className={styles.backBtn}
              onClick={() => goToStep('input')}
            >
              <svg
                className={styles.backArrow}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          </div>
        </div>

        <RouteDetailsModal
          isOpen={detailsRoute !== null}
          onClose={() => setDetailsRoute(null)}
          route={detailsRoute}
        />
      </>
    );
  }

  // =====================================================================
  // RENDER: Step 4 — Confirming
  // =====================================================================
  if (step === 'confirming' && selectedRoute) {
    const pathNodes = [
      selectedRoute.sourceAsset.code,
      ...selectedRoute.path.map((p) => p.code),
      selectedRoute.destAsset.code,
    ];

    return (
      <div className={styles.page}>
        <div className={`${styles.stepContainer}`} key="confirming">
          <div className={styles.confirmCard}>
            <h2 className={styles.confirmTitle}>Confirm Transfer</h2>

            {/* Send / Receive highlight */}
            <div className={styles.summaryHighlight}>
              <div className={styles.summaryDirection}>
                <div className={styles.summaryAmountBlock}>
                  <span className={styles.summaryAmountLabel}>You send</span>
                  <span className={styles.summaryAmount}>
                    {selectedRoute.sourceAmount}
                  </span>
                  <span className={styles.summaryAssetCode}>
                    {selectedRoute.sourceAsset.code}
                  </span>
                </div>
                <span className={styles.summaryArrow} aria-hidden="true">→</span>
                <div className={styles.summaryAmountBlock}>
                  <span className={styles.summaryAmountLabel}>They receive</span>
                  <span className={styles.summaryAmount}>
                    {parseFloat(selectedRoute.destAmount).toFixed(4)}
                  </span>
                  <span className={styles.summaryAssetCode}>
                    {selectedRoute.destAsset.code}
                  </span>
                </div>
              </div>
            </div>

            {/* Transfer details */}
            <div className={styles.transferSummary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Exchange rate</span>
                <span className={styles.summaryValue}>
                  {formatExchangeRate(
                    selectedRoute.exchangeRate,
                    selectedRoute.sourceAsset.code,
                    selectedRoute.destAsset.code
                  )}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Fee</span>
                <span className={styles.summaryValue}>
                  {formatFee(selectedRoute.estimatedFee, selectedRoute.sourceAsset.code)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Speed</span>
                <span className={styles.summaryValue}>
                  {getSpeedLabel(selectedRoute.estimatedSpeedSeconds)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Score</span>
                <span
                  className={styles.summaryValue}
                  style={{ color: getScoreColor(selectedRoute.compositeScore) }}
                >
                  {selectedRoute.compositeScore}/100
                </span>
              </div>
            </div>

            {/* Route path */}
            <div className={styles.confirmPath}>
              {pathNodes.map((code, idx) => (
                <React.Fragment key={`${code}-${idx}`}>
                  {idx > 0 && (
                    <span className={styles.confirmPathArrow} aria-hidden="true">→</span>
                  )}
                  <span className={styles.confirmPathNode}>
                    {KNOWN_ASSETS.find((a) => a.code === code)?.icon ?? '🪙'}{' '}
                    {code}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Destination */}
            <div className={styles.destAddress}>
              <span className={styles.destAddressLabel}>To:</span>
              <span className={styles.destAddressValue} title={destAddress}>
                {truncateKey(destAddress, 8)}
              </span>
            </div>

            {/* Rate lock countdown */}
            <div className={styles.rateLock}>
              <span className={styles.rateLockLabel}>Rate locks in</span>
              <div className={styles.countdownRing}>
                <svg className={styles.countdownSvg} viewBox="0 0 60 60">
                  <circle
                    className={styles.countdownBg}
                    cx="30"
                    cy="30"
                    r={COUNTDOWN_RADIUS}
                  />
                  <circle
                    className={styles.countdownFg}
                    cx="30"
                    cy="30"
                    r={COUNTDOWN_RADIUS}
                    strokeDasharray={`${COUNTDOWN_CIRCUMFERENCE}`}
                    strokeDashoffset={countdownOffset}
                  />
                </svg>
                <span
                  className={`${styles.countdownValue} ${
                    countdown <= 10 ? styles.countdownExpired : ''
                  }`}
                >
                  {countdown}s
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className={styles.warning}>
              <span className={styles.warningIcon} aria-hidden="true">🔐</span>
              This will open Freighter for signing
            </div>

            {/* Actions */}
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirmSend}
                disabled={countdown === 0 || isExecuting}
              >
                {countdown === 0 ? 'Rate Expired — Go Back' : 'Confirm & Send'}
              </button>
              <button
                type="button"
                className={styles.changeRouteBtn}
                onClick={() => goToStep('routes')}
              >
                Change Route
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: Step 5 — Executing
  // =====================================================================
  if (step === 'executing') {
    const execSteps = [
      { label: 'Building transaction', icon: '🔨' },
      { label: 'Signing with Freighter', icon: '🔐' },
      { label: 'Submitting to network', icon: '🚀' },
    ];

    return (
      <div className={styles.page}>
        <div className={`${styles.executingContainer} ${styles.stepContainer}`} key="executing">
          <h2 className={styles.executingTitle}>Processing Transfer</h2>

          <div className={styles.execSteps}>
            {execSteps.map((s, idx) => {
              const isDone = idx < execSubStep;
              const isActive = idx === execSubStep;

              const stepClass = [
                styles.execStep,
                isActive && styles.execStepActive,
                isDone && styles.execStepDone,
              ].filter(Boolean).join(' ');

              const iconClass = [
                styles.execStepIcon,
                isDone ? styles.execStepIconDone
                  : isActive ? styles.execStepIconActive
                  : styles.execStepIconPending,
              ].filter(Boolean).join(' ');

              const labelClass = [
                styles.execStepLabel,
                isActive && styles.execStepLabelActive,
                isDone && styles.execStepLabelDone,
              ].filter(Boolean).join(' ');

              return (
                <div key={idx} className={stepClass}>
                  <span className={iconClass}>
                    {isDone ? '✓' : s.icon}
                  </span>
                  <span className={labelClass}>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} />
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: Step 6 — Success
  // =====================================================================
  if (step === 'success' && lastTransaction) {
    const explorerUrl = getExplorerTxUrl(lastTransaction.transactionHash);

    return (
      <div className={styles.page}>
        <div className={`${styles.successContainer} ${styles.stepContainer}`} key="success">
          {/* Animated checkmark */}
          <div className={styles.successCheck}>
            <svg
              className={styles.successCheckSvg}
              viewBox="0 0 24 24"
              strokeDasharray="40"
              strokeDashoffset="40"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className={styles.successTitle}>Transfer Complete!</h2>

          {/* Transaction summary */}
          <div className={styles.successSummary}>
            <div className={styles.successRow}>
              <span className={styles.successRowLabel}>Sent</span>
              <span className={styles.successRowValue}>
                {lastTransaction.sourceAmount} {lastTransaction.sourceAsset.code}
              </span>
            </div>
            <div className={styles.successRow}>
              <span className={styles.successRowLabel}>Received</span>
              <span className={styles.successRowValue}>
                {parseFloat(lastTransaction.destAmount).toFixed(4)} {lastTransaction.destAsset.code}
              </span>
            </div>
            <div className={styles.successRow}>
              <span className={styles.successRowLabel}>Rate</span>
              <span className={styles.successRowValue}>
                {formatExchangeRate(
                  lastTransaction.exchangeRate,
                  lastTransaction.sourceAsset.code,
                  lastTransaction.destAsset.code
                )}
              </span>
            </div>
            <div className={styles.successRow}>
              <span className={styles.successRowLabel}>Fee</span>
              <span className={styles.successRowValue}>
                {lastTransaction.totalFee} {lastTransaction.sourceAsset.code}
              </span>
            </div>
          </div>

          {/* Transaction hash */}
          <div className={styles.txHash}>
            <span className={styles.txHashLabel}>TX:</span>
            <span className={styles.txHashValue} title={lastTransaction.transactionHash}>
              {truncateKey(lastTransaction.transactionHash, 10)}
            </span>
          </div>

          {/* Actions */}
          <div className={styles.successActions}>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.explorerBtn}
            >
              View on Explorer ↗
            </a>
            <div className={styles.secondaryActions}>
              <button
                type="button"
                className={styles.feedbackBtn}
                onClick={() => {
                  /* TODO: open feedback flow */
                }}
              >
                Give Feedback
              </button>
              <button
                type="button"
                className={styles.sendAnotherBtn}
                onClick={handleReset}
              >
                Send Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: Step 7 — Failed
  // =====================================================================
  if (step === 'failed') {
    return (
      <div className={styles.page}>
        <div className={`${styles.failedContainer} ${styles.stepContainer}`} key="failed">
          {/* Error icon */}
          <div className={styles.failedIcon}>
            <svg className={styles.failedIconSvg} viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <h2 className={styles.failedTitle}>Transfer Failed</h2>

          <p className={styles.failedMessage}>
            {executionError || 'An unexpected error occurred. Please try again.'}
          </p>

          <span className={styles.failedReassurance}>
            ✅ No funds were sent
          </span>

          {executionError?.toLowerCase().includes('trustline') && (
            <div className={styles.trustlinePromo}>
              <p className={styles.trustlinePromoText}>
                {destAddress.trim() === publicKey ? 
                  "Since this is a self-send, we can establish this trustline for you using your connected wallet." :
                  "The recipient's wallet must opt-in to hold this asset first."}
              </p>
              {destAddress.trim() === publicKey && (
                <button
                  type="button"
                  className={styles.addTrustlineBtn}
                  disabled={isAddingTrustline}
                  onClick={handleAddTrustline}
                >
                  {isAddingTrustline ? 'Adding Trustline...' : `Add Trustline for ${selectedRoute?.destAsset.code}`}
                </button>
              )}
            </div>
          )}

          <div className={styles.failedActions}>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={() => goToStep('confirming')}
            >
              Try Again
            </button>
            <button
              type="button"
              className={styles.changeRouteBtn}
              onClick={() => goToStep('routes')}
            >
              Change Route
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // Fallback (should not reach here)
  // =====================================================================
  return (
    <div className={styles.page}>
      <div className={styles.stepContainer}>
        <p>Loading…</p>
      </div>
    </div>
  );
};

TransferPage.displayName = 'TransferPage';
