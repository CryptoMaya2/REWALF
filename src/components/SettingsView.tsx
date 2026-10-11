import React, { useState, useEffect } from 'react';
import type { ConnectedWallet, BusinessProfile } from '../stellar/types';
import {
  HORIZON_URL,
  FRIENDBOT_URL,
  NETWORK_PASSPHRASE,
  fundWithFriendbot,
} from '../stellar/stellarService';
import {
  resetAgreementsToFixtures,
  clearAllAgreements,
} from '../store/agreementStore';
import {
  loadBusinessProfile,
} from '../store/businessStore';
import {
  ShieldCheck,
  Server,
  Zap,
  RotateCcw,
  Trash2,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onRefreshWallets: () => void;
  onAgreementsUpdated: () => void;
  onOpenBusinessModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  connectedWallet,
  onOpenWalletModal,
  onRefreshWallets,
  onAgreementsUpdated,
  onOpenBusinessModal,
}) => {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(loadBusinessProfile());
  const [funding, setFunding] = useState(false);
  const [fundSuccess, setFundSuccess] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setBusinessProfile(loadBusinessProfile());
    };
    window.addEventListener('rewalf_business_updated', handleUpdate);
    return () => window.removeEventListener('rewalf_business_updated', handleUpdate);
  }, []);

  const handleFundConnected = async () => {
    if (!connectedWallet) {
      onOpenWalletModal();
      return;
    }
    setFunding(true);
    setFundSuccess(null);
    setFundError(null);
    try {
      const res = await fundWithFriendbot(connectedWallet.publicKey);
      if (res.success) {
        setFundSuccess(`Funded 10,000 XLM to ${connectedWallet.publicKey.slice(0, 6)}...`);
        onRefreshWallets();
      } else {
        setFundError(res.error || 'Friendbot failed to fund account.');
      }
    } catch (err: any) {
      setFundError(`Error funding account: ${err.message}`);
    } finally {
      setFunding(false);
    }
  };

  const handleResetFixtures = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    setConfirmReset(false);
    resetAgreementsToFixtures();
    onAgreementsUpdated();
  };

  const handleClearAll = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setConfirmClear(false);
    clearAllAgreements();
    onAgreementsUpdated();
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Protocol & Network Configuration
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          Inspect live Stellar Horizon connection parameters, non-custodial boundaries, and evaluation tools
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Business Identity & Verified Profile */}
        <div className="card" style={{ border: '1px solid var(--border-focus)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--accent-lime)" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Registered Business Identity
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Branded profile displayed to affiliate partners and stamped on generated referral links
                </p>
              </div>
            </div>
            {onOpenBusinessModal && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onOpenBusinessModal}
              >
                <Building2 size={14} />
                Edit Business Profile
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(200, 255, 0, 0.15) 0%, rgba(0, 240, 255, 0.15) 100%)',
              border: '1px solid rgba(200, 255, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              color: 'var(--accent-lime)',
              fontFamily: 'var(--font-mono)',
            }}>
              {businessProfile.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {businessProfile.name}
                </span>
                <span className="badge badge-settled" style={{ fontSize: '11px' }}>
                  Verified Business
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  {businessProfile.category}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {businessProfile.description}
              </p>
              {businessProfile.website && (
                <a
                  href={businessProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--accent-lime)',
                    marginTop: '6px',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} />
                  {businessProfile.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Network & Endpoints */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Server size={18} color="var(--accent-lime)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Stellar Network Parameters
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Target Blockchain Network:</span>
              <span className="network-badge">
                <span className="pulse-dot" />
                Stellar Testnet
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Horizon RPC Endpoint:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{HORIZON_URL}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Friendbot Faucet Endpoint:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{FRIENDBOT_URL}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Network Passphrase:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-blue)' }}>
                {NETWORK_PASSPHRASE}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Test USDC Issuer:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
              </span>
            </div>
          </div>
        </div>

        {/* Security & Signer Architecture */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ShieldCheck size={18} color="var(--semantic-green)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Non-Custodial Security Posture
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
            Rewalf is architected so that secret keys for protocol or affiliate wallets are never sent to any server or backend. Transactions for funding escrows are signed directly by your browser wallet (Freighter / Albedo).
          </p>

          <div className="card-subtle" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  Active Connected Signer
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {connectedWallet ? (connectedWallet.label || connectedWallet.walletType) : 'No Signer Connected'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {connectedWallet && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleFundConnected}
                    disabled={funding}
                  >
                    <Zap size={13} color="var(--semantic-amber)" />
                    {funding ? 'Funding...' : 'Friendbot Faucet (+10k XLM)'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenWalletModal}
                >
                  Manage Signer
                </button>
              </div>
            </div>

            {fundSuccess && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--semantic-green)' }}>
                ✓ {fundSuccess}
              </div>
            )}
            {fundError && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--semantic-red)' }}>
                ⚠ {fundError}
              </div>
            )}
          </div>
        </div>

        {/* Evaluation & Fixture Management */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <RotateCcw size={18} color="var(--semantic-amber)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Evaluation State & Fixtures
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            Manage sample testnet records used to evaluate the dashboard. You can reset to clean evaluation fixtures or clear all data to test from an empty state.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn btn-sm ${confirmReset ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleResetFixtures}
              style={confirmReset ? { background: 'var(--semantic-amber)', borderColor: 'var(--semantic-amber)', color: '#000' } : undefined}
            >
              <RotateCcw size={14} />
              {confirmReset ? 'Confirm Reset? (click again)' : 'Reset to Default Evaluation Fixtures'}
            </button>
            {confirmReset && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            )}

            <button
              type="button"
              className={`btn btn-sm ${confirmClear ? 'btn-primary' : 'btn-danger-outline'}`}
              onClick={handleClearAll}
              style={confirmClear ? { background: 'var(--semantic-red)', borderColor: 'var(--semantic-red)', color: '#fff' } : undefined}
            >
              <Trash2 size={14} />
              {confirmClear ? 'Confirm Clear All? (click again)' : 'Clear All Stored Agreements'}
            </button>
            {confirmClear && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
