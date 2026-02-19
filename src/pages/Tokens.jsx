import React from 'react';
import { useApp } from '../App.jsx';
import { getPackages, purchaseTokens } from '../services/payments.js';

export default function Tokens() {
  const { refreshBalance } = useApp();
  const packages = getPackages();

  async function handleBuy(packageId) {
    const result = await purchaseTokens(packageId);
    if (result.success) {
      refreshBalance();
      alert(`Added ${result.tokens} tokens!`);
    } else {
      alert(result.error || 'Purchase failed');
    }
  }

  return (
    <>
      <div className="page-pad">
        <h2 className="text-violet text-3xl font-black mb-4">💳 Buy Tokens</h2>
        <p className="text-muted mb-20">Tip real, verified performers — not bots</p>
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
    </>
  );
}
