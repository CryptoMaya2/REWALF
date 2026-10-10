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
  Wallet,
  Zap,
  Info,
  X,
  CheckCircle2,
} from 'lucide-react';

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onAgreementCreated: (agreement: Agreement) => void;
  onNavigateToReferrer: (code: string) => void;
}

export const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  isOpen,
  onClose,
  connectedWallet,
  onOpenWalletModal,
  onAgreementCreated,
  onNavigateToReferrer,
}) => {
  // Wizard steps
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [customerLabel, setCustomerLabel] = useState('Enterprise Subscription #402');
  const [referrerAddress, setReferrerAddress] = useState('');
  const [amount, setAmount] = useState('25');
  const [assetCode, setAssetCode] = useState<'USDC' | 'XLM'>('USDC');
  const [deadlinePreset, setDeadlinePreset] = useState<'5m' | '1h' | '24h' | 'custom'>('5m');
  const [customDeadline, setCustomDeadline] = useState(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });

  // Submission State
  const [loading, setLoading] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<HorizonErrorDetail | null>(null);
  const [createdAgreement, setCreatedAgreement] = useState<Agreement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleGenerateSampleReferrer = async () => {
    try {
      const sample = await generateTestnetKeypair(false);
      setReferrerAddress(sample.publicKey);
    } catch (err: any) {
      setFormError(`Could not generate sample key: ${err.message}`);
    }
  };

  const calculateDeadlineEpoch = (): number => {
    if (deadlinePreset === '5m') return Date.now() + 5 * 60 * 1000;
    if (deadlinePreset === '1h') return Date.now() + 60 * 60 * 1000;
    if (deadlinePreset === '24h') return Date.now() + 24 * 60 * 60 * 1000;
    return new Date(customDeadline).getTime();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLockReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      onOpenWalletModal();
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive reward amount.');
      return;
    }

    if (!referrerAddress.trim().startsWith('G') || referrerAddress.trim().length !== 56) {
      setFormError('Please enter a valid 56-character Stellar public address starting with G.');
      return;
    }

    const deadlineMs = calculateDeadlineEpoch();
    if (deadlineMs <= Date.now()) {
      setFormError('Deadline must be in the future.');
      return;
    }

    setFormError(null);

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
      console.error('Lock reward error:', err);
      const parsed = parseHorizonError(err);
      setErrorDetail(parsed);
    } finally {
      setLoading(false);
      setStepStatus('');
    }
  };

  const referrerUrl = createdAgreement ? `${window.location.origin}/r/${createdAgreement.code}` : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-badge badge-locked">Guided Workflow</span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                On-Chain Escrow Protocol
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>
              Create Referral Program & Lock Escrow
            </h2>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Steps Progress Tabs */}
          {!createdAgreement && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              {[
                { num: 1, title: 'Program & Deal' },
                { num: 2, title: 'Reward & Token' },
                { num: 3, title: 'Attribution & Expiry' },
                { num: 4, title: 'Review & Sign' },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num as any)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: currentStep === s.num ? 'var(--surface-subtle)' : 'transparent',
                    border: currentStep === s.num ? '1px solid var(--accent-lime-border)' : '1px solid var(--border-subtle)',
                    color: currentStep === s.num ? 'var(--accent-lime)' : 'var(--text-tertiary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Step {s.num}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: currentStep === s.num ? 'var(--text-primary)' : 'inherit' }}>
                    {s.title}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          {!createdAgreement ? (
            <form onSubmit={handleLockReward}>
              {/* STEP 1: Program & Deal Reference */}
              {currentStep === 1 && (
                <div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="customer-label">
                      Deal or Customer Name
                      <span className="hint">Company name, client handle, or invoice #</span>
                    </label>
                    <input
                      id="customer-label"
                      type="text"
                      required
                      value={customerLabel}
                      onChange={(e) => setCustomerLabel(e.target.value)}
                      className="form-input"
                      placeholder="e.g. Acme Corp Annual Subscription"
                      disabled={loading}
                    />
                    <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      This name helps you and your partner identify which customer or sale this reward is tied to.
                    </p>
                  </div>

                  <div className="alert-box alert-info">
                    <Info size={18} />
                    <div>
                      <strong>How this referral escrow works</strong>
                      <p style={{ marginTop: '2px', fontSize: '12px' }}>
                        Your reward deposit will be held securely in an isolated vault. Once customer payment is confirmed, your partner can claim their reward immediately. If no purchase is made before your deadline, you get 100% of your deposit back.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setCurrentStep(2)}
                    >
                      Next: Reward Amount <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Reward & Token */}
              {currentStep === 2 && (
                <div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reward-amount">
                      How much should your partner earn?
                      <span className="hint">Sent to their wallet the moment customer payment is confirmed</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      <input
                        id="reward-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="form-input font-mono"
                        placeholder="25.00"
                        disabled={loading}
                      />
                      <select
                        id="reward-asset"
                        value={assetCode}
                        onChange={(e) => setAssetCode(e.target.value as any)}
                        className="form-select font-mono"
                        disabled={loading}
                      >
                        <option value="USDC">USDC (Test)</option>
                        <option value="XLM">XLM (Native)</option>
                      </select>
                    </div>

                    {/* Quick Amount Chips */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {['10', '25', '50', '100', '250'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className={`preset-btn ${amount === preset ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          +{preset} {assetCode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reserve Preview */}
                  <div className="card-subtle" style={{ marginTop: '16px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      Deposit Summary
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                      <span>Referral Reward Deposit:</span>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{amount} {assetCode}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      <span>Stellar Account Reserve:</span>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>3.0000000 XLM</strong>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                      A small 3 XLM base reserve activates the escrow vault on the Stellar network. It is fully refunded when the escrow closes.
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(3)}>
                      Next: Partner & Expiry <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Attribution & Expiry */}
              {currentStep === 3 && (
                <div>
                  <div className="form-group">
                    <div className="form-label">
                      <label htmlFor="referrer-address">Partner's Stellar Wallet Address</label>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '11px', padding: '2px 6px' }}
                        onClick={handleGenerateSampleReferrer}
                      >
                        <Zap size={11} color="var(--semantic-amber)" />
                        Generate Sample Partner Key
                      </button>
                    </div>
                    <input
                      id="referrer-address"
                      type="text"
                      required
                      value={referrerAddress}
                      onChange={(e) => setReferrerAddress(e.target.value)}
                      className="form-input font-mono"
                      placeholder="G... (56 character Stellar public key)"
                      disabled={loading}
                    />
                    <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      🔒 <strong>Guaranteed Recipient:</strong> Once locked, this reward can only be claimed by this specific wallet address.
                    </p>
                  </div>

                  <div className="form-group">
                    <div className="form-label">
                      <label htmlFor="deadline-picker">How long is this offer open?</label>
                      <span className="hint">You can reclaim your deposit if no purchase is made by this time</span>
                    </div>

                    <div className="preset-pills">
                      <button
                        type="button"
                        className={`preset-btn ${deadlinePreset === '5m' ? 'active' : ''}`}
                        onClick={() => setDeadlinePreset('5m')}
                      >
                        +5 Min (Fast Demo)
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
                        Custom Date
                      </button>
                    </div>

                    {deadlinePreset === 'custom' && (
                      <input
                        id="deadline-picker"
                        type="datetime-local"
                        value={customDeadline}
                        onChange={(e) => setCustomDeadline(e.target.value)}
                        className="form-input"
                        style={{ marginTop: '10px' }}
                        disabled={loading}
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(4)}>
                      Review & Confirm <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Sign */}
              {currentStep === 4 && (
                <div>
                  <div className="card-subtle" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: '12px' }}>
                      Agreement Summary
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Deal / Customer:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{customerLabel}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Reward Bounty:</span>
                        <span style={{ color: 'var(--accent-lime)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {amount} {assetCode}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Partner Wallet:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {referrerAddress ? `${referrerAddress.slice(0, 8)}...${referrerAddress.slice(-6)}` : 'Missing'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Offer Expiry:</span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {new Date(calculateDeadlineEpoch()).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Signing Wallet:</span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {connectedWallet ? (connectedWallet.label || connectedWallet.walletType) : 'Not Connected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form validation error */}
                  {formError && (
                    <div className="alert-box alert-warning" style={{ marginBottom: '12px' }}>
                      <Info size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Error Banner */}
                  {errorDetail && (
                    <div className="alert-box alert-error">
                      <ShieldAlert size={18} />
                      <div>
                        <strong>{errorDetail.title}</strong>
                        <p style={{ marginTop: '2px', fontSize: '12px' }}>{errorDetail.detail}</p>
                      </div>
                    </div>
                  )}

                  {/* Submission Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setCurrentStep(3)} disabled={loading}>
                      Back
                    </button>

                    {!connectedWallet ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onOpenWalletModal}
                      >
                        <Wallet size={15} />
                        Connect Wallet to Sign
                      </button>
                    ) : (
                      <button
                        id="lock-reward-btn"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Clock className="animate-spin" size={15} />
                            <span>{stepStatus || 'Signing transaction...'}</span>
                          </>
                        ) : (
                          <>
                            <Lock size={15} />
                            <span>Lock {amount} {assetCode} in Escrow Vault</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* SUCCESS STATE */
            <div>
              <div
                style={{
                  padding: '20px',
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--accent-lime-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <CheckCircle2 color="var(--accent-lime)" size={22} />
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--accent-lime)' }}>
                    Escrow Vault Anchored on Stellar Testnet!
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  A dedicated Escrow Vault account was created and funded with {createdAgreement.amount} {createdAgreement.assetCode}. Terms are locked on-chain.
                </p>

                {/* Hash Link */}
                <div className="trace-evidence" style={{ marginBottom: '14px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Tx Hash:</span>
                  <a
                    id="lock-tx-link"
                    href={getStellarExpertTxUrl(createdAgreement.lockTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {createdAgreement.lockTxHash}
                    </span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Shareable Link */}
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Shareable Referrer Link (/r/:code)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="referrer-link-input"
                      type="text"
                      readOnly
                      value={referrerUrl}
                      className="form-input font-mono"
                      style={{ fontSize: '12px' }}
                    />
                    <button
                      id="copy-referrer-link-btn"
                      type="button"
                      className="btn btn-outline"
                      onClick={() => copyToClipboard(referrerUrl)}
                    >
                      {copiedLink ? <Check size={14} color="var(--accent-lime)" /> : <Copy size={14} />}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={onClose}>
                  Close
                </button>
                <button
                  id="open-referrer-page-btn"
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onNavigateToReferrer(createdAgreement.code);
                  }}
                >
                  Open Referrer Portal <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
