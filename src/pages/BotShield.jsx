import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/database.js';
import { timeAgo } from '../services/helpers.js';

// ============================================
// CONSTANTS
// ============================================

const THREAT_LEVELS = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: '🔴', label: 'Critical' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', icon: '🟠', label: 'High' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: '🟡', label: 'Medium' },
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', icon: '🟢', label: 'Low' },
};

const ACTION_COLORS = {
  blocked:    { label: 'Blocked',    color: '#ef4444' },
  kicked:     { label: 'Kicked',     color: '#f97316' },
  challenged: { label: 'Challenged', color: '#f59e0b' },
  flagged:    { label: 'Flagged',    color: '#a855f7' },
  throttled:  { label: 'Throttled',  color: '#3b82f6' },
  allowed:    { label: 'Allowed',    color: '#22c55e' },
  shadow_banned: { label: 'Shadow Banned', color: '#6b7280' },
};

const BOT_TYPES = {
  headless:   { icon: '🤖', label: 'Headless Browser' },
  scraper:    { icon: '🕷️', label: 'Scraper Bot' },
  spam:       { icon: '📨', label: 'Chat Spam Bot' },
  fake_acct:  { icon: '👤', label: 'Fake Account' },
  flood:      { icon: '🌊', label: 'Connection Flood' },
  tip_fraud:  { icon: '💳', label: 'Tip Fraud Bot' },
  viewer_bot: { icon: '👁️', label: 'Viewer Inflator' },
  credential: { icon: '🔓', label: 'Credential Stuffer' },
};

// ============================================
// TOGGLE SWITCH SUB-COMPONENT
// ============================================

function Toggle({ checked, onChange, color = '#22c55e' }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      <div style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        background: checked ? color : 'rgba(255,255,255,0.15)',
        transition: 'background 0.2s',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2,
          left: checked ? 22 : 2,
          transition: 'left 0.2s',
        }} />
      </div>
    </label>
  );
}

// ============================================
// SCORE BAR SUB-COMPONENT
// ============================================

function ScoreBar({ score, size = 'md' }) {
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#f59e0b' : score >= 20 ? '#3b82f6' : '#22c55e';
  const height = size === 'sm' ? 4 : 6;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height, borderRadius: height, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: height, background: color, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: size === 'sm' ? 10 : 12, fontWeight: 800, color, minWidth: 28, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function BotShield() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(db.getBotShieldSettings());
  const [sessions, setSessions] = useState(db.getBotShieldSessions());
  const [log, setLog] = useState(db.getBotShieldLog());
  const [activeSection, setActiveSection] = useState('overview');
  const [logFilter, setLogFilter] = useState('all');
  const [sessionSort, setSessionSort] = useState('score');
  const [expandedSession, setExpandedSession] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const simRef = useRef(null);

  // Refresh sessions periodically when sim is running
  useEffect(() => {
    if (simRunning) {
      simRef.current = setInterval(() => {
        const updated = db.getBotShieldSessions().map(s => ({
          ...s,
          botScore: Math.min(100, Math.max(0, s.botScore + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5))),
          lastActivity: Date.now(),
        }));
        db.saveBotShieldSessions(updated);
        setSessions(updated);
      }, 3000);
    }
    return () => { if (simRef.current) clearInterval(simRef.current); };
  }, [simRunning]);

  function updateSetting(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    db.saveBotShieldSettings(updated);
  }

  function updateNestedSetting(section, key, value) {
    const updated = {
      ...settings,
      [section]: { ...settings[section], [key]: value },
    };
    setSettings(updated);
    db.saveBotShieldSettings(updated);
  }

  function kickSession(sessionId) {
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    db.saveBotShieldSessions(updated);
    db.addBotShieldLog({
      type: 'manual_kick',
      severity: 'high',
      action: 'kicked',
      sessionId,
      message: `Session ${sessionId} manually kicked by admin`,
    });
    setLog(db.getBotShieldLog());
    setExpandedSession(null);
  }

  function banSession(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    db.saveBotShieldSessions(updated);
    db.addBotShieldLog({
      type: 'manual_ban',
      severity: 'critical',
      action: 'blocked',
      sessionId,
      message: `IP ${session?.ip || 'unknown'} permanently banned — session ${sessionId} terminated`,
    });
    setLog(db.getBotShieldLog());
    setExpandedSession(null);
  }

  function runAutoSweep() {
    const threshold = settings.autoKickThreshold || 75;
    const toKick = sessions.filter(s => s.botScore >= threshold);
    if (toKick.length === 0) { alert('No sessions above threshold — all clear!'); return; }

    if (!window.confirm(`Auto-sweep will kick ${toKick.length} session(s) with bot score ≥ ${threshold}. Proceed?`)) return;

    const remaining = sessions.filter(s => s.botScore < threshold);
    setSessions(remaining);
    db.saveBotShieldSessions(remaining);

    toKick.forEach(s => {
      db.addBotShieldLog({
        type: 'auto_sweep',
        severity: 'high',
        action: 'kicked',
        sessionId: s.id,
        message: `Auto-sweep kicked session ${s.id} (score: ${s.botScore}, IP: ${s.ip})`,
      });
    });
    setLog(db.getBotShieldLog());
  }

  // Stats
  const totalBlocked = log.filter(l => l.action === 'blocked' || l.action === 'kicked').length;
  const activeBots = sessions.filter(s => s.botScore >= 60).length;
  const avgScore = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.botScore, 0) / sessions.length) : 0;
  const criticalCount = log.filter(l => l.severity === 'critical').length;

  // Filtered log
  const filteredLog = logFilter === 'all' ? log : log.filter(l => l.severity === logFilter);

  // Sorted sessions
  const sortedSessions = [...sessions].sort((a, b) => {
    if (sessionSort === 'score') return b.botScore - a.botScore;
    if (sessionSort === 'recent') return b.lastActivity - a.lastActivity;
    if (sessionSort === 'ip') return a.ip.localeCompare(b.ip);
    return 0;
  });

  // Section nav
  const NAV_SECTIONS = [
    { key: 'overview', icon: '📊', label: 'Overview' },
    { key: 'sessions', icon: '👁️', label: 'Live Sessions' },
    { key: 'fingerprint', icon: '🔍', label: 'Detection' },
    { key: 'behavior', icon: '🧠', label: 'Behavior' },
    { key: 'registration', icon: '🚪', label: 'Registration' },
    { key: 'connections', icon: '🔌', label: 'Connections' },
    { key: 'chat', icon: '💬', label: 'Chat Defense' },
    { key: 'eventlog', icon: '📋', label: 'Event Log' },
  ];

  return (
    <div className="page-pad" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="flex-between mb-8">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>
            <span style={{ color: '#22c55e' }}>🛡️</span> BotShield
          </h2>
          <p className="text-dim text-sm">Bot detection, prevention & live monitoring</p>
        </div>
        <button className="config-badge config-badge-violet" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => navigate('/admin')}>
          ← Admin
        </button>
      </div>

      {/* Section Navigation */}
      <div style={{
        display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 16,
        paddingBottom: 4, WebkitOverflowScrolling: 'touch',
      }}>
        {NAV_SECTIONS.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              whiteSpace: 'nowrap', cursor: 'pointer',
              background: activeSection === sec.key ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
              border: activeSection === sec.key ? '1px solid rgba(34,197,94,0.4)' : '1px solid transparent',
              color: activeSection === sec.key ? '#22c55e' : 'var(--muted)',
              transition: 'all 0.2s',
            }}
          >
            {sec.icon} {sec.label}
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* OVERVIEW */}
      {/* ============================================ */}
      {activeSection === 'overview' && (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <StatCard label="Bots Blocked" value={totalBlocked} icon="🚫" color="#ef4444" />
            <StatCard label="Active Threats" value={activeBots} icon="⚠️" color="#f59e0b" />
            <StatCard label="Avg Bot Score" value={avgScore} icon="📊" color={avgScore > 40 ? '#f59e0b' : '#22c55e'} />
            <StatCard label="Critical Events" value={criticalCount} icon="🔴" color="#ef4444" />
          </div>

          {/* Shield Strength */}
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
              <span style={{ color: '#22c55e' }}>🛡️</span> Shield Strength
            </h3>
            {(() => {
              const enabledCount = [
                settings.fingerprinting?.enabled,
                settings.behaviorAnalysis?.enabled,
                settings.registrationGates?.honeypot,
                settings.connectionLimits?.enabled,
                settings.chatDefense?.enabled,
                settings.fingerprinting?.headlessDetection,
                settings.registrationGates?.proofOfWork,
                settings.chatDefense?.linkFilter,
              ].filter(Boolean).length;
              const pct = Math.round((enabledCount / 8) * 100);
              const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
              const strengthLabel = pct >= 80 ? 'MAXIMUM' : pct >= 60 ? 'STRONG' : pct >= 40 ? 'MODERATE' : pct >= 20 ? 'WEAK' : 'MINIMAL';
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{enabledCount}/8 defenses active</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color }}>{strengthLabel}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 4,
                      background: `linear-gradient(90deg, ${color}, ${color}88)`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </>
              );
            })()}
          </div>

          {/* Threat Breakdown */}
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
              📋 Threat Breakdown (Last 24h)
            </h3>
            {Object.entries(BOT_TYPES).map(([key, bt]) => {
              const count = log.filter(l => l.type === key || l.type?.includes(key)).length;
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{bt.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{bt.label}</span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 800, padding: '2px 10px', borderRadius: 6,
                    background: count > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    color: count > 0 ? '#ef4444' : '#22c55e',
                  }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Active Defenses Summary */}
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
              ✅ Active Defenses
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Headless Detection', enabled: settings.fingerprinting?.headlessDetection, section: 'fingerprint' },
                { label: 'Canvas Fingerprint', enabled: settings.fingerprinting?.canvasFingerprint, section: 'fingerprint' },
                { label: 'WebGL Fingerprint', enabled: settings.fingerprinting?.webglFingerprint, section: 'fingerprint' },
                { label: 'Behavior Analysis', enabled: settings.behaviorAnalysis?.enabled, section: 'behavior' },
                { label: 'Honeypot Fields', enabled: settings.registrationGates?.honeypot, section: 'registration' },
                { label: 'Proof of Work', enabled: settings.registrationGates?.proofOfWork, section: 'registration' },
                { label: 'Connection Limits', enabled: settings.connectionLimits?.enabled, section: 'connections' },
                { label: 'Chat Flood Defense', enabled: settings.chatDefense?.enabled, section: 'chat' },
              ].map((def, i) => (
                <div
                  key={i}
                  onClick={() => setActiveSection(def.section)}
                  style={{
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    background: def.enabled ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${def.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 11 }}>{def.enabled ? '✅' : '⬜'}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: def.enabled ? '#22c55e' : 'var(--dim)' }}>{def.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* LIVE SESSIONS MONITOR */}
      {/* ============================================ */}
      {activeSection === 'sessions' && (
        <>
          {/* Controls */}
          <div className="card card-surface mb-12">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800 }}>👁️ Live Sessions ({sessions.length})</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setSimRunning(!simRunning)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    background: simRunning ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                    border: simRunning ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                    color: simRunning ? '#22c55e' : 'var(--muted)',
                  }}
                >{simRunning ? '● Live' : '▶ Simulate'}</button>
                <button
                  onClick={runAutoSweep}
                  style={{
                    padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                  }}
                >⚡ Auto-Sweep</button>
              </div>
            </div>

            {/* Auto-kick threshold */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--dim)', whiteSpace: 'nowrap' }}>Auto-kick at score:</span>
              <input
                type="range" min={50} max={95} step={5}
                value={settings.autoKickThreshold || 75}
                onChange={e => updateSetting('autoKickThreshold', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#ef4444' }}
              />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', minWidth: 24 }}>{settings.autoKickThreshold || 75}</span>
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'score', label: 'By Score' },
                { key: 'recent', label: 'Recent' },
                { key: 'ip', label: 'By IP' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSessionSort(s.key)}
                  style={{
                    padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    background: sessionSort === s.key ? 'rgba(34,197,94,0.1)' : 'transparent',
                    border: 'none', color: sessionSort === s.key ? '#22c55e' : 'var(--dim)',
                  }}
                >{s.label}</button>
              ))}
            </div>
          </div>

          {/* Session List */}
          {sortedSessions.length === 0 ? (
            <div className="card card-surface" style={{ padding: 30, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div className="text-muted">No active sessions — all clear</div>
            </div>
          ) : sortedSessions.map(session => {
            const threat = session.botScore >= 80 ? THREAT_LEVELS.critical
              : session.botScore >= 60 ? THREAT_LEVELS.high
              : session.botScore >= 40 ? THREAT_LEVELS.medium
              : THREAT_LEVELS.low;
            const isExpanded = expandedSession === session.id;

            return (
              <div
                key={session.id}
                className="card card-surface"
                style={{
                  marginBottom: 6, borderColor: isExpanded ? threat.border : 'var(--border)',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Summary */}
                <div
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{threat.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{session.ip}</span>
                      {session.isHeadless && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>HEADLESS</span>}
                      {session.isVPN && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700 }}>VPN</span>}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--dim)' }}>{session.country} {session.countryFlag}</span>
                  </div>
                  <ScoreBar score={session.botScore} size="sm" />
                  <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
                    <span>Room: {session.room || 'Lobby'}</span>
                    <span>Duration: {Math.round((Date.now() - session.connectedAt) / 60000)}m</span>
                    <span>Msgs: {session.messageCount || 0}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ paddingTop: 12, fontSize: 12 }}>
                      {/* Fingerprint Info */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', marginBottom: 6 }}>🔍 DEVICE FINGERPRINT</div>
                        <DetailRow label="User Agent" value={session.userAgent || 'Unknown'} />
                        <DetailRow label="Screen" value={session.screen || '1920×1080'} />
                        <DetailRow label="Timezone" value={session.timezone || 'UTC'} />
                        <DetailRow label="Language" value={session.language || 'en-US'} />
                        <DetailRow label="WebGL Renderer" value={session.webglRenderer || 'Unknown'} />
                        <DetailRow label="Canvas Hash" value={session.canvasHash || 'a3f2...c891'} />
                        <DetailRow label="Plugins" value={`${session.pluginCount || 0} installed`} />
                      </div>

                      {/* Behavior Signals */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', marginBottom: 6 }}>🧠 BEHAVIOR SIGNALS</div>
                        <SignalRow label="Mouse Movement" pass={session.signals?.mouseMovement} />
                        <SignalRow label="Click Cadence" pass={session.signals?.clickCadence} />
                        <SignalRow label="Scroll Behavior" pass={session.signals?.scrollBehavior} />
                        <SignalRow label="Typing Pattern" pass={session.signals?.typingPattern} />
                        <SignalRow label="Focus/Blur Events" pass={session.signals?.focusBlur} />
                        <SignalRow label="Touch Events" pass={session.signals?.touchEvents} />
                      </div>

                      {/* Flags */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', marginBottom: 6 }}>🚩 FLAGS</div>
                        {(session.flags || []).length === 0 ? (
                          <div style={{ fontSize: 11, color: 'var(--dim)' }}>No flags raised</div>
                        ) : (
                          (session.flags || []).map((flag, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0',
                              fontSize: 11, color: '#f59e0b',
                            }}>
                              <span>⚠️</span> {flag}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => kickSession(session.id)}
                          style={{
                            flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316',
                          }}
                        >👢 Kick</button>
                        <button
                          onClick={() => { if (window.confirm(`Permanently ban IP ${session.ip}?`)) banSession(session.id); }}
                          style={{
                            flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                          }}
                        >🚫 Ban IP</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ============================================ */}
      {/* FINGERPRINTING & HEADLESS DETECTION */}
      {/* ============================================ */}
      {activeSection === 'fingerprint' && (
        <>
          <div className="card card-surface mb-16">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>🔍 Browser Fingerprinting</h3>
              <Toggle
                checked={settings.fingerprinting?.enabled}
                onChange={v => updateNestedSetting('fingerprinting', 'enabled', v)}
              />
            </div>

            <p style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16, lineHeight: 1.5 }}>
              Generates a unique device ID from browser properties — screen resolution, installed fonts, WebGL renderer, 
              canvas hash, timezone, language, and more. Bots and multi-accounts share fingerprints.
            </p>

            <SettingToggle
              label="Headless Browser Detection"
              desc="Detect Puppeteer, Selenium, PhantomJS, Playwright — checks for automation flags, missing APIs, and inconsistent navigator properties"
              checked={settings.fingerprinting?.headlessDetection}
              onChange={v => updateNestedSetting('fingerprinting', 'headlessDetection', v)}
              color="#ef4444"
            />
            <SettingToggle
              label="Canvas Fingerprinting"
              desc="Render hidden canvas elements and hash the output — headless browsers produce distinct patterns"
              checked={settings.fingerprinting?.canvasFingerprint}
              onChange={v => updateNestedSetting('fingerprinting', 'canvasFingerprint', v)}
            />
            <SettingToggle
              label="WebGL Fingerprinting"
              desc="Extract GPU renderer string and shader precision — datacenter VMs and headless have known signatures"
              checked={settings.fingerprinting?.webglFingerprint}
              onChange={v => updateNestedSetting('fingerprinting', 'webglFingerprint', v)}
            />
            <SettingToggle
              label="AudioContext Fingerprinting"
              desc="Process audio signal and hash the output — unique per device, bots often lack audio stack"
              checked={settings.fingerprinting?.audioFingerprint}
              onChange={v => updateNestedSetting('fingerprinting', 'audioFingerprint', v)}
            />
            <SettingToggle
              label="Font Enumeration"
              desc="Detect installed system fonts via measurement — datacenter machines have minimal font sets"
              checked={settings.fingerprinting?.fontEnumeration}
              onChange={v => updateNestedSetting('fingerprinting', 'fontEnumeration', v)}
            />
            <SettingToggle
              label="WebRTC Leak Detection"
              desc="Check for IP mismatches between WebRTC STUN response and connection IP — catches VPN/proxy users"
              checked={settings.fingerprinting?.webrtcLeakDetection}
              onChange={v => updateNestedSetting('fingerprinting', 'webrtcLeakDetection', v)}
              color="#f59e0b"
            />
          </div>

          {/* Known Headless Signatures */}
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>🤖 Headless Signatures Detected</h3>
            <p style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12 }}>
              Auto-updated. These patterns are matched against incoming connections.
            </p>
            {[
              { name: 'Puppeteer / Chrome Headless', indicators: 'navigator.webdriver=true, missing plugins, HeadlessChrome UA', severity: 'critical' },
              { name: 'Selenium WebDriver', indicators: '$cdc_ variable, document.$wdc_, navigator.webdriver', severity: 'critical' },
              { name: 'PhantomJS', indicators: 'callPhantom, _phantom, phantom object on window', severity: 'critical' },
              { name: 'Playwright', indicators: '__playwright, __pw_manual, empty plugins array', severity: 'high' },
              { name: 'CDP (Chrome DevTools Protocol)', indicators: 'Runtime.evaluate traces, debugger attached', severity: 'high' },
              { name: 'Electron Automation', indicators: 'process.type=renderer, Electron UA string', severity: 'medium' },
            ].map((sig, i) => {
              const sev = THREAT_LEVELS[sig.severity] || THREAT_LEVELS.medium;
              return (
                <div key={i} style={{
                  padding: 10, borderRadius: 8, marginBottom: 4,
                  background: sev.bg, border: `1px solid ${sev.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{sig.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: sev.color, textTransform: 'uppercase' }}>{sig.severity}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace' }}>{sig.indicators}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* BEHAVIOR ANALYSIS */}
      {/* ============================================ */}
      {activeSection === 'behavior' && (
        <>
          <div className="card card-surface mb-16">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>🧠 Behavior Analysis Engine</h3>
              <Toggle
                checked={settings.behaviorAnalysis?.enabled}
                onChange={v => updateNestedSetting('behaviorAnalysis', 'enabled', v)}
              />
            </div>

            <p style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16, lineHeight: 1.5 }}>
              Tracks mouse movement patterns, click timing, scroll behavior, and typing cadence. 
              Real humans have natural variance and micro-movements — bots don't.
            </p>

            <SettingToggle
              label="Mouse Movement Analysis"
              desc="Track Bézier curves, acceleration/deceleration, and jitter. Bots move in straight lines or teleport."
              checked={settings.behaviorAnalysis?.mouseTracking}
              onChange={v => updateNestedSetting('behaviorAnalysis', 'mouseTracking', v)}
            />
            <SettingToggle
              label="Click Cadence Detection"
              desc="Measure inter-click intervals. Human clicks follow power-law distributions; bots click at fixed intervals."
              checked={settings.behaviorAnalysis?.clickCadence}
              onChange={v => updateNestedSetting('behaviorAnalysis', 'clickCadence', v)}
            />
            <SettingToggle
              label="Scroll Behavior Profiling"
              desc="Track scroll velocity, momentum, and direction changes. Natural scrolling has deceleration curves."
              checked={settings.behaviorAnalysis?.scrollProfiling}
              onChange={v => updateNestedSetting('behaviorAnalysis', 'scrollProfiling', v)}
            />
            <SettingToggle
              label="Typing Rhythm Analysis"
              desc="Measure key-down to key-up durations and inter-key delays. Each human has a unique typing signature."
              checked={settings.behaviorAnalysis?.typingRhythm}
              onChange={v => updateNestedSetting('behaviorAnalysis', 'typingRhythm', v)}
            />
            <SettingToggle
              label="Focus/Blur Pattern Check"
              desc="Tab-switching patterns. Bots rarely switch tabs; credential stuffers cycle rapidly."
              checked={settings.behaviorAnalysis?.focusBlurCheck}
              onChange={v => updateNestedSetting('behaviorAnalysis', 'focusBlurCheck', v)}
            />
            <SettingToggle
              label="Invisible Challenge Layer"
              desc="Inject invisible interactive elements that humans never interact with — bots do. Zero-friction CAPTCHA alternative."
              checked={settings.behaviorAnalysis?.invisibleChallenge}
              onChange={v => updateNestedSetting('behaviorAnalysis', 'invisibleChallenge', v)}
              color="#a855f7"
            />
          </div>

          {/* Score Thresholds */}
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📐 Score Thresholds</h3>
            <p style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12 }}>
              Set the bot score thresholds for each enforcement action.
            </p>

            {[
              { key: 'challengeAt', label: 'Show CAPTCHA at score', color: '#f59e0b', defaultVal: 40 },
              { key: 'throttleAt', label: 'Throttle actions at score', color: '#f97316', defaultVal: 60 },
              { key: 'autoKickAt', label: 'Auto-kick at score', color: '#ef4444', defaultVal: 80 },
            ].map(thresh => (
              <div key={thresh.key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{thresh.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: thresh.color }}>
                    {settings.behaviorAnalysis?.[thresh.key] ?? thresh.defaultVal}
                  </span>
                </div>
                <input
                  type="range" min={10} max={95} step={5}
                  value={settings.behaviorAnalysis?.[thresh.key] ?? thresh.defaultVal}
                  onChange={e => updateNestedSetting('behaviorAnalysis', thresh.key, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: thresh.color }}
                />
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="card card-surface mb-16" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#a855f7', marginBottom: 10 }}>💡 How Bot Scoring Works</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 8 }}>Each session starts at score 0 (trusted). Points are added for suspicious signals:</p>
              <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.8, color: 'var(--dim)' }}>
                +30 — Headless browser detected<br/>
                +25 — No mouse movement for 60s+ during active session<br/>
                +20 — Linear mouse paths (no Bézier curves)<br/>
                +20 — Fixed-interval click timing (σ &lt; 10ms)<br/>
                +15 — No scroll deceleration curves<br/>
                +15 — Interacted with invisible challenge element<br/>
                +10 — Missing WebGL / Canvas fingerprint<br/>
                +10 — No focus/blur events detected<br/>
                +5 — VPN / proxy connection<br/>
                −10 — Passed reCAPTCHA / hCaptcha (score decays)<br/>
                −5 — Natural typing rhythm confirmed<br/>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* REGISTRATION GATES */}
      {/* ============================================ */}
      {activeSection === 'registration' && (
        <>
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🚪 Registration Defense</h3>
            <p style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16 }}>
              Stop fake account creation before it starts. Layered gates that stop automated signups while keeping the experience smooth for humans.
            </p>

            <SettingToggle
              label="Honeypot Fields"
              desc="Hidden form fields invisible to humans. Bots fill them in automatically → instant block."
              checked={settings.registrationGates?.honeypot}
              onChange={v => updateNestedSetting('registrationGates', 'honeypot', v)}
              color="#22c55e"
            />
            <SettingToggle
              label="Proof of Work Challenge"
              desc="Require client to solve a lightweight hash puzzle on signup. ~200ms for browsers, expensive for bot farms."
              checked={settings.registrationGates?.proofOfWork}
              onChange={v => updateNestedSetting('registrationGates', 'proofOfWork', v)}
              color="#3b82f6"
            />
            <SettingToggle
              label="Progressive CAPTCHA"
              desc="Invisible reCAPTCHA v3 for low-risk, escalate to visual CAPTCHA if score is suspicious."
              checked={settings.registrationGates?.progressiveCaptcha}
              onChange={v => updateNestedSetting('registrationGates', 'progressiveCaptcha', v)}
            />
            <SettingToggle
              label="Email Verification Required"
              desc="Must confirm email before account is active. Blocks throwaway/temp emails."
              checked={settings.registrationGates?.emailVerification}
              onChange={v => updateNestedSetting('registrationGates', 'emailVerification', v)}
            />
            <SettingToggle
              label="Disposable Email Blocking"
              desc="Block domains from known temporary email services (guerrillamail, tempmail, etc.)"
              checked={settings.registrationGates?.disposableEmailBlock}
              onChange={v => updateNestedSetting('registrationGates', 'disposableEmailBlock', v)}
              color="#f59e0b"
            />
            <SettingToggle
              label="Device Fingerprint Lock"
              desc="Limit accounts per device fingerprint. Block if same device registers 3+ accounts."
              checked={settings.registrationGates?.deviceLock}
              onChange={v => updateNestedSetting('registrationGates', 'deviceLock', v)}
              color="#ef4444"
            />
          </div>

          {/* Registration Rate Limits */}
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>⏱️ Registration Rate Limits</h3>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Max Registrations Per IP (per hour)</label>
              <input
                type="number" className="form-input" min={1} max={20}
                value={settings.registrationGates?.maxPerIPPerHour ?? 3}
                onChange={e => updateNestedSetting('registrationGates', 'maxPerIPPerHour', parseInt(e.target.value) || 3)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Max Registrations Per Device (total)</label>
              <input
                type="number" className="form-input" min={1} max={10}
                value={settings.registrationGates?.maxPerDevice ?? 3}
                onChange={e => updateNestedSetting('registrationGates', 'maxPerDevice', parseInt(e.target.value) || 3)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Proof of Work Difficulty (iterations)</label>
              <input
                type="number" className="form-input" min={1000} max={1000000} step={1000}
                value={settings.registrationGates?.powDifficulty ?? 50000}
                onChange={e => updateNestedSetting('registrationGates', 'powDifficulty', parseInt(e.target.value) || 50000)}
              />
              <div className="hint">Higher = harder for bots, but slower for legit users. 50k = ~200ms on modern hardware</div>
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* CONNECTION INTELLIGENCE */}
      {/* ============================================ */}
      {activeSection === 'connections' && (
        <>
          <div className="card card-surface mb-16">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>🔌 Connection Intelligence</h3>
              <Toggle
                checked={settings.connectionLimits?.enabled}
                onChange={v => updateNestedSetting('connectionLimits', 'enabled', v)}
              />
            </div>

            <p style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16, lineHeight: 1.5 }}>
              Monitor and limit WebRTC connections, HTTP sessions, and WebSocket channels per IP.
              A single bot farm IP opening 500 WebRTC connections will burn your streaming budget.
            </p>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Max Concurrent Sessions Per IP</label>
              <input
                type="number" className="form-input" min={1} max={50}
                value={settings.connectionLimits?.maxSessionsPerIP ?? 5}
                onChange={e => updateNestedSetting('connectionLimits', 'maxSessionsPerIP', parseInt(e.target.value) || 5)}
              />
              <div className="hint">Legit users rarely exceed 2-3 (phone + desktop). Default: 5</div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Max WebRTC Connections Per IP</label>
              <input
                type="number" className="form-input" min={1} max={20}
                value={settings.connectionLimits?.maxWebRTCPerIP ?? 3}
                onChange={e => updateNestedSetting('connectionLimits', 'maxWebRTCPerIP', parseInt(e.target.value) || 3)}
              />
              <div className="hint">Each room view = 1 WebRTC connection. Default: 3</div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Max WebSocket Channels Per IP</label>
              <input
                type="number" className="form-input" min={1} max={30}
                value={settings.connectionLimits?.maxWSPerIP ?? 5}
                onChange={e => updateNestedSetting('connectionLimits', 'maxWSPerIP', parseInt(e.target.value) || 5)}
              />
              <div className="hint">Chat connections. Default: 5</div>
            </div>

            <SettingToggle
              label="Bandwidth Abuse Detection"
              desc="Detect IPs consuming >2x expected bandwidth for their connection count → auto-throttle"
              checked={settings.connectionLimits?.bandwidthDetection}
              onChange={v => updateNestedSetting('connectionLimits', 'bandwidthDetection', v)}
              color="#f97316"
            />
            <SettingToggle
              label="Connection Velocity Check"
              desc="Flag IPs that open >10 connections in 5 seconds (connection flood pattern)"
              checked={settings.connectionLimits?.velocityCheck}
              onChange={v => updateNestedSetting('connectionLimits', 'velocityCheck', v)}
              color="#ef4444"
            />
            <SettingToggle
              label="Stale Connection Reaper"
              desc="Auto-close connections that haven't sent data in 5+ minutes (zombie sessions)"
              checked={settings.connectionLimits?.staleReaper}
              onChange={v => updateNestedSetting('connectionLimits', 'staleReaper', v)}
            />
          </div>

          {/* IP Reputation */}
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>🌐 IP Reputation</h3>
            <SettingToggle
              label="Known Datacenter IP Blocking"
              desc="Block connections from AWS, GCP, Azure, DigitalOcean, Hetzner, OVH datacenter IP ranges"
              checked={settings.connectionLimits?.datacenterBlock}
              onChange={v => updateNestedSetting('connectionLimits', 'datacenterBlock', v)}
              color="#ef4444"
            />
            <SettingToggle
              label="Tor Exit Node Blocking"
              desc="Block connections from known Tor exit nodes (updated daily)"
              checked={settings.connectionLimits?.torBlock}
              onChange={v => updateNestedSetting('connectionLimits', 'torBlock', v)}
              color="#ef4444"
            />
            <SettingToggle
              label="Residential Proxy Detection"
              desc="Detect residential proxy networks (Luminati/BrightData, Oxylabs, etc.) via IP scoring APIs"
              checked={settings.connectionLimits?.residentialProxyDetect}
              onChange={v => updateNestedSetting('connectionLimits', 'residentialProxyDetect', v)}
              color="#f59e0b"
            />
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* CHAT FLOOD DEFENSE */}
      {/* ============================================ */}
      {activeSection === 'chat' && (
        <>
          <div className="card card-surface mb-16">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>💬 Chat Flood Defense</h3>
              <Toggle
                checked={settings.chatDefense?.enabled}
                onChange={v => updateNestedSetting('chatDefense', 'enabled', v)}
              />
            </div>

            <p style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16, lineHeight: 1.5 }}>
              Protect chat rooms from spam bots, scam links, and message flooding. 
              Keeps the chat experience clean for real viewers and performers.
            </p>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Max Messages Per Minute (per user)</label>
              <input
                type="number" className="form-input" min={1} max={60}
                value={settings.chatDefense?.maxMsgPerMinute ?? 15}
                onChange={e => updateNestedSetting('chatDefense', 'maxMsgPerMinute', parseInt(e.target.value) || 15)}
              />
              <div className="hint">Active chatters average 5-8/min. Spam bots hit 30+</div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Duplicate Message Cooldown (seconds)</label>
              <input
                type="number" className="form-input" min={0} max={300}
                value={settings.chatDefense?.duplicateCooldown ?? 30}
                onChange={e => updateNestedSetting('chatDefense', 'duplicateCooldown', parseInt(e.target.value) || 30)}
              />
              <div className="hint">Block identical messages within this window. 0 = disabled</div>
            </div>

            <SettingToggle
              label="Link Filtering"
              desc="Block or flag messages containing URLs. Scam links are the #1 chat bot attack vector."
              checked={settings.chatDefense?.linkFilter}
              onChange={v => updateNestedSetting('chatDefense', 'linkFilter', v)}
              color="#ef4444"
            />
            <SettingToggle
              label="New User Chat Delay"
              desc="Require accounts to exist for 10+ minutes before chatting. Stops drive-by spam."
              checked={settings.chatDefense?.newUserDelay}
              onChange={v => updateNestedSetting('chatDefense', 'newUserDelay', v)}
            />
            <SettingToggle
              label="Emoji Spam Detection"
              desc="Detect messages that are 80%+ emoji or repeating characters → throttle sender"
              checked={settings.chatDefense?.emojiSpamDetect}
              onChange={v => updateNestedSetting('chatDefense', 'emojiSpamDetect', v)}
            />
            <SettingToggle
              label="Shadow Banning"
              desc="Instead of visible blocks, shadow-ban spammers so only they see their messages. They don't know they're caught."
              checked={settings.chatDefense?.shadowBan}
              onChange={v => updateNestedSetting('chatDefense', 'shadowBan', v)}
              color="#6b7280"
            />
            <SettingToggle
              label="Auto-Mute on Flood"
              desc="Automatically mute users who exceed 3x the message rate limit for 5 minutes"
              checked={settings.chatDefense?.autoMuteOnFlood}
              onChange={v => updateNestedSetting('chatDefense', 'autoMuteOnFlood', v)}
              color="#f97316"
            />
          </div>

          {/* Word Filter */}
          <div className="card card-surface mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>🔤 Word / Pattern Filter</h3>
            <p style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12 }}>
              Block messages matching these patterns (regex supported). One per line.
            </p>
            <textarea
              value={settings.chatDefense?.wordFilter || 'https?://\n\\.com\\b\n\\.xyz\\b\nfree tokens\nclick here\nwhatsapp\\b\ntelegram\\.me'}
              onChange={e => updateNestedSetting('chatDefense', 'wordFilter', e.target.value)}
              rows={6}
              style={{
                width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text)', fontSize: 12, resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'monospace',
              }}
            />
            <div className="hint">Default patterns catch common scam/spam signals. Add your own.</div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* EVENT LOG */}
      {/* ============================================ */}
      {activeSection === 'eventlog' && (
        <>
          <div className="card card-surface mb-12">
            <div className="flex-between mb-12">
              <h3 style={{ fontSize: 14, fontWeight: 800 }}>📋 Bot Event Log</h3>
              <span className="text-dim text-sm">{log.length} events</span>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {['all', 'critical', 'high', 'medium', 'low'].map(f => {
                const tl = THREAT_LEVELS[f];
                return (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: logFilter === f ? (tl?.color || 'var(--violet)') : 'rgba(255,255,255,0.05)',
                      color: logFilter === f ? '#fff' : 'var(--muted)',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    {f === 'all' ? 'All' : (tl?.icon || '') + ' ' + f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredLog.length === 0 ? (
            <div className="card card-surface" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🛡️</div>
              <div className="text-muted text-sm">No events match this filter</div>
            </div>
          ) : filteredLog.map(entry => {
            const threat = THREAT_LEVELS[entry.severity] || THREAT_LEVELS.medium;
            const act = ACTION_COLORS[entry.action] || { label: entry.action, color: 'var(--muted)' };
            const bt = BOT_TYPES[entry.type] || { icon: '❓', label: entry.type };
            return (
              <div key={entry.id} style={{
                padding: 12, borderRadius: 10, marginBottom: 6,
                background: threat.bg, border: `1px solid ${threat.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{bt.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: threat.color, textTransform: 'uppercase' }}>
                      {bt.label}
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
                  {entry.sessionId && <span>Session: {entry.sessionId}</span>}
                  <span>{timeAgo(entry.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card text-center" style={{
      padding: 14, borderRadius: 12,
      background: `${color}10`, border: `1px solid ${color}30`,
    }}>
      <div style={{ fontSize: 10, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SettingToggle({ label, desc, checked, onChange, color = '#22c55e' }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ flex: 1, marginRight: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} color={color} />
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
      <span style={{ color: 'var(--dim)' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function SignalRow({ label, pass }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', fontSize: 12 }}>
      <span style={{ fontSize: 10 }}>{pass === undefined ? '⬜' : pass ? '✅' : '❌'}</span>
      <span style={{ color: pass === false ? '#ef4444' : 'var(--muted)' }}>{label}</span>
      {pass === false && <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>FAIL</span>}
    </div>
  );
}
