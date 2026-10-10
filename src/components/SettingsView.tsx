import React, { useState } from 'react';
import type { ConnectedWallet } from '../stellar/types';
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
  ShieldCheck,
  Server,
  Zap,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface SettingsViewProps {
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onRefreshWallets: () => void;
  onAgreementsUpdated: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  connectedWallet,
  onOpenWalletModal,
  onRefreshWallets,
  onAgreementsUpdated,
}) => {
  const [funding, setFunding] = useState(false);
  const [fundSuccess, setFundSuccess] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

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
