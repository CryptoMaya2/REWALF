import React, { useState, useMemo, useEffect } from 'react';
import type { Agreement, ConnectedWallet, VerifiedConversion, ReferrerPerformance } from '../stellar/types';
import { getStellarExpertAccountUrl } from '../stellar/stellarService';
import {
  updateBusinessTargetUrl,
  verifyCustomerConversion,
  getReferrersPerformanceList,
  generatePromoterCampaignLink,
} from '../store/agreementStore';
import {
  Search,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Layers,
  ShieldCheck,
  TrendingUp,
  Users,
  CheckCircle2,
  DollarSign,
  Edit3,
  Zap,
  Globe,
  Lock,
  X,
  AlertTriangle,
  ArrowRight,
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

type SubTab = 'campaigns' | 'leaderboard' | 'conversions' | 'marketplace';

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  agreements,
  connectedWallet,
  onOpenCreateModal,
  onInspectProgram,
  onNavigateToReferrer,
  onSelectForTrace,
  initialFilter = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [assetFilter, setAssetFilter] = useState<'all' | 'USDC' | 'XLM'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Edit Business Link Modal state
  const [editingTargetUrl, setEditingTargetUrl] = useState<{ code: string; url: string; name: string } | null>(null);
  const [newUrlInput, setNewUrlInput] = useState('');

  // Conversion Verification Modal state
  const [testConversionModal, setTestConversionModal] = useState<Agreement | null>(null);
  const [testOrderId, setTestOrderId] = useState('');
  const [testCustomerLabel, setTestCustomerLabel] = useState('');
  const [testReferrerAddr, setTestReferrerAddr] = useState('');
  const [testVerificationMethod, setTestVerificationMethod] = useState<'sdk_client' | 'hmac_webhook'>('hmac_webhook');
  const [conversionFeedback, setConversionFeedback] = useState<{ success: boolean; msg: string; fraudAlert?: string } | null>(null);

  // Join Campaign / Generate Promoter Link Modal state
  const [joinCampaignModal, setJoinCampaignModal] = useState<Agreement | null>(null);
  const [promoterWalletInput, setPromoterWalletInput] = useState('');
  const [generatedPromoterLink, setGeneratedPromoterLink] = useState<Agreement | null>(null);
  const [promoterLinkError, setPromoterLinkError] = useState<string | null>(null);

  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Aggregated Escrow & Budget Calculations
  const metrics = useMemo(() => {
    let totalUsdcDeposited = 0;
    let totalUsdcRemaining = 0;
    let totalUsdcExpenses = 0;

    let totalXlmDeposited = 0;
    let totalXlmRemaining = 0;
    let totalXlmExpenses = 0;

    let totalConversions = 0;
    let totalClicks = 0;

    agreements.forEach((a) => {
      const budget = parseFloat(a.totalBudget || a.amount || '0');
      const remaining = parseFloat(a.remainingBudget !== undefined ? a.remainingBudget : (a.state === 'PAID' || a.state === 'CLAIMED' ? '0' : a.amount));
      const claimed = parseFloat(a.claimedAmount || (a.state === 'CLAIMED' ? a.amount : '0'));

      if (a.assetCode === 'USDC') {
        totalUsdcDeposited += budget;
        totalUsdcRemaining += remaining;
        totalUsdcExpenses += claimed;
      } else {
        totalXlmDeposited += budget;
        totalXlmRemaining += remaining;
        totalXlmExpenses += claimed;
      }

      totalConversions += a.conversionsCount || (a.conversions?.length || 0);
      totalClicks += a.clicksCount || 0;
    });

    return {
      usdc: { deposited: totalUsdcDeposited, remaining: totalUsdcRemaining, expenses: totalUsdcExpenses },
      xlm: { deposited: totalXlmDeposited, remaining: totalXlmRemaining, expenses: totalXlmExpenses },
      totalConversions,
      totalClicks,
    };
  }, [agreements]);

  // Referrer Performance List
  const referrerPerformances: ReferrerPerformance[] = useMemo(() => {
    return getReferrersPerformanceList(agreements);
  }, [agreements]);

  // All Verified Conversions flattened
  const allVerifiedConversions: VerifiedConversion[] = useMemo(() => {
    const list: VerifiedConversion[] = [];
    agreements.forEach((a) => {
      if (a.conversions) {
        list.push(...a.conversions);
      }
    });
    return list.sort((a, b) => b.verifiedAt - a.verifiedAt);
  }, [agreements]);

  // Filtered Agreements for Campaigns view
  const filteredAgreements = useMemo(() => {
    return agreements.filter((a) => {
      const matchesSearch =
        a.customerLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.businessName && a.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.targetUrl && a.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
        a.referrerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.escrowPublicKey.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (assetFilter !== 'all' && a.assetCode !== assetFilter) {
        return false;
      }

      if (statusFilter === 'all') return true;
      if (statusFilter === 'locked') return a.state === 'LOCKED' && a.deadline > currentTime;
      if (statusFilter === 'paid') return a.state === 'PAID';
      if (statusFilter === 'claimed') return a.state === 'CLAIMED';
      if (statusFilter === 'reclaimed') return a.state === 'RECLAIMED';
      if (statusFilter === 'expired') return a.state === 'LOCKED' && a.deadline <= currentTime;

      return true;
    });
  }, [agreements, searchQuery, statusFilter, assetFilter, currentTime]);

  const handleSaveTargetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTargetUrl) return;

    if (!newUrlInput.trim().startsWith('http')) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }

    updateBusinessTargetUrl(editingTargetUrl.code, newUrlInput.trim());
    setEditingTargetUrl(null);
  };

  const handleVerifyConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testConversionModal) return;

    setConversionFeedback(null);

    const res = verifyCustomerConversion({
      campaignCode: testConversionModal.code,
      orderId: testOrderId.trim(),
      customerLabel: testCustomerLabel.trim() || undefined,
      referrerAddress: testReferrerAddr.trim() || undefined,
      verificationMethod: testVerificationMethod,
      callerAddress: connectedWallet?.publicKey,
    });

    if (res.success && res.conversion) {
      setConversionFeedback({
        success: true,
        msg: `Verified Order #${res.conversion.orderId} successfully! Credited ${res.conversion.rewardAmount} ${res.conversion.assetCode} to referrer. Escrow balance debited.`,
      });
      setTestOrderId('');
      setTestCustomerLabel('');
    } else {
      setConversionFeedback({
        success: false,
        msg: res.error || 'Verification failed.',
        fraudAlert: res.fraudAlert,
      });
    }
  };

  const handleGeneratePromoterLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCampaignModal) return;

    setPromoterLinkError(null);
    const promoterAddr = promoterWalletInput.trim();

    if (!promoterAddr.startsWith('G') || promoterAddr.length !== 56) {
      setPromoterLinkError('Please enter a valid 56-character Stellar public address starting with G.');
      return;
    }

    try {
      const created = generatePromoterCampaignLink(joinCampaignModal.code, promoterAddr);
      if (created) {
        setGeneratedPromoterLink(created);
      }
    } catch (err: any) {
      setPromoterLinkError(err.message || 'Failed to generate promoter referral link.');
    }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-badge badge-active" style={{ fontSize: '11px' }}>
              Business Referral Marketplace
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Non-Custodial Escrows on Stellar
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginTop: '2px' }}>
            Referral Campaigns & Escrow Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Create campaigns, attach target website links, fund escrow balances, and reward verified customer results.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onOpenCreateModal}
        >
          <Plus size={15} />
          Create Referral Campaign
        </button>
      </div>

      {/* KPI METRIC CARDS: Escrow Balances & Budgets */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Escrow Deposited</span>
            <Lock size={15} color="var(--accent-lime)" />
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-lime)' }}>
            {metrics.usdc.deposited.toFixed(2)} <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>USDC</span>
          </div>
          <div className="kpi-subtext" style={{ fontFamily: 'var(--font-mono)' }}>
            + {metrics.xlm.deposited.toFixed(0)} XLM native
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Remaining Escrow Balance</span>
            <DollarSign size={15} color="var(--semantic-green)" />
          </div>
          <div className="kpi-value" style={{ color: 'var(--semantic-green)' }}>
            {metrics.usdc.remaining.toFixed(2)} <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>USDC</span>
          </div>
          <div className="kpi-subtext" style={{ fontFamily: 'var(--font-mono)' }}>
            + {metrics.xlm.remaining.toFixed(0)} XLM locked in vaults
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Campaign Expenses Paid</span>
            <TrendingUp size={15} color="var(--accent-blue)" />
          </div>
          <div className="kpi-value">
            {metrics.usdc.expenses.toFixed(2)} <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>USDC</span>
          </div>
          <div className="kpi-subtext">
            Paid to verified promoters on-chain
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Verified Customer Results</span>
            <ShieldCheck size={15} color="var(--accent-lime)" />
          </div>
          <div className="kpi-value">
            {metrics.totalConversions} <span style={{ fontSize: '13px', color: 'var(--accent-lime)', fontWeight: 600 }}>Sales Verified</span>
          </div>
          <div className="kpi-subtext">
            Across {metrics.totalClicks} tracked referral clicks
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '24px',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          style={{
            padding: '10px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'campaigns' ? '2px solid var(--accent-lime)' : '2px solid transparent',
            color: activeTab === 'campaigns' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: activeTab === 'campaigns' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Layers size={16} color={activeTab === 'campaigns' ? 'var(--accent-lime)' : undefined} />
          Referral Campaigns ({agreements.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          style={{
            padding: '10px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'leaderboard' ? '2px solid var(--accent-lime)' : '2px solid transparent',
            color: activeTab === 'leaderboard' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: activeTab === 'leaderboard' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} color={activeTab === 'leaderboard' ? 'var(--accent-lime)' : undefined} />
          Referrer Performance Leaderboard ({referrerPerformances.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conversions')}
          style={{
            padding: '10px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'conversions' ? '2px solid var(--accent-lime)' : '2px solid transparent',
            color: activeTab === 'conversions' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: activeTab === 'conversions' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} color={activeTab === 'conversions' ? 'var(--accent-lime)' : undefined} />
          Verified Conversions Ledger ({allVerifiedConversions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marketplace')}
          style={{
            padding: '10px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'marketplace' ? '2px solid var(--accent-lime)' : '2px solid transparent',
            color: activeTab === 'marketplace' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: activeTab === 'marketplace' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Zap size={16} color={activeTab === 'marketplace' ? 'var(--semantic-amber)' : undefined} />
          Promoter Marketplace & Link Generator
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS & ESCROWS */}
      {activeTab === 'campaigns' && (
        <div>
          {/* Search & Filter Bar */}
          <div
            className="card"
            style={{
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
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
                placeholder="Search campaigns, target links, codes, or vaults..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${agreements.length})` },
                { id: 'locked', label: 'Active Escrow' },
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

          {/* Campaigns Table */}
          {filteredAgreements.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Layers size={22} />
                </div>
                <h3>No Referral Campaigns Match Your Filter</h3>
                <p>Try resetting the search terms or create a new referral campaign.</p>
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
                    <th>Campaign & Target URL</th>
                    <th>Escrow Budget Progress</th>
                    <th>Reward per Sale</th>
                    <th>Results (Clicks / Sales)</th>
                    <th>State & Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgreements.map((a) => {
                    const isExp = a.deadline <= currentTime;
                    const budget = parseFloat(a.totalBudget || a.amount || '0');
                    const remaining = parseFloat(a.remainingBudget !== undefined ? a.remainingBudget : (a.state === 'PAID' || a.state === 'CLAIMED' ? '0' : a.amount));
                    const claimed = parseFloat(a.claimedAmount || (a.state === 'CLAIMED' ? a.amount : '0'));
                    const spentPct = budget > 0 ? Math.min(100, Math.round((claimed / budget) * 100)) : 0;
                    const destinationUrl = a.targetUrl || a.businessWebsite || 'https://rewalf.vercel.app';
                    const fullReferralLink = `${destinationUrl}${destinationUrl.includes('?') ? '&' : '?'}ref=${a.code}`;

                    return (
                      <tr key={a.code}>
                        {/* Campaign & Target URL */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {a.customerLabel}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {a.businessName || 'Protocol Partner'} • <span className="font-mono">#{a.code}</span>
                          </div>

                          {/* Business Target Destination Link with Edit button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <Globe size={11} color="var(--accent-blue)" />
                            <a
                              href={fullReferralLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--accent-blue)',
                                textDecoration: 'none',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={`Customer Redirect URL: ${fullReferralLink}`}
                            >
                              {destinationUrl.replace(/^https?:\/\//, '')}
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTargetUrl({ code: a.code, url: destinationUrl, name: a.customerLabel });
                                setNewUrlInput(destinationUrl);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                              title="Update Business Destination URL"
                            >
                              <Edit3 size={11} />
                            </button>
                          </div>
                        </td>

                        {/* Escrow Budget Progress Bar */}
                        <td>
                          <div style={{ minWidth: '150px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                              <span style={{ color: 'var(--semantic-green)', fontWeight: 600 }}>
                                {remaining.toFixed(2)} {a.assetCode} left
                              </span>
                              <span style={{ color: 'var(--text-tertiary)' }}>
                                {claimed.toFixed(2)} / {budget.toFixed(2)} {a.assetCode}
                              </span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: '6px',
                                background: 'var(--surface-input)',
                                borderRadius: 'var(--radius-full)',
                                overflow: 'hidden',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <div
                                style={{
                                  width: `${spentPct}%`,
                                  height: '100%',
                                  background: remaining === 0 ? 'var(--semantic-amber)' : 'var(--accent-lime)',
                                  borderRadius: 'var(--radius-full)',
                                }}
                              />
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                              Vault: <span className="font-mono">{a.escrowPublicKey.slice(0, 4)}...{a.escrowPublicKey.slice(-4)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Reward per sale */}
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--accent-lime)' }}>
                            {a.rewardPerConversion || a.amount}
                          </span>{' '}
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {a.assetCode}
                          </span>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>per verified customer</div>
                        </td>

                        {/* Results: Clicks & Verified Sales */}
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{a.conversionsCount || (a.conversions?.length || 0)}</strong>{' '}
                            <span style={{ color: 'var(--text-secondary)' }}>sales</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {a.clicksCount || 0} visits (
                            {a.clicksCount && a.clicksCount > 0
                              ? (((a.conversionsCount || 0) / a.clicksCount) * 100).toFixed(1)
                              : '0'}
                            % CR)
                          </div>
                        </td>

                        {/* State & Expiry */}
                        <td>
                          <span className={`status-badge badge-${a.state.toLowerCase()}`} style={{ fontSize: '11px' }}>
                            {remaining === 0 && a.state === 'PAID' ? 'CAP EXHAUSTED' : a.state}
                          </span>
                          <div style={{ fontSize: '11px', color: isExp ? 'var(--semantic-red)' : 'var(--text-tertiary)', marginTop: '3px' }}>
                            {isExp ? 'Expired' : new Date(a.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 7px', fontSize: '11px' }}
                              onClick={() => {
                                setTestConversionModal(a);
                                setTestOrderId(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
                                setTestCustomerLabel(a.customerLabel);
                                setTestReferrerAddr(a.referrerAddress);
                                setConversionFeedback(null);
                              }}
                              title="Test Authenticated Conversion Verification"
                            >
                              <ShieldCheck size={11} color="var(--accent-lime)" />
                              Verify Sale
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 7px', fontSize: '11px' }}
                              onClick={() => onNavigateToReferrer(a.code)}
                              title="Open Promoter Referral Portal"
                            >
                              Portal
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 7px', fontSize: '11px' }}
                              onClick={() => onInspectProgram(a)}
                              title="Inspect Program Drawer"
                            >
                              Inspect
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 7px', fontSize: '11px' }}
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
      )}

      {/* TAB 2: REFERRER PERFORMANCE LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div>
          <div className="card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} color="var(--accent-lime)" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Which Promoters Bring Actual Paying Customers
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Track referrer attribution, visit clicks, verified transactions, conversion efficiency, and paid bounties.
                </p>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank & Promoter Wallet</th>
                  <th>Campaign / Offering</th>
                  <th>Traffic Clicks</th>
                  <th>Verified Customers</th>
                  <th>Conversion Rate</th>
                  <th>Total Earned & Paid</th>
                  <th>Attribution Link</th>
                </tr>
              </thead>
              <tbody>
                {referrerPerformances.map((ref, idx) => (
                  <tr key={`${ref.referrerAddress}_${ref.campaignCode}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: idx === 0 ? 'var(--accent-lime-subtle)' : 'var(--surface-input)',
                            color: idx === 0 ? 'var(--accent-lime)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: 600 }}>
                            {ref.referrerAddress.slice(0, 6)}...{ref.referrerAddress.slice(-6)}
                          </span>
                          <a
                            href={getStellarExpertAccountUrl(ref.referrerAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--text-tertiary)', marginLeft: '4px' }}
                          >
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '12.5px' }}>{ref.campaignTitle}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{ref.businessName}</div>
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{ref.clicks}</span> visits
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13.5px', color: 'var(--accent-lime)' }}>
                        {ref.conversions}
                      </span>{' '}
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>paying clients</span>
                    </td>

                    <td>
                      <span
                        className="status-badge badge-active"
                        style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                      >
                        {ref.conversionRate}% CR
                      </span>
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--semantic-green)' }}>
                        {ref.totalEarned} {ref.assetCode}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => onNavigateToReferrer(ref.campaignCode)}
                      >
                        /r/{ref.campaignCode}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIED CONVERSIONS AUDIT LEDGER */}
      {activeTab === 'conversions' && (
        <div>
          <div className="card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="var(--accent-lime)" />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Cryptographic Verified Conversions Audit Ledger
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Every conversion verified via Client SDK or signed HMAC Webhook. Replay and duplicate transactions are strictly rejected.
                  </p>
                </div>
              </div>

              <span className="status-badge badge-locked" style={{ fontSize: '11px' }}>
                Zero Vanity Clicks • Verified Results Only
              </span>
            </div>
          </div>

          {allVerifiedConversions.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <CheckCircle2 size={24} color="var(--accent-lime)" />
                <h3>No Verified Conversions Recorded Yet</h3>
                <p>When customers purchase via referral links, verified transactions appear in this audit log.</p>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order / Transaction ID</th>
                    <th>Campaign & Customer</th>
                    <th>Credited Promoter</th>
                    <th>Reward Payout</th>
                    <th>Verification Proof</th>
                    <th>Verified Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allVerifiedConversions.map((conv) => (
                    <tr key={conv.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-lime)' }}>
                          {conv.orderId}
                        </span>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>ID: {conv.id}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{conv.customerLabel}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Campaign: #{conv.campaignCode}</div>
                      </td>

                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {conv.referrerAddress.slice(0, 6)}...{conv.referrerAddress.slice(-6)}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--semantic-green)' }}>
                          +{conv.rewardAmount} {conv.assetCode}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span className="status-badge badge-locked" style={{ fontSize: '10px' }}>
                            {conv.verificationMethod === 'hmac_webhook' ? 'HMAC Webhook' : 'Client SDK'}
                          </span>
                        </div>
                        {conv.proofHash && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-tertiary)', marginTop: '2px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.proofHash}
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(conv.verifiedAt).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <span className="status-badge badge-paid" style={{ fontSize: '10px' }}>
                          ✓ VERIFIED & PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROMOTER MARKETPLACE */}
      {activeTab === 'marketplace' && (
        <div>
          <div className="card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Promoter Marketplace: Join Active Campaigns
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Browse active escrow-backed referral campaigns, see bounty rewards per paying customer, and generate your custom promoter link.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {agreements.map((a) => {
              const budget = parseFloat(a.totalBudget || a.amount || '0');
              const remaining = parseFloat(a.remainingBudget !== undefined ? a.remainingBudget : a.amount);
              const destinationUrl = a.targetUrl || a.businessWebsite || 'https://saasify.cloud';

              return (
                <div key={a.code} className="card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span className="status-badge badge-active" style={{ fontSize: '10px' }}>
                        {a.businessCategory || 'B2B Software'}
                      </span>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                        {a.customerLabel}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {a.businessName || 'Protocol Partner'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                        {a.rewardPerConversion || a.amount} {a.assetCode}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>per verified sale</div>
                    </div>
                  </div>

                  {/* Destination URL */}
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface-input)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Destination:</div>
                    <div style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {destinationUrl}
                    </div>
                  </div>

                  {/* Escrow remaining */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '14px', color: 'var(--text-secondary)' }}>
                    <span>Escrow Backing:</span>
                    <strong style={{ color: 'var(--semantic-green)', fontFamily: 'var(--font-mono)' }}>
                      {remaining.toFixed(2)} / {budget.toFixed(2)} {a.assetCode}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setJoinCampaignModal(a);
                        setPromoterWalletInput(connectedWallet ? connectedWallet.publicKey : '');
                        setGeneratedPromoterLink(null);
                        setPromoterLinkError(null);
                      }}
                    >
                      <Zap size={13} />
                      Generate My Referral Link
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onNavigateToReferrer(a.code)}
                      title="View Referral Landing Page"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT BUSINESS TARGET URL */}
      {editingTargetUrl && (
        <div className="modal-overlay" onClick={() => setEditingTargetUrl(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Update Business Website Link</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Campaign: {editingTargetUrl.name}</p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingTargetUrl(null)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveTargetUrl}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-target-url">
                    Destination URL
                    <span className="hint">Where users land when visiting referral links</span>
                  </label>
                  <input
                    id="new-target-url"
                    type="url"
                    required
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    className="form-input font-mono"
                    placeholder="https://mybusiness.com/pricing"
                  />
                  <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                    Visitors will automatically be redirected here with <code>?ref={editingTargetUrl.code}</code> preserved in the query parameters.
                  </p>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingTargetUrl(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Update Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TEST & AUTHENTICATE CONVERSION */}
      {testConversionModal && (
        <div className="modal-overlay" onClick={() => setTestConversionModal(null)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--accent-lime)" />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-lime)', fontWeight: 700 }}>
                    Authenticated Verification
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>
                  Verify Customer Conversion for #{testConversionModal.code}
                </h3>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setTestConversionModal(null)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleVerifyConversion}>
              <div className="modal-body">
                <div className="card-subtle" style={{ padding: '12px 14px', marginBottom: '14px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Offering:</span>
                    <strong>{testConversionModal.customerLabel}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Reward Payout:</span>
                    <strong style={{ color: 'var(--accent-lime)' }}>
                      {testConversionModal.rewardPerConversion || testConversionModal.amount} {testConversionModal.assetCode}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Available Escrow:</span>
                    <strong style={{ color: 'var(--semantic-green)' }}>
                      {testConversionModal.remainingBudget !== undefined ? testConversionModal.remainingBudget : testConversionModal.amount} {testConversionModal.assetCode}
                    </strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="test-order-id">
                    Customer Order or Invoice ID
                    <span className="hint">Unique identifier for this paid customer event</span>
                  </label>
                  <input
                    id="test-order-id"
                    type="text"
                    required
                    value={testOrderId}
                    onChange={(e) => setTestOrderId(e.target.value)}
                    className="form-input font-mono"
                    placeholder="e.g. ORD-9821-PRO"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="test-customer-name">
                    Customer Reference Label
                  </label>
                  <input
                    id="test-customer-name"
                    type="text"
                    value={testCustomerLabel}
                    onChange={(e) => setTestCustomerLabel(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Acme Tech Annual Subscription"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="test-referrer-address">
                    Referrer / Promoter Stellar Address
                    <span className="hint">Wallet that receives the reward</span>
                  </label>
                  <input
                    id="test-referrer-address"
                    type="text"
                    required
                    value={testReferrerAddr}
                    onChange={(e) => setTestReferrerAddr(e.target.value)}
                    className="form-input font-mono"
                    placeholder="G..."
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                    🛡️ <strong>Anti-fraud check:</strong> Rejects self-referrals if this matches the business treasury address ({testConversionModal.businessAddress.slice(0, 6)}...{testConversionModal.businessAddress.slice(-6)}).
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Verification Adapter</label>
                  <select
                    value={testVerificationMethod}
                    onChange={(e) => setTestVerificationMethod(e.target.value as any)}
                    className="form-select font-mono"
                  >
                    <option value="hmac_webhook">HMAC Webhook Oracle (Server Signature)</option>
                    <option value="sdk_client">Rewalf Client SDK (Checkout Token)</option>
                  </select>
                </div>

                {conversionFeedback && (
                  <div
                    className={`alert-box ${conversionFeedback.success ? 'alert-info' : 'alert-error'}`}
                    style={{ marginTop: '14px' }}
                  >
                    {conversionFeedback.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <div>
                      {conversionFeedback.fraudAlert && (
                        <div style={{ fontWeight: 700, color: 'var(--semantic-red)', marginBottom: '2px' }}>
                          🛡️ {conversionFeedback.fraudAlert}
                        </div>
                      )}
                      <div>{conversionFeedback.msg}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setTestConversionModal(null)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  <ShieldCheck size={14} /> Authenticate & Record Conversion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: JOIN CAMPAIGN & GENERATE PROMOTER LINK */}
      {joinCampaignModal && (
        <div className="modal-overlay" onClick={() => setJoinCampaignModal(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Generate Your Promoter Referral Link</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{joinCampaignModal.customerLabel}</p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setJoinCampaignModal(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              {!generatedPromoterLink ? (
                <form onSubmit={handleGeneratePromoterLink}>
                  <div className="card-subtle" style={{ padding: '12px', marginBottom: '14px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Bounty:</span>
                      <strong style={{ color: 'var(--accent-lime)' }}>
                        {joinCampaignModal.rewardPerConversion || joinCampaignModal.amount} {joinCampaignModal.assetCode} per verified paying customer
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Target Destination:</span>
                      <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                        {(joinCampaignModal.targetUrl || joinCampaignModal.businessWebsite || '').replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="promoter-wallet">
                      Your Stellar Public Key (Reward Recipient)
                    </label>
                    <input
                      id="promoter-wallet"
                      type="text"
                      required
                      value={promoterWalletInput}
                      onChange={(e) => setPromoterWalletInput(e.target.value)}
                      className="form-input font-mono"
                      placeholder="G... (Your 56-character Stellar wallet)"
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      When referred customers purchase, non-custodial payouts unlock to this wallet.
                    </p>
                  </div>

                  {promoterLinkError && (
                    <div className="alert-box alert-error" style={{ marginBottom: '14px' }}>
                      <AlertTriangle size={16} />
                      <span>{promoterLinkError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setJoinCampaignModal(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Zap size={14} /> Generate Referral Link
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="alert-box alert-info" style={{ marginBottom: '16px' }}>
                    <CheckCircle2 size={18} color="var(--accent-lime)" />
                    <div>
                      <strong>Your Unique Referral Link is Active!</strong>
                      <p style={{ marginTop: '2px', fontSize: '12px' }}>
                        Share this link with potential customers. When they visit and purchase, rewards debit automatically from escrow.
                      </p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Your Referral Link</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/r/${generatedPromoterLink.code}`}
                        className="form-input font-mono"
                        style={{ fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => copyToClipboard(`${window.location.origin}/r/${generatedPromoterLink.code}`, 'promoter_link')}
                      >
                        {copiedKey === 'promoter_link' ? <Check size={14} /> : <Copy size={14} />}
                        {copiedKey === 'promoter_link' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setJoinCampaignModal(null)}>
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setJoinCampaignModal(null);
                        onNavigateToReferrer(generatedPromoterLink.code);
                      }}
                    >
                      Open Referrer Portal <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
