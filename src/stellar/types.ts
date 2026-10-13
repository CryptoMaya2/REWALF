export type AgreementState = 'LOCKED' | 'PAID' | 'CLAIMED' | 'RECLAIMED';

export type AssetType = 'USDC' | 'XLM';

export type ProtocolStatus = 'registered' | 'awaiting_integration' | 'active';
export type ProtocolNetwork = 'Stellar Testnet';
export type IntegrationMechanism = 'client_sdk' | 'webhook_oracle';

export interface Protocol {
  id: string; // e.g. "proto_saasify"
  name: string; // e.g. "SaaSify Cloud Infrastructure"
  website: string; // e.g. "https://saasify.cloud"
  description: string;
  network: ProtocolNetwork;
  ownerWallet: string; // Stellar public key
  status: ProtocolStatus;
  integrationType: IntegrationMechanism;
  apiKey: string;
  webhookSecret: string;
  webhookUrl?: string;
  createdAt: number;
  verifiedOwnership: boolean;
}

export interface BusinessProfile {
  id: string; // e.g. "biz_saasify"
  name: string; // e.g. "SaaSify Cloud"
  website: string; // e.g. "https://saasify.io"
  category: string; // e.g. "B2B SaaS", "FinTech", "Web3 / Crypto", "E-Commerce", "Agency"
  description: string;
  logoUrl?: string;
  contactEmail?: string;
  walletAddress: string; // Business treasury Stellar public key
  createdAt: number;
  verified: boolean;
}

export interface VerifiedConversion {
  id: string;
  campaignCode: string;
  orderId: string;
  customerLabel?: string;
  customerAddress?: string;
  referrerAddress: string;
  rewardAmount: string;
  assetCode: AssetType;
  verifiedAt: number;
  verificationMethod: 'sdk_client' | 'hmac_webhook' | 'manual_settlement';
  proofHash?: string;
  status: 'verified' | 'paid' | 'flagged';
  notes?: string;
}

export interface ReferrerPerformance {
  referrerAddress: string;
  campaignCode: string;
  campaignTitle?: string;
  businessName?: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  totalEarned: string;
  assetCode: AssetType;
  status: 'active' | 'flagged';
}

export interface Agreement {
  code: string;
  businessAddress: string;
  referrerAddress: string;
  customerLabel: string;
  amount: string;
  assetCode: AssetType;
  deadline: number; // Unix epoch ms
  state: AgreementState;
  
  // Optional Registered Business / Protocol Context
  protocolId?: string;
  businessId?: string;
  businessName?: string;
  businessWebsite?: string;
  businessCategory?: string;
  targetUrl?: string; // Destination URL where customer lands with ?ref=CODE

  // Budget & Escrow Metrics
  totalBudget?: string;
  rewardPerConversion?: string;
  remainingBudget?: string;
  claimedAmount?: string;
  clicksCount?: number;
  conversionsCount?: number;

  // Verified Conversions List
  conversions?: VerifiedConversion[];

  // Escrow Vault on Stellar
  escrowPublicKey: string;
  /**
   * ⚠️  SECURITY WARNING: TESTNET DEMO ONLY
   * This secret key is stored in localStorage purely for the sandbox demo signing flow.
   * NEVER ship this field on mainnet. On mainnet, escrow signing must happen via a
   * server-side custodian, multi-sig, or hardware wallet, never client-side localStorage.
   */
  escrowSecretKey?: string;

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
