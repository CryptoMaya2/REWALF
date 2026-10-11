import React, { useState, useMemo, useEffect } from 'react';
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
import {
  ArrowRightLeft,
  Search,
  ExternalLink,
  FastForward,
  ShieldAlert,
} from 'lucide-react';

interface PayoutsViewProps {
  agreements: Agreement[];
  connectedWallet: ConnectedWallet | null;
  onInspectProgram: (agreement: Agreement) => void;
  onSelectForTrace: (code: string) => void;
  onRefreshWallets: () => void;
  onAgreementsUpdated: () => void;
  initialFilter?: string;
}

export const PayoutsView: React.FC<PayoutsViewProps> = ({
  agreements,
  connectedWallet: _connectedWallet,
  onInspectProgram,
  onSelectForTrace,
  onRefreshWallets,
  onAgreementsUpdated,
  initialFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [reclaimingCode, setReclaimingCode] = useState<string | null>(null);
  const [reclaimProgress, setReclaimProgress] = useState<string>('');
  const [errorDetail, setErrorDetail] = useState<HorizonErrorDetail | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Sync filter when parent prop changes (e.g. overview → payouts with 'expired' filter)
  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  // Reactive expiry: refresh currentTime every 60 s
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleFastForward = (code: string) => {
    fastForwardDeadline(code);
    onAgreementsUpdated();
  };

  const handleReclaim = async (agreement: Agreement) => {
    const vaultSecret = getVaultSecret(agreement.code);
    if (!vaultSecret) {
      setErrorDetail({
        title: 'Vault Key Missing',
        status: 400,
        detail: 'Vault key not found in this browser. Create a new offer.',
      });
      return;
    }

    setReclaimingCode(agreement.code);
    setReclaimProgress('Signing and broadcasting Reclaim transaction on Stellar...');
    setErrorDetail(null);

    try {
      const res = await reclaimRewardOnChain(agreement, vaultSecret);
      updateAgreementState(agreement.code, 'RECLAIMED', {
        reclaimTxHash: res.reclaimTxHash,
      });
      onAgreementsUpdated();
      onRefreshWallets();
    } catch (err: any) {
      console.error('Reclaim error:', err);
      setErrorDetail(parseHorizonError(err));
    } finally {
      setReclaimingCode(null);
      setReclaimProgress('');
    }
  };

  const filteredPayouts = useMemo(() => {
    return agreements.filter((a) => {
      const matchesSearch =
        a.referrerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.customerLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.claimTxHash && a.claimTxHash.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.reclaimTxHash && a.reclaimTxHash.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'locked') return a.state === 'LOCKED' && a.deadline > currentTime;
      if (statusFilter === 'claimable') return a.state === 'PAID';
      if (statusFilter === 'claimed') return a.state === 'CLAIMED';
      if (statusFilter === 'reclaimed') return a.state === 'RECLAIMED';
      if (statusFilter === 'expired') return a.state === 'LOCKED' && a.deadline <= currentTime;

      return true;
    });
  }, [agreements, searchQuery, statusFilter, currentTime]);

  // Aggregate stats
  const totalSettledUsdc = agreements
    .filter((a) => a.state === 'CLAIMED' && a.assetCode === 'USDC')
    .reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);

  const pendingObligations = agreements.filter(
    (a) => a.state === 'LOCKED' || a.state === 'PAID'
  ).length;

  const expiredNeedingReclaim = agreements.filter(
    (a) => a.state === 'LOCKED' && a.deadline <= currentTime
  );

  return (
    <div>
      {/* Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Payout Operations & Settlement
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Audit payout obligations, claimable balances, and on-chain settlements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="network-badge">
            <span className="pulse-dot" />
            Horizon Settlement: Active
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {errorDetail && (
        <div className="alert-box alert-error" id="reclaim-error-banner" style={{ marginBottom: '16px' }}>
          <ShieldAlert size={18} />
          <div style={{ flex: 1 }}>
            <strong>{errorDetail.title} (HTTP {errorDetail.status})</strong>
            <p style={{ marginTop: '2px', fontSize: '12px' }}>{errorDetail.detail}</p>
            {errorDetail.codes && errorDetail.codes.length > 0 && (
              <div style={{ marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.25)', padding: '5px 8px', borderRadius: '4px' }}>
                <strong>Horizon Result Codes:</strong> {errorDetail.codes.join(' • ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div className="card-subtle">
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            Total Settled Volume
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--semantic-green)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {totalSettledUsdc.toFixed(2)} USDC
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Transferred to affiliates</span>
        </div>

        <div className="card-subtle">
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            In-Flight Obligations
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {pendingObligations} Escrows
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Locked or awaiting claim</span>
        </div>

        <div className="card-subtle">
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            Expired / Reclaimable
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: expiredNeedingReclaim.length > 0 ? 'var(--semantic-amber)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {expiredNeedingReclaim.length} Escrows
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Ready for business refund</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }}
          />
          <input
            type="text"
            placeholder="Search by recipient key, deal, or tx hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${agreements.length})` },
            { id: 'locked', label: 'Locked' },
            { id: 'claimable', label: 'Claimable' },
            { id: 'claimed', label: 'Settled' },
            { id: 'reclaimed', label: 'Reclaimed' },
            { id: 'expired', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`preset-btn ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payouts Table */}
      {filteredPayouts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <ArrowRightLeft size={22} />
            </div>
            <h3>No Payout Records Found</h3>
            <p>No payout transactions match your search criteria.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient / Beneficiary</th>
                <th>Program / Deal</th>
                <th>Reward Amount</th>
                <th>Payout Status</th>
                <th>On-Chain Evidence</th>
                <th>Lifecycle Timestamps</th>
                <th>Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((a) => {
                const isExp = a.deadline <= currentTime;
                const relevantHash = a.claimTxHash || a.reclaimTxHash || a.lockTxHash;

                return (
                  <tr key={a.code}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                          {a.referrerAddress.slice(0, 6)}...{a.referrerAddress.slice(-6)}
                        </span>
                        {getStellarExpertAccountUrl(a.referrerAddress) && (
                          <a
                            href={getStellarExpertAccountUrl(a.referrerAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="View on Stellar Expert"
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {a.customerLabel}
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        #{a.code}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px' }}>
                        {a.amount}
                      </span>{' '}
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {a.assetCode}
                      </span>
                    </td>

                    <td>
                      <span className={`status-badge badge-${a.state.toLowerCase()}`}>
                        {a.state}
                      </span>
                    </td>

                    <td>
                      {relevantHash ? (() => {
                          const txUrl = getStellarExpertTxUrl(relevantHash);
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: txUrl ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}>
                                {txUrl ? `${relevantHash.slice(0, 8)}...${relevantHash.slice(-6)}` : 'Demo'}
                              </span>
                              {txUrl && (
                                <a
                                  href={txUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--accent-blue)' }}
                                  title="Verify on Stellar Expert"
                                >
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          );
                        })() : (
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Pending</span>
                      )}
                    </td>

                    <td style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      <div>Created: {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      {a.claimedAt && (
                        <div style={{ color: 'var(--semantic-green)' }}>
                          Settled: {new Date(a.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {a.reclaimedAt && (
                        <div style={{ color: 'var(--semantic-amber)' }}>
                          Reclaimed: {new Date(a.reclaimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => onInspectProgram(a)}
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => onSelectForTrace(a.code)}
                        >
                          Trace
                        </button>

                        {/* Reclaim trigger if expired and locked */}
                        {a.state === 'LOCKED' && isExp && (
                          <button
                            id="reclaim-reward-btn"
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--semantic-amber)', borderColor: 'var(--semantic-amber)', color: '#000' }}
                            onClick={() => handleReclaim(a)}
                            disabled={reclaimingCode === a.code}
                            title="Reclaim locked deposit back to business"
                          >
                            {reclaimingCode === a.code ? (reclaimProgress ? 'Broadcasting...' : 'Reclaiming...') : 'Reclaim'}
                          </button>
                        )}

                        {/* Fast forward helper for active locked agreement */}
                        {a.state === 'LOCKED' && !isExp && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 6px', fontSize: '10px' }}
                            onClick={() => handleFastForward(a.code)}
                            title="Fast-forward deadline (demo tool)"
                          >
                            <FastForward size={11} color="var(--semantic-amber)" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
