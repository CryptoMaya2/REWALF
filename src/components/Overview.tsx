import React, { useState, useEffect } from 'react';
import type { Agreement, ConnectedWallet, Protocol } from '../stellar/types';
import {
  Building2,
  Layers,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  ExternalLink,
} from 'lucide-react';

interface OverviewProps {
  protocols: Protocol[];
  agreements: Agreement[];
  connectedWallet: ConnectedWallet | null;
  onOpenRegisterProtocol?: () => void;
  onSelectProtocol: (protocol: Protocol) => void;
  onOpenCreateCampaign: () => void;
  onOpenWalletModal: () => void;
  onNavigateTab: (tab: any, filter?: string) => void;
  onInspectCampaign: (agreement: Agreement) => void;
  onNavigateToReferrer: (code: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  protocols,
  agreements,
  connectedWallet,
  onOpenRegisterProtocol: _onOpenRegisterProtocol,
  onSelectProtocol,
  onOpenCreateCampaign,
  onOpenWalletModal: _onOpenWalletModal,
  onNavigateTab,
  onInspectCampaign,
  onNavigateToReferrer,
}) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Refresh clock every minute for expiry checks
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Summary Metrics strictly derived from real data
  const totalProtocols = protocols.length;
  const activeProtocols = protocols.filter((p) => p.status === 'active').length;

  const totalAgreements = agreements.length;
  const lockedAgreements = agreements.filter((a) => a.state === 'LOCKED');
  const activeCampaigns = lockedAgreements.filter((a) => a.deadline > currentTime);
  const claimableAgreements = agreements.filter((a) => a.state === 'PAID');
  const settledAgreements = agreements.filter((a) => a.state === 'CLAIMED');
  const expiredNeedingAction = lockedAgreements.filter((a) => a.deadline <= currentTime);

  // Financial sums
  const totalLockedUsdc = agreements
    .filter((a) => a.assetCode === 'USDC')
    .reduce(
      (acc, curr) =>
        acc +
        parseFloat(
          curr.remainingBudget !== undefined
            ? curr.remainingBudget
            : curr.state === 'PAID' || curr.state === 'CLAIMED'
            ? '0'
            : curr.amount || '0'
        ),
      0
    );

  const totalSettledUsdc = agreements
    .filter((a) => a.assetCode === 'USDC')
    .reduce(
      (acc, curr) =>
        acc +
        parseFloat(
          curr.claimedAmount !== undefined
            ? curr.claimedAmount
            : curr.state === 'CLAIMED'
            ? curr.amount || '0'
            : '0'
        ),
      0
    );

  const totalConversions = agreements.reduce(
    (acc, curr) => acc + (curr.conversionsCount || (curr.conversions?.length || 0)),
    0
  );

  const recentAgreements = [...agreements]
    .sort((a, b) => (b.claimedAt || b.paidAt || b.createdAt) - (a.claimedAt || a.paidAt || a.createdAt))
    .slice(0, 6);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Command Strip */}
      <div
        className="card"
        style={{
          padding: '24px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="network-badge">
                <span className="pulse-dot" />
                Stellar Testnet Protocol
              </span>
              {connectedWallet && (
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Signer: {connectedWallet.publicKey.slice(0, 4)}...{connectedWallet.publicKey.slice(-4)}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Business & Protocol Dashboard
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Manage registered web3 products, launch escrow-anchored referral campaigns, and audit settlements
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              id="dashboard-create-campaign-btn"
              type="button"
              className="btn btn-primary"
              onClick={onOpenCreateCampaign}
              style={{ fontWeight: 700, padding: '10px 18px', boxShadow: '0 0 20px rgba(184, 243, 107, 0.25)' }}
            >
              <Plus size={16} /> Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* 2. Operational Attention Banners */}
      {expiredNeedingAction.length > 0 && (
        <div className="alert-box alert-warning">
          <AlertTriangle size={18} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>{expiredNeedingAction.length} Campaign(s) Reached Expiry Deadline</strong>
              <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                These referral rewards were not claimed before deadline and can now be safely reclaimed back to the business wallet.
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
              onClick={() => onNavigateTab('campaigns', 'paid')}
            >
              Inspect Claimable <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Summary Metric Cards */}
      <div className="kpi-grid">
        {/* Metric 1: Registered Protocols */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('protocols')}
          title="View all registered protocols"
        >
          <div className="kpi-header">
            <span>Registered Protocols</span>
            <Building2 size={16} color="var(--accent-lime)" />
          </div>
          <div className="kpi-value">{totalProtocols}</div>
          <div className="kpi-subtext">
            {activeProtocols} active • {totalProtocols - activeProtocols} pending integration
          </div>
        </div>

        {/* Metric 2: Active Campaigns */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('campaigns', 'locked')}
          title="View active referral campaigns"
        >
          <div className="kpi-header">
            <span>Active Campaigns</span>
            <Layers size={16} color="var(--accent-blue)" />
          </div>
          <div className="kpi-value">{activeCampaigns.length}</div>
          <div className="kpi-subtext">
            ${totalLockedUsdc.toFixed(2)} USDC locked in escrow
          </div>
        </div>

        {/* Metric 3: Tracked Referral Links */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('links')}
          title="View all referral links"
        >
          <div className="kpi-header">
            <span>Tracked Referral Links</span>
            <LinkIcon size={16} color="var(--semantic-amber)" />
          </div>
          <div className="kpi-value">{totalAgreements}</div>
          <div className="kpi-subtext">
            {totalConversions} verified customer sales
          </div>
        </div>

        {/* Metric 4: Settled Payouts */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('payouts', 'claimed')}
          title="View settled payouts"
        >
          <div className="kpi-header">
            <span>Settled Payouts</span>
            <CheckCircle2 size={16} color="var(--semantic-green)" />
          </div>
          <div className="kpi-value">${totalSettledUsdc.toFixed(2)}</div>
          <div className="kpi-subtext">
            {settledAgreements.length} claims settled on Stellar
          </div>
        </div>
      </div>

      {/* 4. Registered Protocols Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Registered Protocols & Products
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Websites configured with Rewalf referral integrations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onNavigateTab('protocols')}
            >
              View All ({protocols.length})
            </button>
          </div>
        </div>

        {protocols.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 20px' }}>
            <Building2 size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
            <h4>No Protocols Registered Yet</h4>
            <p>Use "Register business" in the top bar to begin configuring referral attribution.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px' }}>
            {protocols.slice(0, 3).map((p) => {
              const protoAgreements = agreements.filter(
                (a) => a.protocolId === p.id || a.businessId === p.id || a.businessName === p.name
              );
              return (
                <div
                  key={p.id}
                  className="card-subtle"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onClick={() => onSelectProtocol(p)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--accent-lime-subtle)',
                            color: 'var(--accent-lime)',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {p.name}
                          </span>
                        </div>
                      </div>

                      {p.status === 'active' ? (
                        <span className="badge badge-settled" style={{ fontSize: '10px' }}>
                          Active
                        </span>
                      ) : (
                        <span className="badge badge-locked" style={{ fontSize: '10px' }}>
                          Pending
                        </span>
                      )}
                    </div>

                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '12px',
                        color: 'var(--accent-lime)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        marginBottom: '8px',
                      }}
                    >
                      {p.website} <ExternalLink size={10} />
                    </a>

                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '12px',
                      }}
                    >
                      {p.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <span>{protoAgreements.length} Campaigns</span>
                    <span style={{ color: 'var(--accent-lime)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      Manage <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Recent Campaign Activity Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Referral Campaign Activity
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Real-time Stellar escrow vault states
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onNavigateTab('campaigns')}
          >
            View All Campaigns ({agreements.length})
          </button>
        </div>

        {recentAgreements.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 20px' }}>
            <Layers size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
            <h4>No Referral Campaigns Created</h4>
            <p>Lock your first reward into an Escrow Vault on Stellar to generate referral links.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenCreateCampaign}
              style={{ marginTop: '8px' }}
            >
              <Plus size={13} /> Create Campaign
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Deal & Reference</th>
                  <th>Referral Link</th>
                  <th>Bounty Amount</th>
                  <th>Escrow State</th>
                  <th>Timelock</th>
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
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {a.businessName || 'SaaSify Cloud'}
                        </span>
                      </td>

                      <td>
                        <a
                          href={`/r/${a.code}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigateToReferrer(a.code);
                          }}
                          style={{
                            color: 'var(--accent-lime)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            textDecoration: 'none',
                            borderBottom: '1px dashed var(--accent-lime)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title="Open referral link portal"
                        >
                          /r/{a.code} <ExternalLink size={10} />
                        </a>
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
                        {isExp ? (
                          'Expired'
                        ) : (
                          new Date(a.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => onInspectCampaign(a)}
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => onNavigateToReferrer(a.code)}
                          >
                            Portal
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
    </div>
  );
};
