# AnchorRoute 🌐

> AI-Powered Cross-Border Remittance Router for Stellar

[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-blue)](https://stellar.org)
[![Smart Contracts](https://img.shields.io/badge/Smart%20Contracts-Soroban-orange)](https://soroban.stellar.org)
[![Live Demo](https://img.shields.io/badge/Live-Demo-emerald)](https://stellarroute.netlify.app/)

## 🚀 Overview

**Live dApp URL:** [https://stellarroute.netlify.app/](https://stellarroute.netlify.app/)

AnchorRoute scans Stellar's anchor network in real-time to find the cheapest, fastest payment path for cross-border remittance. Users simply enter an amount and currency pair, and our AI scoring engine ranks all available routes by cost, speed, liquidity, and community reliability ratings.

### The Problem
Users have no way to know which anchor or corridor gives the best FX rate right now. Comparing routes manually across multiple anchors is time-consuming and error-prone.

### The Solution
AnchorRoute's AI-powered engine:
1. Scans all available Stellar path payments in real-time
2. Scores routes using a weighted multi-factor algorithm (exchange rate, fees, speed, liquidity, reliability)
3. Presents ranked options with clear comparison cards
4. Executes the optimal path payment — all in one click

### Why Stellar?
Path payments + the anchor network are Stellar's actual moat — no other chain has this primitive for atomic multi-hop currency conversion.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                     │
│  Landing │ Transfer Flow │ Route Comparison │ Dashboard       │
└─────────────────────┬────────────────────────────────────────┘
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────────┐
  │ Horizon  │  │ Soroban  │  │ Anchor       │
  │ API      │  │ Contract │  │ stellar.toml │
  │ (Paths)  │  │ (Feedback│  │ (Discovery)  │
  └──────────┘  │  Logging)│  └──────────────┘
                └──────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Vanilla CSS (CSS Modules) |
| **Blockchain** | Stellar SDK, Freighter Wallet |
| **Smart Contract** | Soroban (Rust) on Stellar Testnet ([`CDW3LGL5L3G...`](https://stellar.expert/explorer/testnet/contract/CDW3LGL5L3G737V4DHYF64AECZMXG45MHTKDRN5YGLQ24RCRB64QZMXG)) |
| **State** | Zustand |
| **Analytics** | PostHog |
| **Monitoring** | Sentry |

## 📦 Project Structure

```
StellarRouter/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature-based pages
│   │   │   ├── landing/   # Landing page
│   │   │   ├── transfer/  # Transfer flow (core feature)
│   │   │   ├── dashboard/ # User dashboard
│   │   │   └── feedback/  # Feedback collection
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Core libraries
│   │   │   ├── stellar.ts # Stellar SDK wrapper
│   │   │   ├── scoring.ts # AI route scoring engine
│   │   │   ├── freighter.ts # Wallet adapter
│   │   │   └── anchors.ts # Anchor discovery
│   │   ├── store/         # Zustand state stores
│   │   ├── services/      # Analytics & monitoring
│   │   ├── styles/        # Global CSS & design tokens
│   │   └── types/         # TypeScript definitions
│   └── package.json
├── contracts/             # Soroban smart contracts
│   └── anchor_route/
│       ├── Cargo.toml
│       └── src/lib.rs
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [Freighter Wallet](https://freighter.app) browser extension
- (Optional) Rust + Stellar CLI for contract development

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in `frontend/`:

```env
VITE_POSTHOG_KEY=your_posthog_key
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ANCHOR_ROUTE_CONTRACT_ID=CDW3LGL5L3G737V4DHYF64AECZMXG45MHTKDRN5YGLQ24RCRB64QZMXG
```

### Deployed Smart Contract (Testnet)
- **Contract Address:** `CDW3LGL5L3G737V4DHYF64AECZMXG45MHTKDRN5YGLQ24RCRB64QZMXG`
- **Stellar Expert Link:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDW3LGL5L3G737V4DHYF64AECZMXG45MHTKDRN5YGLQ24RCRB64QZMXG)

### Smart Contract (Optional)

```bash
# Install Rust + Stellar CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32v1-none
cargo install --locked stellar-cli

# Build
cd contracts/anchor_route
stellar contract build

# Deploy to testnet
stellar keys generate --global deployer --network testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/anchor_route.wasm \
  --network testnet \
  --source-account deployer
```

## 🎯 AI Route Scoring

Routes are scored using a weighted multi-factor algorithm:

| Factor | Weight | Description |
|--------|--------|-------------|
| Exchange Rate | 35% | Closeness to mid-market rate |
| Total Fee | 30% | All-in cost (network + spread) |
| Speed | 15% | Path complexity (fewer hops = faster) |
| Liquidity | 10% | Order book depth |
| Reliability | 10% | Community ratings from on-chain feedback |

## 📱 Features

- ✅ **Real-time Path Discovery** — Scans Stellar Horizon for all available routes
- ✅ **AI Route Scoring** — Multi-factor weighted scoring algorithm
- ✅ **Route Comparison UI** — Side-by-side cards with tags (Best Value, Cheapest, Fastest)
- ✅ **Freighter Wallet** — One-click connection + transaction signing
- ✅ **Path Payments** — Atomic multi-hop currency conversion
- ✅ **On-chain Feedback** — Soroban contract for route ratings
- ✅ **Transfer Dashboard** — History, stats, and analytics
- ✅ **Mobile Responsive** — Optimized for all screen sizes
- ✅ **Analytics & Monitoring** — PostHog + Sentry integration
- ✅ **Dark Theme** — Premium fintech aesthetic

## 📄 License

MIT

---

Built with ❤️ on [Stellar](https://stellar.org)
