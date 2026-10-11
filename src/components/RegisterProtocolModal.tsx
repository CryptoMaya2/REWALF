import React, { useState, useEffect } from 'react';
import type { ConnectedWallet, Protocol, IntegrationMechanism } from '../stellar/types';
import { registerProtocol } from '../store/protocolStore';
import {
  X,
  Building2,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Globe,
  Code2,
  Webhook,
  Wallet,
  Sparkles,
  Info,
} from 'lucide-react';

interface RegisterProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onProtocolRegistered: (protocol: Protocol) => void;
}

export const RegisterProtocolModal: React.FC<RegisterProtocolModalProps> = ({
  isOpen,
  onClose,
  connectedWallet,
  onOpenWalletModal,
  onProtocolRegistered,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [network, setNetwork] = useState<'Stellar Testnet'>('Stellar Testnet');
  const [ownerWallet, setOwnerWallet] = useState('');
  const [integrationType, setIntegrationType] = useState<IntegrationMechanism>('client_sdk');

  // Status & Validation
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill connected wallet if available
  useEffect(() => {
    if (connectedWallet?.publicKey && !ownerWallet) {
      setOwnerWallet(connectedWallet.publicKey);
    }
  }, [connectedWallet, ownerWallet]);

  if (!isOpen) return null;

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Protocol or product name is required.');
      return;
    }
    if (!website.trim()) {
      setError('Website URL is required.');
      return;
    }

    // Basic URL validation
    let cleanWebsite = website.trim();
    if (!cleanWebsite.startsWith('http://') && !cleanWebsite.startsWith('https://')) {
      cleanWebsite = `https://${cleanWebsite}`;
    }

    try {
      new URL(cleanWebsite);
    } catch {
      setError('Please provide a valid website URL (e.g. https://yourprotocol.com).');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a short description for your protocol.');
      return;
    }

    setWebsite(cleanWebsite);
    setStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const wallet = ownerWallet.trim();
    if (!wallet) {
      setError('An authorized Stellar wallet address is required.');
      return;
    }

    if (!/^G[A-Z0-9]{55}$/.test(wallet)) {
      setError('Please provide a valid 56-character Stellar public key starting with G.');
      return;
    }

    setStep(3);
  };

  const handleConfirmRegister = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const res = registerProtocol({
        name,
        website,
        description,
        network,
        ownerWallet,
        integrationType,
        verifiedOwnership: connectedWallet?.publicKey === ownerWallet,
      });

      if (!res.success || !res.protocol) {
        setError(res.error || 'Failed to register protocol.');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      onProtocolRegistered(res.protocol);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during registration.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-overlay)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-lime-subtle)',
                border: '1px solid var(--accent-lime-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-lime)',
              }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Register Protocol / Product
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Stage {step} of 3 — {step === 1 ? 'Project Details' : step === 2 ? 'Ownership & Attribution' : 'Review & Confirm'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            style={{ padding: '4px', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '3px', background: 'var(--surface-subtle)', width: '100%' }}>
          <div
            style={{
              height: '100%',
              width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%',
              background: 'var(--accent-lime)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {error && (
            <div className="alert-box alert-error" style={{ marginBottom: '18px' }}>
              <AlertCircle size={16} />
              <div style={{ fontSize: '13px' }}>{error}</div>
            </div>
          )}

          {/* STAGE 1: Project Details */}
          {step === 1 && (
            <form onSubmit={handleNextFromStep1} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Protocol or Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoenix DEX or SaaSify Cloud"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  style={{ background: 'var(--surface-input)' }}
                  autoFocus
                />
                <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  The formal public name of your application, dapp, or protocol.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Official Website URL *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="https://yourprotocol.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="form-input font-mono"
                    style={{ background: 'var(--surface-input)', paddingLeft: '34px' }}
                  />
                  <Globe size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Affiliates and customers will see this domain verified against all issued referral links.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Short Product Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what your product offers and the conversion goal (e.g. Automated market maker aggregator on Stellar)."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  style={{ background: 'var(--surface-input)', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Supported Blockchain Network *
                </label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as 'Stellar Testnet')}
                  className="form-select font-mono"
                  style={{ background: 'var(--surface-input)' }}
                >
                  <option value="Stellar Testnet">Stellar Testnet (Active Smart Escrow Engine)</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '6px' }}>
                  <Info size={13} style={{ color: 'var(--accent-blue)', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    <strong>Architecture Notice:</strong> Rewalf's escrow contracts and instant settlement vaults are currently deployed natively on <strong>Stellar Horizon</strong>. Ethereum and Solana are not supported by this runtime.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 600 }}>
                  Continue to Ownership & Integration <ArrowRight size={14} />
                </button>
              </div>
            </form>
          )}

          {/* STAGE 2: Ownership and Integration */}
          {step === 2 && (
            <form onSubmit={handleNextFromStep2} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Wallet Ownership */}
              <div className="card-subtle" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={16} color="var(--accent-lime)" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Authorised Protocol Treasury Wallet *
                    </span>
                  </div>
                  {connectedWallet ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setOwnerWallet(connectedWallet.publicKey)}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      Use Connected Signer ({connectedWallet.publicKey.slice(0, 4)}...{connectedWallet.publicKey.slice(-4)})
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={onOpenWalletModal}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      Connect Signer
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  required
                  placeholder="G... (56-character Stellar public key)"
                  value={ownerWallet}
                  onChange={(e) => setOwnerWallet(e.target.value)}
                  className="form-input font-mono"
                  style={{ background: 'var(--surface-input)', fontSize: '12.5px' }}
                />
                <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                  This address holds administrative authority to fund campaign escrow vaults and reclaim deposits upon expiry.
                </p>
              </div>

              {/* Attribution Mechanism Selection */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Referral Attribution Mechanism
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                  Select how your application signals that a referred customer has completed a qualifying action:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Option 1: Client SDK */}
                  <div
                    onClick={() => setIntegrationType('client_sdk')}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: integrationType === 'client_sdk' ? 'var(--accent-lime-subtle)' : 'var(--surface-input)',
                      border: `1px solid ${integrationType === 'client_sdk' ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Code2 size={16} color={integrationType === 'client_sdk' ? 'var(--accent-lime)' : 'var(--text-secondary)'} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Client Attribution SDK
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Embed a lightweight JavaScript snippet into your dapp or checkout page. Automatically detects <code style={{ color: 'var(--accent-lime)' }}>?ref=</code> and logs conversions.
                    </p>
                  </div>

                  {/* Option 2: Webhook Oracle */}
                  <div
                    onClick={() => setIntegrationType('webhook_oracle')}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: integrationType === 'webhook_oracle' ? 'var(--accent-lime-subtle)' : 'var(--surface-input)',
                      border: `1px solid ${integrationType === 'webhook_oracle' ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Webhook size={16} color={integrationType === 'webhook_oracle' ? 'var(--accent-lime)' : 'var(--text-secondary)'} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Webhook Settlement Oracle
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Server-to-server HMAC signed webhook. Your backend triggers Rewalf when a smart contract deposit or Stripe purchase completes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Attribution Honesty Warning */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid var(--semantic-amber-border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={16} color="var(--semantic-amber)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Honest Protocol Boundary:</strong> Registering your website creates the protocol record and generates credentials, but <em>does not yet track live conversions</em> until you paste the snippet or configure the webhook.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(1)}
                  style={{ padding: '10px 18px' }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 600 }}>
                  Review Registration <ArrowRight size={14} />
                </button>
              </div>
            </form>
          )}

          {/* STAGE 3: Review & Register */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-subtle" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Sparkles size={18} color="var(--accent-lime)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Summary Review & Registration Confirmation
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Protocol Name:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{name}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Verified Website:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-lime)' }}>{website}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Settlement Network:</span>
                    <span className="network-badge">
                      <span className="pulse-dot" />
                      {network}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Treasury Owner Key:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {ownerWallet.slice(0, 8)}...{ownerWallet.slice(-8)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Attribution Mode:</span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                      {integrationType === 'client_sdk' ? 'Client Attribution SDK' : 'Webhook Settlement Oracle'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Initial Status:</span>
                    <span className="badge badge-locked" style={{ fontSize: '11px' }}>
                      Awaiting Integration
                    </span>
                  </div>
                </div>
              </div>

              {/* What Registration Does */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  What happens upon registration?
                </div>
                <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '18px', lineHeight: 1.6 }}>
                  <li>Initializes your protocol entity in Rewalf's local protocol registry.</li>
                  <li>Generates dedicated cryptographic API keys and webhook signing secret.</li>
                  <li>Enables you to create campaigns with locked Stellar escrow rewards.</li>
                  <li>Redirects to your new <strong>Protocol Management Page</strong> with code snippets ready to copy.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  style={{ padding: '10px 18px' }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmRegister}
                  disabled={submitting}
                  style={{ padding: '10px 24px', fontWeight: 700 }}
                >
                  {submitting ? 'Registering Protocol...' : 'Confirm & Register Protocol'} <Check size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
