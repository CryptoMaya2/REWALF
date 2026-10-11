import React, { useState } from 'react';
import type { Protocol, Agreement, ConnectedWallet } from '../stellar/types';
import { updateProtocol } from '../store/protocolStore';
import { getStellarExpertAccountUrl, getStellarExpertTxUrl } from '../stellar/stellarService';
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  Plus,
  ArrowRight,
  Code2,
  Webhook,
  Key,
  Layers,
  Link as LinkIcon,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ProtocolDetailViewProps {
  protocol: Protocol;
  agreements: Agreement[];
  connectedWallet: ConnectedWallet | null;
  onOpenCreateCampaign: (protocol: Protocol) => void;
  onNavigateToReferrer: (code: string) => void;
  onInspectCampaign: (agreement: Agreement) => void;
  onBackToProtocols: () => void;
  onProtocolUpdated?: (protocol: Protocol) => void;
}

export const ProtocolDetailView: React.FC<ProtocolDetailViewProps> = ({
  protocol,
  agreements,
  connectedWallet,
  onOpenCreateCampaign,
  onNavigateToReferrer,
  onInspectCampaign,
  onBackToProtocols,
  onProtocolUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'links' | 'integration' | 'payouts'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentProtocol, setCurrentProtocol] = useState<Protocol>(protocol);

  // Filter agreements for this protocol
  const protocolAgreements = agreements.filter(
    (a) => a.protocolId === protocol.id || a.businessId === protocol.id || a.businessName === protocol.name
  );

  const activeCampaigns = protocolAgreements.filter((a) => a.state === 'LOCKED');
  const settledPayouts = protocolAgreements.filter((a) => a.state === 'CLAIMED');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleMarkIntegrated = () => {
    const updated = updateProtocol(currentProtocol.id, {
      status: currentProtocol.status === 'active' ? 'awaiting_integration' : 'active',
    });
    if (updated) {
      setCurrentProtocol(updated);
      onProtocolUpdated?.(updated);
    }
  };

  const getStatusBadge = (status: Protocol['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="badge badge-settled" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Active & Tracking
          </span>
        );
      case 'awaiting_integration':
        return (
          <span className="badge badge-locked" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> Awaiting Integration
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Registered
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
        <button
          type="button"
          onClick={onBackToProtocols}
          style={{ background: 'none', border: 'none', color: 'var(--accent-lime)', cursor: 'pointer', padding: 0 }}
        >
          Protocols Directory
        </button>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentProtocol.name}</span>
      </div>

      {/* Protocol Header Card */}
      <div className="card" style={{ padding: '24px', border: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(184, 243, 107, 0.15) 0%, rgba(112, 183, 255, 0.15) 100%)',
                border: '1px solid var(--accent-lime-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-lime)',
                fontWeight: 800,
                fontSize: '24px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {currentProtocol.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  {currentProtocol.name}
                </h2>
                {getStatusBadge(currentProtocol.status)}
                <span className="network-badge" style={{ fontSize: '11px' }}>
                  <span className="pulse-dot" />
                  {currentProtocol.network}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '620px' }}>
                {currentProtocol.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
                <a
                  href={currentProtocol.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-lime)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={12} /> {currentProtocol.website}
                </a>
                <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  Owner Key:{' '}
                  <a
                    href={getStellarExpertAccountUrl(currentProtocol.ownerWallet)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
                  >
                    {currentProtocol.ownerWallet.slice(0, 6)}...{currentProtocol.ownerWallet.slice(-6)}
                  </a>
                  {connectedWallet && connectedWallet.publicKey === currentProtocol.ownerWallet && (
                    <span style={{ color: 'var(--semantic-green)', marginLeft: '4px', fontWeight: 600 }}>
                      (✓ Authorized Signer)
                    </span>
                  )}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  Registered {new Date(currentProtocol.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenCreateCampaign(currentProtocol)}
              style={{ fontWeight: 700 }}
            >
              <Plus size={15} /> Create Campaign
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleMarkIntegrated}
              title="Toggle integration status for evaluation"
              style={{ fontSize: '12px' }}
            >
              {currentProtocol.status === 'active' ? 'Mark Awaiting Integration' : 'Mark Integration Verified'}
            </button>
          </div>
        </div>

        {/* 6-Step Workflow Sequence Strip */}
        <div
          style={{
            marginTop: '24px',
            padding: '14px 18px',
            background: 'var(--surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>
            Protocol Lifecycle & Referral Sequence
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: 'var(--accent-lime)', fontWeight: 600 }}>1. Register Protocol ✓</span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
            <span style={{ color: 'var(--accent-lime)', fontWeight: 600 }}>2. Authorise Treasury ✓</span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
            <span style={{ color: currentProtocol.status === 'active' ? 'var(--accent-lime)' : 'var(--semantic-amber)', fontWeight: 600 }}>
              3. Configure Integration {currentProtocol.status === 'active' ? '✓' : '(Action Req.)'}
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
            <span style={{ color: protocolAgreements.length > 0 ? 'var(--accent-lime)' : 'var(--text-tertiary)', fontWeight: 600 }}>
              4. Create Campaign {protocolAgreements.length > 0 ? `(${protocolAgreements.length})` : ''}
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
            <span style={{ color: protocolAgreements.length > 0 ? 'var(--accent-lime)' : 'var(--text-tertiary)', fontWeight: 600 }}>
              5. Generate Links
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
            <span style={{ color: settledPayouts.length > 0 ? 'var(--accent-lime)' : 'var(--text-tertiary)', fontWeight: 600 }}>
              6. Settle On-Chain Payouts
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
        {[
          { id: 'overview', label: 'Overview & Summary', icon: Building2 },
          { id: 'campaigns', label: `Campaigns (${protocolAgreements.length})`, icon: Layers },
          { id: 'links', label: `Referral Links (${protocolAgreements.length})`, icon: LinkIcon },
          { id: 'integration', label: 'Integration & SDK', icon: Code2 },
          { id: 'payouts', label: `Payouts History (${settledPayouts.length})`, icon: ArrowRightLeft },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Metrics Grid */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Active Campaigns</span>
                <Layers size={15} />
              </div>
              <div className="kpi-value">{activeCampaigns.length}</div>
              <div className="kpi-subtext">Escrows locked on Stellar</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Total Tracked Links</span>
                <LinkIcon size={15} />
              </div>
              <div className="kpi-value">{protocolAgreements.length}</div>
              <div className="kpi-subtext">Issued affiliate links</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Settled Payouts</span>
                <CheckCircle2 size={15} color="var(--semantic-green)" />
              </div>
              <div className="kpi-value">{settledPayouts.length}</div>
              <div className="kpi-subtext">Successfully paid on testnet</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Integration Status</span>
                <ShieldCheck size={15} color={currentProtocol.status === 'active' ? 'var(--semantic-green)' : 'var(--semantic-amber)'} />
              </div>
              <div className="kpi-value" style={{ fontSize: '18px', marginTop: '6px' }}>
                {currentProtocol.status === 'active' ? 'Connected' : 'Pending'}
              </div>
              <div className="kpi-subtext">{currentProtocol.integrationType === 'client_sdk' ? 'Client SDK' : 'Webhook Oracle'}</div>
            </div>
          </div>

          {/* Integration Status Notice */}
          {currentProtocol.status !== 'active' && (
            <div className="alert-box alert-warning">
              <AlertTriangle size={18} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <strong>Action Required: Complete Referral Attribution Integration</strong>
                  <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                    Your protocol is registered on Rewalf, but referral conversions cannot be attributed until your website embeds the client SDK or connects the webhook.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('integration')}
                >
                  View Code Snippet <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Recent Campaigns for this Protocol */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Referral Campaigns
              </h3>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onOpenCreateCampaign(currentProtocol)}
              >
                <Plus size={13} /> Create Campaign
              </button>
            </div>

            {protocolAgreements.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <Layers size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
                <h4>No Campaigns Created for {currentProtocol.name}</h4>
                <p>Lock your first reward into an Escrow Vault on Stellar to launch affiliate links.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onOpenCreateCampaign(currentProtocol)}
                >
                  Create First Campaign
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Deal Label</th>
                      <th>Referral Link</th>
                      <th>Bounty</th>
                      <th>State</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocolAgreements.slice(0, 5).map((a) => (
                      <tr key={a.code}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.customerLabel}</div>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                            #{a.code}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`/r/${a.code}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigateToReferrer(a.code);
                            }}
                            style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', fontSize: '12px', textDecoration: 'underline' }}
                          >
                            /r/{a.code} <ExternalLink size={10} />
                          </a>
                        </td>
                        <td>
                          <strong>{a.amount}</strong> <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{a.assetCode}</span>
                        </td>
                        <td>
                          <span className={`status-badge badge-${a.state.toLowerCase()}`}>
                            {a.state}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(a.deadline).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => onInspectCampaign(a)}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Campaigns for {currentProtocol.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Escrow vaults anchored with timelocks and non-custodial payouts
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenCreateCampaign(currentProtocol)}
            >
              <Plus size={13} /> Create Campaign
            </button>
          </div>

          {protocolAgreements.length === 0 ? (
            <div className="empty-state">
              <Layers size={24} />
              <h4>No Campaigns Found</h4>
              <p>Create a referral agreement to fund a bounty escrow vault.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onOpenCreateCampaign(currentProtocol)}
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Deal Label</th>
                    <th>Referral Code</th>
                    <th>Escrow Vault</th>
                    <th>Referrer Destination</th>
                    <th>Bounty</th>
                    <th>State</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {protocolAgreements.map((a) => (
                    <tr key={a.code}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.customerLabel}</div>
                      </td>
                      <td>
                        <a
                          href={`/r/${a.code}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigateToReferrer(a.code);
                          }}
                          style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                        >
                          /r/{a.code}
                        </a>
                      </td>
                      <td>
                        <a
                          href={getStellarExpertAccountUrl(a.escrowPublicKey)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}
                        >
                          {a.escrowPublicKey.slice(0, 4)}...{a.escrowPublicKey.slice(-4)} <ExternalLink size={10} />
                        </a>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {a.referrerAddress.slice(0, 4)}...{a.referrerAddress.slice(-4)}
                        </span>
                      </td>
                      <td>
                        <strong>{a.amount}</strong> {a.assetCode}
                      </td>
                      <td>
                        <span className={`status-badge badge-${a.state.toLowerCase()}`}>
                          {a.state}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => onInspectCampaign(a)}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Referral Links */}
      {activeTab === 'links' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Generated Referral Links
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Shareable links for affiliate partners and creators
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenCreateCampaign(currentProtocol)}
            >
              <Plus size={13} /> Generate New Link
            </button>
          </div>

          {protocolAgreements.length === 0 ? (
            <div className="empty-state">
              <LinkIcon size={24} />
              <h4>No Referral Links Available</h4>
              <p>Create a campaign to generate branded links for your partners.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Referral Code</th>
                    <th>Shareable URL</th>
                    <th>Associated Deal</th>
                    <th>Bounty</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {protocolAgreements.map((a) => {
                    const fullUrl = `${window.location.origin}/r/${a.code}`;
                    return (
                      <tr key={a.code}>
                        <td>
                          <code style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                            #{a.code}
                          </code>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a
                              href={`/r/${a.code}`}
                              onClick={(e) => {
                                e.preventDefault();
                                onNavigateToReferrer(a.code);
                              }}
                              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', textDecoration: 'underline' }}
                            >
                              {fullUrl}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(fullUrl, a.code)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                              title="Copy URL"
                            >
                              {copiedKey === a.code ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {a.customerLabel}
                        </td>
                        <td>
                          <strong>{a.amount}</strong> {a.assetCode}
                        </td>
                        <td>
                          <span className={`status-badge badge-${a.state.toLowerCase()}`}>
                            {a.state}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onNavigateToReferrer(a.code)}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            Open Portal
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Integration & SDK */}
      {activeTab === 'integration' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* API Credentials */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Key size={18} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cryptographic Protocol Credentials
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Public API Key
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={currentProtocol.apiKey}
                    className="form-input font-mono"
                    style={{ fontSize: '12px', background: 'var(--surface-input)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => copyToClipboard(currentProtocol.apiKey, 'apiKey')}
                  >
                    {copiedKey === 'apiKey' ? <Check size={13} color="var(--accent-lime)" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Webhook Signing Secret (HMAC-SHA256)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={currentProtocol.webhookSecret}
                    className="form-input font-mono"
                    style={{ fontSize: '12px', background: 'var(--surface-input)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => copyToClipboard(currentProtocol.webhookSecret, 'webhookSecret')}
                  >
                    {copiedKey === 'webhookSecret' ? <Check size={13} color="var(--accent-lime)" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Implementation Guide */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Code2 size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Integration Option 1: Client JavaScript SDK
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Add this tag to your product's <code style={{ color: 'var(--accent-lime)' }}>&lt;head&gt;</code>. It captures inbound referral links automatically:
            </p>

            <pre
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-input)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                overflowX: 'auto',
              }}
            >
{`<!-- Rewalf Trustless Referral Attribution SDK -->
<script 
  src="https://cdn.rewalf.xyz/sdk.v1.js"
  data-api-key="${currentProtocol.apiKey}"
  data-network="stellar-testnet"
  async>
</script>

<script>
  // Call upon customer conversion or checkout completion
  window.rewalf?.trackConversion({
    customerLabel: "User #1092 Subscription",
    amount: "150.00",
    asset: "USDC"
  });
</script>`}
            </pre>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Webhook size={18} color="var(--semantic-amber)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Integration Option 2: Webhook Settlement Oracle
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              For backend or smart-contract driven protocols, trigger Rewalf's settlement endpoint via signed HTTP POST:
            </p>

            <pre
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-input)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                overflowX: 'auto',
              }}
            >
{`curl -X POST https://api.rewalf.xyz/v1/oracle/settle \\
  -H "Content-Type: application/json" \\
  -H "X-Rewalf-Signature: HMAC_SHA256_HEX(payload, "${currentProtocol.webhookSecret}")" \\
  -d '{
    "apiKey": "${currentProtocol.apiKey}",
    "referralCode": "saas91x",
    "event": "customer_deal_completed",
    "txHash": "7b4c6e80b435f524da478546123490b4e05466c1b3f9bb8693c0429f5f0b548d"
  }'`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Payouts */}
      {activeTab === 'payouts' && (
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              On-Chain Payout Settlement Log
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Immutable settlement transactions anchored on Stellar Horizon
            </p>
          </div>

          {settledPayouts.length === 0 ? (
            <div className="empty-state">
              <ArrowRightLeft size={24} />
              <h4>No Settled Payouts Yet</h4>
              <p>Rewards will appear here once claim transactions are broadcast to Stellar.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Referral Code</th>
                    <th>Destination Wallet</th>
                    <th>Settled Reward</th>
                    <th>Claim Tx Hash</th>
                    <th>Settled Time</th>
                  </tr>
                </thead>
                <tbody>
                  {settledPayouts.map((a) => (
                    <tr key={a.code}>
                      <td>
                        <code style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                          #{a.code}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {a.referrerAddress.slice(0, 6)}...{a.referrerAddress.slice(-6)}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--semantic-green)' }}>+{a.amount}</strong> {a.assetCode}
                      </td>
                      <td>
                        {a.claimTxHash ? (
                          <a
                            href={getStellarExpertTxUrl(a.claimTxHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            {a.claimTxHash.slice(0, 10)}... <ExternalLink size={10} />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {a.claimedAt ? new Date(a.claimedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
