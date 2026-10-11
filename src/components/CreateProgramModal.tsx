import React, { useState, useEffect } from 'react';
import type { Agreement, ConnectedWallet, HorizonErrorDetail, Protocol } from '../stellar/types';
import {
  lockRewardOnChain,
  getStellarExpertTxUrl,
  parseHorizonError,
  generateTestnetKeypair,
} from '../stellar/stellarService';
import { upsertAgreement, generateReferralCode } from '../store/agreementStore';
import { loadBusinessProfile } from '../store/businessStore';
import { loadProtocols } from '../store/protocolStore';
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
  Building2,
  Plus,
} from 'lucide-react';

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onOpenBusinessModal?: () => void;
  onOpenRegisterModal?: () => void;
  onAgreementCreated: (agreement: Agreement) => void;
  onNavigateToReferrer: (code: string) => void;
  protocols?: Protocol[];
  selectedProtocol?: Protocol | null;
}

export const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  isOpen,
  onClose,
  connectedWallet,
  onOpenWalletModal,
  onOpenBusinessModal: _onOpenBusinessModal,
  onOpenRegisterModal,
  onAgreementCreated,
  onNavigateToReferrer,
  protocols,
  selectedProtocol,
}) => {
  // Wizard steps
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [customerLabel, setCustomerLabel] = useState('Stellar Cloud Validator Node');
  const [targetUrl, setTargetUrl] = useState('https://stellar.org/learn');
  const [partnerType, setPartnerType] = useState<'open_marketplace' | 'specific_partner'>('open_marketplace');
  const [referrerAddress, setReferrerAddress] = useState('');
  const [rewardPerConversion, setRewardPerConversion] = useState('25');
  const [totalBudget, setTotalBudget] = useState('250');
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
  const [selectedProtoId, setSelectedProtoId] = useState<string>('');

  const allProtocols = protocols || loadProtocols();

  useEffect(() => {
    if (selectedProtocol) {
      setSelectedProtoId(selectedProtocol.id);
      if (selectedProtocol.website) {
        setTargetUrl(selectedProtocol.website);
      }
    } else if (allProtocols.length > 0 && !selectedProtoId) {
      setSelectedProtoId(allProtocols[0].id);
      if (allProtocols[0].website) {
        setTargetUrl(allProtocols[0].website);
      }
    }
  }, [selectedProtocol, protocols, isOpen, selectedProtoId, allProtocols]);

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

    const numReward = parseFloat(rewardPerConversion);
    const numBudget = parseFloat(totalBudget);

    if (isNaN(numReward) || numReward <= 0) {
      setFormError('Please enter a valid positive reward per conversion.');
      return;
    }

    if (isNaN(numBudget) || numBudget < numReward) {
      setFormError('Total escrow budget must be greater than or equal to the reward per conversion.');
      return;
    }

    let effectiveReferrer = referrerAddress.trim();
    if (partnerType === 'open_marketplace' && (!effectiveReferrer || !effectiveReferrer.startsWith('G'))) {
      // Create a pool promoter key for open marketplace campaigns
      try {
        const poolKey = await generateTestnetKeypair(false);
        effectiveReferrer = poolKey.publicKey;
      } catch {
        effectiveReferrer = 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP';
      }
    }

    if (!effectiveReferrer.startsWith('G') || effectiveReferrer.length !== 56) {
      setFormError('Please enter a valid 56-character Stellar public address starting with G.');
      return;
    }

    // Anti-fraud check: Referrer cannot match business owner treasury
    if (effectiveReferrer.toLowerCase() === connectedWallet.publicKey.toLowerCase()) {
      setFormError('Anti-fraud violation: You cannot set your own business wallet as the campaign referrer.');
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

      // Lock total deposited budget on Stellar Testnet Escrow Vault
      const lockResult = await lockRewardOnChain({
        businessWallet: connectedWallet,
        referrerAddress: effectiveReferrer,
        customerLabel: customerLabel.trim(),
        amount: numBudget,
        assetCode,
        deadline: deadlineMs,
        code,
        onStatusUpdate: (msg) => setStepStatus(msg),
      });

      const proto = allProtocols.find((p) => p.id === selectedProtoId) || allProtocols[0];
      const biz = loadBusinessProfile();

      const newAgreement: Agreement = {
        code,
        protocolId: proto?.id || biz.id,
        businessAddress: connectedWallet.publicKey,
        businessId: proto?.id || biz.id,
        businessName: proto?.name || biz.name,
        businessWebsite: targetUrl.trim() || proto?.website || biz.website,
        targetUrl: targetUrl.trim() || proto?.website || biz.website,
        businessCategory: proto ? 'Web3 Protocol' : biz.category,
        referrerAddress: effectiveReferrer,
        customerLabel: customerLabel.trim(),
        amount: numReward.toFixed(2),
        rewardPerConversion: numReward.toFixed(2),
        totalBudget: numBudget.toFixed(2),
        remainingBudget: numBudget.toFixed(2),
        claimedAmount: '0.00',
        clicksCount: 0,
        conversionsCount: 0,
        conversions: [],
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
                  {/* Registered Protocol Context */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-input)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color="var(--accent-lime)" />
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Select Business / Protocol:
                        </span>
                      </div>
                      {onOpenRegisterModal && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                          onClick={() => {
                            onClose();
                            onOpenRegisterModal();
                          }}
                        >
                          <Plus size={11} /> Register New Protocol
                        </button>
                      )}
                    </div>

                    {allProtocols.length > 0 ? (
                      <select
                        value={selectedProtoId}
                        onChange={(e) => {
                          setSelectedProtoId(e.target.value);
                          const p = allProtocols.find((proto) => proto.id === e.target.value);
                          if (p?.website) setTargetUrl(p.website);
                        }}
                        className="form-select font-mono"
                        style={{ fontSize: '12.5px', background: 'var(--bg-canvas)' }}
                      >
                        {allProtocols.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.website.replace(/^https?:\/\//, '')}) — {p.network}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        Defaulting to: <strong style={{ color: 'var(--text-primary)' }}>{loadBusinessProfile().name}</strong>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="customer-label">
                      Campaign or Deal Name
                      <span className="hint">Identifier for this referral offering</span>
                    </label>
                    <input
                      id="customer-label"
                      type="text"
                      required
                      value={customerLabel}
                      onChange={(e) => setCustomerLabel(e.target.value)}
                      className="form-input"
                      placeholder="e.g. Enterprise Annual Tier or Summer SaaS Growth"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="target-url">
                      Business Destination Website URL
                      <span className="hint">Where referred customers land (e.g. https://mybusiness.com/pricing)</span>
                    </label>
                    <input
                      id="target-url"
                      type="url"
                      required
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="form-input font-mono"
                      placeholder="https://saasify.cloud/pricing"
                      disabled={loading}
                    />
                    <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Promoters will share unique links that redirect visitors to this page with an appended tracking parameter (e.g. <code>?ref=CODE</code>).
                    </p>
                  </div>

                  <div className="alert-box alert-info">
                    <Info size={18} />
                    <div>
                      <strong>Pay for Verified Results, Not Just Clicks</strong>
                      <p style={{ marginTop: '2px', fontSize: '12px' }}>
                        Your escrow deposit is held securely in an isolated Stellar vault. Rewards are only paid when customers visit through referral links and complete verified actions. Rewards cannot exceed deposited funds.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setCurrentStep(2)}
                    >
                      Next: Escrow Budget & Rewards <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Reward & Token */}
              {currentStep === 2 && (
                <div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reward-per-conversion">
                      Reward per Verified Customer
                      <span className="hint">Amount paid to referrer upon each verified conversion</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      <input
                        id="reward-per-conversion"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={rewardPerConversion}
                        onChange={(e) => setRewardPerConversion(e.target.value)}
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
                      {['10', '25', '50', '100'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRewardPerConversion(preset)}
                          className={`preset-btn ${rewardPerConversion === preset ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          +{preset} {assetCode} / customer
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label" htmlFor="total-escrow-budget">
                      Total Escrow Budget to Deposit
                      <span className="hint">Total funds locked in escrow for this campaign</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      <input
                        id="total-escrow-budget"
                        type="number"
                        step="1"
                        min={rewardPerConversion}
                        required
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(e.target.value)}
                        className="form-input font-mono"
                        placeholder="250.00"
                        disabled={loading}
                      />
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--surface-input)',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {assetCode} Vault
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {['100', '250', '500', '1000'].map((budgetPreset) => (
                        <button
                          key={budgetPreset}
                          type="button"
                          onClick={() => setTotalBudget(budgetPreset)}
                          className={`preset-btn ${totalBudget === budgetPreset ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          Deposit {budgetPreset} {assetCode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reserve & Capacity Preview */}
                  <div className="card-subtle" style={{ marginTop: '16px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      Escrow Capacity & Protection
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                      <span>Verified Customers Funded:</span>
                      <strong style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                        {Math.floor((parseFloat(totalBudget) || 0) / (parseFloat(rewardPerConversion) || 1))} customers
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      <span>Total Escrow Deposit:</span>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {totalBudget} {assetCode}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      <span>Stellar Account Base Reserve:</span>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>3.0000000 XLM</strong>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                      🛡️ <strong>Escrow Cap Guarantee:</strong> Rewards will automatically stop once the deposited budget of {totalBudget} {assetCode} is exhausted. Unclaimed funds can be reclaimed after deadline.
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(3)}>
                      Next: Promoters & Expiry <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Attribution & Expiry */}
              {currentStep === 3 && (
                <div>
                  <div className="form-group">
                    <label className="form-label">
                      Promoter Eligibility
                      <span className="hint">Who can generate referral links for this campaign</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div
                        onClick={() => setPartnerType('open_marketplace')}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: partnerType === 'open_marketplace' ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                          background: partnerType === 'open_marketplace' ? 'var(--accent-lime-subtle)' : 'var(--surface-input)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: partnerType === 'open_marketplace' ? 'var(--accent-lime)' : 'var(--text-primary)' }}>
                          🌐 Open Marketplace
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          Any verified promoter can discover this campaign and generate their custom tracking link.
                        </p>
                      </div>

                      <div
                        onClick={() => setPartnerType('specific_partner')}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: partnerType === 'specific_partner' ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                          background: partnerType === 'specific_partner' ? 'var(--accent-lime-subtle)' : 'var(--surface-input)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: partnerType === 'specific_partner' ? 'var(--accent-lime)' : 'var(--text-primary)' }}>
                          🔒 Designated Partner
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          Exclusive to a specific partner or affiliate Stellar public key.
                        </p>
                      </div>
                    </div>

                    {partnerType === 'specific_partner' && (
                      <div>
                        <div className="form-label" style={{ marginTop: '8px' }}>
                          <label htmlFor="referrer-address">Partner's Stellar Wallet Address</label>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '11px', padding: '2px 6px' }}
                            onClick={handleGenerateSampleReferrer}
                          >
                            <Zap size={11} color="var(--semantic-amber)" />
                            Generate Sample Key
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
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <div className="form-label">
                      <label htmlFor="deadline-picker">Campaign Expiry & Reclaim Window</label>
                      <span className="hint">Unclaimed escrow funds can be reclaimed after this date</span>
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
                      Campaign Escrow Summary
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Campaign Deal:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{customerLabel}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Target Business URL:</span>
                        <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                          {targetUrl}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Reward per Verified Sale:</span>
                        <span style={{ color: 'var(--accent-lime)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {rewardPerConversion} {assetCode}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Escrow Deposited:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {totalBudget} {assetCode} ({Math.floor(parseFloat(totalBudget) / parseFloat(rewardPerConversion))} conversions max)
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Promoter Mode:</span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {partnerType === 'open_marketplace' ? 'Open Marketplace (Self-serve links)' : 'Exclusive Partner'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Campaign Expiry:</span>
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
                            <span>Lock {totalBudget} {assetCode} in Escrow Vault</span>
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
                  A dedicated Escrow Vault account was created and funded with {createdAgreement.totalBudget || createdAgreement.amount} {createdAgreement.assetCode}. Destination URL: <strong style={{ color: 'var(--text-primary)' }}>{createdAgreement.targetUrl || createdAgreement.businessWebsite}</strong>. Promoters can now generate referral links and claim rewards for verified customer purchases.
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
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      id="referrer-link-input"
                      type="text"
                      readOnly
                      value={referrerUrl}
                      className="form-input font-mono"
                      style={{ fontSize: '12px', cursor: 'pointer' }}
                      onClick={() => {
                        onClose();
                        onNavigateToReferrer(createdAgreement.code);
                      }}
                      title="Click to open referrer portal"
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
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        onClose();
                        onNavigateToReferrer(createdAgreement.code);
                      }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Open <ExternalLink size={13} />
                    </button>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface-input)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    👉 Click to open:{' '}
                    <a
                      href={`/r/${createdAgreement.code}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        onNavigateToReferrer(createdAgreement.code);
                      }}
                      style={{
                        color: 'var(--accent-lime)',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {referrerUrl}
                    </a>
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
