# AnchorRoute Frontend Client 🌐

> AI-Powered Cross-Border Remittance Router and Wallet popup client.

**Live dApp URL:** [https://stellarroute.netlify.app/](https://stellarroute.netlify.app/)

This directory houses the React + TypeScript + Vite frontend client for AnchorRoute. The app is fully responsive, optimized for both desktop web layout and Chrome Extension popup viewport formats.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [Freighter Wallet](https://freighter.app) browser extension for testnet signing

### Development Server
Run the local dev server:
```bash
npm install
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** to view the app.

### Production Build
Build the optimized production assets:
```bash
npm run build
```
The output will be compiled into the `dist/` directory.

---

## 👛 Chrome Extension Deployment

The production build folder contains a `manifest.json` file. To run this app as a native browser extension popup:
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Toggle **Developer mode** to **On** (top-right).
4. Click **Load unpacked** (top-left) and select the `frontend/dist/` directory.
5. Pin the extension and click the popup icon in your browser toolbar!
