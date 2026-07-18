import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Detect if running inside Chrome/Firefox Extension environment
const isExtension =
  (typeof window !== 'undefined' && window.chrome && chrome.runtime && chrome.runtime.id) ||
  (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:');

if (isExtension) {
  document.body.classList.add('extension-popup');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
