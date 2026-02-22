import React, { useState, useEffect } from 'react';

/**
 * COOKIE CONSENT BANNER
 * =====================
 * Required under GDPR and increasingly under U.S. state laws.
 * Displays once, stores preference in localStorage.
 */

const COOKIE_KEY = 'sts_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY);
      if (!stored) setVisible(true);
    } catch { setVisible(true); }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: true, timestamp: Date.now() }));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: false, timestamp: Date.now() }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 60, left: 12, right: 12, zIndex: 200,
      maxWidth: 480, margin: '0 auto',
      padding: '14px 16px', borderRadius: 14,
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--muted)', marginBottom: 12 }}>
        🍪 We use essential cookies and local storage to keep you logged in and remember your preferences.
        See our <a href="#/privacy" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Privacy Policy</a> for details.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={decline} style={{
          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
        }}>
          Decline Non-Essential
        </button>
        <button onClick={accept} style={{
          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          background: 'var(--accent)', border: 'none', color: '#fff',
        }}>
          Accept All
        </button>
      </div>
    </div>
  );
}
