import React, { useState, useMemo, useEffect } from 'react';
import type { Agreement, ConnectedWallet } from '../stellar/types';
import { getStellarExpertAccountUrl } from '../stellar/stellarService';
import {
  Search,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Layers,
} from 'lucide-react';

interface ProgramsViewProps {
  agreements: Agreement[];
  connectedWallet: ConnectedWallet | null;
  onOpenCreateModal: () => void;
  onInspectProgram: (agreement: Agreement) => void;
  onNavigateToReferrer: (code: string) => void;
  onSelectForTrace: (code: string) => void;
  initialFilter?: string;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  agreements,
  connectedWallet: _connectedWallet,
  onOpenCreateModal,
  onInspectProgram,
  onNavigateToReferrer,
  onSelectForTrace,
  initialFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [assetFilter, setAssetFilter] = useState<'all' | 'USDC' | 'XLM'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Sync filter when parent prop changes (navigation e.g. overview → programs?filter=locked)
  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  // Reactive expiry: refresh currentTime every 60 s without user interaction
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredAgreements = useMemo(() => {
    return agreements.filter((a) => {
      // Search filter
      const matchesSearch =
        a.customerLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.referrerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.escrowPublicKey.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Asset filter
      if (assetFilter !== 'all' && a.assetCode !== assetFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'locked') return a.state === 'LOCKED' && a.deadline > currentTime;
      if (statusFilter === 'paid') return a.state === 'PAID';
      if (statusFilter === 'claimed') return a.state === 'CLAIMED';
      if (statusFilter === 'reclaimed') return a.state === 'RECLAIMED';
      if (statusFilter === 'expired') return a.state === 'LOCKED' && a.deadline <= currentTime;

      return true;
    });
  }, [agreements, searchQuery, statusFilter, assetFilter, currentTime]);

  return (
    <div>
      {/* Header bar */}
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
            Referral Agreements
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Track your locked rewards, monitor active referral links, and manage payouts
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onOpenCreateModal}
        >
          <Plus size={15} />
          Create New Agreement
        </button>
      </div>

      {/* Filter and Search Bar */}
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
        {/* Search Input */}
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
            placeholder="Search by deal label, code, referrer key, or vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '13px' }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${agreements.length})` },
            { id: 'locked', label: 'Locked' },
            { id: 'paid', label: 'Claimable' },
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

        {/* Token selector */}
        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value as any)}
          className="form-select font-mono"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
        >
          <option value="all">All Tokens</option>
          <option value="USDC">USDC</option>
          <option value="XLM">XLM</option>
        </select>
      </div>

      {/* Program Table */}
      {filteredAgreements.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Layers size={22} />
            </div>
            <h3>No Programs Match Your Filter</h3>
            <p>Try resetting the search terms or create a new referral program.</p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setAssetFilter('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal & Code</th>
                <th>Escrow Vault</th>
                <th>Referrer Public Key</th>
                <th>Reward Amount</th>
                <th>State</th>
                <th>Timelock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgreements.map((a) => {
                const isExp = a.deadline <= currentTime;
                return (
                  <tr key={a.code}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {a.customerLabel}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-lime)' }}>
                          /r/{a.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`${window.location.origin}/r/${a.code}`, a.code)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                          title="Copy Referrer URL"
                        >
                          {copiedKey === a.code ? <Check size={11} color="var(--accent-lime)" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {a.escrowPublicKey.slice(0, 4)}...{a.escrowPublicKey.slice(-4)}
                        </span>
                        <a
                          href={getStellarExpertAccountUrl(a.escrowPublicKey)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="View Escrow on Stellar Expert"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {a.referrerAddress.slice(0, 4)}...{a.referrerAddress.slice(-4)}
                        </span>
                        <a
                          href={getStellarExpertAccountUrl(a.referrerAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="View Referrer on Stellar Expert"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
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

                    <td style={{ fontSize: '12px', color: isExp ? 'var(--semantic-red)' : 'var(--text-secondary)' }}>
                      {isExp ? (
                        <span style={{ fontWeight: 600 }}>Expired</span>
                      ) : (
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
                          title="Open Slide-over Detail Drawer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => onNavigateToReferrer(a.code)}
                          title="Open Affiliate / Referrer Portal"
                        >
                          Portal
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => onSelectForTrace(a.code)}
                          title="Inspect Cryptographic Lifecycle Trace"
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
  );
};
