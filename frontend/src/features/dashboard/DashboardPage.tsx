/**
 * DashboardPage — Main user dashboard
 * Shows wallet overview, transfer stats, recent history, and quick actions.
 * Requires a connected wallet; otherwise renders a full-page connect prompt.
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { useWalletStore } from '../../store/walletStore';
import { useTransferStore } from '../../store/transferStore';
import { truncateKey, getExplorerAccountUrl } from '../../lib/stellar';
import { Button } from '../../components/ui';
import type { TransferRecord, TransferStatus } from '../../types/transfer';

/* ─── Helpers ─── */

/** Format a timestamp into a human-readable date string */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Short date for mobile cards */
function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format a numeric amount for display */
function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

/** Status → CSS class mapping */
const STATUS_STYLES: Record<TransferStatus, string> = {
  confirmed: styles.statusConfirmed,
  pending: styles.statusPending,
  submitted: styles.statusSubmitted,
  failed: styles.statusFailed,
};

/** Stat card icons */
const STAT_ICONS = {
  transfers: '📊',
  volume: '💰',
  success: '✅',
  route: '🛤️',
} as const;

/** Rating labels for score display */
const RATING_HINTS = ['', 'Low', 'Fair', 'Good', 'Great', 'Excellent'] as const;

/* ─── Stat Computation ─── */

interface DashboardStatData {
  totalTransfers: number;
  totalVolume: string;
  successRate: string;
  favoriteRoute: string;
}

function computeStats(history: TransferRecord[]): DashboardStatData {
  if (history.length === 0) {
    return {
      totalTransfers: 0,
      totalVolume: '0',
      successRate: '—',
      favoriteRoute: '—',
    };
  }

  const totalTransfers = history.length;

  const totalVolume = history.reduce((sum, tx) => {
    return sum + parseFloat(tx.sourceAmount || '0');
  }, 0);

  const confirmed = history.filter((tx) => tx.status === 'confirmed').length;
  const successRate =
    totalTransfers > 0 ? ((confirmed / totalTransfers) * 100).toFixed(1) : '0';

  // Find most-used corridor (source → dest asset pair)
  const corridorCounts = new Map<string, number>();
  for (const tx of history) {
    const corridor = `${tx.sourceAsset.code}→${tx.destAsset.code}`;
    corridorCounts.set(corridor, (corridorCounts.get(corridor) || 0) + 1);
  }
  let favoriteRoute = '—';
  let maxCount = 0;
  for (const [corridor, count] of corridorCounts) {
    if (count > maxCount) {
      maxCount = count;
      favoriteRoute = corridor;
    }
  }

  return {
    totalTransfers,
    totalVolume: formatAmount(totalVolume.toFixed(2)),
    successRate: `${successRate}%`,
    favoriteRoute,
  };
}

/* ═══════════════════════════════════════════
   DASHBOARD PAGE COMPONENT
   ═══════════════════════════════════════════ */

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey, status, balances, connect, refreshBalance } = useWalletStore();
  const { history } = useTransferStore();

  const isConnected = status === 'connected' && publicKey;

  /* ---- Derived data ---- */
  const xlmBalance = useMemo(() => {
    const xlm = balances.find((b) => b.assetCode === 'XLM');
    return xlm ? parseFloat(xlm.balance).toFixed(4) : '0.0000';
  }, [balances]);

  const stats = useMemo(() => computeStats(history), [history]);

  const sortedHistory = useMemo(() => {
    return [...history]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);
  }, [history]);

  /* ---- Callbacks ---- */
  const handleNewTransfer = useCallback(() => navigate('/send'), [navigate]);

  const handleRefreshBalance = useCallback(async () => {
    await refreshBalance();
  }, [refreshBalance]);

  const explorerUrl = useMemo(
    () => (publicKey ? getExplorerAccountUrl(publicKey) : '#'),
    [publicKey],
  );

  /* ========================================
     NOT CONNECTED — Show Connect Prompt
     ======================================== */
  if (!isConnected) {
    return (
      <div className={styles.page}>
        <div className={styles.connectPrompt}>
          <span className={styles.connectIcon} aria-hidden="true">
            🔗
          </span>
          <h1 className={styles.connectTitle}>Connect Your Wallet</h1>
          <p className={styles.connectSubtitle}>
            Connect your Stellar wallet to view your dashboard, transfer history,
            and start sending money across borders.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={connect}
            loading={status === 'connecting'}
            icon={<span aria-hidden="true">⚡</span>}
          >
            Connect Freighter
          </Button>
        </div>
      </div>
    );
  }

  /* ========================================
     CONNECTED — Full Dashboard
     ======================================== */
  return (
    <div className={styles.page}>
      {/* ── Welcome Section ── */}
      <section className={styles.welcomeSection} aria-label="Account overview">
        <div className={styles.welcomeInfo}>
          <h1 className={styles.greeting}>Welcome back 👋</h1>
          <span className={styles.walletAddress} title={publicKey}>
            {truncateKey(publicKey, 6)}
          </span>
        </div>

        <div className={styles.balanceBlock}>
          <span className={styles.balanceValue}>{xlmBalance}</span>
          <span className={styles.balanceLabel}>XLM</span>
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <div className={styles.quickActions} role="group" aria-label="Quick actions">
        <button
          type="button"
          className={`${styles.quickActionButton} ${styles.quickActionPrimary}`}
          onClick={handleNewTransfer}
        >
          <span className={styles.quickActionIcon} aria-hidden="true">🚀</span>
          Send Money
        </button>

        <button
          type="button"
          className={styles.quickActionButton}
          onClick={handleNewTransfer}
        >
          <span className={styles.quickActionIcon} aria-hidden="true">📤</span>
          New Transfer
        </button>

        <button
          type="button"
          className={styles.quickActionButton}
          onClick={handleRefreshBalance}
        >
          <span className={styles.quickActionIcon} aria-hidden="true">🔄</span>
          Refresh Balance
        </button>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.explorerLink}
        >
          <span className={styles.quickActionIcon} aria-hidden="true">🔍</span>
          View on Explorer
          <svg className={styles.externalIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </div>

      {/* ── Stats Grid ── */}
      <section
        className={styles.statsGrid}
        aria-label="Transfer statistics"
        style={{ marginTop: 'var(--space-8)' }}
      >
        <div className={styles.statCard}>
          <span className={styles.statIcon} aria-hidden="true">
            {STAT_ICONS.transfers}
          </span>
          <span className={styles.statValue}>{stats.totalTransfers}</span>
          <span className={styles.statLabel}>Total Transfers</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon} aria-hidden="true">
            {STAT_ICONS.volume}
          </span>
          <span className={styles.statValue}>{stats.totalVolume}</span>
          <span className={styles.statLabel}>Total Volume</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon} aria-hidden="true">
            {STAT_ICONS.success}
          </span>
          <span className={styles.statValue}>{stats.successRate}</span>
          <span className={styles.statLabel}>Success Rate</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon} aria-hidden="true">
            {STAT_ICONS.route}
          </span>
          <span className={styles.statValue}>{stats.favoriteRoute}</span>
          <span className={styles.statLabel}>Favorite Route</span>
        </div>
      </section>

      {/* ── Recent Transfers ── */}
      <section aria-label="Recent transfers">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Transfers</h2>
        </div>

        {sortedHistory.length === 0 ? (
          /* Empty State */
          <div className={styles.transfersContainer}>
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden="true">📭</span>
              <h3 className={styles.emptyTitle}>No transfers yet</h3>
              <p className={styles.emptySubtitle}>
                Start your first transfer! Send money across borders in seconds
                with AI-optimized routing.
              </p>
              <Button variant="primary" size="md" onClick={handleNewTransfer}>
                Start First Transfer
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className={`${styles.transfersContainer} ${styles.transfersDesktop}`}>
              <table className={styles.transfersTable}>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Corridor</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Score</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.map((tx) => (
                    <TransferRow key={tx.id} tx={tx} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className={styles.transferCards}>
              {sortedHistory.map((tx) => (
                <TransferCardMobile key={tx.id} tx={tx} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

/* ─── Transfer Table Row ─── */
interface TransferRowProps {
  tx: TransferRecord;
}

const TransferRow: React.FC<TransferRowProps> = ({ tx }) => {
  const scoreNum = Math.round(tx.score * 100);
  const scoreClass =
    scoreNum >= 80
      ? styles.scoreGood
      : scoreNum >= 50
        ? styles.scoreMedium
        : styles.scoreLow;

  return (
    <tr>
      <td className={styles.dateCell}>{formatDate(tx.createdAt)}</td>
      <td>
        <span className={styles.corridorCell}>
          {tx.sourceAsset.code}
          <span className={styles.corridorArrow} aria-hidden="true">→</span>
          {tx.destAsset.code}
        </span>
      </td>
      <td className={styles.amountCell}>{formatAmount(tx.sourceAmount)}</td>
      <td>
        <StatusBadge status={tx.status} />
      </td>
      <td className={`${styles.scoreCell} ${scoreClass}`}>{scoreNum}</td>
      <td>
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${tx.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.viewButton}
        >
          View
        </a>
      </td>
    </tr>
  );
};

/* ─── Mobile Transfer Card ─── */
const TransferCardMobile: React.FC<TransferRowProps> = ({ tx }) => {
  const scoreNum = Math.round(tx.score * 100);
  const scoreClass =
    scoreNum >= 80
      ? styles.scoreGood
      : scoreNum >= 50
        ? styles.scoreMedium
        : styles.scoreLow;

  return (
    <div className={styles.transferCard}>
      <div className={styles.transferCardHeader}>
        <span className={styles.transferCardCorridor}>
          {tx.sourceAsset.code}
          <span className={styles.corridorArrow} aria-hidden="true">→</span>
          {tx.destAsset.code}
        </span>
        <StatusBadge status={tx.status} />
      </div>
      <div className={styles.transferCardRow}>
        <span className={styles.transferCardLabel}>Amount</span>
        <span className={styles.transferCardValue}>{formatAmount(tx.sourceAmount)}</span>
      </div>
      <div className={styles.transferCardRow}>
        <span className={styles.transferCardLabel}>Score</span>
        <span className={`${styles.transferCardValue} ${scoreClass}`}>{scoreNum}</span>
      </div>
      <div className={styles.transferCardRow}>
        <span className={styles.transferCardLabel}>Date</span>
        <span className={styles.transferCardValue}>{formatShortDate(tx.createdAt)}</span>
      </div>
      <a
        href={`https://stellar.expert/explorer/testnet/tx/${tx.transactionHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.viewButton}
        style={{ alignSelf: 'flex-end' }}
      >
        View on Explorer
      </a>
    </div>
  );
};

/* ─── Status Badge ─── */
interface StatusBadgeProps {
  status: TransferStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`${styles.statusBadge} ${STATUS_STYLES[status]}`}>
    <span className={styles.statusDot} aria-hidden="true" />
    {status}
  </span>
);

export default DashboardPage;
