import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/database.js';
import { CLUBS, STATE_NAMES } from '../data/constants.js';

const STEPS = [
  { id: 0, label: 'Overview', icon: '📋' },
  { id: 1, label: 'Identity', icon: '🪪' },
  { id: 2, label: 'Photo Verify', icon: '🤳' },
  { id: 3, label: 'Venue Link', icon: '🏢' },
  { id: 4, label: '2257 Compliance', icon: '⚖️' },
  { id: 5, label: 'Review', icon: '✅' },
];

const ID_TYPES = ['US Driver License', 'US Passport', 'US State ID', 'Foreign Passport', 'Foreign National ID'];

export default function Verification() {
  const navigate = useNavigate();
  const [vData, setVData] = useState(() => db.getVerification());
  const [step, setStep] = useState(vData.status === 'not_started' ? 0 : (vData.status === 'approved' || vData.status === 'pending_review') ? 5 : vData.step || 0);

  function update(section, field, value) {
    const updated = { ...vData, [section]: { ...vData[section], [field]: value } };
    setVData(updated);
  }

  function saveAndNext() {
    const updated = { ...vData, step: step + 1, status: 'in_progress' };
    db.saveVerification(updated);
    setVData(updated);
    setStep(step + 1);
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  function submitForReview() {
    const updated = { ...vData, status: 'pending_review', submittedAt: Date.now(), step: 5 };
    db.saveVerification(updated);
    setVData(updated);
    setStep(5);
  }

  // Mock: simulate approval (in production, this comes from admin backend)
  function mockApprove() {
    const updated = { ...vData, status: 'approved', reviewedAt: Date.now() };
    db.saveVerification(updated);
    setVData(updated);
  }

  function resetVerification() {
    if (!window.confirm('⚠️ Reset your verification? You will need to start over.')) return;
    const fresh = db.getVerification();
    // Force a true reset
    localStorage.removeItem('sts_verification');
    const reset = db.getVerification();
    db.saveVerification(reset);
    setVData(reset);
    setStep(0);
  }

  const allStates = Object.keys(CLUBS).sort();

  // ============================================
  // STATUS BANNER (for approved/pending/rejected)
  // ============================================
  function StatusBanner() {
    if (vData.status === 'approved') {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🛡️</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', marginBottom: 8 }}>Verified Performer</h2>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Your identity and venue have been verified</p>
          <p className="text-dim" style={{ fontSize: 11 }}>Approved {vData.reviewedAt ? new Date(vData.reviewedAt).toLocaleDateString() : ''}</p>
          <div className="card card-surface" style={{ marginTop: 20, padding: 14, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Legal Name</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{vData.identity.legalFirstName} {vData.identity.legalLastName}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Verified Venue</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{vData.venue.clubName}, {STATE_NAMES[vData.venue.clubState] || vData.venue.clubState}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Stage Names</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{vData.identity.stageNames || 'None listed'}</div>
          </div>
          <button onClick={resetVerification} style={{ marginTop: 20, background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            Reset Verification
          </button>
        </div>
      );
    }

    if (vData.status === 'pending_review') {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)', marginBottom: 8 }}>Under Review</h2>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Your verification is being reviewed</p>
          <p className="text-dim" style={{ fontSize: 11, marginBottom: 20 }}>Submitted {vData.submittedAt ? new Date(vData.submittedAt).toLocaleDateString() : ''}</p>

          <div className="card card-surface" style={{ padding: 14, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>What happens next:</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div>1. Our team reviews your ID and selfie</div>
              <div>2. We contact your venue manager for confirmation</div>
              <div>3. 2257 records are filed with our Custodian of Records</div>
              <div>4. You'll receive your 🛡️ Verified badge</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>Typical review time: 24–48 hours</div>
          </div>

          {/* Demo: simulate approval */}
          <button
            onClick={mockApprove}
            style={{ background: 'rgba(34,197,94,0.1)', border: '1.5px solid #22c55e', color: '#22c55e', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            🧪 Demo: Simulate Approval
          </button>
        </div>
      );
    }

    if (vData.status === 'rejected') {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>❌</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)', marginBottom: 8 }}>Verification Denied</h2>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>Reason: {vData.rejectionReason || 'Not specified'}</p>
          <button onClick={resetVerification} className="btn-primary" style={{ fontSize: 14 }}>Try Again</button>
        </div>
      );
    }
    return null;
  }

  // ============================================
  // PROGRESS BAR
  // ============================================
  function ProgressBar() {
    return (
      <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    );
  }

  // ============================================
  // STEP 0: OVERVIEW
  // ============================================
  function StepOverview() {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛡️</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Get Verified</h2>
          <p className="text-muted" style={{ fontSize: 13 }}>Earn your 🛡️ Verified badge and start streaming</p>
        </div>

        <div className="card card-surface" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--accent)' }}>Why verify?</h3>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
            <div>✅ Earn viewer trust with the 🛡️ Verified badge</div>
            <div>✅ Prove you're a real person at a real venue</div>
            <div>✅ Required to receive payouts</div>
            <div>✅ Anti-deepfake / anti-AI protection</div>
          </div>
        </div>

        <div className="card card-surface" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--gold)' }}>What you'll need</h3>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
            <div>🪪 Government-issued photo ID</div>
            <div>🤳 A selfie holding your ID</div>
            <div>🏢 Your venue/club info + manager contact</div>
            <div>⚖️ Acknowledgment of 18 U.S.C. § 2257 record-keeping</div>
          </div>
        </div>

        <div className="card card-surface" style={{ padding: 16, marginBottom: 20, borderColor: 'rgba(245,158,11,0.3)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: 'var(--gold)' }}>⚖️ About 2257 Compliance</h3>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--muted)' }}>
            Federal law (18 U.S.C. § 2257) requires all producers of sexually explicit content to maintain records proving every performer is at least 18 years of age. StreamToStage maintains these records through a designated Custodian of Records. Your information is stored securely and only accessed for legal compliance purposes.
          </p>
        </div>

        <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setStep(1); }}>
          Start Verification →
        </button>
      </div>
    );
  }

  // ============================================
  // STEP 1: IDENTITY
  // ============================================
  function StepIdentity() {
    const id = vData.identity;
    const canContinue = id.legalFirstName.trim() && id.legalLastName.trim() && id.dateOfBirth && id.idType;

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>🪪 Identity Information</h2>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: 20 }}>Legal name as it appears on your government ID</p>

        <div className="card card-surface" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Legal First Name *</label>
            <input
              type="text" value={id.legalFirstName} maxLength={50}
              onChange={e => update('identity', 'legalFirstName', e.target.value)}
              placeholder="First name on ID"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Legal Last Name *</label>
            <input
              type="text" value={id.legalLastName} maxLength={50}
              onChange={e => update('identity', 'legalLastName', e.target.value)}
              placeholder="Last name on ID"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Date of Birth *</label>
            <input
              type="date" value={id.dateOfBirth}
              onChange={e => update('identity', 'dateOfBirth', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Must be 18+ to perform on StreamToStage</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Stage Name(s)</label>
            <input
              type="text" value={id.stageNames} maxLength={100}
              onChange={e => update('identity', 'stageNames', e.target.value)}
              placeholder="All stage/screen names used (comma separated)"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Required by 2257 — list every name you've performed under</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>ID Type *</label>
            <select
              value={id.idType}
              onChange={e => update('identity', 'idType', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            >
              <option value="">Select ID type...</option>
              {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={goBack} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back</button>
          <button onClick={saveAndNext} disabled={!canContinue} className="btn-primary" style={{ flex: 2, opacity: canContinue ? 1 : 0.4 }}>Continue →</button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 2: PHOTO VERIFICATION
  // ============================================
  function StepPhoto() {
    const id = vData.identity;

    function mockUpload(field) {
      // In production: file picker → upload to secure storage → store URL
      update('identity', field, true);
    }

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>🤳 Photo Verification</h2>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: 20 }}>Upload your ID and a verification selfie</p>

        {/* ID Upload */}
        <div className="card card-surface" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🪪 Government ID Photo</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Upload a clear photo of your {id.idType || 'government-issued ID'}. Make sure the name, date of birth, and photo are visible.
          </p>
          {id.idUploaded ? (
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>✅</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>ID Uploaded</div>
              <button onClick={() => update('identity', 'idUploaded', false)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>Remove & re-upload</button>
            </div>
          ) : (
            <button
              onClick={() => mockUpload('idUploaded')}
              style={{
                width: '100%', padding: 20, borderRadius: 12,
                border: '2px dashed var(--border)', background: 'rgba(255,255,255,0.02)',
                color: 'var(--muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}
            >
              <div style={{ fontSize: 32 }}>📷</div>
              <div>Tap to Upload ID Photo</div>
              <div style={{ fontSize: 11, fontWeight: 400 }}>JPG, PNG — Max 10MB</div>
            </button>
          )}
        </div>

        {/* Selfie Upload */}
        <div className="card card-surface" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🤳 Verification Selfie</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Take a photo of yourself holding your ID next to your face. Both your face and the ID must be clearly visible.
          </p>
          {id.selfieUploaded ? (
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>✅</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>Selfie Uploaded</div>
              <button onClick={() => update('identity', 'selfieUploaded', false)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>Remove & re-upload</button>
            </div>
          ) : (
            <button
              onClick={() => mockUpload('selfieUploaded')}
              style={{
                width: '100%', padding: 20, borderRadius: 12,
                border: '2px dashed var(--border)', background: 'rgba(255,255,255,0.02)',
                color: 'var(--muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}
            >
              <div style={{ fontSize: 32 }}>🤳</div>
              <div>Tap to Upload Selfie with ID</div>
              <div style={{ fontSize: 11, fontWeight: 400 }}>JPG, PNG — Max 10MB</div>
            </button>
          )}
        </div>

        <div className="card card-surface" style={{ padding: 12, marginBottom: 20, borderColor: 'rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', lineHeight: 1.5 }}>
            🔒 Your photos are encrypted and stored in compliance with 18 U.S.C. § 2257. They are only accessible by our Custodian of Records and are never shared publicly.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={goBack} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back</button>
          <button onClick={saveAndNext} disabled={!id.idUploaded || !id.selfieUploaded} className="btn-primary" style={{ flex: 2, opacity: (id.idUploaded && id.selfieUploaded) ? 1 : 0.4 }}>Continue →</button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 3: VENUE LINK
  // ============================================
  function StepVenue() {
    const v = vData.venue;
    const clubsForState = v.clubState ? (CLUBS[v.clubState] || []) : [];
    const canContinue = v.clubName && v.clubState && v.managerName.trim() && (v.managerEmail.trim() || v.managerPhone.trim());

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>🏢 Venue Verification</h2>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: 20 }}>Link your profile to a real venue — this is what earns your 🛡️ badge</p>

        <div className="card card-surface" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>State *</label>
            <select
              value={v.clubState}
              onChange={e => { update('venue', 'clubState', e.target.value); update('venue', 'clubName', ''); }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            >
              <option value="">Select state...</option>
              {allStates.map(s => <option key={s} value={s}>{STATE_NAMES[s] || s}</option>)}
            </select>
          </div>

          {v.clubState && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Venue/Club *</label>
              <select
                value={v.clubName}
                onChange={e => update('venue', 'clubName', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
              >
                <option value="">Select venue...</option>
                {clubsForState.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{clubsForState.length} venues in {STATE_NAMES[v.clubState]}</div>
            </div>
          )}
        </div>

        <div className="card card-surface" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Manager / Contact Person</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>We'll contact them to confirm you perform at this venue</p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Manager Name *</label>
            <input
              type="text" value={v.managerName} maxLength={60}
              onChange={e => update('venue', 'managerName', e.target.value)}
              placeholder="First and last name"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Manager Email</label>
            <input
              type="email" value={v.managerEmail} maxLength={80}
              onChange={e => update('venue', 'managerEmail', e.target.value)}
              placeholder="manager@venue.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Manager Phone</label>
            <input
              type="tel" value={v.managerPhone} maxLength={20}
              onChange={e => update('venue', 'managerPhone', e.target.value)}
              placeholder="(555) 123-4567"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Provide email, phone, or both</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={goBack} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back</button>
          <button onClick={saveAndNext} disabled={!canContinue} className="btn-primary" style={{ flex: 2, opacity: canContinue ? 1 : 0.4 }}>Continue →</button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 4: 2257 COMPLIANCE
  // ============================================
  function StepCompliance() {
    const c = vData.compliance;
    const canContinue = c.ageConfirmed && c.custodianAcknowledged && c.termsAccepted;

    function toggleCompliance(field) {
      update('compliance', field, !c[field]);
    }

    function Checkbox({ checked, onToggle, children }) {
      return (
        <button
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
            padding: '12px 14px', borderRadius: 10, cursor: 'pointer', width: '100%',
            background: checked ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
            border: checked ? '1.5px solid rgba(34,197,94,0.3)' : '1.5px solid var(--border)',
            color: 'var(--text)', fontSize: 13, lineHeight: 1.5, marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 18, marginTop: -1, flexShrink: 0 }}>
            {checked ? '☑️' : '⬜'}
          </div>
          <div>{children}</div>
        </button>
      );
    }

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>⚖️ 2257 Compliance</h2>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: 20 }}>Federal record-keeping requirements</p>

        <div className="card card-surface" style={{ padding: 16, marginBottom: 16, borderColor: 'rgba(245,158,11,0.3)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: 'var(--gold)' }}>About 18 U.S.C. § 2257</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 10 }}>
            Federal law requires producers of sexually explicit content to verify and maintain records proving all performers are at least 18 years of age. As a platform, StreamToStage is classified as a secondary producer and must maintain these records.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 10 }}>
            <strong style={{ color: 'var(--text)' }}>Custodian of Records:</strong> StreamToStage designates a Custodian of Records who maintains all 2257-required documentation. The Custodian's name and business address are displayed on our compliance page and in every content page as required by law.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>What we store:</strong> Your legal name, date of birth, all stage names used, a copy of your government-issued photo ID, and the date we verified your age. These records must be maintained for the duration your content exists plus 5 years, and must be available for inspection by the Attorney General.
          </p>
        </div>

        <div className="card card-surface" style={{ padding: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Required Acknowledgments</h3>

          <Checkbox checked={c.ageConfirmed} onToggle={() => toggleCompliance('ageConfirmed')}>
            <strong>I confirm I am at least 18 years of age</strong> and the date of birth I provided is accurate and matches my government-issued identification.
          </Checkbox>

          <Checkbox checked={c.custodianAcknowledged} onToggle={() => toggleCompliance('custodianAcknowledged')}>
            <strong>I understand that StreamToStage will maintain 2257 records</strong> including my legal name, date of birth, stage names, and a copy of my ID, through a designated Custodian of Records as required by federal law.
          </Checkbox>

          <Checkbox checked={c.termsAccepted} onToggle={() => toggleCompliance('termsAccepted')}>
            <strong>I agree to StreamToStage's Performer Terms of Service</strong> including content policies, payout terms, and the requirement to maintain accurate identification and venue information.
          </Checkbox>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={goBack} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back</button>
          <button onClick={saveAndNext} disabled={!canContinue} className="btn-primary" style={{ flex: 2, opacity: canContinue ? 1 : 0.4 }}>Review & Submit →</button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 5: REVIEW & SUBMIT
  // ============================================
  function StepReview() {
    if (vData.status === 'pending_review' || vData.status === 'approved' || vData.status === 'rejected') {
      return <StatusBanner />;
    }

    const id = vData.identity;
    const v = vData.venue;

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>✅ Review & Submit</h2>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: 20 }}>Double-check everything before submitting</p>

        {/* Identity Summary */}
        <div className="card card-surface" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>🪪 Identity</h3>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
            <div><strong className="text-white">Name:</strong> {id.legalFirstName} {id.legalLastName}</div>
            <div><strong className="text-white">DOB:</strong> {id.dateOfBirth}</div>
            <div><strong className="text-white">ID Type:</strong> {id.idType}</div>
            <div><strong className="text-white">Stage Names:</strong> {id.stageNames || 'None'}</div>
          </div>
        </div>

        {/* Photos Summary */}
        <div className="card card-surface" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>🤳 Photos</h3>
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
            <div>{id.idUploaded ? '✅' : '❌'} Government ID photo</div>
            <div>{id.selfieUploaded ? '✅' : '❌'} Verification selfie</div>
          </div>
        </div>

        {/* Venue Summary */}
        <div className="card card-surface" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>🏢 Venue</h3>
            <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
            <div><strong className="text-white">Venue:</strong> {v.clubName}</div>
            <div><strong className="text-white">State:</strong> {STATE_NAMES[v.clubState] || v.clubState}</div>
            <div><strong className="text-white">Manager:</strong> {v.managerName}</div>
            <div><strong className="text-white">Contact:</strong> {v.managerEmail || v.managerPhone}</div>
          </div>
        </div>

        {/* Compliance Summary */}
        <div className="card card-surface" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>⚖️ Compliance</h3>
            <button onClick={() => setStep(4)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
            <div>✅ Age confirmed (18+)</div>
            <div>✅ 2257 record-keeping acknowledged</div>
            <div>✅ Terms of Service accepted</div>
          </div>
        </div>

        <button
          onClick={submitForReview}
          className="btn-primary"
          style={{ width: '100%', fontSize: 16, padding: 14, background: 'linear-gradient(135deg, var(--accent), #ff6b2c)' }}
        >
          🛡️ Submit for Verification
        </button>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
          Review typically takes 24–48 hours
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="page-pad" style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 900 }}>Performer Verification</h1>
      </div>

      {(vData.status !== 'approved' && vData.status !== 'pending_review' && vData.status !== 'rejected') && <ProgressBar />}

      {step === 0 && <StepOverview />}
      {step === 1 && <StepIdentity />}
      {step === 2 && <StepPhoto />}
      {step === 3 && <StepVenue />}
      {step === 4 && <StepCompliance />}
      {step === 5 && <StepReview />}
    </div>
  );
}
