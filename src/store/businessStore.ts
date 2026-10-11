import type { BusinessProfile } from '../stellar/types';

const STORAGE_KEY_BUSINESS_PROFILE = 'rewalf_business_profile_v1';

export const DEFAULT_DEMO_BUSINESS: BusinessProfile = {
  id: 'biz_saasify',
  name: 'SaaSify Cloud Infrastructure',
  website: 'https://saasify.cloud',
  category: 'B2B SaaS / Cloud',
  description: 'Enterprise developer APIs and distributed cloud compute on Stellar.',
  contactEmail: 'partners@saasify.cloud',
  walletAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
  verified: true,
};

/**
 * Load saved business profile from localStorage
 */
export function loadBusinessProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUSINESS_PROFILE);
    if (!raw) {
      // Initialize with default demo business profile
      localStorage.setItem(STORAGE_KEY_BUSINESS_PROFILE, JSON.stringify(DEFAULT_DEMO_BUSINESS));
      return { ...DEFAULT_DEMO_BUSINESS };
    }
    const parsed = JSON.parse(raw);
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
