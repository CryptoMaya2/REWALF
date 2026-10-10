import React, { useState } from 'react';
import type { Agreement } from '../stellar/types';
import { getStellarExpertTxUrl, getStellarExpertAccountUrl } from '../stellar/stellarService';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

interface PayoutTraceProps {
  agreement: Agreement;
}

type StageStatus = 'completed' | 'active' | 'waiting' | 'reclaimed' | 'failed';

interface TraceStage {
  id: string;
  number: number;
  name: string;
  status: StageStatus;
  statusLabel: string;
  timestamp?: number;
  explanation: string;
  nextAction?: string;
  evidenceType?: string;
  evidenceValue?: string;
  evidenceUrl?: string;
  rawDetails?: Record<string, string | number | boolean>;
}

export const PayoutTrace: React.FC<PayoutTraceProps> = ({ agreement }) => {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const formatTimestamp = (epochMs?: number) => {
    if (!epochMs) return 'Pending occurrence';
    const d = new Date(epochMs);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  const isExpired = Date.now() > agreement.deadline;

  // Build the 5 distinct lifecycle stages based on actual agreement state
  const stages: TraceStage[] = [
    {
      id: 'vault_creation',
      number: 1,
      name: 'Escrow Vault Created & Funded',
      status: 'completed',
      statusLabel: 'Confirmed On-Chain',
      timestamp: agreement.createdAt,
      explanation: `Business locked ${agreement.amount} ${agreement.assetCode} into a dedicated on-chain Stellar Escrow Vault account before issuing the referral agreement. Non-divertible key binding was established.`,
      evidenceType: 'Stellar Testnet Transaction Hash',
      evidenceValue: agreement.lockTxHash,
      evidenceUrl: agreement.lockTxHash ? getStellarExpertTxUrl(agreement.lockTxHash) : undefined,
      rawDetails: {
        'Escrow Vault Account': agreement.escrowPublicKey,
        'Business Signer': agreement.businessAddress,
        'Locked Deposit': `${agreement.amount} ${agreement.assetCode}`,
        'Base Reserve Funded': '3.0000000 XLM',
      },
    },
    {
      id: 'metadata_anchoring',
      number: 2,
      name: 'Attribution & Terms Anchored',
      status: 'completed',
      statusLabel: 'Anchored On-Chain',
      timestamp: agreement.createdAt,
      explanation: 'Referrer payout public key (G...), deadline timelock, and customer deal identifier were written into Stellar ledger ManageData entries on the escrow account.',
      evidenceType: 'Escrow Vault Public Key',
      evidenceValue: agreement.escrowPublicKey,
      evidenceUrl: getStellarExpertAccountUrl(agreement.escrowPublicKey),
      rawDetails: {
        'Anchored Referrer': agreement.referrerAddress,
        'Deal Reference': agreement.customerLabel,
        'Deadline Timestamp': new Date(agreement.deadline).toLocaleString(),
        'ManageData Keys': 'rw_referrer, rw_deadline, rw_customer',
      },
    },
    {
      id: 'customer_evaluation',
      number: 3,
      name: 'Customer Payment Evaluation',
      status:
        agreement.state === 'PAID' || agreement.state === 'CLAIMED'
          ? 'completed'
          : agreement.state === 'RECLAIMED' || (agreement.state === 'LOCKED' && isExpired)
          ? 'failed'
          : 'active',
      statusLabel:
        agreement.state === 'PAID' || agreement.state === 'CLAIMED'
          ? 'Payment Confirmed'
          : agreement.state === 'RECLAIMED' || (agreement.state === 'LOCKED' && isExpired)
          ? 'Timeout / Unpaid'
          : 'Awaiting Payment Confirmation',
      timestamp: agreement.paidAt,
      explanation:
        agreement.state === 'PAID' || agreement.state === 'CLAIMED'
          ? `Customer payment for "${agreement.customerLabel}" was verified. Binary condition satisfied; payout escrow unlocked for claim.`
          : agreement.state === 'RECLAIMED' || (agreement.state === 'LOCKED' && isExpired)
          ? `Deadline elapsed without verified customer payment. Escrow unlocked for business return.`
          : 'Protocol is monitoring customer payment settlement. Referrer claim is locked until this condition is verified.',
      nextAction:
        agreement.state === 'LOCKED' && !isExpired
          ? 'Customer or integration must submit/mark payment confirmed before deadline.'
          : undefined,
      evidenceType: agreement.paidTxHash ? 'Verification Identifier' : undefined,
      evidenceValue: agreement.paidTxHash,
      rawDetails: {
        'Deal Label': agreement.customerLabel,
        'Payment Verified': agreement.paidAt ? 'Yes' : 'No',
        'State Transition': agreement.paidAt ? 'LOCKED -> PAID' : 'None yet',
      },
    },
    {
      id: 'payout_authorization',
      number: 4,
      name:
        agreement.state === 'RECLAIMED'
          ? 'Escrow Reclaim Execution'
          : 'Referrer Payout Execution',
      status:
        agreement.state === 'CLAIMED' || agreement.state === 'RECLAIMED'
          ? 'completed'
          : agreement.state === 'PAID'
          ? 'active'
          : 'waiting',
      statusLabel:
        agreement.state === 'CLAIMED'
          ? 'Payment Settled'
          : agreement.state === 'RECLAIMED'
          ? 'Returned to Business'
          : agreement.state === 'PAID'
          ? 'Claimable by Referrer'
          : 'Pending Previous Stage',
      timestamp: agreement.claimedAt || agreement.reclaimedAt,
      explanation:
        agreement.state === 'CLAIMED'
          ? `On-chain payment operation executed transferring ${agreement.amount} ${agreement.assetCode} from Escrow Vault to Referrer (${agreement.referrerAddress.slice(0, 6)}...${agreement.referrerAddress.slice(-6)}).`
          : agreement.state === 'RECLAIMED'
          ? `On-chain reclaim payment executed returning ${agreement.amount} ${agreement.assetCode} from Escrow Vault back to Business wallet.`
          : agreement.state === 'PAID'
          ? 'Escrow funds are now claimable. Referrer or authorized agent can submit on-chain claim payment transaction.'
          : 'Funds remain locked in Escrow Vault until preceding condition is satisfied.',
      nextAction:
        agreement.state === 'PAID'
          ? 'Referrer must click "Claim Reward" in the Referrer Portal to transfer funds.'
          : agreement.state === 'LOCKED' && isExpired
          ? 'Business team can execute "Reclaim Locked Reward" on-chain.'
          : undefined,
      evidenceType: agreement.claimTxHash
        ? 'Claim Transaction Hash'
        : agreement.reclaimTxHash
        ? 'Reclaim Transaction Hash'
        : undefined,
      evidenceValue: agreement.claimTxHash || agreement.reclaimTxHash,
      evidenceUrl: (agreement.claimTxHash || agreement.reclaimTxHash)
        ? getStellarExpertTxUrl((agreement.claimTxHash || agreement.reclaimTxHash)!)
        : undefined,
      rawDetails: {
        'Recipient Address':
          agreement.state === 'RECLAIMED'
            ? agreement.businessAddress
            : agreement.referrerAddress,
        'Amount Transferred': `${agreement.amount} ${agreement.assetCode}`,
        'Escrow Source': agreement.escrowPublicKey,
      },
    },
    {
      id: 'ledger_finality',
      number: 5,
      name: 'Ledger Consensus & Finality',
      status:
        agreement.state === 'CLAIMED' || agreement.state === 'RECLAIMED'
          ? 'completed'
          : 'waiting',
      statusLabel:
        agreement.state === 'CLAIMED'
          ? 'Settled & Immutable'
          : agreement.state === 'RECLAIMED'
          ? 'Reclaimed & Closed'
          : 'Awaiting Finality',
      timestamp: agreement.claimedAt || agreement.reclaimedAt,
      explanation:
        agreement.state === 'CLAIMED'
          ? `Stellar ledger state 'rw_state = CLAIMED' permanently recorded. Payout lifecycle completed with zero counterparty diversion risk.`
          : agreement.state === 'RECLAIMED'
          ? `Stellar ledger state 'rw_state = RECLAIMED' recorded. Agreement closed and vault liquidated.`
          : 'Ledger consensus will finalize once claim or reclaim transaction is incorporated into a Stellar ledger close.',
      evidenceType: 'Agreement Terminal State',
      evidenceValue: agreement.state,
      rawDetails: {
        'Terminal State': agreement.state,
        'Protocol Guarantee': 'Non-divertible cryptographic escrow',
        'Ledger Network': 'Stellar Testnet',
      },
    },
  ];

  return (
    <div className="payout-trace-container">
      {/* Trace Overview Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          background: 'var(--surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            Verifiable Agreement Lifecycle
          </span>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            Trace for Agreement #{agreement.code}
          </h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-badge badge-${agreement.state.toLowerCase()}`}>
            {agreement.state}
          </span>
        </div>
      </div>

      {/* Vertical Progression Timeline */}
      <div className="payout-trace-timeline">
        {stages.map((stage, idx) => {
          const isExpanded = expandedStage === stage.id;
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.id} className="trace-step">
              {/* Timeline Connector & Node */}
              <div className="trace-step-indicator">
                <div
                  className={`trace-node ${
                    stage.status === 'completed'
                      ? 'completed'
                      : stage.status === 'active'
                      ? 'active'
                      : stage.status === 'failed' || stage.status === 'reclaimed'
                      ? 'failed'
                      : 'waiting'
                  }`}
                >
                  {stage.status === 'completed' ? (
                    <CheckCircle2 size={13} />
                  ) : stage.status === 'failed' ? (
                    <RotateCcw size={12} />
                  ) : (
                    stage.number
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`trace-line ${
                      stage.status === 'completed' ? 'completed' : ''
                    }`}
                  />
                )}
              </div>

              {/* Stage Card */}
              <div
                className={`trace-step-content ${stage.status === 'active' ? 'active-step' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
              >
                <div className="trace-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="trace-title">{stage.name}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-xs)',
                        fontFamily: 'var(--font-mono)',
                        background:
                          stage.status === 'completed'
                            ? 'var(--semantic-green-subtle)'
                            : stage.status === 'active'
                            ? 'var(--accent-lime-subtle)'
                            : stage.status === 'failed'
                            ? 'var(--semantic-amber-subtle)'
                            : 'var(--surface-input)',
                        color:
                          stage.status === 'completed'
                            ? 'var(--semantic-green)'
                            : stage.status === 'active'
                            ? 'var(--accent-lime)'
                            : stage.status === 'failed'
                            ? 'var(--semantic-amber)'
                            : 'var(--text-tertiary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {stage.statusLabel}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {stage.timestamp && (
                      <span className="trace-time">
                        <Clock size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                        {formatTimestamp(stage.timestamp)}
                      </span>
                    )}
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                <p className="trace-desc">{stage.explanation}</p>

                {/* Evidence Link / Box if available */}
                {stage.evidenceValue ? (
                  <div className="trace-evidence" onClick={(e) => e.stopPropagation()}>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {stage.evidenceType}:
                    </span>
                    {stage.evidenceUrl ? (
                      <a
                        href={stage.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Inspect on Stellar Expert"
                      >
                        <span style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {stage.evidenceValue}
                        </span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span>{stage.evidenceValue}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    On-chain evidence: Pending execution of this stage
                  </div>
                )}

                {/* Next Action Callout */}
                {stage.nextAction && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      background: 'rgba(184, 243, 107, 0.08)',
                      border: '1px solid var(--accent-lime-border)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '12px',
                      color: 'var(--accent-lime)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ArrowRight size={13} style={{ flexShrink: 0 }} />
                    <span><strong>Required Action:</strong> {stage.nextAction}</span>
                  </div>
                )}

                {/* Expanded Raw Technical Evidence */}
                {isExpanded && stage.rawDetails && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'var(--surface-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase' }}>
                      Cryptographic Evidence & Attributes:
                    </div>
                    {Object.entries(stage.rawDetails).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '3px 0',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        }}
                      >
                        <span style={{ color: 'var(--text-tertiary)' }}>{key}:</span>
                        <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all', textAlign: 'right' }}>
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
