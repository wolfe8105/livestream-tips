import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { getPackages, purchaseTokens } from '../services/payments.js';
import db from '../services/database.js';
import { timeAgo } from '../services/helpers.js';

const TYPE_LABELS = {
  purchase: { icon: '💳', label: 'Token Purchase', color: '#22c55e' },
  tip: { icon: '🎁', label: 'Tip', color: 'var(--accent)' },
  lovense: { icon: '💗', label: 'Lovense', color: '#a855f7' },
  'private-show': { icon: '🔒', label: 'Private Show', color: 'var(--gold)' },
  unknown: { icon: '🪙', label: 'Transaction', color: 'var(--muted)' },
};

export default function Tokens() {
  const { refreshBalance, balance } = useApp();
  const packages = getPackages();
  const [transactions, setTransactions] = useState(() => db.getTransactions(30));

  async function handleBuy(packageId) {
    const result = await purchaseTokens(packageId);
    if (result.success) {
      refreshBalance();
      setTransactions(db.getTransactions(30));
      alert(`Added ${result.tokens} tokens!`);
    } else {
      alert(result.error || 'Purchase failed');
    }
  }

  // Daily spending info
  const dailyLimit = db.getDailyLimit();
  let todaySpent = 0;
  if (dailyLimit > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    todaySpent = transactions
      .filter(t => t.amount < 0 && (t.timestamp || t.id) >= todayStart)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }

  return (
    <>
      <div className="page-pad">
        <h2 className="text-violet text-3xl font-black mb-4">💳 Buy Tokens</h2>
        <p className="text-muted mb-12">Tip real, verified performers — not bots</p>

        {/* Balance + spending limit bar */}
        <div className="card card-surface" style={{ padding: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="text-sm text-muted">Your Balance</div>
              <div className="text-2xl font-black text-gold">🪙 {balance.toLocaleString()}</div>
            </div>
            {dailyLimit > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div className="text-sm text-muted">Daily Spend</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: todaySpent >= dailyLimit ? 'var(--accent)' : '#22c55e' }}>
                  {todaySpent} / {dailyLimit}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="package-grid">
        {packages.map(p => (
          <div key={p.id} className={`package-card ${p.popular ? 'popular' : ''}`}>
            {p.popular && <div className="popular-badge">⭐ MOST POPULAR</div>}
            <div className="package-icon">{p.icon}</div>
            <div className="package-name">{p.name}</div>
            <div className="package-tokens">{p.tokens.toLocaleString()}</div>
            <div className="package-label">tokens</div>
            <button
              className={`buy-btn ${p.popular ? 'popular' : ''}`}
              onClick={() => handleBuy(p.id)}
            >
              BUY ${p.price}
            </button>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="page-pad" style={{ marginTop: 24 }}>
        <h3 className="text-violet text-xl font-bold mb-12">📋 Recent Activity</h3>
        {transactions.length === 0 ? (
          <div className="card card-surface" style={{ padding: 24, textAlign: 'center' }}>
            <div className="text-muted">No transactions yet</div>
          </div>
        ) : (
          <div className="flex-col-gap">
            {transactions.map(t => {
              const info = TYPE_LABELS[t.type] || TYPE_LABELS.unknown;
              const isPositive = t.amount > 0;
              return (
                <div key={t.id} className="card card-surface" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 20 }}>{info.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: info.color }}>{info.label}</div>
                      <div className="text-dim" style={{ fontSize: 11 }}>{timeAgo(t.timestamp || t.id)}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: isPositive ? '#22c55e' : 'var(--accent)' }}>
                    {isPositive ? '+' : ''}{t.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
