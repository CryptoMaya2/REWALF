import React, { useState, useEffect } from 'react';
import type { Agreement, ConnectedWallet, HorizonErrorDetail } from '../stellar/types';
import {
  reclaimRewardOnChain,
  getStellarExpertTxUrl,
  parseHorizonError,
} from '../stellar/stellarService';
import {
  loadAgreements,
  updateAgreementState,
  fastForwardDeadline,
} from '../store/agreementStore';
import {
  ArrowRightLeft,
  Clock,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FastForward,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface BusinessReclaimProps {
  connectedWallet?: ConnectedWallet | null;
  onNavigateToReferrer: (code: string) => void;
  onRefreshWallets: () => void;
}

export const BusinessReclaim: React.FC<BusinessReclaimProps> = ({
  connectedWallet: _connectedWallet,
  onNavigateToReferrer,
  onRefreshWallets,
}) => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [reclaimingCode, setReclaimingCode] = useState<string | null>(null);
  const [reclaimProgress, setReclaimProgress] = useState<string>('');
  const [errorDetail, setErrorDetail] = useState<HorizonErrorDetail | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Reload agreements
  const reload = () => {
    setAgreements(loadAgreements());
  };

  useEffect(() => {
    reload();
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    window.addEventListener('rewalf_agreements_updated', reload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('rewalf_agreements_updated', reload);
    };
  }, []);

  const handleFastForward = (code: string) => {
    fastForwardDeadline(code);
    reload();
  };

  const handleReclaim = async (agreement: Agreement) => {
    setReclaimingCode(agreement.code);
    setReclaimProgress('Submitting Reclaim transaction to Stellar Testnet...');
    setErrorDetail(null);

    try {
      setReclaimProgress('1/2: Signing return transaction from Escrow Vault to Business...');
      const res = await reclaimRewardOnChain(agreement);

      setReclaimProgress('2/2: Confirmed on Stellar testnet ledger!');
      updateAgreementState(agreement.code, 'RECLAIMED', {
        reclaimTxHash: res.reclaimTxHash,
      });

      reload();
      onRefreshWallets();
    } catch (err: any) {
      console.error('Reclaim error:', err);
      const parsed = parseHorizonError(err);
      setErrorDetail(parsed);
    } finally {
      setReclaimingCode(null);
      setReclaimProgress('');
    }
  };

  // Format time remaining
  const getTimeRemaining = (deadline: number) => {
    const diff = deadline - currentTime;
    if (diff <= 0) return { expired: true, text: 'Expired' };
    const mins = Math.floor(diff / (1000 * 60));
    const secs = Math.floor((diff / 1000) % 60);
    return { expired: false, text: `${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining` };
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Header Info */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--stellar-amber)',
            }}
          >
            <ArrowRightLeft size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              Step 3: Business Escrow Reclaim
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: 1.5 }}>
              Because Soroban and Stellar smart contracts cannot trigger themselves on a timer, a person must submit the reclaim transaction.
              Reclaim is <strong>only authorized after the agreed deadline passes without customer payment</strong>.
              Funds are safely refunded from the Escrow Vault back to the business wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorDetail && (
        <div className="alert-box alert-error" id="reclaim-error-banner" style={{ marginBottom: '24px' }}>
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
          </div>
        </div>
      )}

      {/* Agreements List */}
      {agreements.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            No agreements have been created yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {agreements.map((agreement) => {
            const timeInfo = getTimeRemaining(agreement.deadline);
            const canReclaim =
              timeInfo.expired &&
              agreement.state !== 'PAID' &&
              agreement.state !== 'CLAIMED' &&
              agreement.state !== 'RECLAIMED';

            const isReclaiming = reclaimingCode === agreement.code;

            return (
              <div key={agreement.code} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                        {agreement.amount} {agreement.assetCode}
                      </span>
                      <code style={{ fontSize: '12px', color: 'var(--stellar-cyan)' }}>
                        #{agreement.code}
                      </code>
                    </div>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                      Customer: <strong>{agreement.customerLabel}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`state-badge state-${agreement.state.toLowerCase()}`}>
                      {agreement.state}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onNavigateToReferrer(agreement.code)}
                      title="Open Referrer View"
                    >
                      View Link <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Details Bar */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Referrer Address:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      {agreement.referrerAddress.slice(0, 8)}...{agreement.referrerAddress.slice(-8)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Escrow Vault:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      {agreement.escrowPublicKey.slice(0, 8)}...{agreement.escrowPublicKey.slice(-8)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Deadline:</span>
                    <span style={{ color: timeInfo.expired ? '#f43f5e' : 'var(--stellar-amber)', fontWeight: 600 }}>
                      {new Date(agreement.deadline).toLocaleString()} ({timeInfo.text})
                    </span>
                  </div>
                </div>

                {/* Hashes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Lock Tx:</span>
                    {(() => {
                      const url = getStellarExpertTxUrl(agreement.lockTxHash);
                      return url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--stellar-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {agreement.lockTxHash.slice(0, 16)}...<ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Demo fixture — no on-chain tx</span>
                      );
                    })()}
                  </div>

                  {agreement.claimTxHash && (
                    <div style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Claim Tx:</span>
                      {(() => {
                        const url = getStellarExpertTxUrl(agreement.claimTxHash!);
                        return url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#34d399', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {agreement.claimTxHash!.slice(0, 16)}...<ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Demo fixture — no on-chain tx</span>
                        );
                      })()}
                    </div>
                  )}

                  {agreement.reclaimTxHash && (
                    <div style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Reclaim Tx:</span>
                      {(() => {
                        const url = getStellarExpertTxUrl(agreement.reclaimTxHash!);
                        return url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {agreement.reclaimTxHash!.slice(0, 16)}...<ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Demo fixture — no on-chain tx</span>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Reclaim Action Section */}
                <div>
                  {agreement.state === 'RECLAIMED' && (
                    <div className="alert-box alert-info" style={{ margin: 0 }}>
                      <CheckCircle2 size={16} />
                      <span>Already reclaimed by business on Stellar testnet. Funds safely returned.</span>
                    </div>
                  )}

                  {agreement.state === 'CLAIMED' && (
                    <div className="alert-box alert-success" style={{ margin: 0 }}>
                      <CheckCircle2 size={16} />
                      <span>Reward claimed by referrer. Cannot be reclaimed.</span>
                    </div>
                  )}

                  {agreement.state === 'PAID' && (
                    <div className="alert-box alert-info" style={{ margin: 0 }}>
                      <Lock size={16} />
                      <span>Customer is paid! Reward is reserved for referrer to claim.</span>
                    </div>
                  )}

                  {agreement.state === 'LOCKED' && !timeInfo.expired && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled
                        style={{ opacity: 0.6 }}
                      >
                        <Clock size={15} />
                        Reclaim Locked until Deadline ({timeInfo.text})
                      </button>

                      <button
                        id="fast-forward-deadline-btn"
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleFastForward(agreement.code)}
                        title="Simulate time passage by setting deadline to 10 seconds ago"
                      >
                        <FastForward size={14} color="var(--stellar-cyan)" />
                        Fast-forward Deadline (Demo)
                      </button>
                    </div>
                  )}

                  {canReclaim && (
                    <div>
                      <div className="alert-box alert-warning" style={{ marginBottom: '12px' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Deadline has passed without payment.</strong>
                          <p style={{ fontSize: '13px' }}>
                            You can now execute the on-chain reclaim transaction to return the locked deposit to your business wallet.
                          </p>
                        </div>
                      </div>

                      <button
                        id="reclaim-reward-btn"
                        type="button"
                        className="btn btn-warning"
                        disabled={isReclaiming}
                        onClick={() => handleReclaim(agreement)}
                        style={{ width: '100%' }}
                      >
                        {isReclaiming ? (
                          <>
                            <Clock className="animate-spin" size={16} />
                            <span>{reclaimProgress || 'Broadcasting Reclaim to Stellar...'}</span>
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft size={16} />
                            <span>Reclaim {agreement.amount} {agreement.assetCode} on Stellar Testnet</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
