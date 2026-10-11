import * as StellarSdk from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
import type { Agreement, HorizonErrorDetail, ConnectedWallet } from './types';
import { signTransactionWithWallet } from './walletService';

// Network configuration
export const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org';
export const FRIENDBOT_URL = import.meta.env.VITE_FRIENDBOT_URL || 'https://friendbot.stellar.org';
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const STELLAR_EXPERT_BASE = import.meta.env.VITE_STELLAR_EXPERT_URL || 'https://stellar.expert/explorer/testnet';

// Initialize Horizon server
export const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Format stellar expert transaction link.
 * Returns undefined for demo/placeholder hashes so the UI can omit the link.
 */
export function getStellarExpertTxUrl(txHash: string): string | undefined {
  if (!txHash || txHash.startsWith('DEMO_') || txHash.startsWith('sim_')) return undefined;
  return `${STELLAR_EXPERT_BASE}/tx/${txHash}`;
}

/**
 * Format stellar expert account link.
 * Returns undefined for demo/placeholder addresses so the UI can omit the link.
 */
export function getStellarExpertAccountUrl(publicKey: string): string | undefined {
  if (!publicKey || publicKey.startsWith('GDEMO_')) return undefined;
  return `${STELLAR_EXPERT_BASE}/account/${publicKey}`;
}

/**
 * Parse Horizon error details for rich UI feedback
 */
export function parseHorizonError(error: unknown): HorizonErrorDetail {
  if (!error) {
    return { title: 'Unknown Error', status: 500, detail: 'An unexpected error occurred.' };
  }

  // Check if error response has Horizon error data
  const anyErr = error as any;
  if (anyErr.response?.data) {
    const data = anyErr.response.data;
    const codes: string[] = [];
    if (data.extras?.result_codes) {
      const rc = data.extras.result_codes;
      if (rc.transaction) codes.push(`Tx: ${rc.transaction}`);
      if (rc.operations && Array.isArray(rc.operations)) {
        codes.push(...rc.operations.map((op: string, idx: number) => `Op ${idx + 1}: ${op}`));
      }
    }
    return {
      title: data.title || 'Stellar Horizon Rejected Transaction',
      status: data.status || anyErr.response.status || 400,
      detail: data.detail || anyErr.message || 'Transaction submission failed.',
      codes: codes.length > 0 ? codes : undefined,
      raw: data,
    };
  }

  return {
    title: 'Stellar Network Error',
    status: 500,
    detail: anyErr.message || String(error),
    raw: error,
  };
}

/**
 * Request testnet funding from Friendbot
 */
export async function fundWithFriendbot(address: string): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const url = `${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (res.ok && (json.successful || json.hash)) {
      // Wait a moment for ledger to incorporate
      await new Promise((r) => setTimeout(r, 1200));
      return { success: true, hash: json.hash };
    }
    return { success: false, error: json.detail || 'Friendbot failed to fund account.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to Friendbot.' };
  }
}

/**
 * Load account balance and details from Horizon
 */
export async function getAccountBalances(publicKey: string): Promise<{
  exists: boolean;
  xlm: string;
  usdc: string;
  sequence?: string;
}> {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    let xlm = '0.0000000';
    let usdc = '0.0000000';

    for (const b of account.balances) {
      if (b.asset_type === 'native') {
        xlm = b.balance;
      } else if ('asset_code' in b && b.asset_code === 'USDC') {
        usdc = b.balance;
      }
    }

    return {
      exists: true,
      xlm,
      usdc,
      sequence: account.sequenceNumber(),
    };
  } catch (err: any) {
    if (err.response?.status === 404) {
      return { exists: false, xlm: '0', usdc: '0' };
    }
    throw err;
  }
}

/**
 * Generate and optionally fund a fresh Stellar testnet keypair
 */
export async function generateTestnetKeypair(autoFund = true): Promise<{
  publicKey: string;
  secretKey: string;
  funded: boolean;
}> {
  const pair = StellarSdk.Keypair.random();
  let funded = false;

  if (autoFund) {
    const fundRes = await fundWithFriendbot(pair.publicKey());
    funded = fundRes.success;
  }

  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
    funded,
  };
}

/**
 * 1. BUSINESS LOCK REWARD
 * Submits a real Stellar testnet transaction:
 * - Generates dedicated Escrow Vault Keypair
 * - Funds Escrow Account with reward + reserve
 * - Records ManageData on escrow anchoring referrer, deadline, customer label, status
 * - Cryptographically signed non-custodially via Connected Wallet (Freighter, Albedo, etc.)
 */
export async function lockRewardOnChain(params: {
  businessWallet?: ConnectedWallet;
  businessSecretKey?: string;
  referrerAddress: string;
  customerLabel: string;
  amount: number;
  assetCode: 'USDC' | 'XLM';
  deadline: number;
  code: string;
  onStatusUpdate?: (status: string) => void;
}): Promise<{
  escrowPublicKey: string;
  escrowSecretKey: string;
  lockTxHash: string;
}> {
  // Determine business public key
  let businessPublicKey = params.businessWallet?.publicKey;
  let fallbackKeypair: StellarSdk.Keypair | null = null;

  if (!businessPublicKey && params.businessSecretKey) {
    fallbackKeypair = StellarSdk.Keypair.fromSecret(params.businessSecretKey);
    businessPublicKey = fallbackKeypair.publicKey();
  }

  if (!businessPublicKey) {
    throw new Error('No connected business wallet or credentials provided.');
  }

  // Validate referrer address format
  if (!StellarSdk.StrKey.isValidEd25519PublicKey(params.referrerAddress)) {
    throw new Error(`Invalid Referrer Stellar address: ${params.referrerAddress}`);
  }

  // Load business account sequence and balances
  params.onStatusUpdate?.('1/4: Checking business account on Stellar Horizon...');
  const businessAccount = await horizonServer.loadAccount(businessPublicKey);

  // Escrow Vault Keypair
  const escrowKeypair = StellarSdk.Keypair.random();

  // Base reserve + entry reserves + fees
  const startingReserve = 3.0;
  const startingBalance = (params.amount + startingReserve).toFixed(7);

  // Encode short metadata entries for ManageData (max 64 bytes)
  const shortCustomer = params.customerLabel.slice(0, 32);
  const deadlineStr = params.deadline.toString();

  params.onStatusUpdate?.('2/4: Constructing multi-operation Escrow Vault transaction...');
  const builder = new StellarSdk.TransactionBuilder(businessAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    // Operation 1: Create and fund the Escrow Vault Account
    .addOperation(
      StellarSdk.Operation.createAccount({
        destination: escrowKeypair.publicKey(),
        startingBalance: startingBalance,
      })
    )
    // Operation 2: Anchor referrer address to Escrow
    .addOperation(
      StellarSdk.Operation.manageData({
        source: escrowKeypair.publicKey(),
        name: 'rw_referrer',
        value: Buffer.from(params.referrerAddress.slice(0, 32)),
      })
    )
    // Operation 3: Anchor deadline timestamp
    .addOperation(
      StellarSdk.Operation.manageData({
        source: escrowKeypair.publicKey(),
        name: 'rw_deadline',
        value: Buffer.from(deadlineStr),
      })
    )
    // Operation 4: Anchor customer label
    .addOperation(
      StellarSdk.Operation.manageData({
        source: escrowKeypair.publicKey(),
        name: 'rw_customer',
        value: Buffer.from(shortCustomer),
      })
    )
    .setTimeout(60);

  const tx = builder.build();

  // Escrow Vault signs first for its own operations
  tx.sign(escrowKeypair);

  // Business signature: signed non-custodially via connected wallet
  let finalTx: StellarSdk.Transaction = tx;
  if (params.businessWallet) {
    const walletLabel = params.businessWallet.label || params.businessWallet.walletType;
    params.onStatusUpdate?.(`3/4: Requesting signature in your ${walletLabel}...`);
    finalTx = await signTransactionWithWallet(tx, params.businessWallet);
  } else if (fallbackKeypair) {
    finalTx.sign(fallbackKeypair);
  }

  params.onStatusUpdate?.('4/4: Broadcasting signed transaction to Stellar Testnet...');
  const result = await horizonServer.submitTransaction(finalTx);

  if (!result || !result.hash) {
    throw new Error('Transaction submission failed without a transaction hash.');
  }

  return {
    escrowPublicKey: escrowKeypair.publicKey(),
    escrowSecretKey: escrowKeypair.secret(),
    lockTxHash: result.hash,
  };
}

/**
 * 2. REFERRER CLAIM REWARD
 * Submits a real Stellar testnet transaction:
 * - Verifies condition: customer must be PAID
 * - Transfers the reward from Escrow Vault to Referrer's Stellar Address
 */
export async function claimRewardOnChain(agreement: Agreement): Promise<{ claimTxHash: string }> {
  if (agreement.state !== 'PAID') {
    throw new Error('Cannot claim reward: Customer payment is not yet confirmed.');
  }

  const escrowKeypair = StellarSdk.Keypair.fromSecret(agreement.escrowSecretKey);
  const escrowAccount = await horizonServer.loadAccount(escrowKeypair.publicKey());

  const rewardAmount = parseFloat(agreement.amount).toFixed(7);

  const builder = new StellarSdk.TransactionBuilder(escrowAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    // Record state change to CLAIMED
    .addOperation(
      StellarSdk.Operation.manageData({
        name: 'rw_state',
        value: Buffer.from('CLAIMED'),
      })
    )
    // Transfer reward to referrer
    .addOperation(
      StellarSdk.Operation.payment({
        destination: agreement.referrerAddress,
        asset: StellarSdk.Asset.native(),
        amount: rewardAmount,
      })
    )
    .setTimeout(60);

  const tx = builder.build();
  tx.sign(escrowKeypair);

  const result = await horizonServer.submitTransaction(tx);

  if (!result || !result.hash) {
    throw new Error('Claim transaction submission failed.');
  }

  return { claimTxHash: result.hash };
}

/**
 * 3. BUSINESS RECLAIM REWARD
 * Submits a real Stellar testnet transaction:
 * - Available ONLY after deadline has passed without payment
 * - Transfers funds from Escrow Vault back to Business Address
 */
export async function reclaimRewardOnChain(agreement: Agreement): Promise<{ reclaimTxHash: string }> {
  const now = Date.now();
  if (now <= agreement.deadline) {
    throw new Error(`Cannot reclaim: Deadline has not passed yet. Deadline is ${new Date(agreement.deadline).toLocaleString()}`);
  }

  if (agreement.state === 'CLAIMED') {
    throw new Error('Cannot reclaim: Reward has already been claimed by the referrer.');
  }

  if (agreement.state === 'PAID') {
    throw new Error('Cannot reclaim: Customer was already marked as paid. Reward is reserved for referrer.');
  }

  const escrowKeypair = StellarSdk.Keypair.fromSecret(agreement.escrowSecretKey);
  const escrowAccount = await horizonServer.loadAccount(escrowKeypair.publicKey());

  const returnAmount = parseFloat(agreement.amount).toFixed(7);

  const builder = new StellarSdk.TransactionBuilder(escrowAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    // Record state change to RECLAIMED
    .addOperation(
      StellarSdk.Operation.manageData({
        name: 'rw_state',
        value: Buffer.from('RECLAIMED'),
      })
    )
    // Return reward to business
    .addOperation(
      StellarSdk.Operation.payment({
        destination: agreement.businessAddress,
        asset: StellarSdk.Asset.native(),
        amount: returnAmount,
      })
    )
    .setTimeout(60);

  const tx = builder.build();
  tx.sign(escrowKeypair);

  const result = await horizonServer.submitTransaction(tx);

  if (!result || !result.hash) {
    throw new Error('Reclaim transaction submission failed.');
  }

  return { reclaimTxHash: result.hash };
}
