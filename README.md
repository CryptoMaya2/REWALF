# Rewalf — Trustless Stellar Referral Payouts

> **Find Your Way Hackathon (Stellar Passport / HackMeridian) Entry**  
> **Track:** General Track (Technical Execution, Meaningful Use of Stellar, Originality, Impact, UX & Presentation)

---

## 1. What Rewalf Is

**Rewalf** is a trustless referral payout protocol built natively on the **Stellar Testnet**.

In standard referral affiliate programs, referrers are exposed to counterparty risk: a business promises a payout after a customer signs up or pays, but the business can delay payment, change the terms, or divert the funds.

**Rewalf reverses this paradigm:**
1. A business **locks a USDC (or test XLM) reward in an on-chain Stellar Escrow Vault before** it promises a referrer anything.
2. The referrer receives a unique, verifiable referral link (`/r/:code`).
3. **After the lock, the business cannot pay a different person.** The payout recipient address is cryptographically anchored on Stellar.
4. If the referred customer pays, the referrer claims the reward directly from the Escrow Vault on-chain.
5. If the deadline passes with no payment, the business reclaims the escrow deposit.

### What Rewalf is NOT:
- **Not a savings circle:** Rewalf has no pooling or circular member payouts.
- **Not freelancer escrow:** No milestone arbitration or subjective work disputes. Payouts are strictly binary conditional on customer payment confirmation.
- **Not a plugin for an existing shop:** Rewalf is a standalone referral agreement and payout engine with its own verified landing and claiming experience.

---

## 2. Product Experience & Navigation

Rewalf follows leading Web3 protocol design standards:
- **Protocol Landing Page (`/`):** First-time visitors are welcomed with a comprehensive presentation explaining what Rewalf is, why legacy affiliate models fail, how trustless escrow works in 3 steps, architecture breakdown, and interactive FAQs.
- **Protocol Application (`/app`):** Clicking **"Launch App"** transitions into the management dashboard (Overview, Programs, Payouts, Referrer Portal, Payout Trace, and Settings).
- **Seamless Switcher:** Users inside the dashboard can click **"About"** or the brand logo at any time to return to the landing page.

---

## 3. Non-Custodial Architecture & Safety Guarantees

> **Zero Private Keys Handled:**  
> Rewalf does not operate an inbuilt custodial wallet and **never asks for, handles, or stores your secret keys or seed phrase**.  
> Users connect their own trusted Stellar wallet:  
> - **Freighter Wallet:** The official browser extension wallet developed by the Stellar Development Foundation (SDF).  
> - **Albedo:** Zero-install web signer with secure popup authorization — works on any desktop or mobile browser.  
> - **Disposable Sandbox Mode:** Provided solely for instant testnet judging and quick evaluation without installing software.  
>  
> Every blockchain operation (such as funding and locking the Escrow Vault) is handed off to your connected wallet interface for you to inspect, confirm, and cryptographically sign.  
>  
> **Timers & Soroban Notice:**  
> Blockchains are passive state machines; they cannot trigger an autonomous cron job when time elapses. An external party (the referrer or the business) must submit the transaction to invoke **Claim** or **Reclaim**. Rewalf stores an explicit `deadline` timestamp in the agreement on-chain and validates it prior to authorizing reclaim. Storage expiry is never treated as the business deadline.  

---

## 4. The Three Demo Clicks

You can complete the entire lifecycle in 3 clicks in a fresh browser session:

```
[ Click 1: Lock Reward ]  ───>  [ Click 2: Mark Paid ]  ───>  [ Click 3: Claim / Reclaim ]
    (Business Screen)               (Referrer Screen)                 (On-Chain Payout)
```

1. **Click 1: Lock Reward (Business Screen)**
   - Fill reward amount (e.g. `25 USDC`), referrer Stellar public key (`G...`), customer label, and select a deadline preset (e.g. `+5 Minutes (Fast Demo)`).
   - Click **"Lock Reward on Stellar Testnet"** (`#lock-reward-btn`).
   - This submits a **real Stellar Testnet transaction**, funds the dedicated Escrow Vault account, and writes on-chain metadata.
   - Shows the verified Stellar Testnet transaction hash, Stellar Expert explorer link, and the generated `/r/:code` link.

2. **Click 2: Mark Customer Paid (Referrer Screen `/r/:code`)**
   - Click **"Open Page"** or navigate to `/r/:code`.
   - The screen shows the locked amount, the non-divertible escrow rule, and the current state (`LOCKED`). The claim button is disabled while awaiting payment.
   - Click **"Mark Customer Paid"** (`#mark-paid-btn`).
   - For this demo, this button marks the customer payment confirmed (in production, Rewalf can listen to a real Stellar payment or checkout webhook). The state transitions to `PAID`.

3. **Click 3: Claim Reward (Referrer Screen) OR Reclaim (Business Screen)**
   - **Happy Path (Claim):** The **"Claim Reward"** button (`#claim-reward-btn`) is now unlocked. Clicking it submits a **real Stellar Testnet payment transaction** sending the reward from the Escrow Vault directly to the referrer's Stellar wallet.
   - **Timeout Path (Reclaim):** If the deadline passes without customer payment, the Business navigates to **"3. Business Reclaim"**, where the **"Reclaim Locked Reward"** button (`#reclaim-reward-btn`) becomes enabled after the deadline. Clicking it submits a **real Stellar Testnet transaction** returning the deposit to the business wallet. (A *Fast-forward Deadline (Demo)* button is included so evaluators do not have to wait hours).

---

## 5. Where the Stellar Transactions Happen

Every state change in Rewalf interfaces with genuine Stellar Testnet Horizon RPC calls. **No fake hashes are ever returned.**

| Action | Function Location | Stellar Operation & Details |
|---|---|---|
| **Lock Reward** | [`src/stellar/stellarService.ts`](file:///c:/Users/Maya/OneDrive/Dokument/rewalf/src/stellar/stellarService.ts#L170-L245) | `Operation.createAccount`: Creates and funds the Escrow Vault account.<br>`Operation.manageData`: Anchors `rw_referrer`, `rw_deadline`, and `rw_customer`. |
| **Claim Reward** | [`src/stellar/stellarService.ts`](file:///c:/Users/Maya/OneDrive/Dokument/rewalf/src/stellar/stellarService.ts#L250-L295) | `Operation.payment`: Transfers the locked reward from Escrow Vault to Referrer `G...` address.<br>`Operation.manageData`: Records `rw_state = 'CLAIMED'`. |
| **Reclaim Reward** | [`src/stellar/stellarService.ts`](file:///c:/Users/Maya/OneDrive/Dokument/rewalf/src/stellar/stellarService.ts#L300-L355) | `Operation.payment`: Returns the locked deposit from Escrow Vault back to Business `G...` address.<br>`Operation.manageData`: Records `rw_state = 'RECLAIMED'`. |
| **Faucet Funding** | [`src/stellar/stellarService.ts`](file:///c:/Users/Maya/OneDrive/Dokument/rewalf/src/stellar/stellarService.ts#L65-L85) | Hits Stellar Friendbot (`https://friendbot.stellar.org/?addr=...`) to fund accounts with 10,000 testnet XLM. |

All transactions provide a clickable link to:
`https://stellar.expert/explorer/testnet/tx/{txHash}`

---

## 6. State Machine

```
         ┌──────────────┐
         │    LOCKED    │ ◄── Reward locked in Stellar Escrow Vault
         └──────┬───────┘
                │
       Customer │ Customer Unpaid
           Paid │ & Deadline Passed
                ▼
         ┌──────────────┐        ┌──────────────┐
         │     PAID     │        │   EXPIRED    │
         └──────┬───────┘        └──────┬───────┘
                │                       │
Referrer Claims │       Business Reclaims│
                ▼                       ▼
         ┌──────────────┐        ┌──────────────┐
         │   CLAIMED    │        │  RECLAIMED   │
         └──────────────┘        └──────────────┘
```

---

## 7. Quickstart / Running Locally

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### Installation & Run

1. Clone or open the project folder:
   ```bash
   npm install
   ```

2. Configure environment variables (defaults work automatically for Stellar Testnet):
   ```bash
   cp .env.example .env
   ```

3. Start Vite development server:
   ```bash
   npm run dev
   ```

4. Open the local URL in your browser:
   `http://localhost:5174/` (or `http://localhost:5173/`)

---

## 8. Configuration (.env)

```ini
VITE_STELLAR_NETWORK=TESTNET
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_FRIENDBOT_URL=https://friendbot.stellar.org
VITE_STELLAR_EXPERT_URL=https://stellar.expert/explorer/testnet
VITE_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

---

## 9. Hackathon Evaluation Checklist

- [x] **Technical Execution:** Complete React + TypeScript + `@stellar/stellar-sdk` app with on-chain escrow management.
- [x] **Meaningful Use of Stellar:** Utilizes Stellar native account creation, multi-operation signing, `manageData` key-value states, native and asset payments, and Friendbot funding.
- [x] **No Fake Hashes:** Live transactions are signed and submitted to Stellar Horizon testnet; real Horizon errors are caught and surfaced.
- [x] **Referrer Guarantee:** Non-divertible escrow prevents the business from paying anyone else once locked.
- [x] **Clean UX:** 3-screen flow with built-in testnet wallet manager, 1-click Friendbot faucet, deadline countdown, and Stellar Expert explorer links.
