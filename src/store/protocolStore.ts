import type { Protocol } from '../stellar/types';

const STORAGE_KEY_PROTOCOLS = 'rewalf_protocols_v1';

export const DEFAULT_DEMO_PROTOCOLS: Protocol[] = [
  {
    id: 'proto_saasify',
    name: 'SaaSify Cloud Infrastructure',
    website: 'https://saasify.cloud',
    description: 'Enterprise developer APIs, edge nodes, and cloud infrastructure on Stellar.',
    network: 'Stellar Testnet',
    ownerWallet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    status: 'active',
    integrationType: 'client_sdk',
    apiKey: 'rwlf_live_9f82b7c4e1a04d238b71569a',
    webhookSecret: 'whsec_a8b9c0d1e2f3456789abcdef01234567',
    webhookUrl: 'https://api.saasify.cloud/v1/referral/webhook',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14, // 14 days ago
    verifiedOwnership: true,
  },
  {
    id: 'proto_phoenix_dex',
    name: 'Phoenix Stellar DEX',
    website: 'https://phoenixdex.fi',
    description: 'Automated market maker and liquidity aggregator built natively on Stellar Soroban.',
    network: 'Stellar Testnet',
    ownerWallet: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
    status: 'awaiting_integration',
    integrationType: 'webhook_oracle',
    apiKey: 'rwlf_live_3c71a0e4b9d28e147f23058b',
    webhookSecret: 'whsec_e5f6a1b2c3d47890abcdef1234567890',
    webhookUrl: 'https://api.phoenixdex.fi/events/referral-reward',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
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
    return parsed;
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
      webhookSecret: `whsec_${generateRandomHex(32)}`,
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
