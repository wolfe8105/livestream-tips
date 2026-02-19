import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import db from '../services/database.js';
import { timeAgo } from '../services/helpers.js';

// ============================================
// WEBAUTHN HELPERS
// ============================================

// Check if WebAuthn is supported in this browser
function isWebAuthnSupported() {
  return !!(window.PublicKeyCredential && navigator.credentials);
}

// Convert ArrayBuffer to Base64URL string (for storage)
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert Base64URL string back to ArrayBuffer
function base64urlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Generate a cryptographic challenge
function generateChallenge() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr;
}

// ============================================
// SECURITY KEYS PAGE
// ============================================
export default function SecurityKeys() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [keys, setKeys] = useState(db.getSecurityKeys());
  const [settings, setSettings] = useState(db.getSecurityKeySettings());
  const [supported, setSupported] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'success' | 'fail' | null
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [challengeLog, setChallengeLog] = useState(db.getSecurityChallengeLog());

  useEffect(() => {
    setSupported(isWebAuthnSupported());
  }, []);

  // ============================================
  // REGISTER NEW KEY
  // ============================================
  async function registerKey() {
    if (!supported) {
      alert('⚠️ Your browser does not support WebAuthn security keys.');
      return;
    }

    setRegistering(true);
    setTestResult(null);

    try {
      const userId = user?.email || 'demo@streamtostage.com';
      const challenge = generateChallenge();

      // WebAuthn credential creation options
      const createOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: 'StreamToStage',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: user?.email?.split('@')[0] || 'Performer',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256 (ECDSA w/ SHA-256)
            { alg: -257, type: 'public-key' },  // RS256 (RSASSA-PKCS1-v1_5 w/ SHA-256)
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'cross-platform', // USB keys, not just built-in
            userVerification: 'preferred',
            residentKey: 'discouraged',
          },
          timeout: 60000, // 60 second timeout
          attestation: 'none',
          // Exclude already-registered keys
          excludeCredentials: keys.map(k => ({
            type: 'public-key',
            id: base64urlToBuffer(k.credentialId),
          })),
        },
      };

      // This triggers the browser's "Insert your security key" prompt
      const credential = await navigator.credentials.create(createOptions);

      // Extract and store credential data
      const newKey = {
        id: 'sk-' + Date.now(),
        name: 'Security Key ' + (keys.length + 1),
        credentialId: bufferToBase64url(credential.rawId),
        publicKey: bufferToBase64url(credential.response.getPublicKey ? credential.response.getPublicKey() : new ArrayBuffer(0)),
        type: credential.authenticatorAttachment || 'cross-platform',
        registeredAt: Date.now(),
        lastUsedAt: null,
        usageCount: 0,
      };

      const updatedKeys = [...keys, newKey];
      db.saveSecurityKeys(updatedKeys);
      setKeys(updatedKeys);

      // Log the registration
      const log = db.addSecurityChallengeLog({
        action: 'register',
        keyName: newKey.name,
        success: true,
      });
      setChallengeLog(db.getSecurityChallengeLog());

      alert(`✅ Security key "${newKey.name}" registered successfully!`);
    } catch (err) {
      console.error('WebAuthn registration error:', err);

      if (err.name === 'NotAllowedError') {
        // User cancelled or timed out
        alert('Registration cancelled. Insert your security key and try again.');
      } else if (err.name === 'InvalidStateError') {
        alert('This key is already registered.');
      } else {
        alert(`Registration failed: ${err.message}`);
      }

      db.addSecurityChallengeLog({
        action: 'register',
        keyName: 'Unknown',
        success: false,
        error: err.message,
      });
      setChallengeLog(db.getSecurityChallengeLog());
    } finally {
      setRegistering(false);
    }
  }

  // ============================================
  // AUTHENTICATE (TEST) KEY
  // ============================================
  async function testKey() {
    if (!supported || keys.length === 0) return;

    setTesting(true);
    setTestResult(null);

    try {
      const challenge = generateChallenge();

      const getOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials: keys.map(k => ({
            type: 'public-key',
            id: base64urlToBuffer(k.credentialId),
            transports: ['usb', 'ble', 'nfc'],
          })),
          timeout: 60000,
          userVerification: 'preferred',
        },
      };

      // This triggers the browser's "Touch your security key" prompt
      const assertion = await navigator.credentials.get(getOptions);

      // Find which key was used
      const usedKeyId = bufferToBase64url(assertion.rawId);
      const usedKey = keys.find(k => k.credentialId === usedKeyId);

      // Update usage stats
      if (usedKey) {
        const updatedKeys = keys.map(k =>
          k.credentialId === usedKeyId
            ? { ...k, lastUsedAt: Date.now(), usageCount: (k.usageCount || 0) + 1 }
            : k
        );
        db.saveSecurityKeys(updatedKeys);
        setKeys(updatedKeys);
      }

      setTestResult('success');
      db.addSecurityChallengeLog({
        action: 'authenticate',
        keyName: usedKey?.name || 'Unknown Key',
        success: true,
      });
      setChallengeLog(db.getSecurityChallengeLog());

      setTimeout(() => setTestResult(null), 4000);
    } catch (err) {
      console.error('WebAuthn auth error:', err);
      setTestResult('fail');

      db.addSecurityChallengeLog({
        action: 'authenticate',
        keyName: 'Unknown',
        success: false,
        error: err.message,
      });
      setChallengeLog(db.getSecurityChallengeLog());

      setTimeout(() => setTestResult(null), 4000);
    } finally {
      setTesting(false);
    }
  }

  // ============================================
  // KEY MANAGEMENT
  // ============================================
  function removeKey(keyId) {
    const key = keys.find(k => k.id === keyId);
    if (!key) return;

    if (keys.length === 1 && settings.requiredForAdmin) {
      alert('⚠️ Cannot remove your last key while hardware key enforcement is enabled. Disable enforcement first.');
      return;
    }

    if (!window.confirm(`🗑️ Remove "${key.name}"?\n\nThis key will no longer work for authentication on StreamToStage. This cannot be undone.`)) return;

    const updatedKeys = keys.filter(k => k.id !== keyId);
    db.saveSecurityKeys(updatedKeys);
    setKeys(updatedKeys);

    db.addSecurityChallengeLog({
      action: 'remove',
      keyName: key.name,
      success: true,
    });
    setChallengeLog(db.getSecurityChallengeLog());
  }

  function startRename(key) {
    setRenamingId(key.id);
    setRenameValue(key.name);
  }

  function saveRename(keyId) {
    if (!renameValue.trim()) return;
    const updatedKeys = keys.map(k =>
      k.id === keyId ? { ...k, name: renameValue.trim() } : k
    );
    db.saveSecurityKeys(updatedKeys);
    setKeys(updatedKeys);
    setRenamingId(null);
    setRenameValue('');
  }

  // ============================================
  // SETTINGS / ENFORCEMENT
  // ============================================
  function updateSetting(field, value) {
    const updated = { ...settings, [field]: value };
    db.saveSecurityKeySettings(updated);
    setSettings(updated);
  }

  function toggleEnforcement(field) {
    if (!settings[field] && keys.length === 0) {
      alert('⚠️ Register at least one security key before enabling enforcement.');
      return;
    }
    updateSetting(field, !settings[field]);
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="page-pad">
      {/* Header */}
      <div className="flex-between mb-20">
        <div>
          <h2 className="text-cyan text-3xl font-black mb-4">🔐 Security Keys</h2>
          <p className="text-muted text-sm">Hardware authentication (FIDO2 / WebAuthn)</p>
        </div>
        <button
          className="config-badge"
          style={{ cursor: 'pointer', fontSize: 11, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--cyan)' }}
          onClick={() => navigate('/dashboard')}
        >
          ← Dashboard
        </button>
      </div>

      {/* Browser Support Banner */}
      {!supported && (
        <div className="card mb-16" style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid var(--red)', padding: 16 }}>
          <div className="flex-gap">
            <div style={{ fontSize: 24 }}>⚠️</div>
            <div>
              <div className="text-red font-black text-base">Browser Not Supported</div>
              <div className="text-dim text-sm mt-4">WebAuthn requires Chrome 67+, Safari 14+, Firefox 60+, or Edge 18+. Update your browser to use security keys.</div>
            </div>
          </div>
        </div>
      )}

      {supported && (
        <div className="card mb-16" style={{ background: 'rgba(34,197,94,0.08)', border: '1.5px solid rgba(34,197,94,0.3)', padding: 16 }}>
          <div className="flex-gap">
            <div style={{ fontSize: 24 }}>✅</div>
            <div>
              <div style={{ color: '#22c55e', fontWeight: 800, fontSize: 14 }}>WebAuthn Supported</div>
              <div className="text-dim text-sm mt-4">Your browser supports hardware security keys. Plug in a YubiKey, Titan Key, or other FIDO2 device to register.</div>
            </div>
          </div>
        </div>
      )}

      {/* Registered Keys */}
      <div className="card card-surface mb-16" style={{ borderColor: 'rgba(6,182,212,0.25)' }}>
        <div className="flex-between mb-16">
          <h3 className="text-cyan text-xl">🔑 Registered Keys</h3>
          <div className="config-badge" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--cyan)', fontSize: 11 }}>
            {keys.length} key{keys.length !== 1 ? 's' : ''}
          </div>
        </div>

        {keys.length > 0 ? (
          keys.map(key => (
            <div key={key.id} className="sk-key-card">
              <div className="sk-key-icon">🔑</div>
              <div style={{ flex: 1 }}>
                {renamingId === key.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: 6, fontSize: 13, flex: 1 }}
                      value={renameValue}
                      maxLength={40}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(key.id)}
                      autoFocus
                    />
                    <button className="sk-btn-sm sk-btn-save" onClick={() => saveRename(key.id)}>✓</button>
                    <button className="sk-btn-sm sk-btn-cancel" onClick={() => setRenamingId(null)}>✕</button>
                  </div>
                ) : (
                  <>
                    <div className="sk-key-name">{key.name}</div>
                    <div className="sk-key-meta">
                      Registered {timeAgo(key.registeredAt)}
                      {key.lastUsedAt && <> · Last used {timeAgo(key.lastUsedAt)}</>}
                      {key.usageCount > 0 && <> · {key.usageCount} auth{key.usageCount !== 1 ? 's' : ''}</>}
                    </div>
                    <div className="sk-key-type">
                      {key.type === 'cross-platform' ? '🔌 USB / NFC / Bluetooth' : '📱 Platform Key'}
                    </div>
                  </>
                )}
              </div>
              {renamingId !== key.id && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="sk-btn-sm sk-btn-edit" title="Rename" onClick={() => startRename(key)}>✏️</button>
                  <button className="sk-btn-sm sk-btn-delete" title="Remove" onClick={() => removeKey(key.id)}>🗑️</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
            <div className="text-muted text-base font-bold">No Keys Registered</div>
            <div className="text-dim text-sm mt-4">Add a hardware security key to protect your account</div>
          </div>
        )}

        {/* Register Button */}
        <button
          className="sk-register-btn mt-16"
          onClick={registerKey}
          disabled={registering || !supported}
          style={{ opacity: (registering || !supported) ? 0.5 : 1 }}
        >
          {registering ? (
            <div className="sk-register-loading">
              <div className="sk-spinner"></div>
              <span>Waiting for security key…</span>
            </div>
          ) : (
            <>➕ Register New Security Key</>
          )}
        </button>

        {registering && (
          <div className="sk-waiting-prompt">
            <div className="sk-pulse-icon">🔑</div>
            <div className="text-cyan font-bold text-base">Insert & touch your security key</div>
            <div className="text-dim text-sm mt-4">Plug in your YubiKey or tap your NFC key to the device</div>
          </div>
        )}
      </div>

      {/* Test Authentication */}
      {keys.length > 0 && (
        <div className="card card-surface mb-16" style={{ borderColor: 'rgba(245,158,11,0.25)' }}>
          <h3 className="text-gold text-xl mb-12">🧪 Test Authentication</h3>
          <p className="text-dim text-sm mb-16">Verify your security key works by running a test challenge. This simulates the prompt you'll see when performing protected actions.</p>

          <button
            className="sk-test-btn"
            onClick={testKey}
            disabled={testing}
            style={{ opacity: testing ? 0.5 : 1 }}
          >
            {testing ? (
              <div className="sk-register-loading">
                <div className="sk-spinner"></div>
                <span>Touch your key now…</span>
              </div>
            ) : (
              <>🔐 Run Test Challenge</>
            )}
          </button>

          {testResult === 'success' && (
            <div className="sk-test-result sk-test-success">
              <span style={{ fontSize: 20 }}>✅</span>
              <span className="font-bold">Authentication successful!</span>
            </div>
          )}
          {testResult === 'fail' && (
            <div className="sk-test-result sk-test-fail">
              <span style={{ fontSize: 20 }}>❌</span>
              <span className="font-bold">Authentication failed. Try again.</span>
            </div>
          )}
        </div>
      )}

      {/* Enforcement Settings */}
      <div className="card card-surface mb-16" style={{ borderColor: 'rgba(225,29,72,0.25)' }}>
        <h3 className="text-violet text-xl mb-8">🛡️ Enforcement Settings</h3>
        <p className="text-dim text-sm mb-20">Choose which high-risk actions require your hardware key</p>

        {[
          { field: 'requiredForAdmin', icon: '🔑', label: 'Admin Dashboard', desc: 'Require key to access admin & review panels', color: '#a855f7' },
          { field: 'requiredForPayouts', icon: '💰', label: 'Withdrawals & Payouts', desc: 'Require key for payout requests & method changes', color: 'var(--gold)' },
          { field: 'requiredForGoLive', icon: '📡', label: 'Go Live', desc: 'Require key to start a live broadcast', color: 'var(--red)' },
          { field: 'requiredForAccountChanges', icon: '👤', label: 'Account Changes', desc: 'Require key for email, password, payout info edits', color: 'var(--cyan)' },
          { field: 'requiredForAntifraud', icon: '🚩', label: 'Anti-Fraud Settings', desc: 'Require key to modify security thresholds', color: 'var(--hot)' },
        ].map((item, i) => (
          <div key={i} className="sk-enforce-row">
            <div className="sk-enforce-left">
              <div style={{ fontSize: 22 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.label}</div>
                <div className="text-dim" style={{ fontSize: 11, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
            <button
              className={`sk-toggle ${settings[item.field] ? 'sk-toggle-on' : 'sk-toggle-off'}`}
              onClick={() => toggleEnforcement(item.field)}
            >
              <div className="sk-toggle-knob"></div>
            </button>
          </div>
        ))}

        {/* Enforcement strength indicator */}
        {keys.length > 0 && (
          <div className="sk-strength-bar mt-16">
            <div className="flex-between mb-8">
              <span className="text-sm font-bold text-muted">Protection Level</span>
              <span className="text-sm font-black" style={{ color: getStrengthColor(settings) }}>{getStrengthLabel(settings)}</span>
            </div>
            <div className="sk-strength-track">
              <div className="sk-strength-fill" style={{ width: getStrengthPercent(settings) + '%', background: getStrengthColor(settings) }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Challenge Log */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-16">
          <h3 className="text-gold text-xl">📋 Authentication Log</h3>
          <span className="text-dim text-sm">{challengeLog.length} events</span>
        </div>
        {challengeLog.length > 0 ? (
          challengeLog.slice(0, 20).map(entry => (
            <div key={entry.id} className="sk-log-entry">
              <div className="sk-log-left">
                <div className={`sk-log-icon ${entry.success ? 'sk-log-success' : 'sk-log-fail'}`}>
                  {entry.action === 'register' ? '➕' : entry.action === 'remove' ? '🗑️' : '🔐'}
                </div>
                <div>
                  <div className="text-sm font-bold">
                    {entry.action === 'register' ? 'Key Registered' :
                     entry.action === 'remove' ? 'Key Removed' :
                     entry.action === 'authenticate' ? 'Authentication' :
                     entry.action === 'gate-challenge' ? 'Access Challenge' : 'Event'}
                  </div>
                  <div className="text-xs text-dim mt-4">
                    {entry.keyName}{entry.context ? ` · ${entry.context}` : ''} · {timeAgo(entry.timestamp)}
                  </div>
                  {entry.error && <div className="text-xs text-red mt-4">{entry.error}</div>}
                </div>
              </div>
              <div className={`sk-log-status ${entry.success ? 'text-green' : 'text-red'}`} style={{ color: entry.success ? '#22c55e' : 'var(--red)' }}>
                {entry.success ? '✓' : '✕'}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div className="text-muted text-sm">No authentication events yet</div>
          </div>
        )}
      </div>

      {/* Setup Help */}
      <div className="card card-surface mb-16">
        <div
          className="flex-between"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowHelp(!showHelp)}
        >
          <h3 className="text-muted text-lg">❓ Setup Guide</h3>
          <span className="text-dim" style={{ fontSize: 18 }}>{showHelp ? '▲' : '▼'}</span>
        </div>
        {showHelp && (
          <div className="mt-16">
            {[
              { step: 1, icon: '🛒', title: 'Get a Security Key', text: 'Purchase a FIDO2-compatible key. We recommend YubiKey 5 series ($25-$75) or Google Titan ($30). Available on Amazon.' },
              { step: 2, icon: '🔌', title: 'Plug It In', text: 'Insert the USB key into your computer or phone. For NFC keys, hold it against your device when prompted.' },
              { step: 3, icon: '➕', title: 'Register Here', text: 'Click "Register New Security Key" above. Your browser will prompt you to touch the key. Tap the metal contact.' },
              { step: 4, icon: '🛡️', title: 'Enable Enforcement', text: 'Toggle on which actions should require the key. We recommend at minimum: Admin, Payouts, and Account Changes.' },
              { step: 5, icon: '🔑', title: 'Register a Backup', text: 'Register a second key and store it somewhere safe. If you lose your primary key, the backup lets you maintain access.' },
              { step: 6, icon: '🧪', title: 'Test It', text: 'Use the "Test Authentication" section to verify everything works before enabling enforcement.' },
            ].map(s => (
              <div key={s.step} className="sk-help-step">
                <div className="sk-help-number">{s.step}</div>
                <div style={{ flex: 1 }}>
                  <div className="text-base font-bold mb-4">{s.icon} {s.title}</div>
                  <div className="text-sm text-muted leading-relaxed">{s.text}</div>
                </div>
              </div>
            ))}

            <div className="card mt-16" style={{ background: 'rgba(6,182,212,0.08)', border: '1.5px solid rgba(6,182,212,0.25)', padding: 14 }}>
              <div className="text-cyan font-bold text-sm mb-4">💡 Why hardware keys?</div>
              <div className="text-muted text-sm leading-relaxed">
                Unlike passwords, SMS codes, or authenticator apps — hardware keys can't be phished, intercepted, or cloned remotely. An attacker would need to physically steal your USB device. Google eliminated 100% of employee phishing after mandating YubiKeys company-wide.
              </div>
            </div>

            <div className="card mt-12" style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.25)', padding: 14 }}>
              <div className="text-gold font-bold text-sm mb-4">🔗 Compatible Keys</div>
              <div className="text-muted text-sm leading-relaxed">
                Any FIDO2/WebAuthn key works: YubiKey 5 NFC, YubiKey 5C, YubiKey Bio, Google Titan (USB-A/C/Bluetooth), Feitian ePass, SoloKeys, Nitrokey, Thetis FIDO2.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Protected Actions Quick Reference */}
      <div className="card card-surface">
        <h3 className="text-muted text-lg mb-12">🔒 What Gets Protected</h3>
        <div className="text-dim text-sm leading-relaxed" style={{ lineHeight: 2 }}>
          When enforcement is on, these actions pop up a "Touch your security key" prompt before proceeding. No key = no access. This stops attackers cold even if they steal your password.
        </div>
        <div className="sk-protected-grid mt-16">
          {[
            { icon: '🔑', label: 'Admin access', active: settings.requiredForAdmin },
            { icon: '💰', label: 'Withdrawals', active: settings.requiredForPayouts },
            { icon: '📡', label: 'Go live', active: settings.requiredForGoLive },
            { icon: '👤', label: 'Account edits', active: settings.requiredForAccountChanges },
            { icon: '🚩', label: 'Fraud settings', active: settings.requiredForAntifraud },
            { icon: '🔄', label: 'Payout method', active: settings.requiredForPayouts },
          ].map((item, i) => (
            <div key={i} className={`sk-protected-item ${item.active ? 'sk-protected-active' : ''}`}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span className="text-xs font-bold">{item.label}</span>
              <span className="text-xs" style={{ color: item.active ? '#22c55e' : 'var(--dim)' }}>
                {item.active ? '🟢 ON' : '⚫ OFF'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// REUSABLE CHALLENGE GATE COMPONENT
// ============================================
// Import this in any page that needs key verification:
//   import { SecurityChallenge } from './SecurityKeys.jsx';
//
// Usage:
//   <SecurityChallenge action="admin" onSuccess={() => setUnlocked(true)} onCancel={() => navigate(-1)} />
//
export function SecurityChallenge({ action, onSuccess, onCancel }) {
  const [challenging, setChallenging] = useState(false);
  const [error, setError] = useState(null);
  const settings = db.getSecurityKeySettings();
  const keys = db.getSecurityKeys();

  // Check if this action requires a key
  const fieldMap = {
    admin: 'requiredForAdmin',
    payouts: 'requiredForPayouts',
    golive: 'requiredForGoLive',
    account: 'requiredForAccountChanges',
    antifraud: 'requiredForAntifraud',
  };

  const isRequired = settings[fieldMap[action]] && keys.length > 0;

  // If not required, auto-pass
  useEffect(() => {
    if (!isRequired) {
      onSuccess();
    }
  }, [isRequired, onSuccess]);

  async function runChallenge() {
    if (!isWebAuthnSupported()) {
      setError('WebAuthn not supported in this browser');
      return;
    }

    setChallenging(true);
    setError(null);

    try {
      const challenge = generateChallenge();

      const getOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials: keys.map(k => ({
            type: 'public-key',
            id: base64urlToBuffer(k.credentialId),
            transports: ['usb', 'ble', 'nfc'],
          })),
          timeout: 60000,
          userVerification: 'preferred',
        },
      };

      const assertion = await navigator.credentials.get(getOptions);
      const usedKeyId = bufferToBase64url(assertion.rawId);
      const usedKey = keys.find(k => k.credentialId === usedKeyId);

      // Update usage
      if (usedKey) {
        const updatedKeys = keys.map(k =>
          k.credentialId === usedKeyId
            ? { ...k, lastUsedAt: Date.now(), usageCount: (k.usageCount || 0) + 1 }
            : k
        );
        db.saveSecurityKeys(updatedKeys);
      }

      db.addSecurityChallengeLog({
        action: 'gate-challenge',
        keyName: usedKey?.name || 'Unknown',
        success: true,
        context: action,
      });

      onSuccess();
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Cancelled or timed out' : err.message);

      db.addSecurityChallengeLog({
        action: 'gate-challenge',
        keyName: 'Unknown',
        success: false,
        context: action,
        error: err.message,
      });
    } finally {
      setChallenging(false);
    }
  }

  if (!isRequired) return null;

  const actionLabels = {
    admin: 'Admin Dashboard',
    payouts: 'Withdrawals & Payouts',
    golive: 'Go Live',
    account: 'Account Changes',
    antifraud: 'Anti-Fraud Settings',
  };

  return (
    <div className="sk-gate-overlay">
      <div className="sk-gate-card">
        <div className="sk-gate-icon">🔐</div>
        <h3 className="text-cyan text-xl font-black mb-8">Security Key Required</h3>
        <p className="text-muted text-sm mb-4">
          <strong className="text-white">{actionLabels[action] || action}</strong> requires hardware key verification.
        </p>
        <p className="text-dim text-sm mb-20">Insert your security key and touch it to continue.</p>

        {error && (
          <div className="sk-gate-error mb-16">
            <span>❌</span> {error}
          </div>
        )}

        <button
          className="sk-register-btn mb-12"
          onClick={runChallenge}
          disabled={challenging}
          style={{ opacity: challenging ? 0.5 : 1 }}
        >
          {challenging ? (
            <div className="sk-register-loading">
              <div className="sk-spinner"></div>
              <span>Touch your key now…</span>
            </div>
          ) : (
            <>🔑 Verify with Security Key</>
          )}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              width: '100%', background: 'none', border: '1.5px solid var(--border)',
              color: 'var(--muted)', padding: 12, borderRadius: 10,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            ← Go Back
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// STRENGTH HELPERS
// ============================================
function getStrengthPercent(settings) {
  const fields = ['requiredForAdmin', 'requiredForPayouts', 'requiredForGoLive', 'requiredForAccountChanges', 'requiredForAntifraud'];
  const on = fields.filter(f => settings[f]).length;
  return (on / fields.length) * 100;
}

function getStrengthLabel(settings) {
  const pct = getStrengthPercent(settings);
  if (pct === 0) return 'None';
  if (pct <= 20) return 'Minimal';
  if (pct <= 40) return 'Low';
  if (pct <= 60) return 'Medium';
  if (pct <= 80) return 'Strong';
  return 'Maximum';
}

function getStrengthColor(settings) {
  const pct = getStrengthPercent(settings);
  if (pct === 0) return 'var(--dim)';
  if (pct <= 40) return 'var(--gold)';
  if (pct <= 60) return 'var(--hot)';
  if (pct <= 80) return 'var(--cyan)';
  return '#22c55e';
}
