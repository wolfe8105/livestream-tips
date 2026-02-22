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
  const [selectedIcon, setSelectedIcon] = useState(db.getProfileIcon?.() || '😎');
  const [purchasedIcons, setPurchasedIcons] = useState(db.getPurchasedIcons?.() || []);
  const [, forceUpdate] = useState(0);

  // Free icons
  const FREE_ICONS = ['😎', '🤠', '🥸', '🤡', '💀', '👽', '🦧', '🐸', '🍕', '🧻'];

  // Purchasable icons (50 tokens each)
  const SHOP_ICONS = [
    '🦄', '🐉', '👾', '🤖', '🎃', '🧛', '🧟', '🥷', '🧙', '🦹',
    '🐋', '🦈', '🦅', '🐺', '🦁', '🐙', '🍾', '💎', '🔮', '🎰',
    '🏴‍☠️', '🛸', '⚔️', '🧨', '🪩',
  ];
  const ICON_PRICE = 50;

  // Earned icons (milestone rewards)
  const EARNED_ICONS = [
    { icon: '🥉', tokens: 100, label: 'Bronze Tipper' },
    { icon: '🥈', tokens: 500, label: 'Silver Tipper' },
    { icon: '🥇', tokens: 1000, label: 'Gold Tipper' },
    { icon: '💰', tokens: 2500, label: 'Money Bags' },
    { icon: '👑', tokens: 5000, label: 'Royalty' },
    { icon: '🏆', tokens: 10000, label: 'Champion' },
    { icon: '💫', tokens: 25000, label: 'Superstar' },
    { icon: '🌟', tokens: 50000, label: 'Legend' },
    { icon: '⭐', tokens: 75000, label: 'Icon' },
    { icon: '🔱', tokens: 100000, label: 'God Tier' },
  ];

  const totalPurchased = db.getTotalPurchased?.() || 1200; // demo fallback

  function selectIcon(icon) {
    setSelectedIcon(icon);
    db.setProfileIcon?.(icon);
  }

  function buyIcon(icon) {
    if (purchasedIcons.includes(icon)) { selectIcon(icon); return; }
    if (balance < ICON_PRICE) { alert('❌ Not enough tokens! Need ' + ICON_PRICE + '.'); return; }
    if (!window.confirm(`Buy ${icon} for ${ICON_PRICE} tokens?`)) return;
    const updated = [...purchasedIcons, icon];
    setPurchasedIcons(updated);
    db.setPurchasedIcons?.(updated);
    selectIcon(icon);
    alert(`✅ ${icon} unlocked!`);
  }

  const txns = db.getTransactions(100);

  const typeLabels = {
    tip: '🎁 Tip', lovense: '🔥 Lovense', purchase: '💳 Purchase',
    'private-show': '🔒 Private Show', 'private-ext': '⏱️ Extension', unknown: '• Transaction',
  };

  function saveDisplayName() {
    db.setDisplayName(displayName.trim());
    alert('✅ Display name saved!');
  }

  function clearAllData() {
    if (!window.confirm('⚠️ Clear ALL local data?\n\nThis resets your balance, history, favorites, and all settings. This cannot be undone.')) return;
    db.clearAllData();
    refreshBalance();
    setDisplayName('');
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
            <h2 className="text-violet text-3xl font-black mb-4">👤 My Dashboard</h2>
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
        <div className="card card-surface text-center mb-20" style={{ padding: 16 }}>
          <div className="text-3xl font-black text-gold">{balance.toLocaleString()}</div>
          <div className="text-xs text-muted mt-4">Token Balance</div>
        </div>

        {/* Quick Actions */}
        <div className="card card-surface mb-16">
          <h3 className="text-gold text-lg mb-12">⚡ Quick Actions</h3>
          <div className="grid-2col">
            <button className="btn-primary" style={{ fontSize: 14, padding: 14 }} onClick={() => navigate('/tokens')}>💳 Buy Tokens</button>
            <button className="btn-save" style={{ fontSize: 14, padding: 14 }} onClick={() => navigate('/')}>🔍 Find Performers</button>
          </div>
        </div>

        {/* Top Performers + Favorites */}
        <div className="card card-surface mb-16">
          {/* Top Performers — pinned */}
          {(() => {
            const tipTxns = txns.filter(t => (t.type === 'tip' || t.type === 'lovense') && t.performer);
            const spendMap = {};
            tipTxns.forEach(t => {
              spendMap[t.performer] = (spendMap[t.performer] || 0) + Math.abs(t.amount);
            });
            const topSpender = Object.entries(spendMap).sort((a, b) => b[1] - a[1])[0];
            const mostTipped = topSpender
              ? { name: topSpender[0], tokens: topSpender[1] }
              : { name: 'Star Fire', avatar: 'S', color: '#6366f1', club: 'Magic City', tokens: 840 };
            const mostWatched = { name: 'Luna Night', avatar: 'L', color: '#a855f7', club: 'Centerfolds', hours: 12 };

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: '💰 Most Tipped', performer: mostTipped, stat: mostTipped.tokens + ' tokens', accent: 'var(--gold)' },
                  { label: '👁️ Most Watched', performer: mostWatched, stat: mostWatched.hours + 'h watched', accent: 'var(--violet)' },
                ].map((card, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${card.accent}33`,
                    borderRadius: 12, padding: 14, textAlign: 'center',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                      background: card.performer.color || '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 800, color: '#fff',
                      border: `2px solid ${card.accent}`,
                    }}>
                      {card.performer.avatar || card.performer.name.charAt(0)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{card.performer.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>{card.performer.club}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: card.accent,
                      marginTop: 6, padding: '3px 8px', borderRadius: 6,
                      background: `${card.accent}15`, display: 'inline-block',
                    }}>
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Favorites list */}
          <div className="flex-between mb-12" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <h3 className="text-violet text-lg">❤️ Favorites</h3>
            <span className="text-dim text-sm">{db.getFavorites().length} saved</span>
          </div>
          {db.getFavorites().length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {db.getFavorites().map(f => (
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
              ))}
            </div>
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

        {/* Profile Icon */}
        <div className="card card-surface mb-16">
          {/* Current icon display */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 8px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(225,29,72,0.3))',
              border: '2px solid var(--violet)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36,
            }}>
              {selectedIcon}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Your Icon</div>
          </div>

          {/* Free Icons */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', marginBottom: 8 }}>🆓 Free Icons</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FREE_ICONS.map(icon => (
                <button key={icon} onClick={() => selectIcon(icon)} style={{
                  width: 42, height: 42, borderRadius: 10, fontSize: 22,
                  background: selectedIcon === icon ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)',
                  border: selectedIcon === icon ? '2px solid var(--violet)' : '1px solid var(--border)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Purchased Icons */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)' }}>🛒 Shop Icons</div>
              <div style={{ fontSize: 10, color: 'var(--dim)' }}>{ICON_PRICE} tokens each</div>
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
              {SHOP_ICONS.map(icon => {
                const owned = purchasedIcons.includes(icon);
                return (
                  <button key={icon} onClick={() => buyIcon(icon)} style={{
                    minWidth: 48, height: 48, borderRadius: 10, fontSize: 22,
                    background: selectedIcon === icon ? 'rgba(245,158,11,0.25)' : owned ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: selectedIcon === icon ? '2px solid var(--gold)' : owned ? '1px solid var(--border)' : '1px dashed rgba(255,255,255,0.1)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', flexShrink: 0,
                    opacity: owned ? 1 : 0.5,
                  }}>
                    {icon}
                    {!owned && (
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        background: 'var(--gold)', color: '#000', fontSize: 7, fontWeight: 900,
                        padding: '1px 3px', borderRadius: 4,
                      }}>🪙</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Earned Icons */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>🏅 Earned Icons</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
              {EARNED_ICONS.map(e => {
                const unlocked = totalPurchased >= e.tokens;
                return (
                  <button key={e.icon} onClick={() => unlocked && selectIcon(e.icon)} style={{
                    minWidth: 56, height: 62, borderRadius: 10, fontSize: 24,
                    background: selectedIcon === e.icon ? 'rgba(225,29,72,0.25)' : unlocked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.3)',
                    border: selectedIcon === e.icon ? '2px solid var(--accent)' : unlocked ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: unlocked ? 'pointer' : 'default',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 2, flexShrink: 0, opacity: unlocked ? 1 : 0.35,
                  }}>
                    <span>{unlocked ? e.icon : '🔒'}</span>
                    <span style={{ fontSize: 7, color: unlocked ? 'var(--gold)' : 'var(--dim)', fontWeight: 700 }}>
                      {unlocked ? e.label : e.tokens.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card card-surface" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <h3 className="text-red text-lg mb-8">⚠️ Data</h3>
          <p className="text-dim text-sm mb-16">Manage your local data</p>
          <button
            style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1.5px solid var(--red)', color: 'var(--red)', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            onClick={clearAllData}
          >🗑️ Clear All Local Data</button>
          <div className="hint" style={{ textAlign: 'center' }}>Resets history and settings</div>
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
            { icon: '🔗', label: 'Wallets', desc: 'Payout wallets', path: '/wallets', color: 'var(--cyan)' },
            { icon: '💗', label: 'Lovense', desc: 'Device setup', path: '/lovense', color: 'var(--hot)' },
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
          <div className="flex-gap mb-8"><div className="text-2xl">🟢</div><h4 className="text-lg font-bold">Stage Hours</h4></div>
          <p className="text-muted text-sm mb-12">When you're on stage</p>
          {onlineSchedule.length > 0 ? onlineSchedule.map(s => (
            <div key={s.id} className="schedule-item schedule-item-online">
              <div><div className="text-base font-bold mb-4">{s.day}</div><div className="text-sm text-gold">{s.startTime} - {s.endTime}</div></div>
              <button className="btn-delete-sm" onClick={() => deleteSchedule('online', s.id)}>✕</button>
            </div>
          )) : <div className="empty-state">No stage hours set</div>}
          <button className="btn-add btn-add-online mt-12" onClick={() => addSchedule('online')}>➕ Add Stage Hours</button>
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
