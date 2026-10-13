import React, { useState } from 'react';
import type { ConnectedWallet, Protocol } from '../stellar/types';
import {
  HORIZON_URL,
  FRIENDBOT_URL,
  NETWORK_PASSPHRASE,
  fundWithFriendbot,
  testCreateAccountOnTestnet,
  getStellarExpertAccountUrl,
  getStellarExpertTxUrl,
} from '../stellar/stellarService';
import { connectTestAccount } from '../stellar/walletService';
import { resetAgreementsToFixtures, clearAllAgreements } from '../store/agreementStore';
import { resetProtocolsToFixtures } from '../store/protocolStore';
import {
  signConversionPayload,
  authenticateConversionWebhook,
  type WebhookConversionPayload,
} from '../security/conversionVerifier';
import { runWorkflowVerificationTests, type TestCaseResult } from '../test/workflowVerification.test';
import {
  Server,
  Code2,
  Webhook,
  Zap,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Key,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldAlert,
  UserPlus,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';


interface IntegrationSettingsViewProps {
  protocols: Protocol[];
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onRefreshWallets: () => void;
  onAgreementsUpdated: () => void;
}

export const IntegrationSettingsView: React.FC<IntegrationSettingsViewProps> = ({
  protocols,
  connectedWallet,
  onOpenWalletModal,
  onRefreshWallets,
  onAgreementsUpdated,
}) => {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>(protocols[0]?.id || '');
  const [funding, setFunding] = useState(false);
  const [fundSuccess, setFundSuccess] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Automated Test Suite State
  const [testResults, setTestResults] = useState<{
    ran: boolean;
    allPassed: boolean;
    total: number;
    passed: number;
    failed: number;
    results: TestCaseResult[];
  } | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  // Live HMAC Webhook Tester State
  const [testEventId, setTestEventId] = useState(`evt_${Date.now()}`);
  const [testOrderId, setTestOrderId] = useState(`ORD-LIVE-${Math.floor(1000 + Math.random() * 9000)}`);
  const [testReferrer, setTestReferrer] = useState('GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP');
  const [testRewardAmount, setTestRewardAmount] = useState('50.00');
  const [testTimestampOffset, setTestTimestampOffset] = useState<'current' | 'expired'>('current');
  const [tamperSignature, setTamperSignature] = useState(false);
  const [generatedSignature, setGeneratedSignature] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<{
    valid: boolean;
    code: string;
    message: string;
  } | null>(null);

  // Stellar Testnet Account Creation Tester State
  const [testingCreateAccount, setTestingCreateAccount] = useState(false);
  const [createAccountMethod, setCreateAccountMethod] = useState<'friendbot' | 'create_account_op'>('friendbot');
  const [customStartingBalance, setCustomStartingBalance] = useState('10.00');
  const [createAccountProgress, setCreateAccountProgress] = useState<string | null>(null);
  const [createAccountResult, setCreateAccountResult] = useState<{
    success: boolean;
    publicKey: string;
    secretKey: string;
    balanceXlm: string;
    sequence?: string;
    txHash?: string;
    explorerUrl?: string;
    error?: string;
  } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [connectedAsTestAccount, setConnectedAsTestAccount] = useState(false);


  const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId) || protocols[0];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunSecurityTests = async () => {
    setRunningTests(true);
    try {
      const suite = await runWorkflowVerificationTests();
      setTestResults({
        ran: true,
        ...suite,
      });
    } finally {
      setRunningTests(false);
    }
  };

  const handleGenerateAndVerifyWebhook = async () => {
    if (!selectedProtocol) return;

    const timestamp = testTimestampOffset === 'current' ? Date.now() : Date.now() - 10 * 60 * 1000;
    const payload: WebhookConversionPayload = {
      eventId: testEventId,
      orderId: testOrderId,
      campaignCode: 'xlm77a',
      referrerAddress: testReferrer,
      amountPaid: '299.00',
      rewardAmount: testRewardAmount,
      assetCode: 'USDC',
      customerLabel: 'Enterprise Annual Tier',
      timestamp,
    };

    let sig = await signConversionPayload(selectedProtocol.webhookSecret, payload);
    if (tamperSignature) {
      sig = sig.slice(0, -6) + 'badbad';
    }
    setGeneratedSignature(sig);

    const result = await authenticateConversionWebhook({
      payload,
      signature: sig,
      secret: selectedProtocol.webhookSecret,
      campaignContext: {
        businessAddress: selectedProtocol.ownerWallet,
        remainingBudget: 350.0,
        existingOrderIds: ['ORD-PREVIOUS-01'],
      },
    });

    setVerificationFeedback({
      valid: result.valid,
      code: result.code,
      message: result.message,
    });
  };

  const handleTestCreateAccount = async () => {
    setTestingCreateAccount(true);
    setCreateAccountProgress('Generating keypair and initializing account on Stellar Testnet...');
    setCreateAccountResult(null);
    setConnectedAsTestAccount(false);

    try {
      const res = await testCreateAccountOnTestnet({
        method: createAccountMethod,
        sourceWallet: createAccountMethod === 'create_account_op' ? connectedWallet || undefined : undefined,
        startingBalance: `${parseFloat(customStartingBalance || '10').toFixed(7)}`,
        onProgress: (status) => setCreateAccountProgress(status),
      });

      setCreateAccountResult(res);
      if (res.success) {
        onRefreshWallets();
      }
    } catch (err: any) {
      setCreateAccountResult({
        success: false,
        publicKey: '',
        secretKey: '',
        balanceXlm: '0',
        error: err.message || 'Failed to create account on Stellar testnet.',
      });
    } finally {
      setTestingCreateAccount(false);
      setCreateAccountProgress(null);
    }
  };

  const handleConnectCreatedAccount = () => {
    if (!createAccountResult?.publicKey) return;
    connectTestAccount(
      createAccountResult.publicKey,
      createAccountResult.secretKey,
      'Stellar Testnet Account'
    );
    setConnectedAsTestAccount(true);
    onRefreshWallets();
  };

  const handleFundConnected = async () => {

    if (!connectedWallet) {
      onOpenWalletModal();
      return;
    }
    setFunding(true);
    setFundSuccess(null);
    setFundError(null);
    try {
      const res = await fundWithFriendbot(connectedWallet.publicKey);
      if (res.success) {
        setFundSuccess(`Funded 10,000 XLM to ${connectedWallet.publicKey.slice(0, 6)}...`);
        onRefreshWallets();
      } else {
        setFundError(res.error || 'Friendbot failed to fund account.');
      }
    } catch (err: any) {
      setFundError(`Error funding account: ${err.message}`);
    } finally {
      setFunding(false);
    }
  };

  const handleResetFixtures = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    resetAgreementsToFixtures();
    resetProtocolsToFixtures();
    onAgreementsUpdated();
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    clearAllAgreements();
    onAgreementsUpdated();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-badge badge-active" style={{ fontSize: '11px' }}>
            Integration & Security Engine
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            HMAC-SHA256 • Replay Protection • Idempotency
          </span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginTop: '4px' }}>
          Protocol Integration & Webhook Security
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          Cryptographic signature authentication, server-to-server webhook endpoints, and automated security invariant tests.
        </p>
      </div>

      {/* Attribution Protocol Credentials */}
      {protocols.length > 0 && selectedProtocol && (
        <div className="card" style={{ border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={18} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Protocol Attribution Credentials
              </h3>
            </div>

            <select
              value={selectedProtocol.id}
              onChange={(e) => setSelectedProtocolId(e.target.value)}
              className="form-select font-mono"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.network})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="card-subtle" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                  Protocol API Key
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedProtocol.apiKey, 'api-key')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                >
                  {copiedKey === 'api-key' ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-lime)', marginTop: '6px', wordBreak: 'break-all' }}>
                {selectedProtocol.apiKey}
              </div>
            </div>

            <div className="card-subtle" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                  Webhook Secret (HMAC-SHA256)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedProtocol.webhookSecret, 'webhook-secret')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                >
                  {copiedKey === 'webhook-secret' ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-blue)', marginTop: '6px', wordBreak: 'break-all' }}>
                {selectedProtocol.webhookSecret}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATED SECURITY INVARIANTS TEST SUITE */}
      <div className="card" style={{ border: '1px solid var(--accent-lime-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Security Invariants & Workflow Verification Suite
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Automated tests for invalid events, signature tampering, replay attacks, duplicate orders, self-referrals, and escrow bounds.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleRunSecurityTests}
            disabled={runningTests}
          >
            <Play size={13} />
            {runningTests ? 'Running Suite...' : 'Run Security Test Suite'}
          </button>
        </div>

        {testResults && (
          <div>
            <div
              className={`alert-box ${testResults.allPassed ? 'alert-info' : 'alert-error'}`}
              style={{ marginBottom: '14px' }}
            >
              {testResults.allPassed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <div>
                <strong>
                  {testResults.allPassed
                    ? `✓ All ${testResults.total} Security Invariant Tests Passed Successfully!`
                    : `⚠️ ${testResults.failed} of ${testResults.total} Tests Failed!`}
                </strong>
                <p style={{ fontSize: '12px', marginTop: '2px' }}>
                  Cryptographic authentication, replay protection, idempotency deduplication, and escrow bounds verified.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {testResults.results.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-input)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12.5px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {r.passed ? (
                      <CheckCircle2 size={15} color="var(--accent-lime)" />
                    ) : (
                      <ShieldAlert size={15} color="var(--semantic-red)" />
                    )}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.testName}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      Expected: <code>{r.expectedResult}</code>
                    </span>
                    <span
                      className={`status-badge ${r.passed ? 'badge-active' : 'badge-flagged'}`}
                      style={{ fontSize: '10.5px' }}
                    >
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIVE STELLAR TESTNET ACCOUNT CREATION TESTER */}
      <div className="card" style={{ border: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Stellar Testnet Account Creation Tester
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Generate cryptographic Ed25519 keypairs and test account activation on the live Stellar testnet ledger.
            </p>
          </div>

          <span className="network-badge">
            <span className="pulse-dot" />
            Horizon Testnet
          </span>
        </div>

        {/* Method Selection Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${createAccountMethod === 'friendbot' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCreateAccountMethod('friendbot')}
            disabled={testingCreateAccount}
          >
            <Zap size={13} />
            Friendbot Faucet (+10k XLM)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${createAccountMethod === 'create_account_op' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCreateAccountMethod('create_account_op')}
            disabled={testingCreateAccount}
          >
            <Sparkles size={13} />
            Operation.createAccount (From Connected Wallet)
          </button>
        </div>

        {createAccountMethod === 'create_account_op' && (
          <div className="card-subtle" style={{ padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Source Funding Signer:
              </span>
              {connectedWallet ? (
                <span className="status-badge badge-active" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  {connectedWallet.publicKey.slice(0, 6)}...{connectedWallet.publicKey.slice(-4)} ({parseFloat(connectedWallet.balanceXlm || '0').toFixed(2)} XLM)
                </span>
              ) : (
                <button type="button" className="btn btn-outline btn-sm" onClick={onOpenWalletModal}>
                  Connect Signer to Fund
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Starting Balance (XLM):</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={customStartingBalance}
                onChange={(e) => setCustomStartingBalance(e.target.value)}
                className="form-input font-mono"
                style={{ width: '120px', padding: '6px 10px', fontSize: '12px' }}
                disabled={testingCreateAccount}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                (Minimum reserve requires at least 1.0 XLM)
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleTestCreateAccount}
            disabled={testingCreateAccount || (createAccountMethod === 'create_account_op' && !connectedWallet)}
          >
            <UserPlus size={14} />
            {testingCreateAccount
              ? (createAccountProgress || 'Creating Account on Testnet...')
              : 'Test Create Account on Stellar Testnet'}
          </button>

          {testingCreateAccount && (
            <span style={{ fontSize: '12px', color: 'var(--accent-lime)' }}>
              Broadcasting to Horizon...
            </span>
          )}
        </div>

        {/* Progress Alert */}
        {testingCreateAccount && createAccountProgress && (
          <div className="alert-box alert-info" style={{ marginBottom: '16px' }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: '12px' }}>{createAccountProgress}</span>
          </div>
        )}

        {/* Creation Results Box */}
        {createAccountResult && (
          <div
            className="card-subtle"
            style={{
              padding: '16px',
              border: createAccountResult.success
                ? '1px solid var(--accent-lime-border)'
                : '1px solid rgba(255, 99, 132, 0.4)',
              background: createAccountResult.success
                ? 'rgba(184, 243, 107, 0.04)'
                : 'rgba(255, 99, 132, 0.05)',
            }}
          >
            {createAccountResult.success ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--accent-lime)" />
                    <strong style={{ fontSize: '13px', color: 'var(--accent-lime)' }}>
                      Account Successfully Created & Verified on Stellar Testnet!
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={createAccountResult.explorerUrl || getStellarExpertAccountUrl(createAccountResult.publicKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <ExternalLink size={12} />
                      Inspect on Stellar Expert
                    </a>

                    <button
                      type="button"
                      className={`btn btn-sm ${connectedAsTestAccount ? 'btn-outline' : 'btn-primary'}`}
                      onClick={handleConnectCreatedAccount}
                    >
                      {connectedAsTestAccount ? (
                        <>
                          <Check size={12} color="var(--accent-lime)" />
                          Active Signer
                        </>
                      ) : (
                        'Use as Active Wallet'
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  {/* Public Key */}
                  <div style={{ background: 'var(--surface-input)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                        Created Public Key (Ed25519)
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(createAccountResult.publicKey, 'testnet-pubkey')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                      >
                        {copiedKey === 'testnet-pubkey' ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-primary)', wordBreak: 'break-all', marginTop: '4px' }}>
                      {createAccountResult.publicKey}
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div style={{ background: 'var(--surface-input)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                        Secret Key (Testnet Only)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                          title={showSecretKey ? 'Hide Secret Key' : 'Reveal Secret Key'}
                        >
                          {showSecretKey ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(createAccountResult.secretKey, 'testnet-secret')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                        >
                          {copiedKey === 'testnet-secret' ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--accent-blue)', wordBreak: 'break-all', marginTop: '4px' }}>
                      {showSecretKey ? createAccountResult.secretKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div>
                    Confirmed Balance: <strong style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>{parseFloat(createAccountResult.balanceXlm).toFixed(2)} XLM</strong>
                  </div>
                  {createAccountResult.txHash && (
                    <div>
                      Tx Hash:{' '}
                      <a
                        href={getStellarExpertTxUrl(createAccountResult.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}
                      >
                        {createAccountResult.txHash.slice(0, 10)}...{createAccountResult.txHash.slice(-6)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--semantic-red)' }}>
                <AlertTriangle size={18} />
                <span style={{ fontSize: '12px' }}>
                  {createAccountResult.error || 'Failed to create test account on Stellar testnet.'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIVE CRYPTOGRAPHIC WEBHOOK & HMAC TESTER */}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Webhook size={18} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Interactive Server-to-Server Webhook Tester
          </h3>
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Simulate a merchant backend sending a cryptographically signed HMAC conversion webhook to test signature validation, replay attack protection, and idempotency.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Event ID (UUID)</label>
            <input
              type="text"
              value={testEventId}
              onChange={(e) => setTestEventId(e.target.value)}
              className="form-input font-mono"
              style={{ fontSize: '12px' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Order ID</label>
            <input
              type="text"
              value={testOrderId}
              onChange={(e) => setTestOrderId(e.target.value)}
              className="form-input font-mono"
              style={{ fontSize: '12px' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Referrer Stellar Address</label>
            <input
              type="text"
              value={testReferrer}
              onChange={(e) => setTestReferrer(e.target.value)}
              className="form-input font-mono"
              style={{ fontSize: '12px' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Reward Amount (USDC)</label>
            <input
              type="text"
              value={testRewardAmount}
              onChange={(e) => setTestRewardAmount(e.target.value)}
              className="form-input font-mono"
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="radio"
              checked={testTimestampOffset === 'current'}
              onChange={() => setTestTimestampOffset('current')}
            />
            Fresh Timestamp (Within 5-min window)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="radio"
              checked={testTimestampOffset === 'expired'}
              onChange={() => setTestTimestampOffset('expired')}
            />
            Expired Timestamp (&gt; 10 min ago, test replay rejection)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer', color: 'var(--semantic-amber)' }}>
            <input
              type="checkbox"
              checked={tamperSignature}
              onChange={(e) => setTamperSignature(e.target.checked)}
            />
            Tamper with Signature (Test Signature Rejection)
          </label>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleGenerateAndVerifyWebhook}
        >
          <Zap size={14} /> Generate HMAC Signature & Authenticate Event
        </button>

        {generatedSignature && (
          <div style={{ marginTop: '14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Generated Header: X-Rewalf-Signature
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--accent-lime)', background: 'var(--surface-input)', padding: '6px 10px', borderRadius: 'var(--radius-xs)', marginTop: '4px', wordBreak: 'break-all' }}>
              {generatedSignature}
            </div>
          </div>
        )}

        {verificationFeedback && (
          <div
            className={`alert-box ${verificationFeedback.valid ? 'alert-info' : 'alert-error'}`}
            style={{ marginTop: '14px' }}
          >
            {verificationFeedback.valid ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div>
              <strong>Result Code: {verificationFeedback.code}</strong>
              <p style={{ fontSize: '12px', marginTop: '2px' }}>{verificationFeedback.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* BACKEND SERVER INTEGRATION GUIDE */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Code2 size={18} color="var(--accent-lime)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Server-to-Server Webhook Implementation Guide
          </h3>
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          When a customer makes a purchase on your external website, your backend server signs the conversion payload using your protocol secret and broadcasts it to Rewalf:
        </p>

        <pre
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-input)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            color: 'var(--text-primary)',
            overflowX: 'auto',
            lineHeight: 1.5,
          }}
        >
{`// Node.js Backend Example (Stripe / Shopify Order Webhook)
import crypto from 'crypto';

export async function reportVerifiedConversion(order) {
  // Read signing secret from server environment variable
  const secret = process.env.REWALF_WEBHOOK_SECRET || '${selectedProtocol?.webhookSecret || 'YOUR_SIGNING_SECRET'}';
  const payload = {
    eventId: crypto.randomUUID(),
    orderId: order.id,
    campaignCode: order.referralCode,
    referrerAddress: order.promoterStellarAddress,
    amountPaid: order.totalUsd.toFixed(2),
    rewardAmount: '25.00',
    assetCode: 'USDC',
    timestamp: Date.now()
  };

  // Canonical string: eventId|orderId|campaignCode|referrerAddress|amountPaid|rewardAmount|assetCode|timestamp
  const canonical = [
    payload.eventId, payload.orderId, payload.campaignCode.toLowerCase(),
    payload.referrerAddress.trim(), payload.amountPaid, payload.rewardAmount,
    payload.assetCode, payload.timestamp.toString()
  ].join('|');

  const signature = crypto.createHmac('sha256', secret).update(canonical).digest('hex');

  await fetch('https://rewalf.vercel.app/api/conversion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Rewalf-Signature': signature
    },
    body: JSON.stringify(payload)
  });
}`}
        </pre>
      </div>

      {/* Stellar Horizon Network Parameters */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Server size={18} color="var(--accent-lime)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Stellar Horizon Network Parameters
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Target Blockchain Network:</span>
            <span className="network-badge">
              <span className="pulse-dot" />
              Stellar Testnet (Active)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Horizon RPC Endpoint:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{HORIZON_URL}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Friendbot Faucet:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{FRIENDBOT_URL}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Network Passphrase:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-blue)' }}>
              {NETWORK_PASSPHRASE}
            </span>
          </div>
        </div>
      </div>

      {/* Signer Security & Faucet */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ShieldCheck size={18} color="var(--semantic-green)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Non-Custodial Signer Boundary
          </h3>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
          Rewalf operates without custodial keys. Escrow creation and reward reclaims are signed exclusively in your browser via Freighter or Albedo.
        </p>

        <div className="card-subtle" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Connected Signer
              </span>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {connectedWallet ? (connectedWallet.label || connectedWallet.walletType) : 'No Signer Connected'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {connectedWallet && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleFundConnected}
                  disabled={funding}
                >
                  <Zap size={13} color="var(--semantic-amber)" />
                  {funding ? 'Funding...' : 'Friendbot Faucet (+10k XLM)'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenWalletModal}
              >
                Manage Signer
              </button>
            </div>
          </div>

          {fundSuccess && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--semantic-green)' }}>
              ✓ {fundSuccess}
            </div>
          )}
          {fundError && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--semantic-red)' }}>
              ⚠ {fundError}
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Fixtures Management */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <RotateCcw size={18} color="var(--semantic-amber)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Evaluation State & Fixtures
          </h3>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
          Manage local demo fixtures used to test protocols and escrow agreements.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn btn-sm ${confirmReset ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleResetFixtures}
            style={confirmReset ? { background: 'var(--semantic-amber)', borderColor: 'var(--semantic-amber)', color: '#000' } : undefined}
          >
            <RotateCcw size={14} />
            {confirmReset ? 'Confirm Reset Fixtures?' : 'Reset to Default Evaluation Fixtures'}
          </button>
          {confirmReset && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          )}

          <button
            type="button"
            className={`btn btn-sm ${confirmClear ? 'btn-primary' : 'btn-danger-outline'}`}
            onClick={handleClearAll}
            style={confirmClear ? { background: 'var(--semantic-red)', borderColor: 'var(--semantic-red)', color: '#fff' } : undefined}
          >
            <Trash2 size={14} />
            {confirmClear ? 'Confirm Clear All?' : 'Clear All Stored Agreements'}
          </button>
          {confirmClear && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmClear(false)}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
