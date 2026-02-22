import React, { useState } from 'react';

/**
 * AGE GATE — LEGAL REQUIREMENT
 * =============================
 * Required by 25+ U.S. states with active age verification laws.
 * Supreme Court upheld these requirements in June 2025.
 *
 * CURRENT: Self-declaration ("I am 18+") — minimum viable compliance.
 *
 * PRODUCTION UPGRADE NEEDED:
 *   - Integrate third-party age verification (Yoti, Jumio, VerifyMy, AgeChecker.net)
 *   - OR implement government ID scan for states requiring it
 *   - OR geo-block states with strict laws (TX, LA, UT, FL, etc.)
 *   - Consult attorney for state-by-state compliance strategy
 */

const AGE_GATE_KEY = 'sts_age_verified';

export function isAgeVerified() {
  try {
    const stored = localStorage.getItem(AGE_GATE_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored);
    // Expire after 30 days — re-verify periodically
    if (Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000) return false;
    return data.verified === true;
  } catch { return false; }
}

export default function AgeGate({ onVerified }) {
  const [declining, setDeclining] = useState(false);

  function handleAccept() {
    const data = { verified: true, timestamp: Date.now(), method: 'self_declaration' };
    localStorage.setItem(AGE_GATE_KEY, JSON.stringify(data));
    onVerified();
  }

  function handleDecline() {
    setDeclining(true);
  }

  if (declining) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Access Denied</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>
            You must be 18 years of age or older to access this website.
            Please close this browser tab.
          </p>
          <button
            onClick={() => setDeclining(false)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--muted)', fontSize: 12, cursor: 'pointer', padding: '8px 20px' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎭</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)', marginBottom: 4 }}>
          Stream<span style={{ color: 'var(--gold)' }}>To</span>Stage
        </h1>

        {/* Warning */}
        <div style={styles.warningBox}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>⚠️ Age-Restricted Content</div>
          <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            This website contains adult content and is intended solely for individuals
            who are at least <strong>18 years of age</strong> (or the age of majority
            in your jurisdiction, whichever is greater).
          </p>
        </div>

        {/* Legal text */}
        <p style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 20 }}>
          By entering this site, you certify that you are at least 18 years old and that
          viewing adult content is legal in your jurisdiction. You agree to our{' '}
          <a href="#/terms" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Terms of Service</a>{' '}
          and{' '}
          <a href="#/privacy" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button onClick={handleDecline} style={styles.declineBtn}>
            I am under 18 — Exit
          </button>
          <button onClick={handleAccept} style={styles.acceptBtn}>
            I am 18 or older — Enter
          </button>
        </div>

        {/* Compliance link */}
        <div style={{ marginTop: 20 }}>
          <a href="#/compliance" style={{ fontSize: 9, color: 'var(--dim)', textDecoration: 'none' }}>
            18 U.S.C. § 2257 Compliance Statement
          </a>
        </div>

        {/* Production notice */}
        {/* TODO: Replace self-declaration with third-party age verification
            provider for full state-law compliance. Options:
            - AgeChecker.net (ID scan + database verification)
            - Yoti (facial age estimation)
            - Jumio (government ID verification)
            - VerifyMy (privacy-preserving verification)
        */}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: 24,
  },
  card: {
    maxWidth: 440,
    width: '100%',
    textAlign: 'center',
    padding: 32,
    borderRadius: 16,
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
  },
  warningBox: {
    margin: '20px 0',
    padding: 16,
    borderRadius: 12,
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.25)',
    color: 'var(--gold)',
    textAlign: 'left',
  },
  acceptBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 10,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  declineBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
