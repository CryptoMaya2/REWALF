import React, { useState } from 'react';
import type { Protocol, Agreement } from '../stellar/types';
import {
  Building2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface ProtocolsViewProps {
  protocols: Protocol[];
  agreements: Agreement[];
  onOpenRegisterModal?: () => void;
  onSelectProtocol: (protocol: Protocol) => void;
  onOpenCreateCampaign: (protocol: Protocol) => void;
}

export const ProtocolsView: React.FC<ProtocolsViewProps> = ({
  protocols,
  agreements,
  onOpenRegisterModal: _onOpenRegisterModal,
  onSelectProtocol,
  onOpenCreateCampaign,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'awaiting_integration'>('all');

  const filtered = protocols.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.website.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Registered Protocols & Web3 Products
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Configure referral integrations, manage token bounties, and track on-chain partner attribution
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '320px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search protocols, websites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ background: 'var(--surface-input)', paddingLeft: '34px', fontSize: '13px' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: `All Protocols (${protocols.length})` },
            { id: 'active', label: 'Active & Integrated' },
            { id: 'awaiting_integration', label: 'Awaiting Integration' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`preset-btn ${statusFilter === pill.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(pill.id as any)}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Protocols Grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-state-icon">
              <Building2 size={24} />
            </div>
            <h3>No Protocols Found</h3>
            <p>
              {search
                ? `No registered protocols matched "${search}".`
                : 'Use "Register business" in the top bar to add your website or web3 product.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '16px' }}>
          {filtered.map((protocol) => {
            const protoAgreements = agreements.filter(
              (a) => a.protocolId === protocol.id || a.businessId === protocol.id || a.businessName === protocol.name
            );
            const activeCount = protoAgreements.filter((a) => a.state === 'LOCKED').length;

            return (
              <div
                key={protocol.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                  border: '1px solid var(--border-card)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                          fontSize: '16px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {protocol.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3
                          onClick={() => onSelectProtocol(protocol)}
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textDecoration: 'none',
                          }}
                        >
                          {protocol.name}
                        </h3>
                        <a
                          href={protocol.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--accent-lime)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            marginTop: '2px',
                          }}
                        >
                          {protocol.website.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>

                    {protocol.status === 'active' ? (
                      <span className="badge badge-settled" style={{ fontSize: '10.5px' }}>
                        <CheckCircle2 size={10} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-locked" style={{ fontSize: '10.5px' }}>
                        <AlertTriangle size={10} /> Pending
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {protocol.description}
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'var(--surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '16px',
                      fontSize: '11.5px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block' }}>Network</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{protocol.network}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block' }}>Campaigns</span>
                      <strong style={{ color: 'var(--accent-lime)' }}>
                        {protoAgreements.length} ({activeCount} active)
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectProtocol(protocol)}
                    style={{ flex: 1, fontWeight: 600 }}
                  >
                    Manage Protocol <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => onOpenCreateCampaign(protocol)}
                    title="Launch new escrow campaign"
                  >
                    <Layers size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
