export type AgreementState = 'LOCKED' | 'PAID' | 'CLAIMED' | 'RECLAIMED';

export type AssetType = 'USDC' | 'XLM';

export interface Agreement {
  code: string;
  businessAddress: string;
  referrerAddress: string;
  customerLabel: string;
  amount: string;
  assetCode: AssetType;
  deadline: number; // Unix epoch ms
  state: AgreementState;
  
  // Escrow Vault on Stellar
  escrowPublicKey: string;
  /**
   * ⚠️  SECURITY WARNING — TESTNET DEMO ONLY
   * This secret key is stored in localStorage purely for the sandbox demo signing flow.
   * NEVER ship this field on mainnet. On mainnet, escrow signing must happen via a
   * server-side custodian, multi-sig, or hardware wallet — never client-side localStorage.
   */
  escrowSecretKey: string;

  // Stellar Testnet Transaction Hashes
  lockTxHash: string;
  paidTxHash?: string;
  claimTxHash?: string;
  reclaimTxHash?: string;

  // Timestamps
  createdAt: number;
  paidAt?: number;
  claimedAt?: number;
  reclaimedAt?: number;

  // Optional error logging
  lastError?: string;
}

export type WalletType = 'freighter' | 'albedo' | 'sandbox' | 'manual';

export interface ConnectedWallet {
  publicKey: string;
  walletType: WalletType;
  label?: string;
  balanceXlm?: string;
  balanceUsdc?: string;
  secretKey?: string; // Only present for disposable sandbox mode
}

// Kept for backward compatibility
export type WalletAccount = ConnectedWallet;

export interface HorizonErrorDetail {
  title: string;
  status: number;
  detail: string;
  codes?: string[];
  raw?: unknown;
}
