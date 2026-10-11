import type { BusinessProfile } from '../stellar/types';

const STORAGE_KEY_BUSINESS_PROFILE = 'rewalf_business_profile_v2';

export const DEFAULT_DEMO_BUSINESS: BusinessProfile = {
  id: 'biz_stellar_cloud',
  name: 'Stellar Cloud Infrastructure',
  website: 'https://stellar.org',
  category: 'Web3 Infrastructure',
  description: 'Decentralized financial infrastructure, node validation, and payment anchors on Stellar testnet.',
  contactEmail: 'partners@stellar.org',
  walletAddress: 'GBTFHP6SP4GCKMC4MSZ23667UV55CTG6C6N4EKVDLMS4FIH6L7QLJHFT',
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  verified: true,
};

/**
 * Load saved business profile from localStorage
 */
export function loadBusinessProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUSINESS_PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BUSINESS_PROFILE, JSON.stringify(DEFAULT_DEMO_BUSINESS));
      return { ...DEFAULT_DEMO_BUSINESS };
    }
    const parsed = JSON.parse(raw);
    if (parsed.id === 'biz_saasify') {
      localStorage.setItem(STORAGE_KEY_BUSINESS_PROFILE, JSON.stringify(DEFAULT_DEMO_BUSINESS));
      return { ...DEFAULT_DEMO_BUSINESS };
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load business profile', err);
    return { ...DEFAULT_DEMO_BUSINESS };
  }
}

/**
 * Save or update business profile in localStorage
 */
export function saveBusinessProfile(profile: BusinessProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_BUSINESS_PROFILE, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('rewalf_business_updated', { detail: profile }));
  } catch (err) {
    console.error('Failed to save business profile', err);
  }
}

/**
 * Reset business profile to defaults
 */
export function resetBusinessProfile(): void {
  try {
    localStorage.setItem(STORAGE_KEY_BUSINESS_PROFILE, JSON.stringify(DEFAULT_DEMO_BUSINESS));
    window.dispatchEvent(new CustomEvent('rewalf_business_updated', { detail: DEFAULT_DEMO_BUSINESS }));
  } catch (err) {
    console.error('Failed to reset business profile', err);
  }
}
