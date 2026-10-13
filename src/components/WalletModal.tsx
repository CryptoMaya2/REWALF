import React, { useState, useEffect } from 'react';
import type { ConnectedWallet, WalletType } from '../stellar/types';
import {
  checkFreighterInstalled,
  connectFreighter,
  connectAlbedo,
  connectSandbox,
  connectManual,
  disconnectWallet,
} from '../stellar/walletService';
import { fundWithFriendbot, getStellarExpertAccountUrl } from '../stellar/stellarService';
import {
  X,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Zap,
  LogOut,
  Wallet,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: ConnectedWallet | null;
  onWalletConnected: (wallet: ConnectedWallet | null) => void;
  onRefreshBalances: () => Promise<void>;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  connectedWallet,
  onWalletConnected,
  onRefreshBalances,
}) => {
  const [freighterInstalled, setFreighterInstalled] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<WalletType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundSuccess, setFundSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkFreighterInstalled().then(setFreighterInstalled);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectFreighter = async () => {
    setConnecting('freighter');
    setError(null);
    try {
      const wallet = await connectFreighter();
      onWalletConnected(wallet);
      onClose();
    } catch (err: any) {
      console.error('Freighter connect error:', err);
      setError(err.message || 'Failed to connect Freighter.');
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectAlbedo = async () => {
    setConnecting('albedo');
    setError(null);
    try {
      const wallet = await connectAlbedo();
      onWalletConnected(wallet);
      onClose();
    } catch (err: any) {
      console.error('Albedo connect error:', err);
      setError(err.message || 'Failed to connect Albedo.');
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectSandbox = async () => {
    setConnecting('sandbox');
    setError(null);
    try {
      const wallet = await connectSandbox();
      onWalletConnected(wallet);
      onClose();
    } catch (err: any) {
      console.error('Sandbox connect error:', err);
      setError(err.message || 'Failed to generate sandbox testnet wallet.');
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting('manual');
    setError(null);
    try {
      const wallet = await connectManual(manualAddress);
      onWalletConnected(wallet);
      setShowManualInput(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid Stellar address.');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onWalletConnected(null);
    onClose();
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFriendbotFund = async () => {
    if (!connectedWallet) return;
    setFunding(true);
    setFundSuccess(null);
    try {
      const res = await fundWithFriendbot(connectedWallet.publicKey);
      if (res.success) {
        setFundSuccess('+10,000 Testnet XLM received!');
        await onRefreshBalances();
      } else {
        setError(res.error || 'Friendbot faucet error.');
      }
    } catch (err: any) {
      setError(err.message || 'Funding failed.');
    } finally {
      setFunding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={18} color="var(--accent-lime)" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {connectedWallet ? 'Wallet Signer Details' : 'Connect Stellar Signer'}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                {connectedWallet ? 'Manage account & testnet balance' : 'Choose your non-custodial signer'}
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Security Guarantee Strip */}
          <div className="alert-box alert-success" style={{ marginBottom: '18px' }}>
            <ShieldCheck size={18} />
            <div>
              <strong style={{ fontSize: '12.5px' }}>100% Non-Custodial Architecture</strong>
              <p style={{ fontSize: '11.5px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                Rewalf never stores or handles private keys. Every transaction is signed client-side by your connected wallet.
              </p>
            </div>
          </div>

          {error && (
            <div className="alert-box alert-error">
              <AlertCircle size={16} />
              <span style={{ fontSize: '12px' }}>{error}</span>
            </div>
          )}

          {/* ACTIVE WALLET VIEW */}
          {connectedWallet ? (
            <div>
              <div className="card-subtle" style={{ padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="network-badge">
                    <span className="pulse-dot" />
                    {connectedWallet.label || connectedWallet.walletType}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCopyAddress(connectedWallet.publicKey)}
                      title="Copy Public Key"
                    >
                      {copied ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={getStellarExpertAccountUrl(connectedWallet.publicKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      title="Inspect on Stellar Expert"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: '14px' }}>
                  {connectedWallet.publicKey}
                </div>

                {/* Balances */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'var(--surface-input)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Native XLM Balance</span>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-lime)', marginTop: '2px' }}>
                      {parseFloat(connectedWallet.balanceXlm || '0').toFixed(2)} XLM
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface-input)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>USDC Balance</span>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {parseFloat(connectedWallet.balanceUsdc || '0').toFixed(2)} USDC
                    </div>
                  </div>
                </div>
              </div>

              {/* Faucet Top-up */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={handleFriendbotFund}
                  disabled={funding}
                >
                  <Zap size={14} />
                  {funding ? 'Requesting Testnet XLM...' : 'Request +10,000 Friendbot XLM'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger-outline btn-sm"
                  onClick={handleDisconnect}
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              </div>

              {fundSuccess && (
                <div style={{ fontSize: '12px', color: 'var(--semantic-green)', textAlign: 'center' }}>
                  ✓ {fundSuccess}
                </div>
              )}
            </div>
          ) : (
            /* CONNECT SIGNER OPTIONS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Educational Notice about Stellar vs EVM Wallets */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(112, 183, 255, 0.08)',
                  border: '1px solid rgba(112, 183, 255, 0.25)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: '2px' }}>
                  <AlertCircle size={14} />
                  <span>Notice: Rewalf runs on Stellar (Non-EVM)</span>
                </div>
                MetaMask, Rabby, and OKX are Ethereum (EVM) wallets and cannot sign Stellar transactions. Use **1-Click Sandbox** below for instant testing, or **Albedo** for zero-install signing.
              </div>

              {/* Option 1: Create & Connect Stellar Testnet Account (Sandbox Mode) */}
              <button
                type="button"
                className="card-subtle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',

                  cursor: 'pointer',
                  border: '1px solid var(--accent-lime-border)',
                  background: 'rgba(184, 243, 107, 0.06)',
                  textAlign: 'left',
                }}
                onClick={handleConnectSandbox}
                disabled={connecting !== null}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--accent-lime)' }}>Create & Connect Stellar Testnet Account</strong>
                    <span className="status-badge badge-claimed" style={{ fontSize: '10px' }}>Instant Testnet Setup</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Instantly creates and funds a fresh testnet keypair with 10,000 XLM via Friendbot. Zero extension required.
                  </p>
                </div>
                <Zap size={16} color="var(--accent-lime)" />
              </button>


              {/* Option 2: Albedo Web Signer (Zero-install) */}
              <button
                type="button"
                className="card-subtle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-card)',
                  background: 'var(--surface-subtle)',
                  textAlign: 'left',
                }}
                onClick={handleConnectAlbedo}
                disabled={connecting !== null}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>Albedo Web Signer</strong>
                    <span className="status-badge badge-locked" style={{ fontSize: '10px' }}>Zero-Install</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Secure popup web signer. Works in any desktop or mobile browser without installing anything.
                  </p>
                </div>
                <ArrowRight size={16} color="var(--accent-lime)" />
              </button>

              {/* Option 3: Freighter Extension (Official SDF extension) */}
              <button
                type="button"
                className="card-subtle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-card)',
                  background: 'var(--surface-subtle)',
                  textAlign: 'left',
                }}
                onClick={handleConnectFreighter}
                disabled={connecting !== null}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>Freighter Extension</strong>
                    {freighterInstalled && (
                      <span className="status-badge badge-claimed" style={{ fontSize: '10px' }}>Detected</span>
                    )}
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    The official Stellar Development Foundation (SDF) browser extension (like MetaMask, but for Stellar)
                  </p>
                </div>
                <ArrowRight size={16} color="var(--accent-lime)" />
              </button>


              {/* View Only Manual Key */}
              {!showManualInput ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '8px' }}
                  onClick={() => setShowManualInput(true)}
                >
                  View-Only Mode (Manual G... Address)
                </button>
              ) : (
                <form onSubmit={handleConnectManual} style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="G... (Stellar Public Key)"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="form-input font-mono"
                    style={{ fontSize: '12px', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={connecting !== null}>
                      Connect View-Only
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowManualInput(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
