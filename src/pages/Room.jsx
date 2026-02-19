import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import { STATE_NAMES } from '../data/constants.js';
import db from '../services/database.js';
import { sendChatMessage, getChatHistory } from '../services/chat.js';
import BottomSheet from '../components/BottomSheet.jsx';

export default function Room() {
  const navigate = useNavigate();
  const { currentStreamer, refreshBalance, balance } = useApp();
  const [chatMessages, setChatMessages] = useState(getChatHistory());
  const [showLovense, setShowLovense] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [showMoreTime, setShowMoreTime] = useState(false);
  const [isInPrivateShow, setIsInPrivateShow] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);

  // Redirect if no streamer selected
  useEffect(() => {
    if (!currentStreamer) navigate('/');
  }, [currentStreamer, navigate]);

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
    if (balance < amount) { alert('Not enough tokens!'); return; }
    db.deductTokens(amount, 'tip');
    refreshBalance();
    const msg = { type: 'tip', user: 'you', text: label, amount, timestamp: Date.now() };
    sendChatMessage(msg);
    setChatMessages(getChatHistory());
  }

  function handleLovense(label, tokens, duration) {
    if (balance < tokens) { alert('Not enough tokens!'); return; }
    db.deductTokens(tokens, 'lovense');
    refreshBalance();
    const msg = { type: 'lovense', user: 'you', text: `${label} (${duration}s)`, amount: tokens, timestamp: Date.now() };
    sendChatMessage(msg);
    setChatMessages(getChatHistory());
    setShowLovense(false);
  }

  function startPrivateShow() {
    const cost = privateSettings.tokensPerMin * privateSettings.minDuration;
    if (balance < cost) {
      alert(`Not enough tokens!\n\n${cost} needed (${privateSettings.minDuration} min).\nBalance: ${balance}\n\nVisit Wallet to buy more.`);
      setShowPrivate(false);
      navigate('/tokens');
      return;
    }
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

  const s = currentStreamer;

  return (
    <>
      {/* Video Container / Avatar */}
      <div className="video-container">
        <button className="room-back-btn" onClick={leaveRoom}>←</button>
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
          <button className="control-btn" onClick={() => setShowLovense(true)}>🔥 Lovense</button>
          <button className="control-btn control-btn-alt">💬 Chat</button>
        </div>
      </div>

      {/* Tip Buttons */}
      <div className="tip-section">
        {tipButtons.map((t, i) => (
          <button key={i} className="tip-btn" onClick={() => handleTip(t.amount, `${t.icon} ${t.label}`)}>
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
      </div>

      {/* Floating Private Button */}
      <button className="floating-private-btn" onClick={() => setShowPrivate(true)}>
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
    </>
  );
}
