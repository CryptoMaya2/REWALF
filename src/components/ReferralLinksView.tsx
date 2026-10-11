import React, { useState } from 'react';
import type { Agreement, Protocol } from '../stellar/types';
import {
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  Search,
  Plus,
} from 'lucide-react';

interface ReferralLinksViewProps {
  agreements: Agreement[];
  protocols: Protocol[];
  onOpenCreateCampaign: () => void;
  onNavigateToReferrer: (code: string) => void;
  onInspectCampaign: (agreement: Agreement) => void;
}

export const ReferralLinksView: React.FC<ReferralLinksViewProps> = ({
  agreements,
  protocols,
  onOpenCreateCampaign,
  onNavigateToReferrer,
  onInspectCampaign,
}) => {
  const [search, setSearch] = useState('');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filtered = agreements.filter((a) => {
    const matchesProtocol =
      selectedProtocolId === 'all' ||
      a.protocolId === selectedProtocolId ||
      a.businessId === selectedProtocolId;

    const matchesSearch =
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.customerLabel.toLowerCase().includes(search.toLowerCase()) ||
      a.referrerAddress.toLowerCase().includes(search.toLowerCase());

    return matchesProtocol && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Referral Links Directory
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Manage shareable partner links, anchored reward vaults, and live attribution status
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenCreateCampaign}
          style={{ fontWeight: 700 }}
        >
          <Plus size={15} /> Generate New Link
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '320px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search code, deal label, referrer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ background: 'var(--surface-input)', paddingLeft: '34px', fontSize: '13px' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
        </div>

        {/* Protocol Selector */}
        <select
          value={selectedProtocolId}
          onChange={(e) => setSelectedProtocolId(e.target.value)}
          className="form-select font-mono"
          style={{ width: 'auto', padding: '6px 14px', fontSize: '12.5px' }}
        >
          <option value="all">All Protocols ({protocols.length})</option>
          {protocols.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <LinkIcon size={24} />
            <h3>No Referral Links Found</h3>
            <p>
              {search || selectedProtocolId !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Create an escrow agreement to generate your first referral link.'}
            </p>
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenCreateCampaign} style={{ marginTop: '8px' }}>
              Generate Referral Link
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referral Link</th>
                  <th>Protocol / Product</th>
                  <th>Reward Bounty</th>
                  <th>Referrer Destination</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const fullUrl = `${window.location.origin}/r/${a.code}`;
                  const isExp = Date.now() > a.deadline;

                  return (
                    <tr key={a.code}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <a
                            href={`/r/${a.code}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigateToReferrer(a.code);
                            }}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '12.5px',
                              color: 'var(--accent-lime)',
                              fontWeight: 700,
                              textDecoration: 'none',
                              borderBottom: '1px dashed var(--accent-lime)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Open referral link portal"
                          >
                            /r/{a.code} <ExternalLink size={11} />
                          </a>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(fullUrl, a.code)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                            title="Copy full shareable URL"
                          >
                            {copiedKey === a.code ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {a.businessName || 'SaaSify Cloud'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {a.customerLabel}
                        </div>
                      </td>

                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{a.amount}</strong>{' '}
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{a.assetCode}</span>
                      </td>

                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {a.referrerAddress.slice(0, 4)}...{a.referrerAddress.slice(-4)}
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
                          new Date(a.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => onInspectCampaign(a)}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onNavigateToReferrer(a.code)}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
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
        </div>
      )}
    </div>
  );
};
