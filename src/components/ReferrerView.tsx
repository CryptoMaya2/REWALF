import React, { useState, useEffect, useCallback } from 'react';
import type { Agreement, ConnectedWallet, HorizonErrorDetail } from '../stellar/types';
import {
  claimRewardOnChain,
  getStellarExpertTxUrl,
  parseHorizonError,
} from '../stellar/stellarService';
import {
  getAgreementByCode,
  loadAgreements,
  updateAgreementState,
  recordReferralClick,
  verifyCustomerConversion,
  getVaultSecret,
} from '../store/agreementStore';
import { PayoutTrace } from './PayoutTrace';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Copy,
  Check,
  Globe,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface ReferrerViewProps {
  currentCode: string;
  connectedWallet?: ConnectedWallet | null;
  onOpenWalletModal?: () => void;
  onCodeChange: (code: string) => void;
  onNavigateToBusiness: () => void;
}

export const ReferrerView: React.FC<ReferrerViewProps> = ({
  currentCode,
  connectedWallet,
  onOpenWalletModal,
  onCodeChange,
  onNavigateToBusiness,
}) => {
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimProgress, setClaimProgress] = useState('');
  const [errorDetail, setErrorDetail] = useState<HorizonErrorDetail | null>(null);
  const [allAgreements, setAllAgreements] = useState<Agreement[]>([]);
  const [copied, setCopied] = useState(false);

  // Conversion verification simulator state
  const [testOrderId, setTestOrderId] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [testCustomerName, setTestCustomerName] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<{ success: boolean; msg: string; fraudAlert?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Load agreement
  const reloadAgreement = useCallback(() => {
    const list = loadAgreements();
    setAllAgreements(list);

    if (currentCode) {
      const found = getAgreementByCode(currentCode);
      setAgreement(found || null);
    } else if (list.length > 0) {
      setAgreement(list[0]);
      onCodeChange(list[0].code);
    } else {
      setAgreement(null);
    }
  }, [currentCode, onCodeChange]);

  useEffect(() => {
    reloadAgreement();
  }, [reloadAgreement]);

  useEffect(() => {
    const handleUpdate = () => reloadAgreement();
    window.addEventListener('rewalf_agreements_updated', handleUpdate);
    return () => window.removeEventListener('rewalf_agreements_updated', handleUpdate);
  }, [reloadAgreement]);

  // Handle direct click-through to business URL with ?ref=CODE
  const handleVisitBusinessWebsite = () => {
    if (!agreement) return;

    recordReferralClick(agreement.code);

    const baseUrl = agreement.targetUrl || agreement.businessWebsite || 'https://saasify.cloud/pricing';
    const redirectUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ref=${agreement.code}`;

    window.open(redirectUrl, '_blank', 'noopener,noreferrer');

    // Reload state to reflect click count increment
    reloadAgreement();
  };

  // Authenticate customer conversion with anti-fraud safeguards
  const handleAuthenticateConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreement) return;

    setVerifying(true);
    setVerificationFeedback(null);

    try {
      const res = verifyCustomerConversion({
        campaignCode: agreement.code,
        orderId: testOrderId.trim(),
        customerLabel: testCustomerName.trim() || agreement.customerLabel,
        referrerAddress: agreement.referrerAddress,
        callerAddress: connectedWallet?.publicKey,
        verificationMethod: 'hmac_webhook',
      });

      if (res.success && res.agreement) {
        setAgreement({ ...res.agreement });
        setVerificationFeedback({
          success: true,
          msg: `Verified Order #${res.conversion?.orderId}! Reward unlocked for claim on Stellar testnet.`,
        });
        setTestOrderId(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
        setTestCustomerName('');
      } else {
        setVerificationFeedback({
          success: false,
          msg: res.error || 'Conversion verification rejected.',
          fraudAlert: res.fraudAlert,
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  // Referrer claim reward on Stellar Testnet
  const handleClaimReward = async () => {
    if (!agreement) return;
    if (agreement.state !== 'PAID') {
      alert('Reward can only be claimed once customer action is verified.');
      return;
    }

    const vaultSecret = getVaultSecret(agreement.code);
    if (!vaultSecret) {
      setErrorDetail({
        title: 'Vault Key Missing',
        status: 400,
        detail: 'Vault key not found in this browser. Create a new offer.',
      });
      return;
    }

    setClaiming(true);
    setClaimProgress('Submitting Claim transaction to Stellar Testnet...');
    setErrorDetail(null);

    try {
      setClaimProgress('1/2: Signing payout transaction from Escrow Vault to Referrer...');
      const res = await claimRewardOnChain(agreement, vaultSecret);

      setClaimProgress('2/2: Confirmed on Stellar testnet ledger!');
      const updated = updateAgreementState(agreement.code, 'CLAIMED', {
        claimTxHash: res.claimTxHash,
      });

      if (updated) {
        setAgreement({ ...updated });
      }

      // Open new transaction hash on Stellar Expert
      try {
        window.open(getStellarExpertTxUrl(res.claimTxHash), '_blank');
      } catch {
        // Pop-up blocker fallback (link remains clickable in the UI banner)
      }

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    } catch (err: any) {
      console.error('Claim transaction error:', err);
      const parsed = parseHorizonError(err);
      setErrorDetail(parsed);
    } finally {
      setClaiming(false);
      setClaimProgress('');
    }
  };

  const isExpired = agreement ? Date.now() > agreement.deadline : false;

  if (!agreement) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="empty-state-icon">
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Referral Agreement Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            There are no active referral agreements locked yet, or the referral link code <code style={{ color: 'var(--accent-lime)' }}>{currentCode || 'empty'}</code> does not exist in local storage.
          </p>

          <button
            id="go-to-business-lock-btn"
            className="btn btn-primary btn-sm"
            onClick={onNavigateToBusiness}
          >
            <Lock size={14} />
            Go to Programs to Create One
          </button>
        </div>
      </div>
    );
  }

  const targetWebsiteUrl = agreement.targetUrl || agreement.businessWebsite || 'https://saasify.cloud/pricing';
  const customerRedirectUrl = `${targetWebsiteUrl}${targetWebsiteUrl.includes('?') ? '&' : '?'}ref=${agreement.code}`;
  const remainingBudget = parseFloat(agreement.remainingBudget !== undefined ? agreement.remainingBudget : (agreement.state === 'PAID' || agreement.state === 'CLAIMED' ? '0' : agreement.amount));
  const totalBudget = parseFloat(agreement.totalBudget || agreement.amount);

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Switcher if multiple agreements exist */}
      {allAgreements.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-badge badge-active" style={{ fontSize: '11px' }}>
              Public Referral Portal
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Non-custodial escrow payouts on Stellar Testnet
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Switch campaign:</span>
            <select
              value={agreement.code}
              onChange={(e) => onCodeChange(e.target.value)}
              className="form-select font-mono"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            >
              {allAgreements.map((a) => (
                <option key={a.code} value={a.code}>
                  #{a.code}, {a.customerLabel} ({a.amount} {a.assetCode} [{a.state}])
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* DIRECT BUSINESS WEBSITE REDIRECTION CARD */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, var(--surface-card) 0%, var(--surface-subtle) 100%)',
          border: '1px solid var(--accent-lime-border)',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Globe size={16} color="var(--accent-lime)" />
              <span style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-lime)', fontWeight: 700 }}>
                Target Business Website Destination
              </span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Customer Link Redirection: {agreement.businessName || 'Protocol Partner'}
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              When potential customers click this referral link, they are redirected directly to the business offering with your referral tag attached:
            </p>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--accent-blue)',
                marginTop: '8px',
                padding: '6px 10px',
                background: 'var(--surface-input)',
                borderRadius: 'var(--radius-xs)',
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-all',
              }}
            >
              {customerRedirectUrl}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
            <button
              id="visit-business-btn"
              type="button"
              className="btn btn-primary"
              onClick={handleVisitBusinessWebsite}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ArrowUpRight size={16} />
              Visit Business Website
            </button>
            <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              {agreement.clicksCount || 0} visits recorded so far
            </div>
          </div>
        </div>
      </div>

      {/* Recipient Wallet Context Strip */}
      <div
        className="card-subtle"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={16} color="var(--accent-lime)" />
          {connectedWallet ? (
            connectedWallet.publicKey === agreement.referrerAddress ? (
              <span style={{ fontSize: '12.5px', color: 'var(--semantic-green)', fontWeight: 600 }}>
                ✓ Connected with designated Referrer Wallet ({connectedWallet.publicKey.slice(0, 4)}...{connectedWallet.publicKey.slice(-4)})
              </span>
            ) : (
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Connected as: <strong style={{ color: 'var(--text-primary)' }}>{connectedWallet.publicKey.slice(0, 4)}...{connectedWallet.publicKey.slice(-4)}</strong> (Escrow destination: {agreement.referrerAddress.slice(0, 4)}...{agreement.referrerAddress.slice(-4)})
              </span>
            )
          ) : (
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Non-custodial escrow: Payout is anchored to <strong>{agreement.referrerAddress.slice(0, 6)}...{agreement.referrerAddress.slice(-6)}</strong>.
            </span>
          )}
        </div>

        {onOpenWalletModal && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenWalletModal}
            style={{ fontSize: '11.5px', padding: '3px 8px' }}
          >
            {connectedWallet ? 'Switch Signer' : 'Connect Signer'}
          </button>
        )}
      </div>

      {/* Primary Reward Agreement Card */}
      <div className="card card-glow" style={{ marginBottom: '24px' }}>
        {/* Registered Company Branding Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingBottom: '16px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-lime-subtle)',
                border: '1px solid var(--accent-lime-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-lime)',
                fontWeight: 800,
                fontSize: '18px',
              }}
            >
              {agreement.businessName ? agreement.businessName.charAt(0).toUpperCase() : 'B'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {agreement.businessName || 'SaaSify Cloud Infrastructure'}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-lime-subtle)',
                    color: 'var(--accent-lime)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <ShieldCheck size={11} /> Verified Business Escrow
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {agreement.businessCategory || 'B2B SaaS / Cloud'}
                {agreement.businessWebsite && (
                  <>
                    {' • '}
                    <a
                      href={customerRedirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      {agreement.businessWebsite.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface-input)', padding: '5px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Referral Portal:</span>
              <span style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                /r/{agreement.code}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/r/${agreement.code}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                title="Copy portal URL"
              >
                {copied ? <Check size={13} color="var(--accent-lime)" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                Bounty per Verified Customer Action
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>
                {agreement.rewardPerConversion || agreement.amount}
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {agreement.assetCode}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px' }}>
              Deal Reference: <strong style={{ color: 'var(--text-primary)' }}>{agreement.customerLabel}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span className={`status-badge badge-${agreement.state.toLowerCase()}`} style={{ fontSize: '12px', padding: '5px 10px' }}>
              State: {agreement.state}
            </span>
            <span style={{ fontSize: '12px', color: isExpired ? 'var(--semantic-red)' : 'var(--text-tertiary)' }}>
              {isExpired ? '⚠️ Deadline Passed' : `Expiry: ${new Date(agreement.deadline).toLocaleString()}`}
            </span>
            <div style={{ fontSize: '11.5px', color: 'var(--semantic-green)', fontFamily: 'var(--font-mono)' }}>
              Escrow Backing: {remainingBudget.toFixed(2)} / {totalBudget.toFixed(2)} {agreement.assetCode}
            </div>
          </div>
        </div>

        {/* 4 Protocol Guarantees */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          <div className="card-subtle" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-lime)', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
              <Lock size={13} /> 1. Money in Vault
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
              The reward is deposited into an isolated Stellar vault account.
            </p>
          </div>

          <div className="card-subtle" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
              <ShieldCheck size={13} /> 2. Results, Not Clicks
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
              Rewards trigger when customer visits and completes payment.
            </p>
          </div>

          <div className="card-subtle" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--semantic-green)', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
              <Sparkles size={13} /> 3. Instant Claim
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
              When verified, claim unlocks on-chain for the referrer.
            </p>
          </div>

          <div className="card-subtle" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--semantic-amber)', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
              <Clock size={13} /> 4. Safe Deadline
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
              If no sale happens by the deadline, deposit is refunded.
            </p>
          </div>
        </div>

        {/* Lock Transaction Evidence */}
        {agreement.lockTxHash && (() => {
          const explorerUrl = getStellarExpertTxUrl(agreement.lockTxHash);
          return (
            <div className="trace-evidence" style={{ marginBottom: '20px' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>On-Chain Lock Tx:</span>
              {explorerUrl ? (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                  <span>{agreement.lockTxHash}</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Demo fixture, no on-chain transaction</span>
              )}
            </div>
          );
        })()}

        {/* AUTHENTICATED CUSTOMER ACTION / CONVERSION VERIFICATION SIMULATOR */}
        <div
          id="demo-payment-simulator-box"
          className="card-subtle"
          style={{
            padding: '16px',
            border: '1px solid var(--accent-blue-border)',
            background: 'var(--accent-blue-subtle)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>
            <Zap size={15} />
            Demo Button: Mark Customer Paid
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Simulate the customer checkout. Clicking below marks the deal paid so you can click Claim to receive your escrow reward.
          </p>

          <form onSubmit={handleAuthenticateConversion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Customer Order / Invoice ID
              </label>
              <input
                type="text"
                required
                value={testOrderId}
                onChange={(e) => setTestOrderId(e.target.value)}
                className="form-input font-mono"
                style={{ fontSize: '12px' }}
                placeholder="e.g. ORD-9481-USDC"
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Customer Reference (Optional)
              </label>
              <input
                type="text"
                value={testCustomerName}
                onChange={(e) => setTestCustomerName(e.target.value)}
                className="form-input"
                style={{ fontSize: '12px' }}
                placeholder={agreement.customerLabel}
              />
            </div>

            <button
              id="mark-paid-btn"
              type="submit"
              className="btn btn-primary"
              disabled={verifying}
              style={{ padding: '8px 14px', fontSize: '12.5px' }}
            >
              <ShieldCheck size={14} />
              Mark Customer Paid
            </button>
          </form>

          {verificationFeedback && (
            <div
              className={`alert-box ${verificationFeedback.success ? 'alert-info' : 'alert-error'}`}
              style={{ marginTop: '12px' }}
            >
              {verificationFeedback.success ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
              <div>
                {verificationFeedback.fraudAlert && (
                  <div style={{ fontWeight: 700, color: 'var(--semantic-red)', marginBottom: '2px' }}>
                    🛡️ {verificationFeedback.fraudAlert}
                  </div>
                )}
                <div style={{ fontSize: '12px' }}>{verificationFeedback.msg}</div>
              </div>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {errorDetail && (
          <div className="alert-box alert-error" id="claim-error-banner" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <div style={{ flex: 1 }}>
              <strong>{errorDetail.title}</strong>
              <p style={{ fontSize: '12px', marginTop: '2px' }}>{errorDetail.detail}</p>
              {errorDetail.codes && errorDetail.codes.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.25)', padding: '5px 8px', borderRadius: '4px' }}>
                  <strong>Horizon Result Codes:</strong> {errorDetail.codes.join(' • ')}
                </div>
              )}
              {errorDetail.detail.includes('Create a new offer') && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={onNavigateToBusiness}
                    style={{ fontSize: '11.5px', padding: '5px 12px' }}
                  >
                    Go to Programs to Create a New Offer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Claim Reward Button / States */}
        <div>
          {agreement.state === 'LOCKED' && (
            <div style={{ textAlign: 'center' }}>
              <button
                id="claim-reward-btn"
                type="button"
                className="btn btn-outline btn-lg"
                disabled
                style={{ width: '100%', opacity: 0.5 }}
              >
                <Lock size={16} />
                Claim Locked (Waiting for Verified Customer Purchase)
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                The claim action unlocks on-chain as soon as an order is verified.
              </p>
            </div>
          )}

          {agreement.state === 'PAID' && (
            <div>
              <div className="alert-box alert-success" style={{ marginBottom: '16px' }}>
                <CheckCircle2 size={18} />
                <div>
                  <strong>Customer Payment Verified!</strong>
                  <p style={{ fontSize: '12.5px', marginTop: '2px' }}>
                    Reward condition is verified. Submit the on-chain payout transaction to transfer funds to your wallet now.
                  </p>
                </div>
              </div>

              <button
                id="claim-reward-btn"
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={claiming}
                onClick={handleClaimReward}
              >
                {claiming ? (
                  <>
                    <Clock className="animate-spin" size={16} />
                    <span>{claimProgress || 'Broadcasting to Stellar Testnet...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Claim {agreement.rewardPerConversion || agreement.amount} {agreement.assetCode} on Stellar Testnet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {agreement.state === 'CLAIMED' && (
            <div className="alert-box alert-success" style={{ textAlign: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
              <div>
                <strong>Reward Successfully Claimed & Settled on Stellar!</strong>
                {agreement.claimTxHash && (
                  <div style={{ marginTop: '4px' }}>
                    <a
                      href={getStellarExpertTxUrl(agreement.claimTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-lime)', textDecoration: 'underline', fontSize: '12px' }}
                    >
                      View Claim Tx on Stellar Expert <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VERIFIED CONVERSIONS AUDIT LOG FOR THIS CAMPAIGN */}
      {agreement.conversions && agreement.conversions.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle2 size={16} color="var(--accent-lime)" />
            <h4 style={{ fontSize: '14px', fontWeight: 700 }}>
              Verified Conversions Audit Log ({agreement.conversions.length})
            </h4>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Label</th>
                  <th>Reward</th>
                  <th>Timestamp</th>
                  <th>Adapter</th>
                </tr>
              </thead>
              <tbody>
                {agreement.conversions.map((conv) => (
                  <tr key={conv.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-lime)' }}>
                      {conv.orderId}
                    </td>
                    <td>{conv.customerLabel}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--semantic-green)', fontWeight: 600 }}>
                      +{conv.rewardAmount} {conv.assetCode}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      {new Date(conv.verifiedAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="status-badge badge-locked" style={{ fontSize: '10px' }}>
                        {conv.verificationMethod === 'hmac_webhook' ? 'HMAC Webhook' : 'Client SDK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Lifecycle Trace */}
      <div style={{ marginTop: '30px' }}>
        <PayoutTrace agreement={agreement} />
      </div>
    </div>
  );
};
