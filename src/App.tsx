import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, type NavigationTab } from './components/Navbar';
import { Overview } from './components/Overview';
import { ProtocolsView } from './components/ProtocolsView';
import { ProtocolDetailView } from './components/ProtocolDetailView';
import { ProgramsView } from './components/ProgramsView';
import { ReferralLinksView } from './components/ReferralLinksView';
import { PayoutsView } from './components/PayoutsView';
import { ReferrerView } from './components/ReferrerView';
import { PayoutTraceView } from './components/PayoutTraceView';
import { IntegrationSettingsView } from './components/IntegrationSettingsView';
import { RegisterProtocolModal } from './components/RegisterProtocolModal';
import { CreateProgramModal } from './components/CreateProgramModal';
import { ProgramDetailDrawer } from './components/ProgramDetailDrawer';
import { HowItWorksModal } from './components/HowItWorksModal';
import { WalletModal } from './components/WalletModal';
import { LandingPage } from './components/LandingPage';
import { BusinessProfileModal } from './components/BusinessProfileModal';
import type { Agreement, ConnectedWallet, Protocol } from './stellar/types';
import { loadAgreements } from './store/agreementStore';
import { loadProtocols, getProtocolById } from './store/protocolStore';
import { loadSavedWallet } from './stellar/walletService';
import { getAccountBalances } from './stellar/stellarService';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('landing');
  const [activeCode, setActiveCode] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);

  // Modals and Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [inspectAgreement, setInspectAgreement] = useState<Agreement | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Refresh lists
  const refreshAgreements = useCallback(() => {
    const list = loadAgreements();
    setAgreements(list);
    setActiveCode((prev) => {
      if (!prev && list.length > 0) return list[0].code;
      return prev;
    });
  }, []);

  const refreshProtocols = useCallback(() => {
    const list = loadProtocols();
    setProtocols(list);
    if (!selectedProtocol && list.length > 0) {
      setSelectedProtocol(list[0]);
    }
  }, [selectedProtocol]);

  // Parse current route from URL
  const parseRoute = useCallback(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = new URLSearchParams(window.location.search);

    const pathMatch = path.match(/^\/r\/([a-zA-Z0-9_-]+)/);
    const hashMatch = hash.match(/^#\/r\/([a-zA-Z0-9_-]+)/);
    const queryCode = search.get('r');

    const protoMatch = path.match(/^\/protocol\/([a-zA-Z0-9_-]+)/);
    const protoHashMatch = hash.match(/^#\/protocol\/([a-zA-Z0-9_-]+)/);

    const code = pathMatch ? pathMatch[1] : hashMatch ? hashMatch[1] : queryCode || '';
    const protoId = protoMatch ? protoMatch[1] : protoHashMatch ? protoHashMatch[1] : '';

    if (code) {
      setActiveCode(code);
      setCurrentTab('referrals');
    } else if (protoId) {
      const found = getProtocolById(protoId);
      if (found) {
        setSelectedProtocol(found);
      }
      setCurrentTab('protocol-detail');
    } else if (path === '/app' || hash === '#/app') {
      setCurrentTab('overview');
    } else if (path === '/protocols' || hash === '#/protocols') {
      setCurrentTab('protocols');
    } else if (path === '/campaigns' || hash === '#/campaigns' || path === '/programs' || hash === '#/programs') {
      setCurrentTab('campaigns');
    } else if (path === '/links' || hash === '#/links') {
      setCurrentTab('links');
    } else if (path === '/payouts' || hash === '#/payouts') {
      setCurrentTab('payouts');
    } else if (path === '/reclaim' || hash === '#/reclaim') {
      setCurrentTab('payouts');
      setActiveFilter('expired');
    } else if (path === '/integration' || hash === '#/integration' || path === '/settings' || hash === '#/settings') {
      setCurrentTab('integration');
    } else if (path === '/trace' || hash === '#/trace') {
      setCurrentTab('trace');
    } else if (path === '/overview' || hash === '#/overview') {
      setCurrentTab('overview');
    } else {
      // Default entry point: Protocol Landing & Presentation Page
      setCurrentTab('landing');
    }
  }, []);

  // Restore saved wallet connection on mount
  useEffect(() => {
    refreshAgreements();
    refreshProtocols();
    parseRoute();
    window.addEventListener('popstate', parseRoute);

    const initWalletConnection = async () => {
      try {
        const saved = await loadSavedWallet();
        setConnectedWallet(saved);
      } catch (err) {
        console.warn('Could not restore saved wallet session', err);
      } finally {
        setInitialLoading(false);
      }
    };

    initWalletConnection();

    const handleWalletChanged = async () => {
      const saved = await loadSavedWallet();
      setConnectedWallet(saved);
    };

    const handleAgreementsUpdated = () => {
      refreshAgreements();
    };

    const handleProtocolsUpdated = () => {
      refreshProtocols();
    };

    window.addEventListener('rewalf_wallet_changed', handleWalletChanged);
    window.addEventListener('rewalf_agreements_updated', handleAgreementsUpdated);
    window.addEventListener('rewalf_protocols_updated', handleProtocolsUpdated);

    return () => {
      window.removeEventListener('popstate', parseRoute);
      window.removeEventListener('rewalf_wallet_changed', handleWalletChanged);
      window.removeEventListener('rewalf_agreements_updated', handleAgreementsUpdated);
      window.removeEventListener('rewalf_protocols_updated', handleProtocolsUpdated);
    };
  }, [parseRoute, refreshAgreements, refreshProtocols]);

  // Refresh balances
  const refreshWallets = async () => {
    if (connectedWallet?.publicKey) {
      try {
        const balances = await getAccountBalances(connectedWallet.publicKey);
        setConnectedWallet((prev) =>
          prev
            ? {
                ...prev,
                balanceXlm: balances.xlm,
                balanceUsdc: balances.usdc,
              }
            : null
        );
      } catch (err) {
        console.error('Failed to refresh account balances', err);
      }
    }
  };

  const handleSelectTab = (tab: NavigationTab, filter = 'all') => {
    setCurrentTab(tab);
    setActiveFilter(filter);

    if (tab === 'landing') {
      window.history.pushState(null, '', '/');
    } else if (tab === 'overview') {
      window.history.pushState(null, '', '/app');
    } else if (tab === 'protocols') {
      window.history.pushState(null, '', '/protocols');
    } else if (tab === 'campaigns' || tab === 'programs') {
      window.history.pushState(null, '', '/campaigns');
    } else if (tab === 'links') {
      window.history.pushState(null, '', '/links');
    } else if (tab === 'payouts') {
      window.history.pushState(null, '', '/payouts');
    } else if (tab === 'integration' || tab === 'settings') {
      window.history.pushState(null, '', '/integration');
    } else if (tab === 'referrals') {
      const code = activeCode || (agreements[0]?.code ?? '');
      if (code) {
        setActiveCode(code);
        window.history.pushState(null, '', `/r/${code}`);
      } else {
        window.history.pushState(null, '', '/r');
      }
    } else if (tab === 'trace') {
      window.history.pushState(null, '', '/trace');
    }
  };

  const handleNavigateToReferrer = (code: string) => {
    setActiveCode(code);
    setCurrentTab('referrals');
    window.history.pushState(null, '', `/r/${code}`);
  };

  const handleSelectForTrace = (code: string) => {
    setActiveCode(code);
    setCurrentTab('trace');
    window.history.pushState(null, '', '/trace');
  };

  const handleAgreementCreated = (agreement: Agreement) => {
    setActiveCode(agreement.code);
    refreshAgreements();
    refreshWallets();
  };

  const handleSelectProtocol = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setCurrentTab('protocol-detail');
    window.history.pushState(null, '', `/protocol/${protocol.id}`);
  };

  const handleProtocolRegistered = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    refreshProtocols();
    setCurrentTab('protocol-detail');
    window.history.pushState(null, '', `/protocol/${protocol.id}`);
  };

  if (initialLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          background: 'var(--bg-canvas)',
        }}
      >
        <div className="brand-logo-badge" style={{ width: '44px', height: '44px', fontSize: '20px' }}>
          R
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Connecting to Stellar Testnet Horizon...
        </p>
      </div>
    );
  }

  // If on landing page, display the dedicated protocol landing presentation
  if (currentTab === 'landing') {
    return (
      <div className="landing-wrapper">
        <LandingPage onLaunchApp={() => handleSelectTab('overview')} />

        {/* Protocol Guide Modal */}
        <HowItWorksModal isOpen={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />

        {/* Wallet Modal */}
        <WalletModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          connectedWallet={connectedWallet}
          onWalletConnected={(wallet) => setConnectedWallet(wallet)}
          onRefreshBalances={refreshWallets}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Application Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => handleSelectTab(tab)}
        connectedWallet={connectedWallet}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        onOpenBusinessModal={() => setBusinessModalOpen(true)}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="main-content">
        {/* TAB 1: OVERVIEW */}
        {currentTab === 'overview' && (
          <Overview
            protocols={protocols}
            agreements={agreements}
            connectedWallet={connectedWallet}
            onOpenRegisterProtocol={() => setRegisterModalOpen(true)}
            onSelectProtocol={handleSelectProtocol}
            onOpenCreateCampaign={() => setCreateModalOpen(true)}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onNavigateTab={handleSelectTab}
            onInspectCampaign={(a) => setInspectAgreement(a)}
            onNavigateToReferrer={handleNavigateToReferrer}
          />
        )}

        {/* TAB 2: PROTOCOLS DIRECTORY */}
        {currentTab === 'protocols' && (
          <ProtocolsView
            protocols={protocols}
            agreements={agreements}
            onOpenRegisterModal={() => setRegisterModalOpen(true)}
            onSelectProtocol={handleSelectProtocol}
            onOpenCreateCampaign={(p) => {
              setSelectedProtocol(p);
              setCreateModalOpen(true);
            }}
          />
        )}

        {/* TAB 3: DEDICATED PROTOCOL DETAIL PAGE */}
        {currentTab === 'protocol-detail' && (
          <ProtocolDetailView
            protocol={selectedProtocol || protocols[0]}
            agreements={agreements}
            connectedWallet={connectedWallet}
            onOpenCreateCampaign={(p) => {
              setSelectedProtocol(p);
              setCreateModalOpen(true);
            }}
            onNavigateToReferrer={handleNavigateToReferrer}
            onInspectCampaign={(a) => setInspectAgreement(a)}
            onBackToProtocols={() => handleSelectTab('protocols')}
            onProtocolUpdated={(updated) => {
              setSelectedProtocol(updated);
              refreshProtocols();
            }}
          />
        )}

        {/* TAB 4: CAMPAIGNS */}
        {(currentTab === 'campaigns' || currentTab === 'programs') && (
          <ProgramsView
            agreements={agreements}
            connectedWallet={connectedWallet}
            onOpenCreateModal={() => setCreateModalOpen(true)}
            onInspectProgram={(a) => setInspectAgreement(a)}
            onNavigateToReferrer={handleNavigateToReferrer}
            onSelectForTrace={handleSelectForTrace}
            initialFilter={activeFilter}
          />
        )}

        {/* TAB 5: REFERRAL LINKS DIRECTORY */}
        {currentTab === 'links' && (
          <ReferralLinksView
            agreements={agreements}
            protocols={protocols}
            onOpenCreateCampaign={() => setCreateModalOpen(true)}
            onNavigateToReferrer={handleNavigateToReferrer}
            onInspectCampaign={(a) => setInspectAgreement(a)}
          />
        )}

        {/* TAB 6: PAYOUTS */}
        {currentTab === 'payouts' && (
          <PayoutsView
            agreements={agreements}
            connectedWallet={connectedWallet}
            onInspectProgram={(a) => setInspectAgreement(a)}
            onSelectForTrace={handleSelectForTrace}
            onRefreshWallets={refreshWallets}
            onAgreementsUpdated={refreshAgreements}
            initialFilter={activeFilter}
          />
        )}

        {/* TAB 7: INTEGRATION SETTINGS */}
        {(currentTab === 'integration' || currentTab === 'settings') && (
          <IntegrationSettingsView
            protocols={protocols}
            connectedWallet={connectedWallet}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onRefreshWallets={refreshWallets}
            onAgreementsUpdated={refreshAgreements}
          />
        )}

        {/* PUBLIC REFERRAL PORTAL */}
        {currentTab === 'referrals' && (
          <ReferrerView
            currentCode={activeCode}
            connectedWallet={connectedWallet}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onCodeChange={(code) => {
              setActiveCode(code);
              window.history.pushState(null, '', `/r/${code}`);
            }}
            onNavigateToBusiness={() => handleSelectTab('campaigns')}
          />
        )}

        {/* ON-CHAIN PAYOUT TRACE */}
        {currentTab === 'trace' && (
          <PayoutTraceView
            agreements={agreements}
            selectedCode={activeCode}
            onCodeSelect={(code) => setActiveCode(code)}
            onNavigateToReferrer={handleNavigateToReferrer}
          />
        )}
      </main>

      {/* Slide-over Detail Drawer */}
      <ProgramDetailDrawer
        agreement={inspectAgreement}
        isOpen={inspectAgreement !== null}
        onClose={() => setInspectAgreement(null)}
        connectedWallet={connectedWallet}
        onNavigateToReferrer={handleNavigateToReferrer}
        onUpdated={() => {
          refreshAgreements();
          refreshWallets();
          if (inspectAgreement) {
            const updated = loadAgreements().find((a) => a.code === inspectAgreement.code);
            setInspectAgreement(updated || null);
          }
        }}
      />

      {/* Guided Create Program / Campaign Modal */}
      <CreateProgramModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        connectedWallet={connectedWallet}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onOpenBusinessModal={() => setBusinessModalOpen(true)}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
        onAgreementCreated={handleAgreementCreated}
        onNavigateToReferrer={handleNavigateToReferrer}
        protocols={protocols}
        selectedProtocol={selectedProtocol}
      />

      {/* 3-Stage Register Protocol Modal */}
      <RegisterProtocolModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        connectedWallet={connectedWallet}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onProtocolRegistered={handleProtocolRegistered}
      />

      {/* Legacy Business Profile Modal */}
      <BusinessProfileModal
        isOpen={businessModalOpen}
        onClose={() => setBusinessModalOpen(false)}
        connectedWallet={connectedWallet}
        onProfileSaved={() => {
          refreshAgreements();
          refreshProtocols();
        }}
      />

      {/* Protocol Architecture Guide Modal */}
      <HowItWorksModal isOpen={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />

      {/* Wallet Management Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        connectedWallet={connectedWallet}
        onWalletConnected={(wallet) => setConnectedWallet(wallet)}
        onRefreshBalances={refreshWallets}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
        }}
      >
        <p>
          Rewalf — Trustless Referral Payout Protocol | Non-Custodial Stellar Testnet Infrastructure
        </p>
        <p style={{ marginTop: '4px' }}>
          All escrows and settlements are cryptographically anchored on Stellar Horizon. Private keys never touch Rewalf.
        </p>
      </footer>
    </div>
  );
};

export default App;
