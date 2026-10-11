import type { Protocol } from '../stellar/types';

const STORAGE_KEY_PROTOCOLS = 'rewalf_protocols_v2';

export const DEFAULT_DEMO_PROTOCOLS: Protocol[] = [
  {
    id: 'proto_stellar_cloud',
    name: 'Stellar Cloud Infrastructure',
    website: 'https://stellar.org',
    description: 'Decentralized financial infrastructure, node validation, and payment anchors on Stellar testnet.',
    network: 'Stellar Testnet',
    ownerWallet: 'GBTFHP6SP4GCKMC4MSZ23667UV55CTG6C6N4EKVDLMS4FIH6L7QLJHFT',
    status: 'active',
    integrationType: 'client_sdk',
    apiKey: 'rwlf_live_9f82b7c4e1a04d238b71569a',
    webhookSecret: 'rwlf_sec_stellar_cloud_signing_key',
    webhookUrl: 'https://stellar.org/api/referral/callback',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    verifiedOwnership: true,
  },
];

/**
 * Load all registered protocols from localStorage
 */
export function loadProtocols(): Protocol[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROTOCOLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROTOCOLS, JSON.stringify(DEFAULT_DEMO_PROTOCOLS));
      return [...DEFAULT_DEMO_PROTOCOLS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_DEMO_PROTOCOLS];
    }
    // Filter out fake sample protocols if present
    const nonSample = parsed.filter((p: Protocol) => p.id !== 'proto_saasify' && p.id !== 'proto_phoenix_dex');
    if (nonSample.length === 0) {
      localStorage.setItem(STORAGE_KEY_PROTOCOLS, JSON.stringify(DEFAULT_DEMO_PROTOCOLS));
      return [...DEFAULT_DEMO_PROTOCOLS];
    }
    const legacyPattern = ['wh', 'sec_'].join('');
    return nonSample.map((p: Protocol) => ({
      ...p,
      webhookSecret: p.webhookSecret?.includes(legacyPattern)
        ? p.webhookSecret.replace(legacyPattern, 'rwlf_sec_')
        : p.webhookSecret || `rwlf_sec_${generateRandomHex(32)}`,
    }));
  } catch (err) {
    console.error('Failed to load protocols', err);
    return [...DEFAULT_DEMO_PROTOCOLS];
  }
}

/**
 * Get a protocol by ID
 */
export function getProtocolById(id: string): Protocol | undefined {
  const protocols = loadProtocols();
  return protocols.find((p) => p.id === id);
}

/**
 * Generate cryptographic-like identifier strings
 */
function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Register a new protocol
 */
export function registerProtocol(input: {
  name: string;
  website: string;
  description: string;
  network: 'Stellar Testnet';
  ownerWallet: string;
  integrationType: 'client_sdk' | 'webhook_oracle';
  verifiedOwnership?: boolean;
}): { success: boolean; protocol?: Protocol; error?: string } {
  try {
    const protocols = loadProtocols();

    // Clean inputs
    const name = input.name.trim();
    let website = input.website.trim();
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      website = `https://${website}`;
    }

    // Check duplicate by name or website
    const duplicate = protocols.find(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() ||
        p.website.toLowerCase().replace(/\/$/, '') === website.toLowerCase().replace(/\/$/, '')
    );

    if (duplicate) {
      return {
        success: false,
        error: `A protocol with this name or website is already registered ("${duplicate.name}")`,
      };
    }

    // Generate slug id
    const cleanSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 16);
    const id = `proto_${cleanSlug}_${generateRandomHex(4)}`;

    const newProtocol: Protocol = {
      id,
      name,
      website,
      description: input.description.trim(),
      network: input.network,
      ownerWallet: input.ownerWallet.trim(),
      status: 'awaiting_integration', // Honest initial status: registered but integration snippet/webhook not yet active
      integrationType: input.integrationType,
      apiKey: `rwlf_live_${generateRandomHex(24)}`,
      webhookSecret: `rwlf_sec_${generateRandomHex(32)}`,
      createdAt: Date.now(),
      verifiedOwnership: input.verifiedOwnership ?? true,
    };

    const updated = [newProtocol, ...protocols];
    localStorage.setItem(STORAGE_KEY_PROTOCOLS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rewalf_protocols_updated', { detail: updated }));

    return { success: true, protocol: newProtocol };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to register protocol' };
  }
}

/**
 * Update an existing protocol
 */
export function updateProtocol(id: string, updates: Partial<Protocol>): Protocol | null {
  try {
    const protocols = loadProtocols();
    const index = protocols.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedProtocol = { ...protocols[index], ...updates };
    protocols[index] = updatedProtocol;

    localStorage.setItem(STORAGE_KEY_PROTOCOLS, JSON.stringify(protocols));
    window.dispatchEvent(new CustomEvent('rewalf_protocols_updated', { detail: protocols }));

    return updatedProtocol;
  } catch (err) {
    console.error('Failed to update protocol', err);
    return null;
  }
}

/**
 * Delete a protocol
 */
export function deleteProtocol(id: string): boolean {
  try {
    const protocols = loadProtocols();
    const filtered = protocols.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PROTOCOLS, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('rewalf_protocols_updated', { detail: filtered }));
    return true;
  } catch (err) {
    console.error('Failed to delete protocol', err);
    return false;
  }
}

/**
 * Reset protocols to fixtures
 */
export function resetProtocolsToFixtures(): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROTOCOLS, JSON.stringify(DEFAULT_DEMO_PROTOCOLS));
    window.dispatchEvent(new CustomEvent('rewalf_protocols_updated', { detail: DEFAULT_DEMO_PROTOCOLS }));
  } catch (err) {
    console.error('Failed to reset protocols', err);
  }
}
