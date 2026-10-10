import React, { useState, useEffect } from 'react';
import type { Agreement, ConnectedWallet } from '../stellar/types';
import {
  Layers,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Plus,
  Wallet,
  Zap,
} from 'lucide-react';

interface OverviewProps {
  agreements: Agreement[];
  connectedWallet: ConnectedWallet | null;
  onOpenCreateModal: () => void;
  onOpenWalletModal: () => void;
  onNavigateTab: (tab: 'overview' | 'programs' | 'referrals' | 'payouts' | 'trace' | 'settings', filter?: string) => void;
  onSelectAgreementForTrace: (code: string) => void;
  onInspectProgram: (agreement: Agreement) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  agreements,
  connectedWallet,
  onOpenCreateModal,
  onOpenWalletModal,
  onNavigateTab,
  onSelectAgreementForTrace,
  onInspectProgram,
}) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Reactive expiry: refresh every 60 s
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Accurate calculated metrics strictly derived from loaded agreements
  const totalAgreements = agreements.length;
  const lockedAgreements = agreements.filter((a) => a.state === 'LOCKED');
  const activeUnexpired = lockedAgreements.filter((a) => a.deadline > currentTime);
  const claimableAgreements = agreements.filter((a) => a.state === 'PAID');
  const completedAgreements = agreements.filter((a) => a.state === 'CLAIMED');
  const expiredNeedingAction = lockedAgreements.filter((a) => a.deadline <= currentTime);

  // Financial sums
  const totalEscrowUsdc = agreements
    .filter((a) => a.assetCode === 'USDC')
    .reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);

  const totalEscrowXlm = agreements
    .filter((a) => a.assetCode === 'XLM')
    .reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);

  const settledUsdc = completedAgreements
    .filter((a) => a.assetCode === 'USDC')
    .reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);

  // Recent on-chain activity: sorted by most recently modified
  const recentAgreements = [...agreements]
    .sort((a, b) => (b.claimedAt || b.paidAt || b.createdAt) - (a.claimedAt || a.paidAt || a.createdAt))
    .slice(0, 5);

  return (
    <div>
      {/* Top Banner / Hero Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Protocol Operations
            </span>
            <span className="network-badge">
              <span className="pulse-dot" />
              Stellar Testnet
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', letterSpacing: '-0.3px' }}>
            Protocol Command Centre
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenWalletModal}
          >
            <Wallet size={14} />
            {connectedWallet ? `${connectedWallet.label || connectedWallet.walletType}` : 'Signer Settings'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenCreateModal}
          >
            <Plus size={15} />
            Lock New Escrow Vault
          </button>
        </div>
      </div>

      {/* Operational Attention Alerts */}
      {expiredNeedingAction.length > 0 && (
        <div className="alert-box alert-warning">
          <AlertTriangle size={18} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>{expiredNeedingAction.length} Escrow Agreement(s) Reached Expiry Deadline</strong>
              <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                These rewards were not triggered by customer payment before deadline and can now be safely reclaimed back to the business wallet.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('payouts', 'expired')}
            >
              Reclaim Escrows <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {claimableAgreements.length > 0 && (
        <div className="alert-box alert-info">
          <CheckCircle2 size={18} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>{claimableAgreements.length} Reward(s) Verified & Awaiting Referrer Claim</strong>
              <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                Customer payment conditions are satisfied. Referrers can claim payouts directly from their Stellar vault links.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('programs', 'paid')}
            >
              Inspect Claimable <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="kpi-grid">
        {/* KPI 1: Active Programs */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('programs', 'locked')}
        >
          <div className="kpi-header">
            <span>Active Escrow Vaults</span>
            <Layers size={15} />
          </div>
          <div className="kpi-value">
            {activeUnexpired.length}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)' }}>
              / {totalAgreements} total
            </span>
          </div>
          <div className="kpi-subtext">
            <span>Non-divertible locks on Stellar</span>
          </div>
        </div>

        {/* KPI 2: Total Escrow Volume */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Escrow Volume</span>
            <ShieldCheck size={15} />
          </div>
          <div className="kpi-value">
            {totalEscrowUsdc.toFixed(0)} <span style={{ fontSize: '13px', color: 'var(--accent-lime)' }}>USDC</span>
          </div>
          <div className="kpi-subtext">
            <span>+{totalEscrowXlm.toFixed(0)} XLM native locked</span>
          </div>
        </div>

        {/* KPI 3: Awaiting Payout / Claimable */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('payouts', 'paid')}
        >
          <div className="kpi-header">
            <span>Claimable by Referrers</span>
            <Clock size={15} />
          </div>
          <div className="kpi-value" style={{ color: claimableAgreements.length > 0 ? 'var(--accent-blue)' : 'inherit' }}>
            {claimableAgreements.length}
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>programs</span>
          </div>
          <div className="kpi-subtext">
            <span>Customer payment satisfied</span>
          </div>
        </div>

        {/* KPI 4: Settled Payouts */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('payouts', 'claimed')}
        >
          <div className="kpi-header">
            <span>Settled Payouts</span>
            <CheckCircle2 size={15} />
          </div>
          <div className="kpi-value" style={{ color: 'var(--semantic-green)' }}>
            {completedAgreements.length}
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              ({settledUsdc.toFixed(0)} USDC)
            </span>
          </div>
          <div className="kpi-subtext">
            <span>Transferred to referrer wallets</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Operational Programs & Protocol Activity */}
      <div className="overview-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(300px, 1fr)', gap: '20px' }}>
        {/* Left Column: Priority Programs Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Referral Escrow Programs
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Programs anchored on Stellar Horizon testnet
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onNavigateTab('programs')}
            >
              View All ({totalAgreements}) <ArrowRight size={13} />
            </button>
          </div>

          {agreements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Layers size={22} />
              </div>
              <h3>No Referral Programs Active</h3>
              <p>Create and lock your first referral reward escrow vault on Stellar Testnet.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={onOpenCreateModal}>
                <Plus size={14} /> Create Program
              </button>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Deal</th>
                    <th>Reward</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAgreements.map((a) => {
                    const isExp = a.deadline <= currentTime;
                    return (
                      <tr key={a.code}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.customerLabel}</div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            #{a.code}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {a.amount} <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{a.assetCode}</span>
                        </td>
                        <td>
                          <span className={`status-badge badge-${a.state.toLowerCase()}`}>
                            {a.state}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: isExp ? 'var(--semantic-red)' : 'var(--text-secondary)' }}>
                          {isExp ? 'Expired' : (
                            <span title={new Date(a.deadline).toLocaleString()}>
                              {new Date(a.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                              {new Date(a.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
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
                              onClick={() => {
                                onSelectAgreementForTrace(a.code);
                                onNavigateTab('trace');
                              }}
                            >
                              Trace
                            </button>
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

        {/* Right Column: Trustless Protocol Architecture & Ledger Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Protocol Integrity Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={18} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Protocol Guarantees
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>01</span>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Pre-Funded Escrow Vaults</strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                    Rewards are locked before promises are issued. Businesses cannot default after customer payment.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>02</span>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Non-Divertible Recipient Key</strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                    Referrer address is cryptographically anchored via Stellar ManageData. Payout cannot be re-routed.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>03</span>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Zero Key Custody</strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                    Transactions are signed client-side via Freighter or Albedo. Private keys never touch Rewalf.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Card */}
          <div className="card-subtle" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: '12px' }}>
              Operational Quick Actions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => onNavigateTab('payouts')}
              >
                <ArrowRightLeft size={14} color="var(--accent-blue)" />
                Audit Payout Obligations & Settlements
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => onNavigateTab('trace')}
              >
                <Clock size={14} color="var(--accent-lime)" />
                Open Payout Trace Lifecycle Inspector
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={onOpenWalletModal}
              >
                <Zap size={14} color="var(--semantic-amber)" />
                Request Stellar Friendbot Testnet XLM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
