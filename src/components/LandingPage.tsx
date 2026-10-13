import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Users,
  Building2,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  Lock,
  Zap,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive Simulator State for Hero
  const [simulatorStep, setSimulatorStep] = useState<1 | 2 | 3>(1);
  const [simulatorScenario, setSimulatorScenario] = useState<'success' | 'refund'>('success');

  const faqs = [
    {
      q: 'Do I or my partners need to be crypto experts to use this?',
      a: 'Not at all. You just connect a Stellar wallet (like Freighter or Albedo with one click) or use the built-in demo sandbox. Everything is designed like a regular, clean payment app. You set a dollar or token amount, set a deadline, and the on-chain escrow vault handles the rest.',
    },
    {
      q: 'Can a business take their money back before the referral happens?',
      a: 'No. That is the core safety feature. Once a business locks a reward into an escrow vault, the funds are held securely until the deadline. The business cannot withdraw the funds early, which gives the referrer complete confidence that the reward will be there when the deal closes.',
    },
    {
      q: 'How fast does the referrer receive their reward when a customer buys?',
      a: 'Once customer payment is confirmed, the referrer clicks Claim. Because Rewalf runs on the Stellar network, the escrow payout transfers in about 3 to 5 seconds directly into the referrer’s wallet, with fees that cost a fraction of a cent.',
    },
    {
      q: 'What happens if no customer ever buys before the deadline?',
      a: 'The business never loses their money. If the deadline passes and no qualifying purchase was made, the business clicks one button to reclaim 100% of their deposit back to their own wallet.',
    },
    {
      q: 'Why not just use regular invoices, bank wires, or affiliate spreadsheets?',
      a: 'With traditional affiliate deals, referrers often wait 30 to 60 days to get paid, deal with international wire fees, or worry the business will forget or refuse to pay. Rewalf replaces promises with an upfront digital vault: the money is already there, ready to release the moment the customer pays.',
    },
    {
      q: 'Does Rewalf hold my private keys or control my wallet?',
      a: 'Never. Rewalf is non-custodial. You sign transactions directly from your own browser wallet. Rewalf never sees or stores your private passwords or keys.',
    },
  ];

  return (
    <div className="landing-container" style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* 1. Header Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(10, 13, 10, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          onClick={onLaunchApp}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          title="Launch Protocol App"
        >
          <div className="brand-logo-badge">R</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Rewalf
            </span>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '10px',
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-lime-subtle)',
                color: 'var(--accent-lime)',
                border: '1px solid var(--accent-lime-border)',
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              STELLAR TESTNET
            </span>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <a
            href="#story"
            style={{ fontSize: '13.5px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            How It Works
          </a>
          <a
            href="#simulator"
            style={{ fontSize: '13.5px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Simulator
          </a>
          <a
            href="#use-cases"
            style={{ fontSize: '13.5px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Who It’s For
          </a>
          <a
            href="#faq"
            style={{ fontSize: '13.5px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            FAQ
          </a>

          {/* Primary Launch App Button */}
          <button
            onClick={onLaunchApp}
            className="btn btn-primary"
            style={{
              padding: '9px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
            }}
          >
            Launch Dashboard <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section: High Impact, Atmospheric, Web3 Fintech */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '80px 24px 40px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Glow ambient background aura */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '750px',
            height: '350px',
            background: 'radial-gradient(ellipse at 50% 30%, rgba(184, 243, 107, 0.12) 0%, rgba(112, 183, 255, 0.05) 50%, transparent 75%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Status pill with animated radar dot */}
          <div
            className="glass-pill"
            style={{ marginBottom: '28px' }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--accent-lime)',
                boxShadow: '0 0 10px var(--accent-lime)',
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Instant & Guaranteed Referral Payouts</span>
            <span style={{ color: 'var(--border-card)' }}>•</span>
            <span style={{ color: 'var(--accent-lime)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} /> Powered by Stellar Escrow
            </span>
          </div>

          {/* Natural Human Headline with subtle gradient */}
          <h1
            style={{
              fontSize: 'clamp(38px, 6vw, 68px)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              maxWidth: '960px',
              margin: '0 auto 24px',
              fontFamily: 'var(--font-display)',
            }}
          >
            Referral rewards are claimed{' '}
            <span className="gradient-text-lime">
              on Stellar
            </span>. You can verify the escrow.
          </h1>

          {/* Conversational Explanation */}
          <p
            style={{
              fontSize: 'clamp(16px, 1.9vw, 20px)',
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              maxWidth: '780px',
              margin: '0 auto 40px',
            }}
          >
            No unpaid invoices. No chasing payments for 60 days.
            Businesses lock reward money into a secure on-chain vault upfront.
            When a referred customer completes their purchase, the referrer clicks <strong>Claim</strong> and receives payment in seconds via Stellar.
            If nobody buys before the deadline, the business clicks <strong>Reclaim</strong> and gets 100% of their money back.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '56px' }}>
            <button
              onClick={onLaunchApp}
              className="btn btn-primary btn-lg"
              style={{
                fontWeight: 700,
              }}
            >
              Launch Dashboard <ArrowRight size={17} />
            </button>

            <a
              href="#simulator"
              className="btn btn-secondary btn-lg"
              style={{
                textDecoration: 'none',
              }}
            >
              Try 10-Second Demo ↓
            </a>
          </div>

          {/* 4 Protocol Counters Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              maxWidth: '1060px',
              margin: '0 auto',
            }}
          >
            <div className="stat-counter-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                <Lock size={12} style={{ color: 'var(--accent-lime)' }} /> Escrow Security
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                100% Locked
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Funds protected on-chain upfront
              </div>
            </div>

            <div className="stat-counter-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                <Zap size={12} style={{ color: 'var(--accent-blue)' }} /> Stellar Speed
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                3.2s Payout
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Direct settlement into referrer wallet
              </div>
            </div>

            <div className="stat-counter-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                <ShieldCheck size={12} style={{ color: 'var(--semantic-green)' }} /> Non-Custodial
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--semantic-green)', fontFamily: 'var(--font-mono)' }}>
                Zero Risk
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                No platform custody of your keys
              </div>
            </div>

            <div className="stat-counter-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                <RotateCcw size={12} style={{ color: 'var(--semantic-amber)' }} /> Timelock Safety
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--semantic-amber)', fontFamily: 'var(--font-mono)' }}>
                100% Refund
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Full reclaim if no deal closes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive 10-Second Simulator Widget */}
      <section
        id="simulator"
        style={{
          maxWidth: '1020px',
          margin: '20px auto 80px',
          padding: '0 24px',
        }}
      >
        <div className="interactive-demo-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-lime)', fontWeight: 800, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-lime)' }} />
                INTERACTIVE FLOW SIMULATOR
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                See how trustless referral escrow settles in real time:
              </h2>
            </div>

            {/* Toggle Scenario */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(16, 20, 16, 0.8)', padding: '5px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  setSimulatorScenario('success');
                  setSimulatorStep(1);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: simulatorScenario === 'success' ? 'var(--surface-subtle)' : 'transparent',
                  color: simulatorScenario === 'success' ? 'var(--accent-lime)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  boxShadow: simulatorScenario === 'success' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                Deal Closed (Instant Payout)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulatorScenario('refund');
                  setSimulatorStep(1);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: simulatorScenario === 'refund' ? 'var(--surface-subtle)' : 'transparent',
                  color: simulatorScenario === 'refund' ? 'var(--semantic-amber)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  boxShadow: simulatorScenario === 'refund' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                Deal Timed Out (100% Refund)
              </button>
            </div>
          </div>

          {/* Interactive Steps Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '32px' }}>
            <button
              type="button"
              onClick={() => setSimulatorStep(1)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: simulatorStep >= 1 ? 'rgba(36, 44, 36, 0.7)' : 'rgba(20, 24, 20, 0.4)',
                border: simulatorStep === 1 ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: simulatorStep === 1 ? '0 0 16px rgba(184, 243, 107, 0.15)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-lime)', fontWeight: 800 }}>STEP 01</span>
                <span className={`step-indicator-pill ${simulatorStep === 1 ? 'active' : simulatorStep > 1 ? 'completed' : 'inactive'}`}>
                  1
                </span>
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, marginTop: '6px' }}>Business Locks $50</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Funds stored in on-chain vault</div>
            </button>

            <button
              type="button"
              onClick={() => setSimulatorStep(2)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: simulatorStep >= 2 ? 'rgba(36, 44, 36, 0.7)' : 'rgba(20, 24, 20, 0.4)',
                border: simulatorStep === 2 ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: simulatorStep === 2 ? '0 0 16px rgba(112, 183, 255, 0.15)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 800 }}>STEP 02</span>
                <span className={`step-indicator-pill ${simulatorStep === 2 ? 'active' : simulatorStep > 2 ? 'completed' : 'inactive'}`}>
                  2
                </span>
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, marginTop: '6px' }}>
                {simulatorScenario === 'success' ? 'Customer Pays' : 'Deadline Passes'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {simulatorScenario === 'success' ? 'Customer marked paid' : 'Timelock elapsed'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSimulatorStep(3)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: simulatorStep >= 3 ? 'rgba(36, 44, 36, 0.7)' : 'rgba(20, 24, 20, 0.4)',
                border: simulatorStep === 3 ? (simulatorScenario === 'success' ? '1px solid var(--semantic-green)' : '1px solid var(--semantic-amber)') : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: simulatorStep === 3 ? '0 0 16px rgba(52, 211, 153, 0.15)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: simulatorScenario === 'success' ? 'var(--semantic-green)' : 'var(--semantic-amber)', fontWeight: 800 }}>
                  STEP 03
                </span>
                <span className={`step-indicator-pill ${simulatorStep === 3 ? 'active' : 'inactive'}`}>
                  3
                </span>
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, marginTop: '6px' }}>
                {simulatorScenario === 'success' ? 'Referrer Clicks Claim' : 'Business Clicks Reclaim'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {simulatorScenario === 'success' ? 'Referrer claims escrow reward' : 'Business recovers unspent deposit'}
              </div>
            </button>
          </div>

          {/* Visual Flow Representation */}
          <div
            style={{
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(14, 18, 14, 0.7)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Visual Box Diagram */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr auto 1fr',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'center',
              }}
            >
              {/* Business Box */}
              <div
                style={{
                  padding: '20px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  border: simulatorStep === 1 ? '1px solid var(--accent-lime)' : '1px solid var(--border-card)',
                  boxShadow: simulatorStep === 1 ? '0 0 20px rgba(184, 243, 107, 0.2)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Business Account
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                  Acme Protocol
                </div>
                <div style={{ fontSize: '12px', color: simulatorStep === 1 ? 'var(--accent-lime)' : 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
                  {simulatorStep === 1 ? 'Deposited $50 USDC' : simulatorScenario === 'refund' && simulatorStep === 3 ? 'Refunded $50 USDC' : 'Funds in vault'}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight size={20} style={{ color: 'var(--accent-lime)', opacity: 0.6 }} />

              {/* Vault Box */}
              <div
                style={{
                  padding: '20px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  border: simulatorStep === 2 ? '1px solid var(--accent-blue)' : '1px solid var(--border-card)',
                  boxShadow: simulatorStep === 2 ? '0 0 25px rgba(112, 183, 255, 0.25)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Smart Escrow Vault
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {simulatorStep === 3 ? (simulatorScenario === 'success' ? '$0.00 (Disbursed)' : '$0.00 (Reclaimed)') : '$50.00 USDC'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {simulatorStep === 1 && '🔒 Locked for Referrer'}
                  {simulatorStep === 2 && (simulatorScenario === 'success' ? '⚡ Payment Confirmed' : '⏰ Deadline Elapsed')}
                  {simulatorStep === 3 && '✓ Vault Settled'}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight size={20} style={{ color: 'var(--accent-blue)', opacity: 0.6 }} />

              {/* Referrer Box */}
              <div
                style={{
                  padding: '20px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  border: simulatorStep === 3 && simulatorScenario === 'success' ? '1px solid var(--semantic-green)' : '1px solid var(--border-card)',
                  boxShadow: simulatorStep === 3 && simulatorScenario === 'success' ? '0 0 25px rgba(52, 211, 153, 0.25)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Referrer Wallet
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                  Sarah (Partner)
                </div>
                <div style={{ fontSize: '12px', color: simulatorStep === 3 && simulatorScenario === 'success' ? 'var(--semantic-green)' : 'var(--text-secondary)', marginTop: '4px', fontWeight: simulatorStep === 3 ? 700 : 500 }}>
                  {simulatorStep === 3 && simulatorScenario === 'success'
                    ? '+$50.00 USDC Received! 🎉'
                    : simulatorScenario === 'refund' && simulatorStep === 3
                      ? 'No payout (Timed out)'
                      : 'Awaiting verified deal'}
                </div>
              </div>
            </div>

            {/* Explanation banner for active simulator step */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', flex: 1, minWidth: '260px' }}>
                {simulatorStep === 1 && (
                  <span>
                    👉 <strong>What just happened:</strong> Acme Protocol registers their product and deposits $50 USDC into a timelocked escrow contract. Sarah receives her tracked referral link showing the funds are physically locked.
                  </span>
                )}
                {simulatorStep === 2 && simulatorScenario === 'success' && (
                  <span>
                    👉 <strong>What just happened:</strong> A customer purchases via Sarah’s link. The customer payment is confirmed (or simulated via the demo button), unlocking the reward in the Escrow Vault for Sarah.
                  </span>
                )}
                {simulatorStep === 2 && simulatorScenario === 'refund' && (
                  <span>
                    👉 <strong>What just happened:</strong> The 14-day campaign deadline passed without qualifying sales. The timelock condition unlocks refund eligibility.
                  </span>
                )}
                {simulatorStep === 3 && simulatorScenario === 'success' && (
                  <span>
                    👉 <strong>What just happened:</strong> Sarah clicks <strong>Claim</strong> in her referrer dashboard. The Stellar transaction settles in ~3 seconds, sending $50 USDC directly from the escrow contract to her wallet. Zero manual invoicing.
                  </span>
                )}
                {simulatorStep === 3 && simulatorScenario === 'refund' && (
                  <span>
                    👉 <strong>What just happened:</strong> Acme clicks "Reclaim" and recovers 100% of the $50 USDC immediately back to their Stellar wallet.
                  </span>
                )}
              </div>

              {/* Next Button */}
              {simulatorStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setSimulatorStep((simulatorStep + 1) as 2 | 3)}
                  style={{ gap: '6px', whiteSpace: 'nowrap' }}
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSimulatorStep(1)}
                  style={{ gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <RotateCcw size={13} /> Reset Demo
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3.5 Protocol Architecture Flow: 3-Step High-End Architecture */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto 90px',
          padding: '0 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              color: 'var(--accent-lime)',
              fontWeight: 800,
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}
          >
            END-TO-END WORKFLOW
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', fontFamily: 'var(--font-display)' }}>
            How Rewalf Eliminates Trust Issues
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15.5px', maxWidth: '640px', margin: '8px auto 0' }}>
            Built from first principles: money is held by mathematical smart contracts, never by middlemen or delayed accounting spreadsheets.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Card 1 */}
          <div className="feature-grid-item">
            <div className="feature-icon-wrap">
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--accent-lime)', fontWeight: 800, letterSpacing: '0.04em' }}>01 / PROTOCOL SETUP</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                Register Website & Deposit Escrow
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Businesses register their website URL, define reward rates (e.g. $50 USDC per conversion), and fund the campaign escrow directly with a timelock deadline.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--accent-lime)' }}>
              <Lock size={13} /> Timelocked & Reclaimable
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-grid-item">
            <div className="feature-icon-wrap" style={{ background: 'linear-gradient(135deg, rgba(112, 183, 255, 0.15) 0%, rgba(184, 243, 107, 0.08) 100%)', borderColor: 'rgba(112, 183, 255, 0.3)', color: 'var(--accent-blue)', boxShadow: '0 0 16px rgba(112, 183, 255, 0.15)' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 800, letterSpacing: '0.04em' }}>02 / PROMOTER DISTRIBUTION</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                Self-Serve Tracked Referral Links
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Affiliates and promoters generate custom referral links with their wallet address attached. Clicking immediately routes buyers to the business site with referral attribution.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--accent-blue)' }}>
              <Zap size={13} /> Instant Link Creation
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-grid-item">
            <div className="feature-icon-wrap" style={{ background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(112, 183, 255, 0.08) 100%)', borderColor: 'rgba(52, 211, 153, 0.3)', color: 'var(--semantic-green)', boxShadow: '0 0 16px rgba(52, 211, 153, 0.15)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--semantic-green)', fontWeight: 800, letterSpacing: '0.04em' }}>03 / ON-CHAIN SETTLEMENT</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                Referrer Claim & Business Reclaim
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Once customer payment is confirmed, the referrer clicks Claim to transfer the reward directly from the Escrow Vault to their wallet. If the deadline passes without payment, the business clicks Reclaim to return the deposit.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--semantic-green)' }}>
              <ShieldCheck size={13} /> Non-Custodial Escrow Vault
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real Story Section: Relatable Plain English Story */}
      <section
        id="story"
        style={{
          maxWidth: '1050px',
          margin: '0 auto 80px',
          padding: '0 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              color: 'var(--accent-lime)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}
          >
            REAL WORLD STORY
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Why Alice and Bob both love Rewalf
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '620px', margin: '8px auto 0' }}>
            A quick story showing how Rewalf protects both sides of every referral partnership.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Bob's Perspective (Referrer) */}
          <div
            style={{
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--accent-lime-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-lime)',
                  fontWeight: 700,
                  fontSize: '16px',
                }}
              >
                B
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Bob’s View (The Referrer)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Affiliate Marketer / Agency Partner</p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
              <em>"In past affiliate programs, I worked hard bringing customers to companies, only for them to take 3 months to pay me, or make up an excuse and never pay at all."</em>
            </p>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-input)', border: '1px solid var(--accent-lime-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-lime)', marginBottom: '4px' }}>
                With Rewalf:
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                Bob opens his unique link. He sees the <strong>$100 reward already sitting in the vault</strong>. He knows Alice can’t take it back early. He starts promoting with complete confidence.
              </p>
            </div>
          </div>

          {/* Alice's Perspective (Business) */}
          <div
            style={{
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--accent-blue-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  fontWeight: 700,
                  fontSize: '16px',
                }}
              >
                A
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Alice’s View (The Business)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Founder of SaaS / Digital Product</p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
              <em>"I want to motivate partners to bring us paying customers, but I cannot pay upfront commissions before someone actually buys our product."</em>
            </p>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-input)', border: '1px solid var(--accent-blue-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '4px' }}>
                With Rewalf:
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                Alice locks the $100 bounty with a 14-day deadline. If Bob brings a paying customer, Bob <strong>clicks Claim</strong> and receives $100 in seconds via Stellar. If no one buys, Alice simply <strong>clicks Reclaim and gets her $100 back</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Who It's For: Clear Audience Use Cases */}
      <section
        id="use-cases"
        style={{
          maxWidth: '1050px',
          margin: '0 auto 80px',
          padding: '0 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Who benefits from Rewalf?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginTop: '6px' }}>
            Designed for anyone who wants high-trust word-of-mouth partnerships.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-card)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-lime-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-lime)',
                marginBottom: '14px',
              }}
            >
              <Building2 size={18} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Software & SaaS Teams
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Motivate top affiliates to send enterprise and subscription leads by locking verified bounties upfront in USDC.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-card)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-blue-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
                marginBottom: '14px',
              }}
            >
              <Users size={18} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Agencies & Freelancers
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Introduce clients to partner agencies with guaranteed referral fees backed by escrow rather than vague handshake promises.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-card)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--semantic-green-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--semantic-green)',
                marginBottom: '14px',
              }}
            >
              <TrendingUp size={18} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Creators & Promoters
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Promote products to your audience knowing that 100% of your payout is already secured in a vault you can verify anytime.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section: Friendly, Non-Jargon Q&A */}
      <section
        id="faq"
        style={{
          maxWidth: '850px',
          margin: '0 auto 80px',
          padding: '0 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginTop: '6px' }}>
            Straightforward answers without confusing jargon.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-card)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: isOpen ? 'var(--accent-lime)' : 'var(--text-tertiary)',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}
                  />
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 20px',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '14px',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section
        style={{
          maxWidth: '1050px',
          margin: '0 auto 80px',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            padding: '50px 32px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(184, 243, 107, 0.12) 0%, rgba(27, 32, 27, 0.95) 100%)',
            border: '1px solid var(--accent-lime-border)',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 38px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '14px',
            }}
          >
            Ready to explore the dashboard?
          </h2>
          <p
            style={{
              fontSize: '15.5px',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 28px',
            }}
          >
            Create an agreement, test the referrer Claim portal, and see the trustless escrow mechanics in action.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onLaunchApp}
              className="btn btn-primary"
              style={{
                padding: '14px 30px',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 0 25px rgba(184, 243, 107, 0.35)',
              }}
            >
              Open Protocol Dashboard <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Friendly Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '36px 24px',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div className="brand-logo-badge" style={{ width: '22px', height: '22px', fontSize: '11px' }}>R</div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Rewalf</span>
          <span>•</span>
          <span>Trustless Referral Payouts on Stellar</span>
        </div>
        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '12px' }}>
          Non-custodial smart escrow infrastructure. Private keys remain with you.
        </p>
      </footer>
    </div>
  );
};
