import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/database.js';
import { timeAgo } from '../services/helpers.js';

const SEVERITY_CONFIG = {
  critical: { color: 'var(--red)', bg: 'rgba(225,29,72,0.1)', border: 'rgba(225,29,72,0.3)', icon: '🔴' },
  warning: { color: 'var(--gold)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: '🟡' },
  info: { color: 'var(--violet)', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: '🔵' },
};

const ACTION_LABELS = {
  rate_limited: { label: 'Rate Limited', color: 'var(--gold)' },
  flagged: { label: 'Flagged', color: 'var(--gold)' },
  account_frozen: { label: 'Account Frozen', color: 'var(--red)' },
  allowed: { label: 'Allowed', color: '#22c55e' },
  captcha_required: { label: 'CAPTCHA Required', color: 'var(--violet)' },
  blocked: { label: 'Blocked', color: 'var(--red)' },
};

export default function Antifraud() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(db.getAntifraudSettings());
  const [log] = useState(db.getAntifraudLog());
  const [showSettings, setShowSettings] = useState(true);
  const [logFilter, setLogFilter] = useState('all');

  function updateSetting(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    db.saveAntifraudSettings(updated);
  }

  const filteredLog = logFilter === 'all'
    ? log
    : log.filter(l => l.severity === logFilter);

  const criticalCount = log.filter(l => l.severity === 'critical').length;
  const warningCount = log.filter(l => l.severity === 'warning').length;

  return (
    <div className="page-pad">
      <div className="flex-between mb-20">
        <div>
          <h2 className="text-red text-3xl font-black mb-4">🛡️ Anti-Fraud</h2>
          <p className="text-muted text-sm">Security & rate limiting</p>
        </div>
        <button className="config-badge config-badge-violet" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => navigate('/admin')}>
          ← Admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid-2col mb-16">
        <div className="card text-center" style={{
          padding: 14, borderRadius: 12,
          background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)',
        }}>
          <div className="text-2xl font-black text-red">{criticalCount}</div>
          <div className="text-xs text-muted mt-4">Critical Events</div>
        </div>
        <div className="card text-center" style={{
          padding: 14, borderRadius: 12,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <div className="text-2xl font-black text-gold">{warningCount}</div>
          <div className="text-xs text-muted mt-4">Warnings</div>
        </div>
      </div>

      {/* Rate Limiting Settings */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-16" onClick={() => setShowSettings(!showSettings)} style={{ cursor: 'pointer' }}>
          <h3 className="text-gold text-xl">⚡ Rate Limits & Thresholds</h3>
          <span style={{ color: 'var(--muted)' }}>{showSettings ? '▼' : '▶'}</span>
        </div>

        {showSettings && (
          <>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Max Tips Per Minute</label>
              <input type="number" className="form-input form-input-gold" value={settings.maxTipsPerMinute} min={1} max={100}
                onChange={(e) => updateSetting('maxTipsPerMinute', parseInt(e.target.value) || 10)} />
              <div className="hint">Triggers rate-limiting if exceeded. Default: 10/min</div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Max Single Tip Amount (tokens)</label>
              <input type="number" className="form-input form-input-gold" value={settings.maxTipAmount} min={100} max={50000}
                onChange={(e) => updateSetting('maxTipAmount', parseInt(e.target.value) || 5000)} />
              <div className="hint">Single tips above this are blocked</div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Suspicious Amount Threshold (tokens)</label>
              <input type="number" className="form-input form-input-pink" value={settings.suspiciousThreshold} min={100} max={10000}
                onChange={(e) => updateSetting('suspiciousThreshold', parseInt(e.target.value) || 2000)} />
              <div className="hint">Flags tips above this amount for review</div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Require CAPTCHA Above (tokens)</label>
              <input type="number" className="form-input form-input-gold" value={settings.requireCaptchaAbove} min={0} max={10000}
                onChange={(e) => updateSetting('requireCaptchaAbove', parseInt(e.target.value) || 1000)} />
              <div className="hint">0 = never require CAPTCHA</div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">New Account Cooldown (hours)</label>
              <input type="number" className="form-input form-input-gold" value={settings.newAccountCooldown} min={0} max={168}
                onChange={(e) => updateSetting('newAccountCooldown', parseInt(e.target.value) || 24)} />
              <div className="hint">New accounts can't tip for this many hours. 0 = no cooldown</div>
            </div>
          </>
        )}
      </div>

      {/* Security Toggles */}
      <div className="card card-surface mb-16">
        <h3 className="text-violet text-xl mb-16">🔒 Security Features</h3>

        {[
          { key: 'vpnDetection', label: 'VPN / Proxy Detection', desc: 'Flag or block connections through VPNs and proxies' },
          { key: 'chargebackProtection', label: 'Chargeback Protection', desc: 'Auto-freeze accounts with chargeback attempts' },
          { key: 'duplicateDetection', label: 'Duplicate Account Detection', desc: 'Identify multi-accounts via device fingerprint + email patterns' },
          { key: 'velocityChecks', label: 'Velocity Checks', desc: 'Detect abnormally fast spending patterns' },
          { key: 'geoBlocking', label: 'Geo-Blocking', desc: 'Block access from specific countries' },
        ].map(item => (
          <div key={item.key} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>{item.desc}</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) => updateSetting(item.key, e.target.checked)}
                style={{ display: 'none' }}
              />
              <div style={{
                width: 44, height: 24, borderRadius: 12, position: 'relative',
                background: settings[item.key] ? '#22c55e' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.2s',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2,
                  left: settings[item.key] ? 22 : 2,
                  transition: 'left 0.2s',
                }} />
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Blocked Users Quick View */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-12">
          <h3 className="text-red text-lg">🚫 Blocked Users</h3>
          <span className="text-dim text-sm">{db.getBlockedUsers().length} blocked</span>
        </div>
        {db.getBlockedUsers().length === 0 ? (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--dim)', fontSize: 13 }}>
            No blocked users
          </div>
        ) : (
          db.getBlockedUsers().map(u => (
            <div key={u.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 10, borderRadius: 8, background: 'rgba(225,29,72,0.05)',
              marginBottom: 4,
            }}>
              <span style={{ fontSize: 13 }}>{u.name || u.id}</span>
              <button
                onClick={() => { db.unblockUser(u.id); window.location.reload(); }}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)', border: 'none',
                  color: 'var(--muted)', cursor: 'pointer',
                }}
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </div>

      {/* Fraud Event Log */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-12">
          <h3 className="text-gold text-lg">📋 Fraud Event Log</h3>
          <span className="text-dim text-sm">{log.length} events</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['all', 'critical', 'warning', 'info'].map(f => (
            <button key={f} onClick={() => setLogFilter(f)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: logFilter === f ? (SEVERITY_CONFIG[f]?.color || 'var(--violet)') : 'rgba(255,255,255,0.05)',
              color: logFilter === f ? '#fff' : 'var(--muted)',
              border: 'none', cursor: 'pointer',
            }}>
              {f === 'all' ? 'All' : SEVERITY_CONFIG[f]?.icon + ' ' + f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredLog.map(entry => {
          const sev = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.info;
          const act = ACTION_LABELS[entry.action] || { label: entry.action, color: 'var(--muted)' };
          return (
            <div key={entry.id} style={{
              padding: 12, borderRadius: 10, marginBottom: 8,
              background: sev.bg, border: `1px solid ${sev.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{sev.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sev.color, textTransform: 'uppercase' }}>
                    {entry.type}
                  </span>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 4,
                  background: `${act.color}20`, color: act.color, fontWeight: 700,
                }}>
                  {act.label}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.4, marginBottom: 4 }}>
                {entry.message}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--dim)' }}>
                <span>User: {entry.userId}</span>
                <span>{timeAgo(entry.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
