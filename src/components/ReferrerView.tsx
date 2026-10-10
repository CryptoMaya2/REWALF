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

  // Load agreement — memoized so it can safely go in useEffect deps
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

  // Demo action: Mark customer paid
  const handleMarkCustomerPaid = () => {
    if (!agreement) return;
    const updated = updateAgreementState(agreement.code, 'PAID', {
      paidTxHash: `sim_${Date.now().toString(16)}`,
    });
    if (updated) {
      setAgreement({ ...updated });
    }
  };

  // Referrer claim reward on Stellar Testnet
  const handleClaimReward = async () => {
    if (!agreement) return;
    if (agreement.state !== 'PAID') {
      alert('Reward can only be claimed once the customer is marked paid.');
      return;
    }

    setClaiming(true);
    setClaimProgress('Submitting Claim transaction to Stellar Testnet...');
    setErrorDetail(null);

    try {
      setClaimProgress('1/2: Signing payout transaction from Escrow Vault to Referrer...');
      const res = await claimRewardOnChain(agreement);

      setClaimProgress('2/2: Confirmed on Stellar testnet ledger!');
      const updated = updateAgreementState(agreement.code, 'CLAIMED', {
        claimTxHash: res.claimTxHash,
      });

      if (updated) {
        setAgreement({ ...updated });
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

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Switcher if multiple agreements exist */}
      {allAgreements.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Switch referral agreement:</span>
          <select
            value={agreement.code}
            onChange={(e) => onCodeChange(e.target.value)}
            className="form-select font-mono"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
          >
            {allAgreements.map((a) => (
              <option key={a.code} value={a.code}>
                #{a.code} — {a.customerLabel} ({a.amount} {a.assetCode} [{a.state}])
              </option>
            ))}
          </select>
        </div>
      )}

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
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                Stellar Escrow Agreement
              </span>
              <span className="network-badge" style={{ padding: '2px 6px', fontSize: '11px' }}>
                #{agreement.code}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>
                {agreement.amount}
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
              The reward is already deposited and waiting in escrow.
            </p>
          </div>

          <div className="card-subtle" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
              <ShieldCheck size={13} /> 2. Locked For You
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
              The business cannot redirect your reward to anyone else.
            </p>
          </div>

          <div className="card-subtle" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--semantic-green)', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
              <Sparkles size={13} /> 3. Instant Claim
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
              When the customer pays, your reward unlocks immediately.
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
        {agreement.lockTxHash && (
          <div className="trace-evidence" style={{ marginBottom: '20px' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>On-Chain Lock Tx:</span>
            <a
              href={getStellarExpertTxUrl(agreement.lockTxHash)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{agreement.lockTxHash}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Demo Customer Payment Simulator */}
        {agreement.state === 'LOCKED' && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '13.5px' }}>
                  <Zap size={15} />
                  Demo Action: Customer Payment Confirmation Simulator
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  In production, this is triggered via webhook or payment oracle. Click to confirm customer payment receipt.
                </p>
              </div>

              <button
                id="mark-paid-btn"
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleMarkCustomerPaid}
              >
                <Zap size={14} />
                Mark Customer Paid
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorDetail && (
          <div className="alert-box alert-error" id="claim-error-banner" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <div>
              <strong>{errorDetail.title}</strong>
              <p style={{ fontSize: '12px', marginTop: '2px' }}>{errorDetail.detail}</p>
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
                Claim Locked (Waiting for Customer Payment)
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                The claim action unlocks on-chain as soon as the deal payment is confirmed.
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
                    Binary condition is satisfied. You can submit the on-chain payment transaction to transfer the reward now.
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
                    <span>Claim {agreement.amount} {agreement.assetCode} on Stellar Testnet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {agreement.state === 'CLAIMED' && (
            <div
              id="claim-success-card"
              className="card-subtle"
              style={{
                padding: '20px',
                border: '1px solid var(--semantic-green-border)',
                background: 'var(--semantic-green-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--semantic-green)', marginBottom: '8px' }}>
                <CheckCircle2 size={20} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                  Reward Claimed & Settled on Stellar!
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                The reward was transferred from the Escrow Vault directly to your registered destination key:
                <br />
                <code style={{ fontSize: '12px', color: 'var(--accent-lime)' }}>{agreement.referrerAddress}</code>
              </p>

              {agreement.claimTxHash && (
                <div className="trace-evidence">
                  <span style={{ color: 'var(--text-tertiary)' }}>Claim Tx Hash:</span>
                  <a
                    id="claim-tx-link"
                    href={getStellarExpertTxUrl(agreement.claimTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{agreement.claimTxHash}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {agreement.state === 'RECLAIMED' && (
            <div
              id="reclaimed-notice-card"
              className="card-subtle"
              style={{
                padding: '16px',
                border: '1px solid var(--semantic-amber-border)',
                background: 'var(--semantic-amber-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--semantic-amber)', marginBottom: '6px' }}>
                <Clock size={16} />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                  Agreement Expired & Reclaimed by Business
                </h3>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                The deadline passed without customer payment confirmation. The business has reclaimed the escrowed deposit on Stellar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Payout Trace for this agreement */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
          Referral Reward Verification Trace
        </h3>
        <PayoutTrace agreement={agreement} />
      </div>
    </div>
  );
};
