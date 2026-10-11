import * as StellarSdk from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
import type { Agreement, HorizonErrorDetail, ConnectedWallet } from './types';
import { signTransactionWithWallet } from './walletService';
import { getVaultSecret, saveVaultSecret } from '../store/agreementStore';

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
 * Parse Horizon error details for rich UI feedback.
 * Strictly extracts and displays the Horizon result_codes (e.g. op_underfunded, tx_failed).
 */
export function parseHorizonError(error: unknown): HorizonErrorDetail {
  if (!error) {
    return { title: 'Unknown Error', status: 500, detail: 'An unexpected error occurred.' };
  }

  const anyErr = error as any;
  let data = anyErr.response?.data || anyErr.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // ignore
    }
  }

  const codes: string[] = [];
  const rc = data?.extras?.result_codes || anyErr.extras?.result_codes || anyErr.result_codes;
  if (rc) {
    if (rc.transaction) codes.push(`Tx: ${rc.transaction}`);
    if (rc.operations && Array.isArray(rc.operations)) {
      codes.push(...rc.operations.map((op: string, idx: number) => `Op ${idx + 1}: ${op}`));
    }
  }

  if (codes.length > 0 || data) {
    const rawDetail = data?.detail || anyErr.message || 'Transaction submission failed.';
    const detailWithCodes = codes.length > 0 ? `${rawDetail} [Result codes: ${codes.join(', ')}]` : rawDetail;
    const title = codes.length > 0
      ? `Transaction Failed: ${codes.join(', ')}`
      : (data?.title || 'Stellar Horizon Rejected Transaction');

    return {
      title,
      status: data?.status || anyErr.response?.status || 400,
      detail: detailWithCodes,
      codes: codes.length > 0 ? codes : undefined,
      raw: data || anyErr,
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
    // Operation 2: Anchor full referrer address to Escrow
    .addOperation(
      StellarSdk.Operation.manageData({
        source: escrowKeypair.publicKey(),
        name: 'rw_referrer',
        value: Buffer.from(params.referrerAddress),
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

  // Persist the vault secret in localStorage keyed by the offer code (never committed to git)
  saveVaultSecret(params.code, escrowKeypair.secret());

  return {
    escrowPublicKey: escrowKeypair.publicKey(),
    escrowSecretKey: escrowKeypair.secret(),
    lockTxHash: result.hash,
  };
}

/**
 * 2. REFERRER CLAIM REWARD
 * Submits a real Stellar testnet transaction:
 * - Signed strictly by that vault secret, NOT by Freighter or connected wallet.
 * - Resolves destination from rw_referrer on-chain (fallback to agreement.referrerAddress).
 * - Pays the reward (e.g. 7 XLM) and leaves sufficient balance for minimum reserves and fees.
 */
export async function claimRewardOnChain(
  agreement: Agreement,
  explicitVaultSecret?: string
): Promise<{ claimTxHash: string }> {
  if (agreement.state !== 'PAID') {
    throw new Error('Cannot claim reward: Customer payment is not yet confirmed.');
  }

  // 1. Resolve Vault Secret from localStorage or parameter
  const vaultSecret = explicitVaultSecret || getVaultSecret(agreement.code) || agreement.escrowSecretKey;
  if (!vaultSecret) {
    throw new Error('Vault key not found in this browser. Create a new offer.');
  }

  // 2. Load Escrow Vault Account from Horizon
  const escrowKeypair = StellarSdk.Keypair.fromSecret(vaultSecret);
  const escrowAccount = await horizonServer.loadAccount(escrowKeypair.publicKey());

  // 3. Resolve Referrer Destination Address from on-chain rw_referrer
  let destination = agreement.referrerAddress;
  if (escrowAccount.data_attr && escrowAccount.data_attr['rw_referrer']) {
    try {
      const decoded = Buffer.from(escrowAccount.data_attr['rw_referrer'], 'base64').toString('utf-8');
      if (StellarSdk.StrKey.isValidEd25519PublicKey(decoded)) {
        destination = decoded;
      }
    } catch {
      // fallback to agreement.referrerAddress
    }
  }

  if (!destination || !StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
    throw new Error(`Invalid destination address for referrer: ${destination}`);
  }

  // 4. Calculate Payment Amount leaving minimum balance and fees
  const nativeBalance = parseFloat(
    escrowAccount.balances.find((b) => b.asset_type === 'native')?.balance || '0'
  );
  // Stellar minimum reserve formula: (2 + subentry_count) * 0.5 XLM
  const minReserve = (2 + (escrowAccount.subentry_count || 0)) * 0.5;
  const feeXlm = Number(StellarSdk.BASE_FEE) / 10000000; // 0.0000100 XLM
  const maxAvailable = Math.max(0, nativeBalance - minReserve - feeXlm);

  const targetAmount = agreement.amount ? parseFloat(agreement.amount) : 7.0;
  const payAmountNum = Math.min(targetAmount, maxAvailable);

  if (payAmountNum <= 0) {
    throw new Error(
      `Insufficient vault balance to pay referrer. Vault balance: ${nativeBalance.toFixed(7)} XLM, Required reserve: ${minReserve.toFixed(7)} XLM.`
    );
  }

  const rewardAmount = payAmountNum.toFixed(7);

  // 5. Build payment transaction
  // Do NOT add manageData operations here because adding new data entries consumes additional reserve!
  const builder = new StellarSdk.TransactionBuilder(escrowAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount: rewardAmount,
      })
    )
    .setTimeout(60);

  const tx = builder.build();

  // 6. Signed ONLY by the Escrow Vault keypair (not Freighter)
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
 * - Signed strictly by that vault secret, NOT by Freighter or connected wallet.
 * - Pays the business address leaving minimum balance and fees.
 */
export async function reclaimRewardOnChain(
  agreement: Agreement,
  explicitVaultSecret?: string
): Promise<{ reclaimTxHash: string }> {
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

  // 1. Resolve Vault Secret from localStorage or parameter
  const vaultSecret = explicitVaultSecret || getVaultSecret(agreement.code) || agreement.escrowSecretKey;
  if (!vaultSecret) {
    throw new Error('Vault key not found in this browser. Create a new offer.');
  }

  // 2. Load Escrow Vault Account from Horizon
  const escrowKeypair = StellarSdk.Keypair.fromSecret(vaultSecret);
  const escrowAccount = await horizonServer.loadAccount(escrowKeypair.publicKey());

  const destination = agreement.businessAddress;
  if (!destination || !StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
    throw new Error(`Invalid destination address for business: ${destination}`);
  }

  // 3. Calculate Payment Amount leaving minimum balance and fees
  const nativeBalance = parseFloat(
    escrowAccount.balances.find((b) => b.asset_type === 'native')?.balance || '0'
  );
  const minReserve = (2 + (escrowAccount.subentry_count || 0)) * 0.5;
  const feeXlm = Number(StellarSdk.BASE_FEE) / 10000000;
  const maxAvailable = Math.max(0, nativeBalance - minReserve - feeXlm);

  const targetAmount = agreement.amount ? parseFloat(agreement.amount) : 7.0;
  const payAmountNum = Math.min(targetAmount, maxAvailable);

  if (payAmountNum <= 0) {
    throw new Error(
      `Insufficient vault balance to return to business. Vault balance: ${nativeBalance.toFixed(7)} XLM, Required reserve: ${minReserve.toFixed(7)} XLM.`
    );
  }

  const returnAmount = payAmountNum.toFixed(7);

  const builder = new StellarSdk.TransactionBuilder(escrowAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount: returnAmount,
      })
    )
    .setTimeout(60);

  const tx = builder.build();

  // Signed ONLY by the Escrow Vault keypair
  tx.sign(escrowKeypair);

  const result = await horizonServer.submitTransaction(tx);

  if (!result || !result.hash) {
    throw new Error('Reclaim transaction submission failed.');
  }

  return { reclaimTxHash: result.hash };
}
