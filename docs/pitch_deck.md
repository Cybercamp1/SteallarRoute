# AnchorRoute Startup Pitch Deck 🚀

> AI-Powered Cross-Border Remittance Router and Wallet popup client built on Stellar.

**dApp Live Demo:** [https://stellarroute.netlify.app/](https://stellarroute.netlify.app/)
**GitHub Codebase:** [https://github.com/Cybercamp1/SteallarRoute](https://github.com/Cybercamp1/SteallarRoute)

---

## Slide 1: Title & Vision
### **AnchorRoute: The Smart Layer of Stellar Remittances**
*   **Tagline:** AI-driven route discovery and atomic settlement for borderless payments.
*   **Vision:** Democratize global money transfers by giving users real-time execution clarity and automated fee savings across the entire Stellar ecosystem.

---

## Slide 2: The Problem
### **The Opacity & Friction of Cross-Border Transfers**
*   **Corridor Complexity:** Finding the cheapest corridor (e.g., USD to EUR) across multiple decentralized anchors is extremely time-consuming and opaque.
*   **Variable spreads:** Slippage and hidden anchor fee spreads fluctuate constantly, costing users up to 5-10% per transaction.
*   **Trustline Barriers:** Activating asset accounts (USDC, EURT) on Stellar requires manual trustlines, blocking non-technical users from onboarding.

---

## Slide 3: The Solution
### **Atomic Multi-Factor Route Optimization**
*   **Real-time Pathfinder:** Scans the Stellar network's Decentralized Exchanges (DEX) and AMMs in milliseconds to construct optimal transaction paths.
*   **AI Score Engine:** Ranks paths using a weighted multi-factor scoring model:
    *   *Rate Spread (35%)*
    *   *Total Fee (30%)*
    *   *Hops & Speed (15%)*
    *   *Liquidity Depth (10%)*
    *   *On-chain Reputation (10%)*
*   **One-Click Settlement:** Executes the chosen path payment atomically. If path liquidity is thin, it falls back to direct settlement instantly to ensure real-time completion.

---

## Slide 4: The Product Experience
### **Seamless Web Client & Extension Wallet**
*   **Landing Dashboard:** Glowing dark-mode client featuring live transaction stats and route summaries.
*   **AI Routing Insights:** Expandable breakdown panels on every route selection card detailing exact fee paths, spreads, and execution speed.
*   **Dual-Context Wallet:** Functioning as both a desktop dApp and a standalone **Chrome Extension Popup Wallet** loaded natively via Manifest V3.
*   **Trustline Manager:** Automatic warnings and inline, one-click trustline activation buttons on transfer failure screens.

---

## Slide 5: Technical Architecture
### **A Hybrid Blockchain Core**
*   **Frontend Client:** React 18 + TypeScript + Vite + Zustand state store.
*   **Blockchain Integration:** Stellar SDK + Freighter Wallet API for secure, non-custodial transaction signing.
*   **On-chain Ratings Register:** A Soroban smart contract (Rust) running on Stellar Testnet that registers and compiles decentralized user ratings for anchors.
*   **Client Operations:** Performs atomic `PathPaymentStrictSend` and `PathPaymentStrictReceive` operations.

---

## Slide 6: Market Opportunity
### **Tapping into the Global Remittance Flows**
*   **Target Market:** Small-and-Medium Enterprises (SMEs), freelancers, and migrant workers executing recurring cross-border transfers.
*   **Stellar Moat:** Stellar's path payment primitives are unique in the blockchain ecosystem. AnchorRoute sits on top of this, acting as the intelligent user interface layer.
*   **Addressing Pain:** Replaces opaque centralized fee giants with low-cost, decentralized liquidity pools.

---

## Slide 7: Growth & Virality
### **XLM Gas Cashback & Referral Engine**
*   **Cashback Reward Loop:** Users earn a 0.05% cashback rebate (paid in XLM) for making transactions, which is claimed directly into their wallets to cover future gas.
*   **Viral Referrals:** Programmatic referral link generators (`?ref=YOUR_ADDRESS`) that allow influencers, websites, and users to earn a share of transaction fees by onboarding others.
*   **Active Onboarding:** 55+ active testers successfully onboarded during our MVP validation phase.

---

## Slide 8: Business Model
### **Sustainable Unit Economics**
*   **Routing Convenience Spread:** A small, transparent 0.05% fee spread on routing paths that save users more than 1.5% compared to baseline rates.
*   **Anchor Affiliation:** Affiliate partnerships with anchors who receive increased remittance inflows.
*   **No Upfront Fees:** Free for users; monetization is tied directly to the value created by fee savings.

---

## Slide 9: Traction & Milestones
### **Validated MVP Execution**
*   **Development Progress:** 35+ incremental commits in git history.
*   **Live Deployment:** Production build hosted at [stellarroute.netlify.app](https://stellarroute.netlify.app/).
*   **Ecosystem Validation:**
    *   *55+ active test wallets logged.*
    *   *PostHog analytics tracking user sessions.*
    *   *Sentry error monitoring capturing client-side diagnostics.*
*   **Smart Contract:** Live on testnet at `CDW3LGL5L3G737V4DHYF64AECZMXG45MHTKDRN5YGLQ24RCRB64QZMXG`.

---

## Slide 10: The Roadmap & Vision
### **Scale, Deploy, and Partner**
*   **Phase 1:** Chrome Web Store release and anchor partnership integrations.
*   **Phase 2:** Multi-wallet connect (connecting Albedo, xBull, and walletconnect).
*   **Phase 3:** Automated dollar-cost averaging (DCA) routing channels.
