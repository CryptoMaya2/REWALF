import React, { useState, useEffect } from 'react';
import type { Agreement } from '../stellar/types';
import { PayoutTrace } from './PayoutTrace';
import {
  Clock,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface PayoutTraceViewProps {
  agreements: Agreement[];
  selectedCode?: string;
  onCodeSelect: (code: string) => void;
  onNavigateToReferrer: (code: string) => void;
}

export const PayoutTraceView: React.FC<PayoutTraceViewProps> = ({
  agreements,
  selectedCode,
  onCodeSelect,
  onNavigateToReferrer,
}) => {
  const [activeCode, setActiveCode] = useState<string>(
    selectedCode || (agreements[0]?.code ?? '')
  );

  useEffect(() => {
    if (selectedCode) {
      setActiveCode(selectedCode);
    } else if (!activeCode && agreements.length > 0) {
      setActiveCode(agreements[0].code);
    }
  }, [selectedCode, agreements]);

  const activeAgreement = agreements.find(
    (a) => a.code.toLowerCase() === activeCode.toLowerCase()
  );

  const handleSelect = (code: string) => {
    setActiveCode(code);
    onCodeSelect(code);
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Signature Verification Feature
            </span>
            <span className="network-badge">
              <ShieldCheck size={12} color="var(--accent-lime)" />
              Verifiable On-Chain Lifecycle
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', letterSpacing: '-0.3px' }}>
            Payout Trace Lifecycle Inspector
          </h2>
        </div>

        {/* Quick Agreement Selector */}
        {agreements.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Select Agreement:</span>
            <select
              value={activeCode}
              onChange={(e) => handleSelect(e.target.value)}
              className="form-select font-mono"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            >
              {agreements.map((a) => (
                <option key={a.code} value={a.code}>
                  #{a.code}, {a.customerLabel} ({a.amount} {a.assetCode} [{a.state}])
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      {agreements.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Clock size={22} />
            </div>
            <h3>No Escrow Records to Trace</h3>
            <p>Create a referral program to inspect its verifiable cryptographic lifecycle.</p>
          </div>
        </div>
      ) : activeAgreement ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Main Trace Column */}
          <div className="card">
            <PayoutTrace agreement={activeAgreement} />
          </div>

          {/* Right Information & Context Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Agreement Quick Snapshot */}
            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Agreement Snapshot
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Customer Deal</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {activeAgreement.customerLabel}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Locked Reward</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--accent-lime)' }}>
                    {activeAgreement.amount} {activeAgreement.assetCode}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Agreement State</span>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`status-badge badge-${activeAgreement.state.toLowerCase()}`}>
                      {activeAgreement.state}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Escrow Public Key</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {activeAgreement.escrowPublicKey}
                  </div>
                </div>

                <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => onNavigateToReferrer(activeAgreement.code)}
                  >
                    Open Affiliate Portal (/r/{activeAgreement.code})
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Architecture Principles */}
            <div className="card-subtle" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Info size={15} color="var(--accent-blue)" />
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Verification Transparency
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Rewalf strictly distinguishes between off-chain application triggers (such as marking a deal paid) and cryptographically sealed on-chain outcomes (such as Stellar account funding and payment execution).
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '8px' }}>
                Click on any step card on the left to reveal the exact transaction hashes, keys, and timestamp evidence.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
