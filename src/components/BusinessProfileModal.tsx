import React, { useState, useEffect } from 'react';
import type { BusinessProfile, ConnectedWallet } from '../stellar/types';
import { loadBusinessProfile, saveBusinessProfile } from '../store/businessStore';
import {
  X,
  Building2,
  ShieldCheck,
  Check,
  Sparkles,
  Wallet,
} from 'lucide-react';

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: ConnectedWallet | null;
  onProfileSaved?: (profile: BusinessProfile) => void;
}

export const BusinessProfileModal: React.FC<BusinessProfileModalProps> = ({
  isOpen,
  onClose,
  connectedWallet,
  onProfileSaved,
}) => {
  const [profile, setProfile] = useState<BusinessProfile>(() => loadBusinessProfile());
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState('B2B SaaS / Cloud');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = loadBusinessProfile();
      setProfile(current);
      setName(current.name || '');
      setWebsite(current.website || '');
      setCategory(current.category || 'B2B SaaS / Cloud');
      setDescription(current.description || '');
      setContactEmail(current.contactEmail || '');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: BusinessProfile = {
      ...profile,
      id: profile.id || `biz_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: name.trim(),
      website: website.trim(),
      category,
      description: description.trim(),
      contactEmail: contactEmail.trim(),
      walletAddress: connectedWallet?.publicKey || profile.walletAddress,
      verified: true,
    };

    saveBusinessProfile(updated);
    setProfile(updated);
    setSavedSuccess(true);
    if (onProfileSaved) {
      onProfileSaved(updated);
    }
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Register Business Profile
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Brand your referral programs so partners see your verified company identity
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Business Name & Website */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="biz-name">
                  Company / Brand Name <span style={{ color: 'var(--accent-lime)' }}>*</span>
                </label>
                <input
                  id="biz-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. SaaSify Cloud"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="biz-website">
                  Website URL
                </label>
                <input
                  id="biz-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="form-input"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Category & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="biz-category">
                  Business Category
                </label>
                <select
                  id="biz-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="B2B SaaS / Cloud">B2B SaaS / Cloud</option>
                  <option value="FinTech & Payments">FinTech & Payments</option>
                  <option value="Web3 & Crypto">Web3 & Crypto</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                  <option value="Agency & Professional Services">Agency & Professional Services</option>
                  <option value="Developer Tools">Developer Tools</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="biz-email">
                  Partner Contact Email
                </label>
                <input
                  id="biz-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="form-input"
                  placeholder="partners@example.com"
                />
              </div>
            </div>

            {/* Tagline / Description */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="biz-desc">
                Company Description / Tagline
                <span className="hint">Shown on your referral links so partners know what you sell</span>
              </label>
              <textarea
                id="biz-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                placeholder="e.g. Enterprise developer APIs and distributed cloud compute on Stellar."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Connected Treasury Wallet Info */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-input)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={15} color="var(--accent-lime)" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Connected Treasury Wallet:
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {connectedWallet ? `${connectedWallet.publicKey.slice(0, 6)}...${connectedWallet.publicKey.slice(-6)}` : `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-6)}`}
                </span>
              </div>
              <span className="status-badge badge-claimed" style={{ fontSize: '10px' }}>
                Refund Destination
              </span>
            </div>

            {/* Live Branded Portal Preview */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: '8px' }}>
                Referrer Portal Preview (What partners will see)
              </div>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--accent-lime-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-lime-subtle)',
                      border: '1px solid var(--accent-lime-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-lime)',
                      fontWeight: 800,
                      fontSize: '18px',
                    }}
                  >
                    {name ? name.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {name || 'Your Company Name'}
                      </strong>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--accent-lime-subtle)',
                          color: 'var(--accent-lime)',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <ShieldCheck size={11} /> Verified Business
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {category} {website && `• ${website.replace(/^https?:\/\//, '')}`}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Escrow Reward</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                    Guaranteed Payout
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {savedSuccess && (
              <div className="alert-box alert-success" style={{ marginBottom: '16px' }}>
                <Check size={16} />
                <span>Business profile saved successfully! Your referral links will now display this brand.</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ minWidth: '140px' }}>
                <Sparkles size={14} />
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
