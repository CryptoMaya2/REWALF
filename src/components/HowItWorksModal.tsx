import React from 'react';
import { X } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo-badge">R</div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Protocol Architecture Guide
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                How Rewalf enforces trustless referral escrows on Stellar
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {/* Section 1 */}
          <section>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '14.5px', fontWeight: 700, marginBottom: '6px' }}>
              1. The Problem Rewalf Solves
            </h3>
            <p>
              In traditional referral agreements, partners worry that businesses won't actually pay them when a deal closes. Meanwhile, businesses can't afford to pay commissions before a customer actually buys.
            </p>
            <p style={{ marginTop: '6px' }}>
              <strong>Rewalf bridges this trust gap:</strong> The business deposits the referral fee into an escrow vault upfront. The partner sees proof the money is locked and waiting for them, while the business is protected by a deadline refund guarantee.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '14.5px', fontWeight: 700, marginBottom: '8px' }}>
              2. How the 3 Steps Work
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="card-subtle" style={{ padding: '12px 14px' }}>
                <strong style={{ color: 'var(--accent-lime)' }}>Step 1: Lock the Bounty</strong>
                <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                  The business deposits the reward (e.g. 50 USDC) into a dedicated digital vault, sets the partner’s wallet address, and picks a deadline.
                </p>
              </div>

              <div className="card-subtle" style={{ padding: '12px 14px' }}>
                <strong style={{ color: 'var(--accent-blue)' }}>Step 2: Share & Track</strong>
                <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                  The partner opens their unique link, sees that the funds are genuinely secured in the vault, and starts referring customers with confidence.
                </p>
              </div>

              <div className="card-subtle" style={{ padding: '12px 14px' }}>
                <strong style={{ color: 'var(--semantic-green)' }}>Step 3: Instant Payout or Safe Refund</strong>
                <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                  • <strong>If a customer buys:</strong> The partner clicks "Claim" and the funds arrive directly in their wallet in under 5 seconds.<br />
                  • <strong>If nobody buys before the deadline:</strong> The business clicks "Reclaim" and gets 100% of their deposit back.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '14.5px', fontWeight: 700, marginBottom: '6px' }}>
              3. Safe & Non-Custodial
            </h3>
            <p>
              Rewalf never holds your money or sees your private keys. You stay in control using your preferred wallet:
            </p>
            <ul style={{ paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Freighter:</strong> Official browser extension wallet.</li>
              <li><strong>Albedo:</strong> 1-click web popup with zero installation required.</li>
              <li><strong>Demo Sandbox:</strong> Fast built-in test wallet for quick evaluation.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
