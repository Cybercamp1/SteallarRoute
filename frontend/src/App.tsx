/**
 * AnchorRoute — Main Application Component
 * Sets up routing, providers, and global initialization
 */

import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { LandingPage } from './features/landing';
import { DashboardPage } from './features/dashboard';
import { ToastProvider } from './components/ui';
import { useWalletStore } from './store/walletStore';
import { initAnalytics } from './services/analytics';
import { initMonitoring } from './services/monitoring';

// Import global styles
import './styles/globals.css';
import './styles/animations.css';
import './styles/utilities.css';

import { TransferPage } from './features/transfer';
import { WalletPage } from './features/wallet';

function App() {
  const { checkExistingConnection, checkFreighter } = useWalletStore();

  useEffect(() => {
    // Initialize services
    initAnalytics();
    initMonitoring();

    // Check for existing wallet connection
    checkFreighter();
    checkExistingConnection();
  }, [checkExistingConnection, checkFreighter]);

  return (
    <HashRouter>
      <ToastProvider>
        <div className="app-wrapper">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/send" element={<TransferPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;
