import React, { useState } from 'react';
import type { Agreement, ConnectedWallet, HorizonErrorDetail } from '../stellar/types';
import {
  lockRewardOnChain,
  getStellarExpertTxUrl,
  parseHorizonError,
  generateTestnetKeypair,
} from '../stellar/stellarService';
import { upsertAgreement, generateReferralCode } from '../store/agreementStore';
import {
  Lock,
  ExternalLink,
  Copy,
  Check,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Wallet,
  ShieldCheck,
  Zap,
  Activity,
} from 'lucide-react';

interface BusinessLockProps {
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onAgreementCreated: (agreement: Agreement) => void;
  onNavigateToReferrer: (code: string) => void;
}

export const BusinessLock: React.FC<BusinessLockProps> = ({
  connectedWallet,
  onOpenWalletModal,
  onAgreementCreated,
  onNavigateToReferrer,
}) => {
  const [amount, setAmount] = useState('25');
  const [assetCode, setAssetCode] = useState<'USDC' | 'XLM'>('USDC');
  const [referrerAddress, setReferrerAddress] = useState('');
  const [customerLabel, setCustomerLabel] = useState('Acme Pro Subscription #402');
  
  // Deadline defaults to +5 minutes from now for quick hackathon testing
  const [deadlinePreset, setDeadlinePreset] = useState<'5m' | '1h' | '24h' | 'custom'>('5m');
  const [customDeadline, setCustomDeadline] = useState(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });

  const [loading, setLoading] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>('');
  const [errorDetail, setErrorDetail] = useState<HorizonErrorDetail | null>(null);
  const [createdAgreement, setCreatedAgreement] = useState<Agreement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Quick helper to fill a fresh testnet recipient address
  const handleGenerateSampleReferrer = async () => {
    try {
      const sample = await generateTestnetKeypair(false);
      setReferrerAddress(sample.publicKey);
    } catch (err: any) {
      alert(`Could not generate sample address: ${err.message}`);
    }
  };

  const calculateDeadlineEpoch = (): number => {
    if (deadlinePreset === '5m') return Date.now() + 5 * 60 * 1000;
    if (deadlinePreset === '1h') return Date.now() + 60 * 60 * 1000;
    if (deadlinePreset === '24h') return Date.now() + 24 * 60 * 60 * 1000;
    return new Date(customDeadline).getTime();
  };

  const handleLockReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      onOpenWalletModal();
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive reward amount.');
      return;
    }

    if (!referrerAddress.trim().startsWith('G') || referrerAddress.trim().length !== 56) {
      alert('Please enter a valid 56-character Stellar public address starting with G.');
      return;
    }

    if (referrerAddress.trim() === connectedWallet.publicKey) {
      if (!confirm('Warning: The referrer address is the same as your connected business address. Continue?')) {
        return;
      }
    }

    const deadlineMs = calculateDeadlineEpoch();
    if (deadlineMs <= Date.now()) {
      alert('Deadline must be in the future.');
      return;
    }

    setLoading(true);
    setErrorDetail(null);
    setCreatedAgreement(null);

    try {
      const code = generateReferralCode();

      const lockResult = await lockRewardOnChain({
        businessWallet: connectedWallet,
        referrerAddress: referrerAddress.trim(),
        customerLabel: customerLabel.trim(),
        amount: numAmount,
        assetCode,
        deadline: deadlineMs,
        code,
        onStatusUpdate: (msg) => setStepStatus(msg),
      });

      const newAgreement: Agreement = {
        code,
        businessAddress: connectedWallet.publicKey,
        referrerAddress: referrerAddress.trim(),
        customerLabel: customerLabel.trim(),
        amount: numAmount.toFixed(2),
        assetCode,
        deadline: deadlineMs,
        state: 'LOCKED',
        escrowPublicKey: lockResult.escrowPublicKey,
        escrowSecretKey: lockResult.escrowSecretKey,
        lockTxHash: lockResult.lockTxHash,
        createdAt: Date.now(),
      };

      upsertAgreement(newAgreement);
      setCreatedAgreement(newAgreement);
      onAgreementCreated(newAgreement);
    } catch (err: any) {
      console.error('Lock transaction failed:', err);
      const parsed = parseHorizonError(err);
      setErrorDetail(parsed);
    } finally {
      setLoading(false);
      setStepStatus('');
    }
  };

  const referrerUrl = createdAgreement
    ? `${window.location.origin}/r/${createdAgreement.code}`
    : '';

  const copyToClipboard = (text: string, isHash = false) => {
    navigator.clipboard.writeText(text);
    if (isHash) {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* High-Impact Protocol Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12), rgba(139, 92, 246, 0.15))',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--stellar-cyan)',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            marginBottom: '14px',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)',
          }}
        >
          <Sparkles size={14} />
          <span>Trustless Referral Escrow on Stellar</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '34px',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.15,
            letterSpacing: '-0.8px',
            marginBottom: '12px',
          }}
        >
          Lock Real Rewards in <span style={{ background: 'linear-gradient(120deg, #00f2fe 0%, #38bdf8 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>On-Chain Escrow</span>
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '620px', margin: '0 auto', lineHeight: 1.55 }}>
          Pre-fund your affiliate promise in a dedicated Stellar Escrow Vault. 
          The reward is cryptographically locked to the referrer and cannot be diverted.
        </p>

        {/* 3 Live Metric Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              color: 'var(--text-main)',
            }}
          >
            <Activity size={13} color="#00f2fe" />
            <span><strong>3.2s</strong> Finality</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              color: 'var(--text-main)',
            }}
          >
            <Lock size={13} color="#a78bfa" />
            <span><strong>Non-Divertible</strong> Recipient</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              color: 'var(--text-main)',
            }}
          >
            <Clock size={13} color="#fbbf24" />
            <span><strong>Auto-Protected</strong> Deadline</span>
          </div>
        </div>
      </div>

      {/* Safety Reassurance Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 78, 59, 0.12) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: '14px',
          padding: '14px 20px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} color="#10b981" />
          <span style={{ fontSize: '13.5px', color: '#e2e8f0' }}>
            <strong style={{ color: '#34d399' }}>Non-Custodial:</strong> You sign directly via Freighter or Albedo. Private keys are never touched.
          </span>
        </div>
        {connectedWallet ? (
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0,0,0,0.4)',
              padding: '4px 10px',
              borderRadius: '8px',
              color: 'var(--stellar-cyan)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
            }}
          >
            Signer: {connectedWallet.publicKey.slice(0, 4)}...{connectedWallet.publicKey.slice(-4)}
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenWalletModal}
            style={{ fontSize: '12px', padding: '4px 12px' }}
          >
            <Wallet size={13} />
            Connect Wallet
          </button>
        )}
      </div>

      {/* Main Lock Form Card */}
      <div className="glass-card">
        <form onSubmit={handleLockReward}>
          {/* Amount & Asset Section with Crypto Quick Pills */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="reward-amount">Reward Amount & Currency</label>
              <span className="hint">Transferred into Escrow Vault</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  id="reward-amount"
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-input font-mono"
                  style={{ fontSize: '18px', fontWeight: 700, paddingLeft: '16px' }}
                  placeholder="e.g. 25"
                  disabled={loading}
                />
              </div>

              <div style={{ width: '150px' }}>
                <select
                  id="reward-asset"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value as any)}
                  className="form-select"
                  style={{ fontWeight: 700, fontSize: '14.5px' }}
                  disabled={loading}
                >
                  <option value="USDC">USDC (Test)</option>
                  <option value="XLM">XLM (Native)</option>
                </select>
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {['10', '25', '50', '100', '250'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`preset-btn ${amount === preset ? 'active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                >
                  +{preset} {assetCode}
                </button>
              ))}
            </div>
          </div>

          {/* Referred Customer Identifier */}
          <div className="form-group">
            <label className="form-label" htmlFor="customer-label">
              Referred Customer Identifier
              <span className="hint">Invoice #, user ID, or deal reference</span>
            </label>
            <input
              id="customer-label"
              type="text"
              required
              value={customerLabel}
              onChange={(e) => setCustomerLabel(e.target.value)}
              className="form-input"
              placeholder="e.g. Acme Pro Subscription #402"
              disabled={loading}
            />
          </div>

          {/* Referrer Stellar Public Address */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="referrer-address">Referrer Payout Public Key (Stellar G...)</label>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '11.5px', padding: '3px 8px' }}
                onClick={handleGenerateSampleReferrer}
                title="Generate a random Stellar public key to test as referrer recipient"
              >
                <Zap size={12} color="#f59e0b" />
                Fill Sample Recipient Key
              </button>
            </div>
            <input
              id="referrer-address"
              type="text"
              required
              value={referrerAddress}
              onChange={(e) => setReferrerAddress(e.target.value)}
              className="form-input font-mono"
              placeholder="G... (56 character Stellar Ed25519 public key)"
              disabled={loading}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
              🔒 Crucial Rule: Once locked on-chain, this payout address is permanently bound to this escrow agreement.
            </p>
          </div>

          {/* Deadline Picker */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="deadline-picker">Agreement Expiry Deadline</label>
              <span className="hint">Business can reclaim after this timestamp</span>
            </div>

            <div className="preset-pills">
              <button
                type="button"
                className={`preset-btn ${deadlinePreset === '5m' ? 'active' : ''}`}
                onClick={() => setDeadlinePreset('5m')}
              >
                +5 Minutes (Fast Demo)
              </button>
              <button
                type="button"
                className={`preset-btn ${deadlinePreset === '1h' ? 'active' : ''}`}
                onClick={() => setDeadlinePreset('1h')}
              >
                +1 Hour
              </button>
              <button
                type="button"
                className={`preset-btn ${deadlinePreset === '24h' ? 'active' : ''}`}
                onClick={() => setDeadlinePreset('24h')}
              >
                +24 Hours
              </button>
              <button
                type="button"
                className={`preset-btn ${deadlinePreset === 'custom' ? 'active' : ''}`}
                onClick={() => setDeadlinePreset('custom')}
              >
                Custom Date & Time
              </button>
            </div>

            {deadlinePreset === 'custom' && (
              <input
                id="deadline-picker"
                type="datetime-local"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                className="form-input"
                style={{ marginTop: '12px' }}
                disabled={loading}
              />
            )}
          </div>

          {/* Error Banner */}
          {errorDetail && (
            <div className="alert-box alert-error" id="lock-error-banner">
              <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                  {errorDetail.title} (HTTP {errorDetail.status})
                </strong>
                <p style={{ marginBottom: '6px' }}>{errorDetail.detail}</p>
                {errorDetail.codes && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '4px' }}>
                    {errorDetail.codes.map((c, i) => (
                      <div key={i}>{c}</div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '12px', marginTop: '6px', opacity: 0.9 }}>
                  💡 Tip: Ensure your wallet has testnet XLM for transaction fees and escrow funding.
                </p>
              </div>
            </div>
          )}

          {/* Submission Button */}
          <div style={{ marginTop: '28px' }}>
            {!connectedWallet ? (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onOpenWalletModal}
              >
                <Wallet size={18} />
                Connect Wallet to Lock Reward
              </button>
            ) : (
              <button
                id="lock-reward-btn"
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Clock className="animate-spin" size={18} />
                    <span>{stepStatus || 'Awaiting wallet signature...'}</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Lock {amount} {assetCode} (Sign with {connectedWallet.label || connectedWallet.walletType})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Success Result Box */}
        {createdAgreement && (
          <div
            id="lock-success-box"
            style={{
              marginTop: '32px',
              padding: '26px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles color="#10b981" size={22} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: '#34d399' }}>
                  Reward Successfully Locked on Stellar!
                </h3>
              </div>
              <span className="state-badge state-locked">LOCKED</span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '18px', lineHeight: 1.5 }}>
              A dedicated Escrow Vault Account was created and funded on Stellar testnet. The agreement terms are anchored on-chain.
            </p>

            {/* Stellar Expert Link */}
            <div className="stellar-hash-box">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Real Stellar Testnet Transaction Hash
                </span>
                <a
                  id="lock-tx-link"
                  href={getStellarExpertTxUrl(createdAgreement.lockTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Verify on Stellar Expert"
                >
                  {createdAgreement.lockTxHash}
                  <ExternalLink size={13} style={{ flexShrink: 0 }} />
                </a>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => copyToClipboard(createdAgreement.lockTxHash, true)}
                title="Copy Transaction Hash"
              >
                {copiedHash ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              </button>
            </div>

            {/* Referrer Shareable Link */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                Shareable Referrer Link (/r/:code)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  id="referrer-link-input"
                  type="text"
                  readOnly
                  value={referrerUrl}
                  className="form-input font-mono"
                  style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--stellar-cyan)' }}
                />
                <button
                  id="copy-referrer-link-btn"
                  type="button"
                  className="btn btn-outline"
                  onClick={() => copyToClipboard(referrerUrl)}
                  style={{ flexShrink: 0 }}
                >
                  {copiedLink ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
                <button
                  id="open-referrer-page-btn"
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigateToReferrer(createdAgreement.code)}
                  style={{ flexShrink: 0 }}
                >
                  Open Page
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
