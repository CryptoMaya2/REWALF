import type { Agreement, WalletAccount, AgreementState } from '../stellar/types';
import { generateTestnetKeypair, getAccountBalances } from '../stellar/stellarService';

const STORAGE_KEY_AGREEMENTS = 'rewalf_agreements_v1';
const STORAGE_KEY_BUSINESS_WALLET = 'rewalf_business_wallet_v1';
const STORAGE_KEY_REFERRER_WALLET = 'rewalf_referrer_wallet_v1';

/**
 * Generate a clean unique referral code
 */
export function generateReferralCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const DEFAULT_DEMO_AGREEMENTS: Agreement[] = [
  {
    code: 'saas91x',
    businessAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    referrerAddress: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
    customerLabel: 'Enterprise Annual Tier #1092',
    amount: '150.00',
    assetCode: 'USDC',
    deadline: Date.now() + 1000 * 60 * 60 * 18, // 18 hours remaining
    state: 'PAID',
    escrowPublicKey: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZS3MGDQKJZ5EFQWI5U73',
    escrowSecretKey: 'SDEMO_TESTNET_ONLY_NEVER_MAINNET',
    lockTxHash: '40d28bb461e1b8eb300cb105e1fc41459424c883e580e031b2658a5c3bb96362',
    paidTxHash: '7b4c6e80b435f524da478546123490b4e05466c1b3f9bb8693c0429f5f0b548d',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    paidAt: Date.now() - 1000 * 60 * 45,
  },
  {
    code: 'defi44k',
    businessAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    referrerAddress: 'GCNL55IJTH2HX26HLNIGYD7JJDNXVNMKFVTK4KCSO3RDOT5FHKZ6RJI',
    customerLabel: 'Liquidity Provider Onboarding Tier 1',
    amount: '350.00',
    assetCode: 'XLM',
    deadline: Date.now() + 1000 * 60 * 60 * 4, // 4 hours remaining
    state: 'LOCKED',
    escrowPublicKey: 'GDOEVDDBU6OBWKL7VHDAOKD77UP4DHNBJKAEBY2AZIHRN63RESO2PFI',
    escrowSecretKey: 'SDEMO_TESTNET_ONLY_NEVER_MAINNET',
    lockTxHash: '8e9f1a23b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    createdAt: Date.now() - 1000 * 60 * 90,
  },
  {
    code: 'node88q',
    businessAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    referrerAddress: 'GBVKI23OQZCANDBER6X7QNBIK755YILSX47MXWI3O7QKJL4SMSOVWXI',
    customerLabel: 'Stellar Validator Cluster Sponsor',
    amount: '75.00',
    assetCode: 'USDC',
    deadline: Date.now() - 1000 * 60 * 60 * 12,
    state: 'CLAIMED',
    escrowPublicKey: 'GCTFMTC55ZXCF74GTAU7BGBKYRWKV56BGPNXHKBHVOL3ALXHXBTZ5ON',
    escrowSecretKey: 'SDEMO_TESTNET_ONLY_NEVER_MAINNET',
    lockTxHash: '1f3c5e7a9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7a9b1d3f',
    paidTxHash: '2a4b6c8d0e2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0e2f4a',
    claimTxHash: '9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    paidAt: Date.now() - 1000 * 60 * 60 * 18,
    claimedAt: Date.now() - 1000 * 60 * 60 * 14,
  },
  {
    code: 'api22z',
    businessAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    referrerAddress: 'GCVJ4Z6YI75QSOP3XDTD66FKWMNCB2CJFNV3GYVNHWLMTW5MKFHKD6',
    customerLabel: 'Fintech API High-Throughput Bundle',
    amount: '50.00',
    assetCode: 'USDC',
    deadline: Date.now() - 1000 * 60 * 60 * 5,
    state: 'RECLAIMED',
    escrowPublicKey: 'GBZSF4LRE4ZQLKAQ5JV5EDEZFLP7O4DXVLMKQP3BJOXTFHPWBJYLXDL',
    escrowSecretKey: 'SDEMO_TESTNET_ONLY_NEVER_MAINNET',
    lockTxHash: '3b5d7f9a1c3e5b7d9f1a3c5e7a9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b',
    reclaimTxHash: '5f7a9b1c3e5b7d9f1a3c5e7a9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d',
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
    reclaimedAt: Date.now() - 1000 * 60 * 60 * 4,
  },
];

/**
 * Load all stored agreements
 */
export function loadAgreements(): Agreement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AGREEMENTS);
    if (!raw) {
      // Seed default demo fixtures initially
      localStorage.setItem(STORAGE_KEY_AGREEMENTS, JSON.stringify(DEFAULT_DEMO_AGREEMENTS));
      return DEFAULT_DEMO_AGREEMENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load agreements from localStorage', err);
    return [];
  }
}

/**
 * Reset agreements back to initial fixtures
 */
export function resetAgreementsToFixtures(): void {
  saveAgreements(DEFAULT_DEMO_AGREEMENTS);
}

/**
 * Clear all agreements
 */
export function clearAllAgreements(): void {
  saveAgreements([]);
}

/**
 * Save agreements
 */
export function saveAgreements(agreements: Agreement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AGREEMENTS, JSON.stringify(agreements));
    window.dispatchEvent(new Event('rewalf_agreements_updated'));
  } catch (err) {
    console.error('Failed to save agreements', err);
  }
}

/**
 * Get an agreement by referral code
 */
export function getAgreementByCode(code: string): Agreement | undefined {
  const all = loadAgreements();
  return all.find((a) => a.code.toLowerCase() === code.toLowerCase());
}

/**
 * Save or update single agreement
 */
export function upsertAgreement(agreement: Agreement): void {
  const all = loadAgreements();
  const idx = all.findIndex((a) => a.code.toLowerCase() === agreement.code.toLowerCase());
  if (idx >= 0) {
    all[idx] = agreement;
  } else {
    all.unshift(agreement);
  }
  saveAgreements(all);
}

/**
 * Update agreement state
 */
export function updateAgreementState(
  code: string,
  state: AgreementState,
  meta?: {
    paidTxHash?: string;
    claimTxHash?: string;
    reclaimTxHash?: string;
    lastError?: string;
  }
): Agreement | null {
  const agreement = getAgreementByCode(code);
  if (!agreement) return null;

  agreement.state = state;
  if (meta?.paidTxHash) {
    agreement.paidTxHash = meta.paidTxHash;
    agreement.paidAt = Date.now();
  }
  if (meta?.claimTxHash) {
    agreement.claimTxHash = meta.claimTxHash;
    agreement.claimedAt = Date.now();
  }
  if (meta?.reclaimTxHash) {
    agreement.reclaimTxHash = meta.reclaimTxHash;
    agreement.reclaimedAt = Date.now();
  }
  if (meta?.lastError !== undefined) {
    agreement.lastError = meta.lastError;
  }

  upsertAgreement(agreement);
  return agreement;
}

/**
 * Fast forward deadline for demo evaluation
 */
export function fastForwardDeadline(code: string): Agreement | null {
  const agreement = getAgreementByCode(code);
  if (!agreement) return null;
  // Set deadline to 10 seconds ago
  agreement.deadline = Date.now() - 10000;
  upsertAgreement(agreement);
  return agreement;
}

/**
 * Load or initialize Business Testnet Wallet
 */
export async function getOrCreateBusinessWallet(): Promise<WalletAccount> {
  const raw = localStorage.getItem(STORAGE_KEY_BUSINESS_WALLET);
  if (raw) {
    try {
      const parsed: WalletAccount = JSON.parse(raw);
      // Fetch fresh balance
      const balances = await getAccountBalances(parsed.publicKey).catch(() => ({ exists: false, xlm: '0', usdc: '0' }));
      parsed.balanceXlm = balances.xlm;
      parsed.balanceUsdc = balances.usdc;
      return parsed;
    } catch {
      // Re-initialize if corrupt
    }
  }

  // Create fresh funded business testnet keypair
  const kp = await generateTestnetKeypair(true);
  const account: WalletAccount = {
    label: 'Business Demo Account',
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    walletType: 'sandbox',
    balanceXlm: '10000.0000000',
    balanceUsdc: '0.0000000',
  };
  localStorage.setItem(STORAGE_KEY_BUSINESS_WALLET, JSON.stringify(account));
  return account;
}

/**
 * Save custom Business Wallet
 */
export function saveBusinessWallet(account: WalletAccount): void {
  localStorage.setItem(STORAGE_KEY_BUSINESS_WALLET, JSON.stringify(account));
  window.dispatchEvent(new Event('rewalf_wallet_updated'));
}

/**
 * Load or initialize Referrer Testnet Wallet
 */
export async function getOrCreateReferrerWallet(): Promise<WalletAccount> {
  const raw = localStorage.getItem(STORAGE_KEY_REFERRER_WALLET);
  if (raw) {
    try {
      const parsed: WalletAccount = JSON.parse(raw);
      const balances = await getAccountBalances(parsed.publicKey).catch(() => ({ exists: false, xlm: '0', usdc: '0' }));
      parsed.balanceXlm = balances.xlm;
      parsed.balanceUsdc = balances.usdc;
      return parsed;
    } catch {
      // Re-initialize
    }
  }

  // Create fresh funded referrer testnet keypair
  const kp = await generateTestnetKeypair(true);
  const account: WalletAccount = {
    label: 'Referrer Demo Account',
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    walletType: 'sandbox',
    balanceXlm: '10000.0000000',
    balanceUsdc: '0.0000000',
  };
  localStorage.setItem(STORAGE_KEY_REFERRER_WALLET, JSON.stringify(account));
  return account;
}

/**
 * Save custom Referrer Wallet
 */
export function saveReferrerWallet(account: WalletAccount): void {
  localStorage.setItem(STORAGE_KEY_REFERRER_WALLET, JSON.stringify(account));
  window.dispatchEvent(new Event('rewalf_wallet_updated'));
}
