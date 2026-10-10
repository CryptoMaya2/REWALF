import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, type NavigationTab } from './components/Navbar';
import { Overview } from './components/Overview';
import { ProgramsView } from './components/ProgramsView';
import { PayoutsView } from './components/PayoutsView';
import { ReferrerView } from './components/ReferrerView';
import { PayoutTraceView } from './components/PayoutTraceView';
import { SettingsView } from './components/SettingsView';
import { CreateProgramModal } from './components/CreateProgramModal';
import { ProgramDetailDrawer } from './components/ProgramDetailDrawer';
import { HowItWorksModal } from './components/HowItWorksModal';
import { WalletModal } from './components/WalletModal';
import { LandingPage } from './components/LandingPage';
import type { Agreement, ConnectedWallet } from './stellar/types';
import { loadAgreements } from './store/agreementStore';
import { loadSavedWallet } from './stellar/walletService';
import { getAccountBalances } from './stellar/stellarService';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('landing');
  const [activeCode, setActiveCode] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);

  // Modals and Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inspectAgreement, setInspectAgreement] = useState<Agreement | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Parse current route from URL
  const parseRoute = useCallback(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = new URLSearchParams(window.location.search);

    const pathMatch = path.match(/^\/r\/([a-zA-Z0-9_-]+)/);
    const hashMatch = hash.match(/^#\/r\/([a-zA-Z0-9_-]+)/);
    const queryCode = search.get('r');

    const code = pathMatch ? pathMatch[1] : hashMatch ? hashMatch[1] : queryCode || '';

    if (code) {
      setActiveCode(code);
      setCurrentTab('referrals');
    } else if (path === '/app' || hash === '#/app') {
      setCurrentTab('overview');
    } else if (path === '/reclaim' || hash === '#/reclaim') {
      setCurrentTab('payouts');
      setActiveFilter('expired');
    } else if (path === '/programs' || hash === '#/programs') {
      setCurrentTab('programs');
    } else if (path === '/payouts' || hash === '#/payouts') {
      setCurrentTab('payouts');
    } else if (path === '/trace' || hash === '#/trace') {
      setCurrentTab('trace');
    } else if (path === '/settings' || hash === '#/settings') {
      setCurrentTab('settings');
    } else if (path === '/overview' || hash === '#/overview') {
      setCurrentTab('overview');
    } else {
      // Default entry point: Protocol Landing & Presentation Page
      setCurrentTab('landing');
    }
  }, []);

  const refreshAgreements = useCallback(() => {
    const list = loadAgreements();
    setAgreements(list);
    setActiveCode((prev) => {
      if (!prev && list.length > 0) return list[0].code;
      return prev;
    });
  }, []);

  // Restore saved wallet connection on mount
  useEffect(() => {
    refreshAgreements();
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

    window.addEventListener('rewalf_wallet_changed', handleWalletChanged);
    window.addEventListener('rewalf_agreements_updated', handleAgreementsUpdated);

    return () => {
      window.removeEventListener('popstate', parseRoute);
      window.removeEventListener('rewalf_wallet_changed', handleWalletChanged);
      window.removeEventListener('rewalf_agreements_updated', handleAgreementsUpdated);
    };
  }, [parseRoute, refreshAgreements]);

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
    } else if (tab === 'programs') {
      window.history.pushState(null, '', '/programs');
    } else if (tab === 'payouts') {
      window.history.pushState(null, '', '/payouts');
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
    } else if (tab === 'settings') {
      window.history.pushState(null, '', '/settings');
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
          Connecting to Stellar Testnet...
        </p>
      </div>
    );
  }

  // If on landing page, display the dedicated protocol landing presentation
  if (currentTab === 'landing') {
    return (
      <div className="landing-wrapper">
        <LandingPage
          onLaunchApp={() => handleSelectTab('overview')}
        />

        {/* Protocol Guide Modal */}
        <HowItWorksModal
          isOpen={howItWorksOpen}
          onClose={() => setHowItWorksOpen(false)}
        />

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
      />

      {/* Main Workspace Body */}
      <main className="main-content">
        {currentTab === 'overview' && (
          <Overview
            agreements={agreements}
            connectedWallet={connectedWallet}
            onOpenCreateModal={() => setCreateModalOpen(true)}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onNavigateTab={handleSelectTab}
            onSelectAgreementForTrace={handleSelectForTrace}
            onInspectProgram={(a) => setInspectAgreement(a)}
          />
        )}

        {currentTab === 'programs' && (
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

        {currentTab === 'referrals' && (
          <ReferrerView
            currentCode={activeCode}
            connectedWallet={connectedWallet}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onCodeChange={(code) => {
              setActiveCode(code);
              window.history.pushState(null, '', `/r/${code}`);
            }}
            onNavigateToBusiness={() => handleSelectTab('programs')}
          />
        )}

        {currentTab === 'trace' && (
          <PayoutTraceView
            agreements={agreements}
            selectedCode={activeCode}
            onCodeSelect={(code) => setActiveCode(code)}
            onNavigateToReferrer={handleNavigateToReferrer}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            connectedWallet={connectedWallet}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onRefreshWallets={refreshWallets}
            onAgreementsUpdated={refreshAgreements}
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

      {/* Guided Create Program Modal */}
      <CreateProgramModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        connectedWallet={connectedWallet}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onAgreementCreated={handleAgreementCreated}
        onNavigateToReferrer={handleNavigateToReferrer}
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

      {/* Protocol Architecture Guide Modal */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />

      {/* Wallet Management Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        connectedWallet={connectedWallet}
        onWalletConnected={(wallet) => setConnectedWallet(wallet)}
        onRefreshBalances={refreshWallets}
      />
    </div>
  );
};

export default App;
