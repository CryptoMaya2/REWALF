import React, { useState } from 'react';
import type { Agreement, ConnectedWallet, HorizonErrorDetail } from '../stellar/types';
import {
  getStellarExpertTxUrl,
  getStellarExpertAccountUrl,
  reclaimRewardOnChain,
  parseHorizonError,
} from '../stellar/stellarService';
import {
  updateAgreementState,
  fastForwardDeadline,
  getVaultSecret,
} from '../store/agreementStore';
import { PayoutTrace } from './PayoutTrace';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ArrowRightLeft,
  FastForward,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface ProgramDetailDrawerProps {
  agreement: Agreement | null;
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: ConnectedWallet | null;
  onNavigateToReferrer: (code: string) => void;
  onUpdated: () => void;
}

export const ProgramDetailDrawer: React.FC<ProgramDetailDrawerProps> = ({
  agreement,
  isOpen,
  onClose,
  connectedWallet: _connectedWallet,
  onNavigateToReferrer,
  onUpdated,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [reclaiming, setReclaiming] = useState(false);
  const [reclaimStatus, setReclaimStatus] = useState('');
  const [errorDetail, setErrorDetail] = useState<HorizonErrorDetail | null>(null);

  if (!isOpen || !agreement) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isExpired = Date.now() > agreement.deadline;

  const handleFastForward = () => {
    fastForwardDeadline(agreement.code);
    onUpdated();
  };

  const handleReclaim = async () => {
    if (!isExpired) {
      setErrorDetail({ title: 'Not Yet Expired', status: 400, detail: 'Cannot reclaim: the deadline has not passed yet.' });
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

    setReclaiming(true);
    setReclaimStatus('Submitting Reclaim transaction to Stellar Testnet...');
    setErrorDetail(null);

    try {
      const res = await reclaimRewardOnChain(agreement, vaultSecret);
      updateAgreementState(agreement.code, 'RECLAIMED', {
        reclaimTxHash: res.reclaimTxHash,
      });
      onUpdated();
    } catch (err: any) {
      console.error('Reclaim error:', err);
      setErrorDetail(parseHorizonError(err));
    } finally {
      setReclaiming(false);
      setReclaimStatus('');
    }
  };

  const referrerUrl = `${window.location.origin}/r/${agreement.code}`;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`status-badge badge-${agreement.state.toLowerCase()}`}>
                {agreement.state}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                #{agreement.code}
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {agreement.customerLabel}
            </h3>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Target Business Website URL */}
          <div className="card-subtle" style={{ marginBottom: '16px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Destination Business URL
              </span>
              {agreement.targetUrl && (
                <a
                  href={`${agreement.targetUrl}${agreement.targetUrl.includes('?') ? '&' : '?'}ref=${agreement.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                >
                  Test Link <ExternalLink size={10} />
                </a>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-blue)', marginTop: '4px', wordBreak: 'break-all' }}>
              {agreement.targetUrl || agreement.businessWebsite || 'https://saasify.cloud/pricing'}
            </div>
          </div>

          {/* Primary Financial Snapshot */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <div className="card-subtle">
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Reward per Customer
              </span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {agreement.rewardPerConversion || agreement.amount} {agreement.assetCode}
              </div>
            </div>

            <div className="card-subtle">
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Remaining Escrow
              </span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--semantic-green)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {agreement.remainingBudget !== undefined ? agreement.remainingBudget : (agreement.state === 'PAID' ? '0.00' : agreement.amount)} {agreement.assetCode}
              </div>
            </div>

            <div className="card-subtle">
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Total Deposited
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {agreement.totalBudget || agreement.amount} {agreement.assetCode}
              </div>
            </div>

            <div className="card-subtle">
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Verified Customers
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {agreement.conversionsCount || (agreement.conversions?.length || 0)} sales ({agreement.clicksCount || 0} visits)
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorDetail && (
            <div className="alert-box alert-error">
              <ShieldAlert size={18} />
              <div>
                <strong>{errorDetail.title}</strong>
                <p style={{ marginTop: '2px' }}>{errorDetail.detail}</p>
              </div>
            </div>
          )}

          {/* On-Chain Cryptographic Anchors */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '10px' }}>
              On-Chain Identity & Anchors
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Escrow Vault Key */}
              <div className="card-subtle" style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Stellar Escrow Vault Address</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => copyToClipboard(agreement.escrowPublicKey, 'escrow')}
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                    >
                      {copiedKey === 'escrow' ? <Check size={11} color="var(--accent-lime)" /> : <Copy size={11} />}
                    </button>
                    <a
                      href={getStellarExpertAccountUrl(agreement.escrowPublicKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
                  {agreement.escrowPublicKey}
                </div>
              </div>

              {/* Referrer Payout Key */}
              <div className="card-subtle" style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Referrer Destination Public Key</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => copyToClipboard(agreement.referrerAddress, 'referrer')}
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                    >
                      {copiedKey === 'referrer' ? <Check size={11} color="var(--accent-lime)" /> : <Copy size={11} />}
                    </button>
                    <a
                      href={getStellarExpertAccountUrl(agreement.referrerAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
                  {agreement.referrerAddress}
                </div>
              </div>

              {/* Initial Lock Transaction */}
              {agreement.lockTxHash && (() => {
                const explorerUrl = getStellarExpertTxUrl(agreement.lockTxHash);
                return (
                  <div className="card-subtle" style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Vault Creation Tx Hash</span>
                      {explorerUrl ? (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '2px 6px', fontSize: '11px' }}
                        >
                          Explorer <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(248,200,100,0.12)', color: 'var(--semantic-amber)', border: '1px solid rgba(248,200,100,0.2)', fontWeight: 600 }}>
                          Sample data
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: explorerUrl ? 'var(--accent-blue)' : 'var(--text-tertiary)', marginTop: '4px', wordBreak: 'break-all' }}>
                      {explorerUrl ? agreement.lockTxHash : 'No on-chain transaction, demo fixture only'}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '10px' }}>
              Operational Actions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={referrerUrl}
                  className="form-input font-mono"
                  style={{ fontSize: '12px', background: 'var(--surface-input)', cursor: 'pointer' }}
                  onClick={() => {
                    onClose();
                    onNavigateToReferrer(agreement.code);
                  }}
                  title="Click to open referrer portal"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyToClipboard(referrerUrl, 'link')}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {copiedKey === 'link' ? <Check size={13} color="var(--accent-lime)" /> : <Copy size={13} />}
                  Copy Link
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onClose();
                    onNavigateToReferrer(agreement.code);
                  }}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Open Portal <ArrowRight size={13} />
                </button>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                👉 Click link to open:{' '}
                <a
                  href={`/r/${agreement.code}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                    onNavigateToReferrer(agreement.code);
                  }}
                  style={{ color: 'var(--accent-lime)', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {referrerUrl}
                </a>
              </div>

              {/* Fast Forward & Reclaim Controls */}
              {agreement.state === 'LOCKED' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleFastForward}
                    title="Simulate deadline passage for testing"
                  >
                    <FastForward size={13} color="var(--semantic-amber)" />
                    Fast-Forward Deadline (Demo)
                  </button>

                  {isExpired && (
                    <button
                      id="reclaim-reward-btn"
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleReclaim}
                      disabled={reclaiming}
                      style={{ background: 'var(--semantic-amber)', borderColor: 'var(--semantic-amber)', color: '#000' }}
                    >
                      <ArrowRightLeft size={13} />
                      {reclaiming ? reclaimStatus || 'Reclaiming...' : 'Reclaim Deposit to Business'}
                    </button>
                  )}
                </div>
              )}
              {/* Error Detail Banner */}
              {errorDetail && (
                <div className="alert-box alert-error" id="reclaim-drawer-error-banner" style={{ marginTop: '12px' }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <strong>{errorDetail.title} {errorDetail.status ? `(HTTP ${errorDetail.status})` : ''}</strong>
                    <p style={{ fontSize: '12px', marginTop: '2px' }}>{errorDetail.detail}</p>
                    {errorDetail.codes && errorDetail.codes.length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.25)', padding: '5px 8px', borderRadius: '4px' }}>
                        <strong>Horizon Result Codes:</strong> {errorDetail.codes.join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Embedded Payout Trace */}
          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '10px' }}>
              Complete Payout Trace
            </h4>
            <PayoutTrace agreement={agreement} />
          </div>
        </div>
      </div>
    </div>
  );
};
