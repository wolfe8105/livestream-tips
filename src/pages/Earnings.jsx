import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/database.js';
import { timeAgo } from '../services/helpers.js';

const PAYOUT_METHODS = [
  { id: 'ach', name: 'ACH Direct Deposit', icon: '🏦', fee: '0%', time: '2-3 business days', min: 500 },
  { id: 'wire', name: 'Wire Transfer', icon: '💸', fee: '$25 flat', time: '1-2 business days', min: 1000 },
  { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: '₿', fee: '1%', time: '< 1 hour', min: 200 },
  { id: 'usdc', name: 'USDC (Ethereum)', icon: '💎', fee: '0.5% + gas', time: '< 30 minutes', min: 200 },
  { id: 'check', name: 'Physical Check', icon: '✉️', fee: '$5 flat', time: '5-7 business days', min: 500 },
];

export default function Earnings() {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(db.getEarnings());
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showPayoutSetup, setShowPayoutSetup] = useState(false);
  const [filter, setFilter] = useState('all');
  const [payoutDetails, setPayoutDetails] = useState({
    bankName: '', accountNumber: '', routingNumber: '',
    btcAddress: '', usdcAddress: '',
    checkName: '', checkAddress: '',
  });

  const availableUSD = (earnings.availableBalance * 0.055).toFixed(2);
  const thisMonthUSD = (earnings.thisMonth * 0.055).toFixed(2);
  const lastMonthUSD = (earnings.lastMonth * 0.055).toFixed(2);
  const lifetimeUSD = (earnings.lifetimeEarnings * 0.055).toFixed(2);

  const filteredLog = filter === 'all'
    ? earnings.earningsLog
    : earnings.earningsLog.filter(e => e.type === filter);

  const typeIcons = {
    tip: '🎁', lovense: '💗', 'private-show': '🔒',
  };
  const typeColors = {
    tip: 'var(--accent)', lovense: 'var(--hot)', 'private-show': 'var(--gold)',
  };

  function requestPayout() {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < earnings.minimumPayout) {
      alert(`Minimum payout is ${earnings.minimumPayout} tokens ($${(earnings.minimumPayout * 0.055).toFixed(2)})`);
      return;
    }
    if (amount > earnings.availableBalance) {
      alert('Insufficient available balance');
      return;
    }
    if (!selectedMethod) {
      alert('Please select a payout method');
      return;
    }

    const method = PAYOUT_METHODS.find(m => m.id === selectedMethod);
    const updated = {
      ...earnings,
      availableBalance: earnings.availableBalance - amount,
      pendingPayout: earnings.pendingPayout + amount,
      payoutHistory: [
        {
          id: 'p-' + Date.now(),
          amount,
          method: method.name,
          status: 'pending',
          requestedAt: Date.now(),
          completedAt: null,
          reference: 'PAY-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + amount,
        },
        ...earnings.payoutHistory,
      ],
    };
    setEarnings(updated);
    db.saveEarnings(updated);
    setShowWithdraw(false);
    setWithdrawAmount('');
    alert(`✅ Payout of ${amount} tokens ($${(amount * 0.055).toFixed(2)}) requested via ${method.name}!`);
  }

  return (
    <div className="page-pad">
      <div className="flex-between mb-20">
        <div>
          <h2 className="text-gold text-3xl font-black mb-4">💰 Earnings</h2>
          <p className="text-muted text-sm">Your revenue & payouts</p>
        </div>
        <button className="config-badge config-badge-violet" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
      </div>

      {/* Balance Card */}
      <div className="card mb-16" style={{
        padding: 20, borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(225,29,72,0.1))',
        border: '1px solid rgba(245,158,11,0.3)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Available Balance</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--gold)' }}>
          ${availableUSD}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          {earnings.availableBalance.toLocaleString()} tokens
        </div>
        {earnings.pendingPayout > 0 && (
          <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 12 }}>
            ⏳ Pending payout: {earnings.pendingPayout.toLocaleString()} tokens (${(earnings.pendingPayout * 0.055).toFixed(2)})
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/wallets')}
            style={{
              flex: 1, padding: 14, borderRadius: 12,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', fontWeight: 800, fontSize: 14,
              border: 'none', cursor: 'pointer',
            }}
          >
            💸 Withdraw Funds
          </button>
          <button
            onClick={() => navigate('/wallets')}
            style={{
              padding: 14, borderRadius: 12,
              background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
              color: 'var(--cyan)', fontWeight: 800, fontSize: 13,
              cursor: 'pointer',
            }}
          >
            🔗 Wallets
          </button>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="card card-surface mb-16" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <h3 className="text-lg mb-12" style={{ color: '#22c55e' }}>💸 Request Payout</h3>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Amount (tokens)</label>
            <input
              type="number"
              className="form-input form-input-gold"
              placeholder={`Min ${earnings.minimumPayout} tokens`}
              value={withdrawAmount}
              min={earnings.minimumPayout}
              max={earnings.availableBalance}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            {withdrawAmount && (
              <div className="hint" style={{ color: 'var(--gold)' }}>
                = ${(parseInt(withdrawAmount || 0) * 0.055).toFixed(2)} USD (55% payout rate)
              </div>
            )}
            <button
              style={{ marginTop: 6, fontSize: 11, color: 'var(--violet)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setWithdrawAmount(earnings.availableBalance.toString())}
            >
              Withdraw all ({earnings.availableBalance.toLocaleString()} tokens)
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Payout Method</label>
            {PAYOUT_METHODS.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 12, borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  background: selectedMethod === m.id ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedMethod === m.id ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Fee: {m.fee} • {m.time}</div>
                  </div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${selectedMethod === m.id ? '#22c55e' : 'var(--dim)'}`,
                  background: selectedMethod === m.id ? '#22c55e' : 'transparent',
                }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-save" style={{ flex: 1 }} onClick={() => setShowWithdraw(false)}>Cancel</button>
            <button
              onClick={requestPayout}
              style={{
                flex: 2, padding: 14, borderRadius: 12,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff', fontWeight: 800, fontSize: 14,
                border: 'none', cursor: 'pointer',
              }}
            >
              Confirm Payout
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid-2col mb-16">
        <div className="card card-surface text-center" style={{ padding: 14 }}>
          <div className="text-xl font-black text-gold">${thisMonthUSD}</div>
          <div className="text-xs text-muted mt-4">This Month</div>
        </div>
        <div className="card card-surface text-center" style={{ padding: 14 }}>
          <div className="text-xl font-black text-muted">${lastMonthUSD}</div>
          <div className="text-xs text-muted mt-4">Last Month</div>
        </div>
      </div>
      <div className="card card-surface text-center mb-16" style={{ padding: 14 }}>
        <div className="text-2xl font-black text-violet">${lifetimeUSD}</div>
        <div className="text-xs text-muted mt-4">Lifetime Earnings ({earnings.lifetimeEarnings.toLocaleString()} tokens)</div>
      </div>

      {/* Revenue Breakdown */}
      <div className="card card-surface mb-16">
        <h3 className="text-violet text-lg mb-12">📊 Revenue Breakdown</h3>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12 }}>Token to USD: $0.055 per token (55% payout rate)</div>
        {(() => {
          const tips = earnings.earningsLog.filter(e => e.type === 'tip');
          const lovense = earnings.earningsLog.filter(e => e.type === 'lovense');
          const privates = earnings.earningsLog.filter(e => e.type === 'private-show');
          const tipTotal = tips.reduce((s, e) => s + e.performerCut, 0);
          const lovTotal = lovense.reduce((s, e) => s + e.performerCut, 0);
          const privTotal = privates.reduce((s, e) => s + e.performerCut, 0);
          const total = tipTotal + lovTotal + privTotal || 1;
          return (
            <>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>🎁 Tips ({tips.length})</span>
                  <span style={{ color: 'var(--accent)' }}>${tipTotal.toFixed(2)} ({Math.round(tipTotal / total * 100)}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ width: `${tipTotal / total * 100}%`, height: '100%', borderRadius: 3, background: 'var(--accent)' }} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>💗 Lovense ({lovense.length})</span>
                  <span style={{ color: 'var(--hot)' }}>${lovTotal.toFixed(2)} ({Math.round(lovTotal / total * 100)}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ width: `${lovTotal / total * 100}%`, height: '100%', borderRadius: 3, background: 'var(--hot)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>🔒 Private Shows ({privates.length})</span>
                  <span style={{ color: 'var(--gold)' }}>${privTotal.toFixed(2)} ({Math.round(privTotal / total * 100)}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ width: `${privTotal / total * 100}%`, height: '100%', borderRadius: 3, background: 'var(--gold)' }} />
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Earnings Log */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-12">
          <h3 className="text-gold text-lg">📋 Earnings Log</h3>
          <span className="text-dim text-sm">{filteredLog.length} entries</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {['all', 'tip', 'lovense', 'private-show'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#fff' : 'var(--muted)',
              border: 'none', cursor: 'pointer',
            }}>
              {f === 'all' ? 'All' : f === 'tip' ? '🎁 Tips' : f === 'lovense' ? '💗 Lovense' : '🔒 Private'}
            </button>
          ))}
        </div>

        {filteredLog.map(entry => (
          <div key={entry.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{typeIcons[entry.type]}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {entry.type === 'tip' ? 'Tip' : entry.type === 'lovense' ? 'Lovense' : 'Private Show'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--dim)' }}>from {entry.from} • {timeAgo(entry.timestamp)}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: typeColors[entry.type] }}>
                +{entry.amount} tokens
              </div>
              <div style={{ fontSize: 10, color: '#22c55e' }}>
                you earn ${entry.performerCut.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payout History */}
      <div className="card card-surface mb-16">
        <h3 className="text-violet text-lg mb-12">📤 Payout History</h3>
        {earnings.payoutHistory.map(p => (
          <div key={p.id} style={{
            padding: 12, borderRadius: 10, marginBottom: 8,
            background: p.status === 'completed' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${p.status === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: p.status === 'completed' ? '#22c55e' : 'var(--gold)' }}>
                ${(p.amount * 0.055).toFixed(2)}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                background: p.status === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                color: p.status === 'completed' ? '#22c55e' : 'var(--gold)',
              }}>
                {p.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {p.method} • {p.amount.toLocaleString()} tokens
            </div>
            <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
              Requested {timeAgo(p.requestedAt)}
              {p.completedAt && ` • Completed ${timeAgo(p.completedAt)}`}
            </div>
            <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace' }}>{p.reference}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
