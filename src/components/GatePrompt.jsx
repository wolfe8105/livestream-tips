/**
 * GATE PROMPT — Freemium Access Gates
 * =====================================
 * Reusable overlay/inline prompt shown when a user tries to access
 * a feature they haven't unlocked yet.
 *
 * Props:
 *   reason: 'signup' | 'tokens'
 *   message: string — what the user sees
 *   onSignup: function — navigate to signup
 *   onBuyTokens: function — navigate to token purchase
 *   variant: 'overlay' | 'inline' | 'banner' (default: 'inline')
 *   onClose: function — optional close handler for overlay variant
 */

import React from 'react';

export default function GatePrompt({ reason, message, onSignup, onBuyTokens, variant = 'inline', onClose }) {
  const isSignup = reason === 'signup';

  if (variant === 'banner') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, padding: '10px 14px', borderRadius: 10,
        background: isSignup ? 'rgba(99,102,241,0.12)' : 'rgba(234,179,8,0.12)',
        border: `1px solid ${isSignup ? 'rgba(99,102,241,0.3)' : 'rgba(234,179,8,0.3)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{isSignup ? '🔒' : '🪙'}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.3 }}>{message}</span>
        </div>
        <button
          onClick={isSignup ? onSignup : onBuyTokens}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: isSignup ? 'var(--violet)' : 'var(--gold)',
            border: 'none', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {isSignup ? 'Sign Up Free' : 'Get Tokens'}
        </button>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }} onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: 'var(--card-bg, #1e293b)', borderRadius: 16,
          border: '1px solid var(--border, rgba(255,255,255,0.1))',
          padding: 28, maxWidth: 340, width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{isSignup ? '🔐' : '👑'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            {isSignup ? 'Sign Up to Unlock' : 'Tokens Required'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted, #94a3b8)', marginBottom: 24, lineHeight: 1.5 }}>
            {message}
          </div>
          <button
            onClick={isSignup ? onSignup : onBuyTokens}
            style={{
              width: '100%', padding: '12px 20px', borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              background: isSignup ? 'var(--violet, #8b5cf6)' : 'linear-gradient(135deg, #f59e0b, #eab308)',
              border: 'none', color: '#fff', cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            {isSignup ? '✨ Create Free Account' : '🪙 Get Tokens'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '10px 20px', borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', border: 'none',
                color: 'var(--muted, #94a3b8)', cursor: 'pointer',
              }}
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default: inline
  return (
    <div style={{
      padding: 20, borderRadius: 12, textAlign: 'center',
      background: isSignup ? 'rgba(99,102,241,0.08)' : 'rgba(234,179,8,0.08)',
      border: `1px solid ${isSignup ? 'rgba(99,102,241,0.2)' : 'rgba(234,179,8,0.2)'}`,
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{isSignup ? '🔐' : '👑'}</div>
      <div style={{ fontSize: 13, color: 'var(--muted, #94a3b8)', marginBottom: 14, lineHeight: 1.4 }}>
        {message}
      </div>
      <button
        onClick={isSignup ? onSignup : onBuyTokens}
        style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: isSignup ? 'var(--violet, #8b5cf6)' : 'var(--gold, #eab308)',
          border: 'none', color: '#fff', cursor: 'pointer',
        }}
      >
        {isSignup ? '✨ Sign Up Free' : '🪙 Get Tokens'}
      </button>
    </div>
  );
}
