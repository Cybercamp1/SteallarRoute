/**
 * Header Component
 * Top navigation bar with logo, nav links, and wallet connection
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWalletStore } from '../../store/walletStore';
import { truncateKey } from '../../lib/stellar';
import styles from './Header.module.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/send', label: 'Send' },
  { to: '/wallet', label: 'Wallet' },
  { to: '/referral', label: 'Referrals' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { publicKey, status, connect, disconnect, balances } = useWalletStore();

  const xlmBalance = balances.find((b) => b.assetCode === 'XLM')?.balance;

  const handleConnect = async () => {
    await connect();
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>AnchorRoute</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${
                location.pathname === link.to ? styles.active : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wallet Section */}
        <div className={styles.walletSection}>
          {status === 'connected' && publicKey ? (
            <div className={styles.walletInfo}>
              {xlmBalance && (
                <span className={styles.balance}>
                  {parseFloat(xlmBalance).toFixed(2)} XLM
                </span>
              )}
              <button
                className={styles.walletButton}
                onClick={disconnect}
                title="Click to disconnect"
              >
                <span className={styles.walletDot} />
                {truncateKey(publicKey)}
              </button>
            </div>
          ) : (
            <button
              className={styles.connectButton}
              onClick={handleConnect}
              disabled={status === 'connecting'}
            >
              {status === 'connecting' ? (
                <>
                  <span className={styles.spinner} />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.mobileToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.mobileNavLink} ${
                location.pathname === link.to ? styles.active : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileWallet}>
            {status === 'connected' && publicKey ? (
              <>
                <span className={styles.mobileBalance}>
                  {xlmBalance ? `${parseFloat(xlmBalance).toFixed(2)} XLM` : ''}
                </span>
                <button className={styles.mobileDisconnect} onClick={disconnect}>
                  Disconnect ({truncateKey(publicKey)})
                </button>
              </>
            ) : (
              <button
                className={styles.connectButton}
                onClick={handleConnect}
                disabled={status === 'connecting'}
              >
                {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
