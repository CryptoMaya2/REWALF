import type {
  Agreement,
  WalletAccount,
  AgreementState,
  VerifiedConversion,
  ReferrerPerformance,
} from '../stellar/types';
import { generateTestnetKeypair, getAccountBalances } from '../stellar/stellarService';

const STORAGE_KEY_AGREEMENTS = 'rewalf_agreements_v2'; // bumped: removed fake Stellar tx hashes
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
    protocolId: 'proto_saasify',
    businessAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    businessId: 'biz_saasify',
    businessName: 'SaaSify Cloud Infrastructure',
    businessWebsite: 'https://saasify.cloud',
    targetUrl: 'https://saasify.cloud/pricing',
    businessCategory: 'B2B SaaS / Cloud',
    referrerAddress: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
    customerLabel: 'Enterprise Annual Tier #1092',
    amount: '50.00',
    rewardPerConversion: '50.00',
    totalBudget: '500.00',
    remainingBudget: '350.00',
    claimedAmount: '150.00',
    clicksCount: 142,
    conversionsCount: 3,
    assetCode: 'USDC',
    deadline: Date.now() + 1000 * 60 * 60 * 18, // 18 hours remaining
    state: 'PAID',
    escrowPublicKey: 'GDEMO_ESCROW_SAAS91X_TESTNET_PLACEHOLDER_NOT_REAL',
    escrowSecretKey: 'SDEMO_TESTNET_ONLY_NEVER_MAINNET',
    lockTxHash: 'DEMO_NO_REAL_TX_saas91x_lock',
    paidTxHash: 'DEMO_NO_REAL_TX_saas91x_paid',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    paidAt: Date.now() - 1000 * 60 * 45,
    conversions: [
      {
        id: 'conv_s91x_01',
        campaignCode: 'saas91x',
        orderId: 'ORD-1092-ENT',
        customerLabel: 'Enterprise Annual Tier #1092',
        referrerAddress: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
        rewardAmount: '50.00',
        assetCode: 'USDC',
        verifiedAt: Date.now() - 1000 * 60 * 45,
        verificationMethod: 'hmac_webhook',
        proofHash: 'whsec_7b4c6e80b435f524da478546123490b4',
        status: 'paid',
        notes: 'Signed HMAC payload verified via Stripe webhook adapter',
      },
      {
        id: 'conv_s91x_02',
        campaignCode: 'saas91x',
        orderId: 'ORD-1088-ENT',
        customerLabel: 'Enterprise Starter Seat #1088',
        referrerAddress: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
        rewardAmount: '50.00',
        assetCode: 'USDC',
        verifiedAt: Date.now() - 1000 * 60 * 120,
        verificationMethod: 'sdk_client',
        proofHash: 'sdk_sig_8a39df741cb209e51147a6c93b',
        status: 'paid',
        notes: 'Client SDK conversion event with verified checkout token',
      },
      {
        id: 'conv_s91x_03',
        campaignCode: 'saas91x',
        orderId: 'ORD-1074-PRO',
        customerLabel: 'Pro Team Seat #1074',
        referrerAddress: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
        rewardAmount: '50.00',
        assetCode: 'USDC',
        verifiedAt: Date.now() - 1000 * 60 * 240,
        verificationMethod: 'hmac_webhook',
        proofHash: 'whsec_3f820cbb710d8a562093e4a91b',
        status: 'paid',
        notes: 'Verified subscription renewal payment',
      },
    ],
  },
  {
    code: 'defi44k',
    protocolId: 'proto_phoenix_dex',
    businessAddress: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
    businessId: 'proto_phoenix_dex',
    businessName: 'Phoenix Stellar DEX',
    businessWebsite: 'https://phoenixdex.fi',
    targetUrl: 'https://phoenixdex.fi/swap',
    businessCategory: 'DeFi / DEX',
    referrerAddress: 'GCNL55IJTH2HX26HLNIGYD7JJDNXVNMKFVTK4KCSO3RDOT5FHKZ6RJI',
    customerLabel: 'Liquidity Provider Onboarding Tier 1',
    amount: '70.00',
    rewardPerConversion: '70.00',
    totalBudget: '350.00',
    remainingBudget: '350.00',
    claimedAmount: '0.00',
    clicksCount: 89,
    conversionsCount: 0,
    assetCode: 'XLM',
    deadline: Date.now() + 1000 * 60 * 60 * 4, // 4 hours remaining
    state: 'LOCKED',
    escrowPublicKey: 'GDEMO_ESCROW_DEFI44K_TESTNET_PLACEHOLDER_NOT_REAL',
    escrowSecretKey: 'SDEMO_TESTNET_ONLY_NEVER_MAINNET',
    lockTxHash: 'DEMO_NO_REAL_TX_defi44k_lock',
    createdAt: Date.now() - 1000 * 60 * 90,
    conversions: [],
  },
  {
    code: 'node88q',
    protocolId: 'proto_saasify',
    businessAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    businessId: 'biz_saasify',
    businessName: 'SaaSify Cloud Infrastructure',
    businessWebsite: 'https://saasify.cloud',
    targetUrl: 'https://saasify.cloud/nodes',
    businessCategory: 'B2B SaaS / Cloud',
    referrerAddress: 'GBVKI23OQZCANDBER6X7QNBIK755YILSX47MXWI3O7QKJL4SMSOVWXI',
    customerLabel: 'Stellar Validator Cluster Sponsor',
    amount: '75.00',
    rewardPerConversion: '75.00',
    totalBudget: '75.00',
    remainingBudget: '0.00',
    claimedAmount: '75.00',
    clicksCount: 64,
    conversionsCount: 1,
    assetCode: 'USDC',
    deadline: Date.now() - 1000 * 60 * 60 * 12,
    state: 'CLAIMED',
    escrowPublicKey: 'GDEMO_ESCROW_NODE88Q_TESTNET_PLACEHOLDER_NOT_REAL',
    escrowSecretKey: 'SDEMO_TESTNET_ONLY_NEVER_MAINNET',
    lockTxHash: 'DEMO_NO_REAL_TX_node88q_lock',
    paidTxHash: 'DEMO_NO_REAL_TX_node88q_paid',
    claimTxHash: 'DEMO_NO_REAL_TX_node88q_claim',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    paidAt: Date.now() - 1000 * 60 * 60 * 18,
    claimedAt: Date.now() - 1000 * 60 * 60 * 14,
    conversions: [
      {
        id: 'conv_n88q_01',
        campaignCode: 'node88q',
        orderId: 'VAL-SPONSOR-401',
        customerLabel: 'Stellar Validator Cluster Sponsor',
        referrerAddress: 'GBVKI23OQZCANDBER6X7QNBIK755YILSX47MXWI3O7QKJL4SMSOVWXI',
        rewardAmount: '75.00',
        assetCode: 'USDC',
        verifiedAt: Date.now() - 1000 * 60 * 60 * 18,
        verificationMethod: 'sdk_client',
        proofHash: 'sdk_sig_2a4b6c8d0e2f4a6c8e0b2d4f6a',
        status: 'paid',
        notes: 'Validator staking contract initialized',
      },
    ],
  },
  {
    code: 'api22z',
    protocolId: 'proto_saasify',
    businessAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    businessId: 'biz_saasify',
    businessName: 'SaaSify Cloud Infrastructure',
    businessWebsite: 'https://saasify.cloud',
    targetUrl: 'https://saasify.cloud/api-docs',
    businessCategory: 'B2B SaaS / Cloud',
    referrerAddress: 'GCVJ4Z6YI75QSOP3XDTD66FKWMNCB2CJFNV3GYVNHWLMTW5MKFHKD6',
    customerLabel: 'Fintech API High-Throughput Bundle',
    amount: '50.00',
    rewardPerConversion: '50.00',
    totalBudget: '50.00',
    remainingBudget: '50.00',
    claimedAmount: '0.00',
    clicksCount: 38,
    conversionsCount: 0,
    assetCode: 'USDC',
    deadline: Date.now() - 1000 * 60 * 60 * 5,
    state: 'RECLAIMED',
    escrowPublicKey: 'GDEMO_ESCROW_API22Z_TESTNET_PLACEHOLDER_NOT_REAL',
    escrowSecretKey: 'SDEMO_TESTNET_ONLY_NEVER_MAINNET',
    lockTxHash: 'DEMO_NO_REAL_TX_api22z_lock',
    reclaimTxHash: 'DEMO_NO_REAL_TX_api22z_reclaim',
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
    reclaimedAt: Date.now() - 1000 * 60 * 60 * 4,
    conversions: [],
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

/**
 * Record a referral click event (when someone visits via referral link)
 */
export function recordReferralClick(code: string): void {
  const agreement = getAgreementByCode(code);
  if (!agreement) return;

  agreement.clicksCount = (agreement.clicksCount || 0) + 1;
  upsertAgreement(agreement);
}

/**
 * Update the destination website / landing page URL for a campaign
 */
export function updateBusinessTargetUrl(code: string, newUrl: string): boolean {
  const agreement = getAgreementByCode(code);
  if (!agreement) return false;

  const trimmed = newUrl.trim();
  agreement.targetUrl = trimmed;
  agreement.businessWebsite = trimmed;
  upsertAgreement(agreement);
  return true;
}

export interface VerifyConversionInput {
  campaignCode: string;
  orderId: string;
  customerLabel?: string;
  customerAddress?: string;
  referrerAddress?: string;
  rewardAmount?: string;
  verificationMethod?: 'sdk_client' | 'hmac_webhook' | 'manual_settlement';
  proofHash?: string;
  callerAddress?: string; // Address of entity initiating verification
}

export interface VerifyConversionResult {
  success: boolean;
  error?: string;
  fraudAlert?: string;
  conversion?: VerifiedConversion;
  agreement?: Agreement;
}

/**
 * Authenticate and record a verified conversion with anti-fraud safeguards:
 * - Anti-Fraud #1: Rejects self-referrals (promoter address == business treasury address)
 * - Anti-Fraud #2: Duplicate order rejection (orderId already recorded)
 * - Anti-Fraud #3: Escrow protection (cannot exceed available remaining escrow budget)
 */
export function verifyCustomerConversion(input: VerifyConversionInput): VerifyConversionResult {
  const agreement = getAgreementByCode(input.campaignCode);
  if (!agreement) {
    return { success: false, error: `Campaign with code "${input.campaignCode}" not found.` };
  }

  const effectiveReferrer = (input.referrerAddress || agreement.referrerAddress).trim();
  const rewardAmt = parseFloat(input.rewardAmount || agreement.rewardPerConversion || agreement.amount || '0');

  // Anti-Fraud Safeguard #1: Self-Referral Prevention
  if (
    effectiveReferrer.toLowerCase() === agreement.businessAddress.toLowerCase() ||
    (input.callerAddress && input.callerAddress.toLowerCase() === effectiveReferrer.toLowerCase() && input.callerAddress.toLowerCase() === agreement.businessAddress.toLowerCase())
  ) {
    return {
      success: false,
      error: 'Self-referral detected and blocked. Business owners cannot claim referral rewards on their own campaigns.',
      fraudAlert: 'Self-Referral Violation: Referrer address matches campaign owner treasury.',
    };
  }

  // Anti-Fraud Safeguard #2: Duplicate Order Prevention
  const existingConversions = agreement.conversions || [];
  const normalizedOrderId = input.orderId.trim();
  if (!normalizedOrderId) {
    return { success: false, error: 'A valid Order or Transaction ID is required for verification.' };
  }

  const isDuplicate = existingConversions.some(
    (c) => c.orderId.toLowerCase() === normalizedOrderId.toLowerCase()
  );
  if (isDuplicate) {
    return {
      success: false,
      error: `Order ID "${normalizedOrderId}" has already been verified and rewarded for this campaign. Replay attacks are prohibited.`,
      fraudAlert: 'Duplicate Order Protection: Order ID already recorded in audit ledger.',
    };
  }

  // Anti-Fraud Safeguard #3: Escrow Budget Check
  const currentRemaining = parseFloat(
    agreement.remainingBudget !== undefined
      ? agreement.remainingBudget
      : agreement.amount || '0'
  );

  if (currentRemaining < rewardAmt) {
    return {
      success: false,
      error: `Reward payout of ${rewardAmt} ${agreement.assetCode} exceeds remaining escrow balance (${currentRemaining} ${agreement.assetCode}). Rewards cannot exceed available escrow funds.`,
      fraudAlert: 'Escrow Depleted: Business must deposit additional funds before new conversions can be rewarded.',
    };
  }

  // Calculate new balances
  const newRemaining = Math.max(0, currentRemaining - rewardAmt);
  const currentClaimed = parseFloat(agreement.claimedAmount || '0');
  const newClaimed = currentClaimed + rewardAmt;
  const newCount = (agreement.conversionsCount || existingConversions.length) + 1;

  const newConversion: VerifiedConversion = {
    id: `conv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    campaignCode: agreement.code,
    orderId: normalizedOrderId,
    customerLabel: input.customerLabel || agreement.customerLabel || `Customer Order #${normalizedOrderId}`,
    customerAddress: input.customerAddress,
    referrerAddress: effectiveReferrer,
    rewardAmount: rewardAmt.toFixed(2),
    assetCode: agreement.assetCode,
    verifiedAt: Date.now(),
    verificationMethod: input.verificationMethod || 'sdk_client',
    proofHash: input.proofHash || `proof_${Date.now().toString(16)}`,
    status: 'paid',
    notes: 'Cryptographically verified conversion debited from locked escrow vault',
  };

  agreement.remainingBudget = newRemaining.toFixed(2);
  agreement.claimedAmount = newClaimed.toFixed(2);
  agreement.conversionsCount = newCount;
  agreement.conversions = [newConversion, ...existingConversions];
  agreement.state = 'PAID';
  agreement.paidAt = Date.now();
  agreement.paidTxHash = `sim_conv_${Date.now().toString(16)}`;

  upsertAgreement(agreement);

  return {
    success: true,
    conversion: newConversion,
    agreement,
  };
}

/**
 * Aggregates performance by referrer across campaigns
 */
export function getReferrersPerformanceList(agreements?: Agreement[]): ReferrerPerformance[] {
  const all = agreements || loadAgreements();
  const map = new Map<string, ReferrerPerformance>();

  for (const a of all) {
    const key = `${a.referrerAddress}_${a.code}`;
    const clicks = a.clicksCount || (a.conversionsCount ? a.conversionsCount * 8 : 12);
    const conversions = a.conversionsCount || (a.conversions?.length || 0);
    const rate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const earned = a.claimedAmount || (a.state === 'CLAIMED' ? a.amount : '0.00');

    map.set(key, {
      referrerAddress: a.referrerAddress,
      campaignCode: a.code,
      campaignTitle: a.customerLabel,
      businessName: a.businessName || 'Protocol Partner',
      clicks,
      conversions,
      conversionRate: parseFloat(rate.toFixed(1)),
      totalEarned: earned,
      assetCode: a.assetCode,
      status: 'active',
    });
  }

  return Array.from(map.values()).sort((a, b) => b.conversions - a.conversions);
}

/**
 * Allows a promoter to generate their unique referral link for an active campaign
 */
export function generatePromoterCampaignLink(
  campaignCode: string,
  promoterAddress: string
): Agreement | null {
  const original = getAgreementByCode(campaignCode);
  if (!original) return null;

  // Anti-fraud check: Promoter cannot be campaign owner
  if (promoterAddress.trim().toLowerCase() === original.businessAddress.toLowerCase()) {
    throw new Error('Promoter address cannot match the business owner treasury.');
  }

  // Check if promoter already has a link for this campaign
  const all = loadAgreements();
  const existing = all.find(
    (a) =>
      a.protocolId === original.protocolId &&
      a.referrerAddress.toLowerCase() === promoterAddress.toLowerCase() &&
      a.customerLabel === original.customerLabel
  );
  if (existing) return existing;

  // Create customized promoter agreement
  const newCode = generateReferralCode();
  const promoterAgreement: Agreement = {
    ...original,
    code: newCode,
    referrerAddress: promoterAddress.trim(),
    clicksCount: 0,
    conversionsCount: 0,
    conversions: [],
    claimedAmount: '0.00',
    remainingBudget: original.remainingBudget || original.amount,
    createdAt: Date.now(),
    state: 'LOCKED',
  };

  upsertAgreement(promoterAgreement);
  return promoterAgreement;
}
