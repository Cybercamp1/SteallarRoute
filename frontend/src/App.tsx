/**
 * AnchorRoute — Main Application Component
 * Sets up routing, providers, and global initialization
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

// Lazy load transfer page (heavy component)
import { lazy, Suspense } from 'react';
const TransferPage = lazy(() =>
  import('./features/transfer/TransferPage').then((mod) => ({ default: mod.TransferPage }))
);

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
    <BrowserRouter>
      <ToastProvider>
        <div className="app-wrapper">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/send"
                element={
                  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-secondary, #94a3b8)' }}>Loading...</div>}>
                    <TransferPage />
                  </Suspense>
                }
              />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
