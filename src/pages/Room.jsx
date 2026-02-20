import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import { STATE_NAMES } from '../data/constants.js';
import db from '../services/database.js';
import { sendChatMessage, getChatHistory } from '../services/chat.js';
import BottomSheet from '../components/BottomSheet.jsx';
import GatePrompt from '../components/GatePrompt.jsx';

export default function Room() {
  const navigate = useNavigate();
  const { currentStreamer, refreshBalance, balance, user } = useApp();
  const [chatMessages, setChatMessages] = useState(getChatHistory());
  const [isFav, setIsFav] = useState(false);
  const [showLovense, setShowLovense] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [showMoreTime, setShowMoreTime] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isInPrivateShow, setIsInPrivateShow] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [gatePrompt, setGatePrompt] = useState(null); // { reason, message } or null
  const timerRef = useRef(null);

  // Access tier helpers
  const accessTier = db.getAccessTier(user);
  const hdAccess = db.canHD(user);
  const goSignup = () => { setGatePrompt(null); navigate('/login'); };
  const goTokens = () => { setGatePrompt(null); navigate('/tokens'); };

  // Gate check helper — shows overlay if not allowed, returns true if blocked
  function gateCheck(check) {
    if (!check.allowed) {
      setGatePrompt({ reason: check.reason, message: check.message });
      return true;
    }
    return false;
  }

  // Redirect if no streamer selected
  useEffect(() => {
    if (!currentStreamer) navigate('/');
    else setIsFav(db.isFavorite(currentStreamer.id));
  }, [currentStreamer, navigate]);

  function toggleFavorite() {
    if (!currentStreamer) return;
    if (isFav) {
      db.removeFavorite(currentStreamer.id);
      setIsFav(false);
    } else {
      // Gate check — guests need signup, free users limited to 3
      const check = db.canFollow(user);
      if (gateCheck(check)) return;
      db.addFavorite({
        id: currentStreamer.id,
        name: currentStreamer.name,
        avatar: currentStreamer.avatar,
        color: currentStreamer.color,
        club: currentStreamer.club,
        state: currentStreamer.state,
      });
      setIsFav(true);
    }
  }

  // Spending limit check
  function checkSpendingLimit(amount) {
    const limit = db.getDailyLimit();
    if (limit <= 0) return true; // no limit
    // Sum today's spending
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const txns = db.getTransactions(100);
    const todaySpent = txns
      .filter(t => t.amount < 0 && (t.timestamp || t.id) >= todayStart)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    if (todaySpent + amount > limit) {
      alert(`🛡️ Daily Spending Limit Reached!\n\nLimit: ${limit} tokens/day\nSpent today: ${todaySpent} tokens\nThis action: ${amount} tokens\n\nAdjust your limit in Dashboard → Spending Controls`);
      return false;
    }
    return true;
  }

  // Timer for private shows
  useEffect(() => {
    if (isInPrivateShow && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsInPrivateShow(false);
            alert('⏰ Private Show Ended');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [isInPrivateShow, timeRemaining]);

  if (!currentStreamer) return null;

  const tipButtons = db.getTipButtons();
  const lovenseLevels = db.getLovenseLevels();
  const privateSettings = db.getPrivateShowSettings();

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function handleTip(amount, label) {
    if (!user) { setGatePrompt({ reason: 'signup', message: 'Create a free account and buy tokens to send tips' }); return; }
    if (balance < amount) { alert('Not enough tokens!'); return; }
    if (!checkSpendingLimit(amount)) return;
    db.deductTokens(amount, 'tip');
    refreshBalance();
    const msg = { type: 'tip', user: 'you', text: label, amount, timestamp: Date.now() };
    sendChatMessage(msg);
    setChatMessages(getChatHistory());
  }

  function handleLovense(label, tokens, duration) {
    if (!user) { setGatePrompt({ reason: 'signup', message: 'Create an account and buy tokens to control Lovense toys' }); return; }
    if (balance < tokens) { alert('Not enough tokens!'); return; }
    if (!checkSpendingLimit(tokens)) return;
    db.deductTokens(tokens, 'lovense');
    refreshBalance();
    const msg = { type: 'lovense', user: 'you', text: `${label} (${duration}s)`, amount: tokens, timestamp: Date.now() };
    sendChatMessage(msg);
    setChatMessages(getChatHistory());
    setShowLovense(false);
  }

  function startPrivateShow() {
    if (gateCheck(db.canPrivateShow(user))) return;
    const cost = privateSettings.tokensPerMin * privateSettings.minDuration;
    if (balance < cost) {
      alert(`Not enough tokens!\n\n${cost} needed (${privateSettings.minDuration} min).\nBalance: ${balance}\n\nVisit Wallet to buy more.`);
      setShowPrivate(false);
      navigate('/tokens');
      return;
    }
    if (!checkSpendingLimit(cost)) { setShowPrivate(false); return; }
    db.deductTokens(cost, 'private-show');
    refreshBalance();
    setShowPrivate(false);
    setIsInPrivateShow(true);
    setTimeRemaining(privateSettings.minDuration * 60);
    const msg = { type: 'system', text: `🔒 Private show started! ${privateSettings.minDuration} min`, timestamp: Date.now() };
    sendChatMessage(msg);
    setChatMessages(getChatHistory());
    alert(`🔒 Private Show Started!\n\n⏱️ ${privateSettings.minDuration} minutes\n💰 ${cost} tokens`);
  }

  function addMoreTime(extIndex) {
    const ext = (privateSettings.extensions || [])[extIndex];
    if (!ext) return;
    if (balance < ext.tokens) { alert(`Not enough tokens! ${ext.tokens} needed.`); setShowMoreTime(false); return; }
    db.deductTokens(ext.tokens, 'private-ext');
    refreshBalance();
    setTimeRemaining(prev => prev + ext.minutes * 60);
    setShowMoreTime(false);
    const msg = { type: 'system', text: `⏱️ +${ext.minutes} min added!`, timestamp: Date.now() };
    sendChatMessage(msg);
    setChatMessages(getChatHistory());
    alert(`✅ +${ext.minutes} minutes added!`);
  }

  function leaveRoom() {
    if (isInPrivateShow) {
      if (!window.confirm('Leave private show? Time will be lost.')) return;
      clearInterval(timerRef.current);
      setIsInPrivateShow(false);
    }
    navigate('/');
  }

  function blockStreamer() {
    if (!window.confirm(`Block ${s.name}?\n\nYou won't see their streams or receive notifications from them.`)) return;
    db.blockUser({ id: s.id, name: s.name });
    setShowReportMenu(false);
    alert(`🚫 ${s.name} has been blocked.\n\nYou can unblock them in Dashboard → Settings.`);
    navigate('/');
  }

  function submitReport() {
    if (!reportReason) { alert('Please select a reason'); return; }
    db.addReport({
      targetId: s.id,
      targetName: s.name,
      targetType: 'performer',
      reason: reportReason,
      details: reportDetails,
      roomId: s.id,
    });
    setShowReportForm(false);
    setShowReportMenu(false);
    const isUrgent = reportReason === 'Underage appearance' || reportReason === 'Suspected trafficking or exploitation';
    setReportReason('');
    setReportDetails('');
    if (isUrgent) {
      alert('🚨 Report submitted — URGENT.\n\nOur team will review this immediately.\n\nIf you believe someone is in immediate danger:\n• NCMEC CyberTipline: www.missingkids.org/gethelpnow/cybertipline\n• National Human Trafficking Hotline: 1-888-373-7888\n• Emergency: Call 911');
    } else {
      alert('✅ Report submitted.\n\nOur team will review this within 24 hours. Thank you for helping keep the community safe.');
    }
  }

  const REPORT_REASONS = [
    'Underage appearance',
    'Suspected trafficking or exploitation',
    'Non-consensual content',
    'Harassment or abuse',
    'Fraud or scam',
    'Impersonation',
    'Illegal activity',
    'Spam or bot behavior',
    'Other',
  ];

  const s = currentStreamer;

  return (
    <>
      {/* Video Container / Avatar */}
      <div className="video-container">
        <button className="room-back-btn" onClick={leaveRoom}>←</button>
        <button onClick={() => setShowReportMenu(!showReportMenu)} style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
          width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
          fontSize: 16, fontWeight: 800,
        }}>⋯</button>
        <div className="room-avatar" style={{ background: s.color }}>{s.avatar}</div>
        <div className="room-name">{s.name}</div>
        <div className="room-title">{s.title || 'Live now!'}</div>
        <div className="room-stats">
          <div className="stat-badge stat-live">
            <div className="pulse-dot" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
            <span style={{ marginLeft: 5 }}>LIVE</span>
          </div>
          <div className="stat-badge stat-viewers">👁️ {(s.viewers || 0).toLocaleString()}</div>
          <div className="stat-badge" style={{ background: 'rgba(225,29,72,0.1)', color: 'var(--accent)', border: '1px solid rgba(225,29,72,0.3)', fontSize: 11 }}>🛡️ Verified</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 6 }}>
          📍 Verified at {s.club || 'Club'}, {STATE_NAMES[s.state] || s.state || ''}
        </div>

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          style={{
            marginTop: 10, padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
            background: isFav ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.06)',
            border: isFav ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
            color: isFav ? 'var(--accent)' : 'var(--muted)',
            fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
          }}
        >
          {isFav ? '❤️ Favorited' : '🤍 Add to Favorites'}
        </button>

        {/* Private Timer */}
        {isInPrivateShow && (
          <>
            <div className="private-timer" style={{ display: 'block' }}>
              <div className="timer-label">🔒 PRIVATE SHOW</div>
              <div className="timer-display">{formatTime(timeRemaining)}</div>
              <div className="timer-sub">Time Remaining</div>
            </div>
            <button className="btn-more-time" onClick={() => setShowMoreTime(true)}>➕ ADD MORE TIME</button>
          </>
        )}

        <div className="room-controls">
          <button className="control-btn" onClick={() => {
            if (!user) { setGatePrompt({ reason: 'signup', message: 'Create an account and buy tokens to control Lovense toys' }); return; }
            if (accessTier === 'free') { setGatePrompt({ reason: 'tokens', message: 'Buy tokens to control Lovense toys' }); return; }
            setShowLovense(true);
          }}>🔥 Lovense</button>
          <button className="control-btn control-btn-alt" onClick={() => {
            if (!user) { setGatePrompt({ reason: 'signup', message: 'Create a free account to chat' }); return; }
          }}>💬 Chat</button>
        </div>

        {/* Quality Tier Badge */}
        <div style={{
          position: 'absolute', top: 12, left: 54, zIndex: 10,
          padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
          letterSpacing: 0.5,
          background: hdAccess.allowed ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${hdAccess.allowed ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.15)'}`,
          color: hdAccess.allowed ? '#34d399' : 'var(--muted)',
          cursor: hdAccess.allowed ? 'default' : 'pointer',
        }} onClick={() => { if (!hdAccess.allowed) setGatePrompt({ reason: hdAccess.reason, message: hdAccess.message }); }}>
          {hdAccess.allowed ? '720p HD' : '480p'}
          {!hdAccess.allowed && <span style={{ marginLeft: 4, fontSize: 9 }}>⬆️</span>}
        </div>
      </div>

      {/* Tip Buttons */}
      <div className="tip-section">
        {!user && (
          <div style={{ marginBottom: 10, gridColumn: '1 / -1' }}>
            <GatePrompt reason="signup" message="Create an account and buy tokens to tip performers" onSignup={goSignup} variant="banner" />
          </div>
        )}
        {tipButtons.map((t, i) => (
          <button key={i} className="tip-btn" onClick={() => handleTip(t.amount, `${t.icon} ${t.label}`)} style={!user ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            <div className="tip-label">{t.icon} {t.label}</div>
            <div className="tip-amount">🪙 {t.amount}</div>
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="chat-section">
        <div className="chat-title">💬 RECENT ACTIVITY</div>
        <div className="chat-messages">
          {chatMessages.slice(0, 10).map((m, i) => {
            if (m.type === 'tip' && m.amount) {
              return (
                <div key={i} className="chat-msg">
                  <span className="chat-user">{m.user}</span>
                  <span>{m.text}</span>
                  <span className="chat-tip-amount">🪙 {m.amount}</span>
                </div>
              );
            }
            if (m.type === 'lovense') {
              return (
                <div key={i} className="chat-msg chat-msg-lovense">
                  <span className="chat-user chat-user-pink">{m.user}</span>
                  <span>activated {m.text}</span>
                  <span className="chat-tip-amount chat-tip-pink">🪙 {m.amount}</span>
                </div>
              );
            }
            return <div key={i} className="chat-msg">{m.text}</div>;
          })}
        </div>
        {/* Chat gate: guests see signup prompt, logged-in users see chat is available */}
        {!user && (
          <GatePrompt reason="signup" message="Create a free account to chat with performers and viewers" onSignup={goSignup} variant="banner" />
        )}
      </div>

      {/* Floating Private Button */}
      <button className="floating-private-btn" onClick={() => {
        if (gateCheck(db.canPrivateShow(user))) return;
        setShowPrivate(true);
      }}>
        <div className="floating-btn-icon">🔒</div>
        <div className="floating-btn-text">PRIVATE</div>
        <div className="floating-btn-price">${(privateSettings.tokensPerMin / 10).toFixed(0)}/min</div>
      </button>

      {/* Lovense Sheet */}
      <BottomSheet open={showLovense} onClose={() => setShowLovense(false)} title="🔥 Lovense Control" subtitle="Lush 4 • 🔋 87%">
        {lovenseLevels.map((l, i) => (
          <div key={i} className="lovense-item" onClick={() => handleLovense(l.label, l.tokens, l.duration)}>
            <span className="lovense-label">{l.icon} {l.label}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span className="lovense-cost">🪙 {l.tokens}</span>
              <span className="lovense-duration">{l.duration}s</span>
            </div>
          </div>
        ))}
      </BottomSheet>

      {/* Private Show Sheet */}
      <BottomSheet open={showPrivate} onClose={() => setShowPrivate(false)} title="🔒 Private Show" subtitle="Exclusive 1-on-1 experience">
        <div className="card-premium mb-20">
          <div className="text-center mb-20">
            <div style={{ fontSize: 48 }} className="mb-8">👑</div>
            <div className="text-2xl font-black text-violet mb-4">Exclusive 1-on-1</div>
            <div className="text-base text-muted">Just you and the performer</div>
          </div>
          <div className="grid-2col mb-20">
            <div className="card-stat">
              <div className="text-4xl font-black text-violet">${(privateSettings.tokensPerMin / 10).toFixed(0)}</div>
              <div className="text-sm text-muted">per minute</div>
            </div>
            <div className="card-stat">
              <div className="text-4xl font-black text-violet">{privateSettings.minDuration} min</div>
              <div className="text-sm text-muted">minimum</div>
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }} className="mb-20">
            <div className="text-base font-bold text-gold mb-8">✨ What's Included:</div>
            <div className="text-md text-muted leading-relaxed">Full control of the show • Two-way audio & video • Custom requests • Lovense control • Recording (+$20)</div>
          </div>
          <button className="btn-primary" onClick={startPrivateShow}>
            🔒 START PRIVATE SHOW (${(privateSettings.tokensPerMin * privateSettings.minDuration / 10).toFixed(0)})
          </button>
        </div>
        <div className="card-spy">
          <div className="flex-gap-lg mb-12">
            <div style={{ fontSize: 36 }}>👁️</div>
            <div>
              <div className="text-xl font-black text-cyan mb-4">Spy Mode</div>
              <div className="text-sm text-muted">Watch someone else's show</div>
            </div>
          </div>
          <div className="flex-between mt-12">
            <div>
              <div className="text-2xl font-black text-cyan">$3/min</div>
              <div className="text-xs text-muted">Watch only</div>
            </div>
            <button className="btn-spy" onClick={() => { alert('👁️ Spy Mode\n\nNo private shows available to spy on.'); setShowPrivate(false); }}>JOIN SPY</button>
          </div>
        </div>
      </BottomSheet>

      {/* More Time Sheet */}
      <BottomSheet open={showMoreTime} onClose={() => setShowMoreTime(false)} title="➕ Add More Time" subtitle="Extend your private show">
        <div className="timer-box mb-16">
          <div className="text-base text-muted mb-8">⏱️ Time Remaining</div>
          <div className="text-5xl font-black" style={{ fontFamily: 'monospace' }}>{formatTime(timeRemaining)}</div>
        </div>
        {(privateSettings.extensions || []).map((ext, i) => (
          <div key={i} className="extension-option" onClick={() => addMoreTime(i)}>
            <div className="flex-between">
              <div>
                <div className="text-xl font-black text-violet mb-4">+{ext.minutes} Minutes</div>
                <div className="text-sm text-muted">Extend your show</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-3xl font-black">{ext.tokens}</div>
                <div className="text-xs text-muted">tokens</div>
              </div>
            </div>
          </div>
        ))}
      </BottomSheet>

      {/* Report / Block Menu */}
      {showReportMenu && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 100, background: 'rgba(0,0,0,0.5)',
        }} onClick={() => { setShowReportMenu(false); setShowReportForm(false); }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            position: 'absolute', top: 60, right: 16,
            background: 'var(--card-bg)', borderRadius: 12,
            border: '1px solid var(--border)', overflow: 'hidden',
            minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {!showReportForm ? (
              <>
                <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--dim)', borderBottom: '1px solid var(--border)' }}>
                  Options for {s.name}
                </div>
                <button onClick={() => setShowReportForm(true)} style={{
                  width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                  color: 'var(--gold)', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  🚩 Report
                </button>
                <button onClick={blockStreamer} style={{
                  width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                  color: 'var(--red)', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                }}>
                  🚫 Block User
                </button>
              </>
            ) : (
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--gold)' }}>🚩 Report {s.name}</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Reason *</label>
                  {REPORT_REASONS.map(r => (
                    <label key={r} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                      fontSize: 12, cursor: 'pointer', color: reportReason === r ? '#fff' : 'var(--muted)',
                    }}>
                      <input type="radio" name="report-reason" checked={reportReason === r}
                        onChange={() => setReportReason(r)} />
                      {r}
                    </label>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Details (optional)</label>
                  <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe what happened..."
                    style={{
                      width: '100%', minHeight: 60, padding: 10, borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                      color: '#fff', fontSize: 12, resize: 'vertical',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowReportForm(false)} style={{
                    flex: 1, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                  }}>Cancel</button>
                  <button onClick={submitReport} style={{
                    flex: 1, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: 'var(--red)', border: 'none', color: '#fff', cursor: 'pointer',
                  }}>Submit Report</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gate Prompt Overlay */}
      {gatePrompt && (
        <GatePrompt
          reason={gatePrompt.reason}
          message={gatePrompt.message}
          onSignup={goSignup}
          onBuyTokens={goTokens}
          variant="overlay"
          onClose={() => setGatePrompt(null)}
        />
      )}

      {/* Legal footer — required on content pages */}
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a href="#/terms" style={{ fontSize: 9, color: 'var(--dim)', textDecoration: 'none' }}>Terms</a>
          <span style={{ fontSize: 9, color: 'var(--dim)' }}>·</span>
          <a href="#/privacy" style={{ fontSize: 9, color: 'var(--dim)', textDecoration: 'none' }}>Privacy</a>
          <span style={{ fontSize: 9, color: 'var(--dim)' }}>·</span>
          <a href="#/dmca" style={{ fontSize: 9, color: 'var(--dim)', textDecoration: 'none' }}>DMCA</a>
          <span style={{ fontSize: 9, color: 'var(--dim)' }}>·</span>
          <a href="#/compliance" style={{ fontSize: 9, color: 'var(--dim)', textDecoration: 'none' }}>2257 Compliance</a>
        </div>
      </div>
    </>
  );
}
