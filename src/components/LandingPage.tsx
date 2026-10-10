import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Users,
  Building2,
  TrendingUp,
  RotateCcw,
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
      a: 'Not at all. You just connect a Stellar wallet (like Freighter or Albedo with one click) or use the built-in demo sandbox. Everything is designed like a regular, clean payment app. You set a dollar or token amount, set a deadline, and the system handles the escrow vault automatically.',
    },
    {
      q: 'Can a business take their money back before the referral happens?',
      a: 'No. That is the core safety feature. Once a business locks a reward into an escrow vault, the funds are held securely until the deadline. The business cannot withdraw the funds early, which gives the referrer complete confidence that the reward will be there when the deal closes.',
    },
    {
      q: 'How fast does the referrer get paid when a customer buys?',
      a: 'In about 3 to 5 seconds. Because Rewalf runs on the Stellar network, payouts settle almost instantly directly into the referrer’s wallet, with fees that cost a fraction of a cent.',
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
    <div className="landing-container" style={{ minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* 1. Header Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(17, 20, 17, 0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div className="brand-logo-badge">R</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Rewalf
            </span>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-lime-subtle)',
                color: 'var(--accent-lime)',
                border: '1px solid var(--accent-lime-border)',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              TRUSTLESS REFERRALS
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
            Live Demo
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
              padding: '8px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(184, 243, 107, 0.25)',
            }}
          >
            Open App <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section: Clear, Human, Welcoming */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '70px 24px 50px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Glow ambient background aura */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(184, 243, 107, 0.08) 0%, rgba(17, 20, 17, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Simple status pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-card)',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-lime)',
                boxShadow: '0 0 8px var(--accent-lime)',
                display: 'inline-block',
              }}
            />
            <span>Instant & Guaranteed Referral Payouts</span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <span style={{ color: 'var(--accent-lime)' }}>Powered by Stellar Escrow</span>
          </div>

          {/* Natural Human Headline */}
          <h1
            style={{
              fontSize: 'clamp(34px, 5.5vw, 62px)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
              maxWidth: '920px',
              margin: '0 auto 20px',
            }}
          >
            Referral rewards that pay out{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #B8F36B 0%, #70B7FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              automatically
            </span>{' '}
            when customers buy.
          </h1>

          {/* Conversational Explanation */}
          <p
            style={{
              fontSize: 'clamp(16px, 1.8vw, 19px)',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              maxWidth: '740px',
              margin: '0 auto 36px',
            }}
          >
            No unpaid invoices. No chasing payments for 60 days.
            Businesses lock reward money into a secure digital vault upfront.
            When a referred customer completes their purchase, the referrer gets paid instantly.
            If nobody buys before the deadline, the business gets 100% of their money back.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onLaunchApp}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 0 25px rgba(184, 243, 107, 0.3)',
              }}
            >
              Launch Dashboard <ArrowRight size={17} />
            </button>

            <a
              href="#simulator"
              className="btn btn-outline"
              style={{
                padding: '14px 24px',
                fontSize: '15px',
                textDecoration: 'none',
              }}
            >
              Try 10-Second Demo ↓
            </a>
          </div>
        </div>
      </section>

      {/* 3. Interactive 10-Second Simulator Widget */}
      <section
        id="simulator"
        style={{
          maxWidth: '960px',
          margin: '20px auto 70px',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            padding: '32px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-card)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-lime)', fontWeight: 700, letterSpacing: '0.08em' }}>
                INTERACTIVE SIMULATOR
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                See how Rewalf works in 10 seconds:
              </h2>
            </div>

            {/* Toggle Scenario */}
            <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  setSimulatorScenario('success');
                  setSimulatorStep(1);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: simulatorScenario === 'success' ? 'var(--surface-subtle)' : 'transparent',
                  color: simulatorScenario === 'success' ? 'var(--accent-lime)' : 'var(--text-secondary)',
                }}
              >
                Happy Path (Deal Closed)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulatorScenario('refund');
                  setSimulatorStep(1);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: simulatorScenario === 'refund' ? 'var(--surface-subtle)' : 'transparent',
                  color: simulatorScenario === 'refund' ? 'var(--semantic-amber)' : 'var(--text-secondary)',
                }}
              >
                No Deal (Automatic Refund)
              </button>
            </div>
          </div>

          {/* Interactive Steps Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
            <button
              type="button"
              onClick={() => setSimulatorStep(1)}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: simulatorStep >= 1 ? 'var(--surface-subtle)' : 'transparent',
                border: simulatorStep === 1 ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--accent-lime)', fontWeight: 700 }}>STEP 1</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>Business Locks $50</div>
            </button>

            <button
              type="button"
              onClick={() => setSimulatorStep(2)}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: simulatorStep >= 2 ? 'var(--surface-subtle)' : 'transparent',
                border: simulatorStep === 2 ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700 }}>STEP 2</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                {simulatorScenario === 'success' ? 'Customer Pays' : 'Deadline Passes'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSimulatorStep(3)}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: simulatorStep >= 3 ? 'var(--surface-subtle)' : 'transparent',
                border: simulatorStep === 3 ? (simulatorScenario === 'success' ? '1px solid var(--semantic-green)' : '1px solid var(--semantic-amber)') : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '11px', color: simulatorScenario === 'success' ? 'var(--semantic-green)' : 'var(--semantic-amber)', fontWeight: 700 }}>
                STEP 3
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                {simulatorScenario === 'success' ? 'Referrer Gets Paid' : 'Business Reclaims $50'}
              </div>
            </button>
          </div>

          {/* Visual Flow Animation Representation */}
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-input)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Visual Box Diagram */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr auto 1fr',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              {/* Business Box */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  border: simulatorStep === 1 ? '1px solid var(--accent-lime)' : '1px solid var(--border-card)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Business Account
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  Acme SaaS
                </div>
                <div style={{ fontSize: '12px', color: simulatorStep === 1 ? 'var(--accent-lime)' : 'var(--text-secondary)', marginTop: '4px' }}>
                  {simulatorStep === 1 ? 'Deposited $50 USDC' : simulatorScenario === 'refund' && simulatorStep === 3 ? 'Refunded $50 USDC' : 'Funds sent to vault'}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight size={18} style={{ color: 'var(--text-tertiary)' }} />

              {/* Vault Box */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  border: simulatorStep === 2 ? '1px solid var(--accent-blue)' : '1px solid var(--border-card)',
                  boxShadow: simulatorStep === 2 ? '0 0 15px rgba(112, 183, 255, 0.2)' : 'none',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Secure Escrow Vault
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {simulatorStep === 3 ? (simulatorScenario === 'success' ? '$0.00 (Paid Out)' : '$0.00 (Refunded)') : '$50.00 USDC'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {simulatorStep === 1 && '🔒 Locked for Referrer'}
                  {simulatorStep === 2 && (simulatorScenario === 'success' ? '⚡ Customer Payment Confirmed' : '⏰ 7-Day Deadline Elapsed')}
                  {simulatorStep === 3 && '✓ Vault Empty (Closed)'}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight size={18} style={{ color: 'var(--text-tertiary)' }} />

              {/* Referrer Box */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  border: simulatorStep === 3 && simulatorScenario === 'success' ? '1px solid var(--semantic-green)' : '1px solid var(--border-card)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Referrer Wallet
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  Sarah (Partner)
                </div>
                <div style={{ fontSize: '12px', color: simulatorStep === 3 && simulatorScenario === 'success' ? 'var(--semantic-green)' : 'var(--text-secondary)', marginTop: '4px', fontWeight: simulatorStep === 3 ? 700 : 400 }}>
                  {simulatorStep === 3 && simulatorScenario === 'success'
                    ? '+$50.00 USDC Arrived! 🎉'
                    : simulatorScenario === 'refund' && simulatorStep === 3
                    ? 'No payout (Deal timed out)'
                    : 'Awaiting completion'}
                </div>
              </div>
            </div>

            {/* Explanation banner for the active simulator step */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                {simulatorStep === 1 && (
                  <span>
                    👉 <strong>What just happened:</strong> Acme SaaS creates the referral program and deposits $50 USDC into an escrow account. Sarah gets a link showing the money is waiting for her.
                  </span>
                )}
                {simulatorStep === 2 && simulatorScenario === 'success' && (
                  <span>
                    👉 <strong>What just happened:</strong> A customer buys through Sarah’s link. The system detects the purchase and marks the deal completed.
                  </span>
                )}
                {simulatorStep === 2 && simulatorScenario === 'refund' && (
                  <span>
                    👉 <strong>What just happened:</strong> 7 days passed without any customer purchase. The deadline timelock has officially expired.
                  </span>
                )}
                {simulatorStep === 3 && simulatorScenario === 'success' && (
                  <span>
                    👉 <strong>What just happened:</strong> Sarah clicks "Claim" and receives the $50 USDC directly in her wallet in 3 seconds. Zero waiting. Zero chasing invoices.
                  </span>
                )}
                {simulatorStep === 3 && simulatorScenario === 'refund' && (
                  <span>
                    👉 <strong>What just happened:</strong> Acme SaaS clicks "Reclaim" and receives 100% of their $50 USDC back. Zero money wasted.
                  </span>
                )}
              </div>

              {/* Next Button */}
              {simulatorStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setSimulatorStep((simulatorStep + 1) as 2 | 3)}
                  style={{ gap: '6px', whiteSpace: 'nowrap', marginLeft: '16px' }}
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSimulatorStep(1)}
                  style={{ gap: '6px', whiteSpace: 'nowrap', marginLeft: '16px' }}
                >
                  <RotateCcw size={13} /> Reset Demo
                </button>
              )}
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
              <em>"In past affiliate programs, I worked hard bringing customers to companies, only for them to take 3 months to pay me — or make up an excuse and never pay at all."</em>
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
                Alice locks the $100 bounty with a 14-day deadline. If Bob brings a paying customer, Bob gets paid automatically. If no one buys, Alice simply <strong>clicks Reclaim and gets her $100 back</strong>.
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
            Create an agreement, test the referrer claim portal, and see the automated escrow mechanics in action.
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
