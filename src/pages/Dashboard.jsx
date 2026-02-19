import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import db from '../services/database.js';
import { timeAgo } from '../services/helpers.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { balance, refreshBalance, user, logoutUser } = useApp();
  const [role, setRole] = useState('viewer'); // 'viewer' or 'performer'
  const [displayName, setDisplayName] = useState(db.getDisplayName());
  const [dailyLimit, setDailyLimit] = useState(db.getDailyLimit());
  const [, forceUpdate] = useState(0);

  const txns = db.getTransactions(100);
  const tips = txns.filter(t => t.type === 'tip' || t.type === 'lovense');
  const privates = txns.filter(t => t.type === 'private-show' || t.type === 'private-ext');
  const totalSpent = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const typeLabels = {
    tip: '🎁 Tip', lovense: '🔥 Lovense', purchase: '💳 Purchase',
    'private-show': '🔒 Private Show', 'private-ext': '⏱️ Extension', unknown: '• Transaction',
  };

  function saveDisplayName() {
    db.setDisplayName(displayName.trim());
    alert('✅ Display name saved!');
  }

  function saveSpendingLimit() {
    db.setDailyLimit(dailyLimit);
    alert(`✅ Spending limit ${dailyLimit > 0 ? 'set to ' + dailyLimit + ' tokens/day' : 'removed'}!`);
  }

  function clearAllData() {
    if (!window.confirm('⚠️ Clear ALL local data?\n\nThis resets your balance, history, favorites, and all settings. This cannot be undone.')) return;
    db.clearAllData();
    refreshBalance();
    setDisplayName('');
    setDailyLimit(0);
    forceUpdate(n => n + 1);
    alert('🗑️ All data cleared.');
  }

  // ============================================
  // VIEWER DASHBOARD
  // ============================================
  if (role === 'viewer') {
    return (
      <div className="page-pad">
        <div className="flex-between mb-20">
          <div>
            <h2 className="text-violet text-3xl font-black mb-4">📊 My Dashboard</h2>
            <p className="text-muted text-sm">Your activity & account</p>
          </div>
          <button
            className="config-badge config-badge-violet"
            style={{ cursor: 'pointer', fontSize: 11 }}
            onClick={() => setRole('performer')}
          >
            Switch to Performer →
          </button>
        </div>

        {/* Stats */}
        <div className="grid-2col mb-12">
          <div className="card card-surface text-center" style={{ padding: 16 }}>
            <div className="text-3xl font-black text-gold">{balance.toLocaleString()}</div>
            <div className="text-xs text-muted mt-4">Token Balance</div>
          </div>
          <div className="card card-surface text-center" style={{ padding: 16 }}>
            <div className="text-3xl font-black text-violet">{totalSpent.toLocaleString()}</div>
            <div className="text-xs text-muted mt-4">Total Spent</div>
          </div>
        </div>
        <div className="grid-2col mb-20">
          <div className="card card-surface text-center" style={{ padding: 16 }}>
            <div className="text-3xl font-black text-hot">{tips.length}</div>
            <div className="text-xs text-muted mt-4">Tips Sent</div>
          </div>
          <div className="card card-surface text-center" style={{ padding: 16 }}>
            <div className="text-3xl font-black">{privates.length}</div>
            <div className="text-xs text-muted mt-4">Private Shows</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card card-surface mb-16">
          <h3 className="text-gold text-lg mb-12">⚡ Quick Actions</h3>
          <div className="grid-2col">
            <button className="btn-primary" style={{ fontSize: 14, padding: 14 }} onClick={() => navigate('/tokens')}>💳 Buy Tokens</button>
            <button className="btn-save" style={{ fontSize: 14, padding: 14 }} onClick={() => navigate('/')}>🔍 Find Performers</button>
          </div>
        </div>

        {/* Favorites */}
        <div className="card card-surface mb-16">
          <div className="flex-between mb-12">
            <h3 className="text-violet text-lg">❤️ Favorites</h3>
            <span className="text-dim text-sm">{db.getFavorites().length} saved</span>
          </div>
          {db.getFavorites().length > 0 ? (
            db.getFavorites().map(f => (
              <div key={f.id} className="sheet-item" style={{ padding: '10px 0' }}>
                <div className="streamer-item">
                  <div className="streamer-avatar" style={{ background: f.color, width: 36, height: 36, fontSize: 16 }}>{f.avatar}</div>
                  <div className="streamer-info">
                    <div className="streamer-name">{f.name}</div>
                    <div className="streamer-viewers" style={{ color: 'var(--dim)' }}>{f.club}</div>
                  </div>
                </div>
                <button className="btn-delete-sm" onClick={() => { db.removeFavorite(f.id); forceUpdate(n => n + 1); }}>✕</button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: 32, marginBottom: 8 }}>❤️</div>
              <div className="text-muted text-sm">No favorites yet</div>
              <div className="text-dim text-xs mt-4">Tap ❤️ on a performer's profile to save them here</div>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="card card-surface mb-16">
          <div className="flex-between mb-12">
            <h3 className="text-gold text-lg">📜 Recent Activity</h3>
            <span className="text-dim text-sm">{txns.length} transactions</span>
          </div>
          {txns.length > 0 ? txns.slice(0, 20).map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="text-sm font-bold">{typeLabels[t.type] || typeLabels.unknown}</div>
                <div className="text-xs text-dim mt-4">{timeAgo(t.timestamp || t.id)}</div>
              </div>
              <div className={`text-base font-black ${t.amount < 0 ? 'text-red' : 'text-gold'}`}>
                {t.amount < 0 ? '' : '+'}{t.amount}
              </div>
            </div>
          )) : (
            <div className="empty-state">
              <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
              <div className="text-muted text-sm">No activity yet</div>
              <div className="text-dim text-xs mt-4">Tips, purchases, and private shows will appear here</div>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="card card-surface mb-16">
          <h3 className="text-violet text-lg mb-16">👤 Account</h3>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input type="text" className="form-input" placeholder="Anonymous Viewer" maxLength={30} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
          </div>
          <button className="btn-save mt-12" onClick={saveDisplayName}>💾 Save</button>
          <button
            onClick={logoutUser}
            style={{ width: '100%', marginTop: 10, background: 'none', border: '1.5px solid var(--border)', color: 'var(--muted)', padding: 10, borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >🚪 Log Out</button>
        </div>

        {/* Spending Limits */}
        <div className="card card-surface mb-16" style={{ borderColor: 'rgba(245,158,11,0.25)' }}>
          <h3 className="text-gold text-lg mb-8">🛡️ Spending Controls</h3>
          <p className="text-dim text-sm mb-16">Set limits to stay in control</p>
          <div className="form-group">
            <label className="form-label">Daily Spending Limit (tokens)</label>
            <input type="number" className="form-input form-input-gold" value={dailyLimit} min={0} max={50000} placeholder="0 = no limit" onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)} />
            <div className="hint">0 = unlimited. Set a cap to get alerts.</div>
          </div>
          <button className="btn-save mt-12" onClick={saveSpendingLimit}>💾 Save Limit</button>
        </div>

        {/* Danger Zone */}
        <div className="card card-surface" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <h3 className="text-red text-lg mb-8">⚠️ Data</h3>
          <p className="text-dim text-sm mb-16">Manage your local data</p>
          <button
            style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1.5px solid var(--red)', color: 'var(--red)', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            onClick={clearAllData}
          >🗑️ Clear All Local Data</button>
          <div className="hint" style={{ textAlign: 'center' }}>Resets balance, history, and settings</div>
        </div>

        {/* Admin & Tools */}
        <div className="card card-surface mb-16" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
          <h3 className="text-violet text-lg mb-12">🔧 Tools</h3>
          {[
            { icon: '🔑', label: 'Admin Review Panel', desc: 'Manage performer verifications', path: '/admin', color: '#a855f7' },
            { icon: '🛡️', label: 'Anti-Fraud Dashboard', desc: 'Security & rate limiting', path: '/antifraud', color: 'var(--red)' },
            { icon: '🔐', label: 'Security Keys', desc: 'Hardware key authentication (FIDO2)', path: '/security-keys', color: 'var(--cyan)' },
            { icon: '🤖', label: 'BotShield', desc: 'Bot detection & prevention', path: '/botshield', color: '#22c55e' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 12, cursor: 'pointer', borderRadius: 10,
                background: 'rgba(255,255,255,0.02)', marginBottom: 6,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onClick={() => navigate(item.path)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 20 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 1 }}>{item.desc}</div>
                </div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>→</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // PERFORMER DASHBOARD
  // ============================================
  return <PerformerDashboard onSwitch={() => setRole('viewer')} />;
}

// Performer Dashboard as sub-component
function PerformerDashboard({ onSwitch }) {
  const navigate = useNavigate();
  const vData = db.getVerification();
  const [tipButtons, setTipButtons] = useState(db.getTipButtons());
  const [privateSettings, setPrivateSettings] = useState(db.getPrivateShowSettings());
  const [lovenseLevels, setLovenseLevels] = useState(db.getLovenseLevels());
  const [onlineSchedule, setOnlineSchedule] = useState(db.getOnlineSchedule());
  const [liveSchedule, setLiveSchedule] = useState(db.getLiveSchedule());

  // Tip button editing
  const [editButtons, setEditButtons] = useState(tipButtons);
  const icons = ['🎁', '💖', '💝', '💎', '👑', '🌟', '✨', '💰', '🔥', '⚡', '💥', '🐋', '🎆', '🎉', '🍾', '🏆'];

  function updateEditButton(index, field, value) {
    const updated = [...editButtons];
    updated[index] = { ...updated[index], [field]: field === 'amount' ? parseInt(value) || 0 : value };
    setEditButtons(updated);
  }

  function saveTipButtons() {
    for (let i = 0; i < 4; i++) {
      if (!editButtons[i]?.label?.trim()) { alert(`Button ${i + 1} needs a label!`); return; }
      const a = editButtons[i]?.amount;
      if (a < 1 || a > 10000) { alert(`Button ${i + 1}: tokens 1-10,000`); return; }
    }
    db.saveTipButtons(editButtons);
    setTipButtons(editButtons);
    alert('✅ Tip buttons saved!');
  }

  // Private show editing
  const [editPrivate, setEditPrivate] = useState(privateSettings);
  const exts = editPrivate.extensions || [];
  const minCost = editPrivate.tokensPerMin * editPrivate.minDuration;

  function updateExt(idx, field, value) {
    const newExts = [...exts];
    newExts[idx] = { ...newExts[idx], [field]: parseInt(value) || 0 };
    setEditPrivate({ ...editPrivate, extensions: newExts });
  }

  function savePrivateSettings() {
    db.savePrivateShowSettings(editPrivate);
    setPrivateSettings(editPrivate);
    alert('✅ Settings saved!');
  }

  // Lovense
  const [newLovense, setNewLovense] = useState({ icon: '💗', label: '', tokens: 15, duration: 10 });
  const lovenseIcons = ['💗', '💖', '💝', '🔥', '⚡', '💥', '🌟', '✨', '🌊', '🎆'];

  function addLovenseLevel() {
    if (lovenseLevels.length >= 5) { alert('⚠️ Max 5!'); return; }
    if (!newLovense.label.trim()) { alert('Enter a label.'); return; }
    const updated = [...lovenseLevels, { ...newLovense, id: Date.now() }];
    db.saveLovenseLevels(updated);
    setLovenseLevels(updated);
    setNewLovense({ icon: '💗', label: '', tokens: 15, duration: 10 });
    alert(`✅ Added! ${newLovense.icon} ${newLovense.label}`);
  }

  function deleteLovenseLevel(id) {
    const l = lovenseLevels.find(x => x.id === id);
    if (!l) return;
    if (window.confirm(`Delete ${l.icon} ${l.label}?`)) {
      const updated = lovenseLevels.filter(x => x.id !== id);
      db.saveLovenseLevels(updated);
      setLovenseLevels(updated);
    }
  }

  // Schedule
  function addSchedule(type) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const d = prompt('Day (1-7):\n' + days.map((d, i) => `${i + 1}. ${d}`).join('\n'));
    if (!d || d < 1 || d > 7) return;
    const dn = days[parseInt(d) - 1];
    const st = prompt('Start (HH:MM):\ne.g. 18:00');
    if (!st || !/^\d{2}:\d{2}$/.test(st)) { alert('Use HH:MM'); return; }
    const en = prompt('End (HH:MM):\ne.g. 23:00');
    if (!en || !/^\d{2}:\d{2}$/.test(en)) { alert('Use HH:MM'); return; }
    const entry = { id: Date.now(), day: dn, startTime: st, endTime: en };
    if (type === 'online') {
      const updated = [...onlineSchedule, entry];
      db.saveOnlineSchedule(updated);
      setOnlineSchedule(updated);
    } else {
      const updated = [...liveSchedule, entry];
      db.saveLiveSchedule(updated);
      setLiveSchedule(updated);
    }
    alert(`✅ ${dn} ${st}-${en}`);
  }

  function deleteSchedule(type, id) {
    if (type === 'online') {
      const sl = onlineSchedule.find(x => x.id === id);
      if (sl && window.confirm(`Delete ${sl.day}?`)) {
        const updated = onlineSchedule.filter(x => x.id !== id);
        db.saveOnlineSchedule(updated);
        setOnlineSchedule(updated);
      }
    } else {
      const sl = liveSchedule.find(x => x.id === id);
      if (sl && window.confirm(`Delete ${sl.day}?`)) {
        const updated = liveSchedule.filter(x => x.id !== id);
        db.saveLiveSchedule(updated);
        setLiveSchedule(updated);
      }
    }
  }

  return (
    <div className="page-pad">
      <div className="flex-between mb-20">
        <h2 className="text-violet text-3xl font-black">📊 Performer Dashboard</h2>
        <button className="config-badge config-badge-violet" style={{ cursor: 'pointer', fontSize: 11 }} onClick={onSwitch}>
          ← Back to Viewer
        </button>
      </div>

      {/* Verification Status */}
      <div
        className="card card-surface mb-16"
        style={{
          padding: 16, cursor: 'pointer',
          borderColor: vData.status === 'approved' ? 'rgba(34,197,94,0.3)' :
                       vData.status === 'pending_review' ? 'rgba(245,158,11,0.3)' :
                       'rgba(225,29,72,0.3)',
        }}
        onClick={() => navigate('/verification')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 28 }}>
              {vData.status === 'approved' ? '🛡️' : vData.status === 'pending_review' ? '⏳' : '⚠️'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: vData.status === 'approved' ? '#22c55e' : vData.status === 'pending_review' ? 'var(--gold)' : 'var(--accent)' }}>
                {vData.status === 'approved' ? 'Verified Performer' :
                 vData.status === 'pending_review' ? 'Verification Pending' :
                 vData.status === 'in_progress' ? 'Verification In Progress' :
                 'Not Verified'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {vData.status === 'approved' ? 'Your 🛡️ badge is active' :
                 vData.status === 'pending_review' ? 'Under review — typically 24-48hrs' :
                 'Complete verification to earn your 🛡️ badge'}
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 18 }}>→</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card card-surface mb-16">
        <h3 className="text-gold text-lg mb-12">⚡ Performer Tools</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { icon: '📡', label: 'Go Live', desc: 'Stream dashboard', path: '/golive', color: 'var(--red)' },
            { icon: '💰', label: 'Earnings', desc: 'Revenue & payouts', path: '/earnings', color: 'var(--gold)' },
            { icon: '💗', label: 'Lovense', desc: 'Device setup', path: '/lovense', color: 'var(--hot)' },
            { icon: '🔐', label: 'Security Keys', desc: 'Hardware auth', path: '/security-keys', color: 'var(--cyan)' },
            { icon: '🔔', label: 'Notifications', desc: 'View alerts', path: '/notifications', color: 'var(--violet)' },
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => navigate(item.path)}
              style={{
                padding: 14, borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Buttons */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-16">
          <h3 className="text-violet text-xl">💰 Custom Tip Buttons</h3>
          <div className="config-badge config-badge-violet">4 buttons</div>
        </div>
        <p className="text-dim text-sm mb-16">Customize the 4 preset tip buttons in your room</p>
        {editButtons.map((b, i) => (
          <div key={i} className="config-card">
            <div className="text-violet font-black text-base mb-12">Button {i + 1}</div>
            <div className="form-group">
              <label className="form-label">Icon</label>
              <select className="form-select" value={b.icon} onChange={(e) => updateEditButton(i, 'icon', e.target.value)}>
                {icons.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Label</label>
              <input type="text" className="form-input form-input-pink" value={b.label} maxLength={20} onChange={(e) => updateEditButton(i, 'label', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Tokens</label>
              <input type="number" className="form-input form-input-pink" value={b.amount} min={1} max={10000} onChange={(e) => updateEditButton(i, 'amount', e.target.value)} />
            </div>
          </div>
        ))}
        <button className="btn-save mt-16" onClick={saveTipButtons}>💾 Save Tip Buttons</button>
        <div className="section-divider">
          <h4 className="text-gold text-base mb-12">👁️ Preview</h4>
          <div className="tip-preview-row">
            {editButtons.map((b, i) => (
              <div key={i} className="tip-btn tip-preview-item">
                <div className="tip-label">{b.icon} {b.label}</div>
                <div className="tip-amount">🪙 {b.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Private Show Settings */}
      <div className="card card-surface mb-16">
        <h3 className="text-gold text-xl mb-16">🔒 Private Show Settings</h3>
        <div className="form-group-lg">
          <label className="form-label-md">💰 Tokens Per Minute</label>
          <input type="number" className="form-input form-input-gold" value={editPrivate.tokensPerMin} min={10} max={500} onChange={(e) => setEditPrivate({ ...editPrivate, tokensPerMin: parseInt(e.target.value) || 60 })} />
          <div className="hint">Current: ${(editPrivate.tokensPerMin / 10).toFixed(0)}/min</div>
        </div>
        <div className="form-group-lg">
          <label className="form-label-md">⏱️ Minimum Duration (minutes)</label>
          <input type="number" className="form-input form-input-gold" value={editPrivate.minDuration} min={5} max={60} onChange={(e) => setEditPrivate({ ...editPrivate, minDuration: parseInt(e.target.value) || 10 })} />
          <div className="hint">Minimum booking: {editPrivate.minDuration} minutes ({minCost} tokens)</div>
        </div>
        <div className="section-divider">
          <h4 className="text-hot mb-12 text-lg">➕ Extension Options</h4>
          <p className="text-dim text-sm mb-16">Options shown during private shows</p>
          {exts.map((ext, i) => (
            <div key={i} className="card-pink mb-12">
              <div className="grid-2col">
                <div><label className="form-label-sm">Minutes</label><input type="number" className="form-input form-input-pink" value={ext.minutes} min={1} max={60} onChange={(e) => updateExt(i, 'minutes', e.target.value)} /></div>
                <div><label className="form-label-sm">Tokens</label><input type="number" className="form-input form-input-pink" value={ext.tokens} min={10} max={5000} onChange={(e) => updateExt(i, 'tokens', e.target.value)} /></div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-save mt-16" onClick={savePrivateSettings}>💾 Save Settings</button>
      </div>

      {/* Preview */}
      <div className="card card-gold mb-16" style={{ padding: 14 }}>
        <h4 className="text-gold text-base mb-8">👁️ Preview</h4>
        <div className="text-md text-muted leading-relaxed">
          <div><strong className="text-white">Price:</strong> ${(editPrivate.tokensPerMin / 10).toFixed(0)}/min</div>
          <div><strong className="text-white">Min cost:</strong> {minCost} tokens (${(minCost / 10).toFixed(0)})</div>
          <div className="mt-8"><strong className="text-white">Extensions:</strong></div>
          {exts.map((ext, i) => <div key={i}>+{ext.minutes}min = {ext.tokens} tokens</div>)}
        </div>
      </div>

      {/* Lovense Levels */}
      <div className="card card-surface mb-16" style={{ borderColor: 'rgba(255,107,44,0.25)' }}>
        <div className="flex-between mb-16">
          <h3 className="text-hot text-xl">💗 Lovense Levels</h3>
          <div className="config-badge config-badge-pink">{lovenseLevels.length}/5</div>
        </div>
        {lovenseLevels.map(l => (
          <div key={l.id} className="lovense-level-item">
            <div style={{ flex: 1 }}>
              <div className="text-lg font-bold mb-4">{l.icon} {l.label}</div>
              <div className="text-sm text-muted">{l.tokens} tokens • {l.duration}s</div>
            </div>
            <button className="btn-delete" onClick={() => deleteLovenseLevel(l.id)}>✕</button>
          </div>
        ))}
        {lovenseLevels.length >= 5 && (
          <div className="max-warning" style={{ display: 'block' }}>
            <div className="text-hot font-bold text-md">⚠️ Maximum 5 levels</div>
            <div className="text-muted text-xs mt-4">Delete a level to add a new one</div>
          </div>
        )}
        {lovenseLevels.length < 5 && (
          <div className="card-pink-dashed" style={{ padding: 14, borderRadius: 12 }}>
            <h4 className="text-hot text-base mb-12">➕ Add New Level</h4>
            <div className="form-group">
              <label className="form-label">Icon</label>
              <select className="form-select" value={newLovense.icon} onChange={(e) => setNewLovense({ ...newLovense, icon: e.target.value })}>
                {lovenseIcons.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Label</label>
              <input type="text" className="form-input form-input-pink" placeholder="e.g., Low Vibe" maxLength={20} value={newLovense.label} onChange={(e) => setNewLovense({ ...newLovense, label: e.target.value })} />
            </div>
            <div className="grid-2col mb-12">
              <div><label className="form-label">Tokens</label><input type="number" className="form-input form-input-pink" value={newLovense.tokens} min={1} max={1000} onChange={(e) => setNewLovense({ ...newLovense, tokens: parseInt(e.target.value) || 15 })} /></div>
              <div><label className="form-label">Duration (sec)</label><input type="number" className="form-input form-input-pink" value={newLovense.duration} min={1} max={300} onChange={(e) => setNewLovense({ ...newLovense, duration: parseInt(e.target.value) || 10 })} /></div>
            </div>
            <button className="btn-pink w-full" onClick={addLovenseLevel}>➕ Add Level</button>
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="card card-surface" style={{ borderColor: 'rgba(245,158,11,0.25)' }}>
        <h3 className="text-gold text-xl mb-16">📅 My Schedule</h3>
        <p className="text-dim text-sm mb-20">Set your availability</p>

        <div className="section-border-bottom">
          <div className="flex-gap mb-8"><div className="text-2xl">🟢</div><h4 className="text-lg font-bold">Online Hours</h4></div>
          <p className="text-muted text-sm mb-12">When you're available for chat & bookings</p>
          {onlineSchedule.length > 0 ? onlineSchedule.map(s => (
            <div key={s.id} className="schedule-item schedule-item-online">
              <div><div className="text-base font-bold mb-4">{s.day}</div><div className="text-sm text-gold">{s.startTime} - {s.endTime}</div></div>
              <button className="btn-delete-sm" onClick={() => deleteSchedule('online', s.id)}>✕</button>
            </div>
          )) : <div className="empty-state">No online hours set</div>}
          <button className="btn-add btn-add-online mt-12" onClick={() => addSchedule('online')}>➕ Add Online Hours</button>
        </div>

        <div>
          <div className="flex-gap mb-8"><div className="text-2xl">🔴</div><h4 className="text-red text-lg font-bold">Live Streaming</h4></div>
          <p className="text-muted text-sm mb-12">When you're broadcasting</p>
          {liveSchedule.length > 0 ? liveSchedule.map(s => (
            <div key={s.id} className="schedule-item schedule-item-live">
              <div><div className="text-base font-bold mb-4">{s.day}</div><div className="text-sm text-red">{s.startTime} - {s.endTime}</div></div>
              <button className="btn-delete-sm" onClick={() => deleteSchedule('live', s.id)}>✕</button>
            </div>
          )) : <div className="empty-state">No live hours set</div>}
          <button className="btn-add btn-add-live mt-12" onClick={() => addSchedule('live')}>➕ Add Live Hours</button>
        </div>
      </div>
    </div>
  );
}
