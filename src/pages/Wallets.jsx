import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import payouts, {
  PAYOUT_NETWORKS,
  validateWalletAddress,
  getVerificationStatusLabel,
  getPayoutStatusLabel,
} from '../services/payouts.js';
import { timeAgo } from '../services/helpers.js';
import db from '../services/database.js';

// ============================================
// WALLET MANAGEMENT PAGE
// ============================================
// Full add → verify → remove flow for crypto payout wallets.
// Wired to payouts.js service (works in demo mode or with backend).

export default function Wallets() {
  const navigate = useNavigate();

  // Wallet list
  const [wallets, setWallets] = useState(() => payouts.getWallets());
  const [refreshKey, setRefreshKey] = useState(0);

  // Add wallet form
  const [showAdd, setShowAdd] = useState(false);
  const [addNetwork, setAddNetwork] = useState('tron');
  const [addCurrency, setAddCurrency] = useState('USDT');
  const [addAddress, setAddAddress] = useState('');
  const [addLabel, setAddLabel] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  // Verify wallet
  const [verifyId, setVerifyId] = useState(null);
  const [verifyAmount, setVerifyAmount] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Signature verify (advanced)
  const [sigId, setSigId] = useState(null);
  const [sigChallenge, setSigChallenge] = useState('');
  const [sigInput, setSigInput] = useState('');
  const [sigError, setSigError] = useState('');

  // Remove confirm
  const [removeId, setRemoveId] = useState(null);

  // Request payout
  const [showPayout, setShowPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');
  const [requesting, setRequesting] = useState(false);

  // Payout history
  const [history, setHistory] = useState(() => payouts.getPayoutHistory());

  // Refresh wallets when state changes
  useEffect(() => {
    setWallets(payouts.getWallets());
    setHistory(payouts.getPayoutHistory());
  }, [refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  const primaryWallet = wallets.find(w => w.isPrimary) || wallets[0] || null;
  const hasVerified = wallets.some(w => w.verification?.status === 'verified');
  const earnings = db.getEarnings();
  const availableUSD = earnings.pendingUSD || (earnings.availableBalance * 0.055);

  // ============================================
  // ADD WALLET
  // ============================================
  async function handleAddWallet() {
    setAddError('');
    const validation = validateWalletAddress(addAddress, addNetwork);
    if (!validation.valid) {
      setAddError(validation.error);
      return;
    }

    setAdding(true);
    const result = await payouts.addWallet(addAddress.trim(), addNetwork, addCurrency, addLabel);
    setAdding(false);

    if (!result.success) {
      setAddError(result.error);
      return;
    }

    // Success — reset form, open verify for this wallet
    setShowAdd(false);
    setAddAddress('');
    setAddLabel('');
    setAddError('');
    setVerifyId(result.wallet.id);
    setVerifyAmount('');
    setVerifyError('');
    setVerifySuccess(result.message || '');
    refresh();
  }

  // ============================================
  // VERIFY WALLET (Micro-deposit)
  // ============================================
  async function handleVerify() {
    setVerifyError('');
    setVerifySuccess('');
    if (!verifyAmount) {
      setVerifyError('Enter the exact micro-deposit amount you received');
      return;
    }

    setVerifying(true);
    const result = await payouts.verifyWallet(verifyId, verifyAmount);
    setVerifying(false);

    if (result.success) {
      setVerifySuccess(result.message);
      setVerifyId(null);
      setVerifyAmount('');
      refresh();
    } else {
      setVerifyError(result.error);
    }
  }

  // ============================================
  // VERIFY VIA SIGNATURE (Advanced)
  // ============================================
  async function handleGetChallenge(walletId) {
    const result = await payouts.getSignatureChallenge(walletId);
    if (result.success) {
      setSigId(walletId);
      setSigChallenge(result.challenge);
      setSigInput('');
      setSigError('');
    }
  }

  async function handleSubmitSignature() {
    setSigError('');
    if (!sigInput || sigInput.length < 10) {
      setSigError('Paste the full signature from your wallet');
      return;
    }
    const result = await payouts.submitSignatureProof(sigId, sigInput);
    if (result.success) {
      setSigId(null);
      setSigChallenge('');
      setSigInput('');
      setVerifySuccess(result.message);
      refresh();
    } else {
      setSigError(result.error);
    }
  }

  // ============================================
  // RESEND MICRO-DEPOSIT
  // ============================================
  async function handleResend(walletId) {
    const result = await payouts.resendMicroDeposit(walletId);
    if (result.success) {
      setVerifySuccess(result.message);
      setVerifyError('');
      refresh();
    } else {
      setVerifyError(result.error);
    }
  }

  // ============================================
  // REMOVE WALLET
  // ============================================
  function handleRemove(walletId) {
    payouts.removeWallet(walletId);
    setRemoveId(null);
    refresh();
  }

  // ============================================
  // SET PRIMARY
  // ============================================
  function handleSetPrimary(walletId) {
    const result = payouts.setPrimaryWallet(walletId);
    if (!result.success) {
      alert(result.error);
      return;
    }
    refresh();
  }

  // ============================================
  // REQUEST PAYOUT
  // ============================================
  async function handleRequestPayout() {
    setPayoutError('');
    setPayoutSuccess('');
    const amount = parseFloat(payoutAmount);
    if (!amount || amount < 20) {
      setPayoutError('Minimum payout is $20.00');
      return;
    }

    setRequesting(true);
    const result = await payouts.requestPayout(amount);
    setRequesting(false);

    if (result.success) {
      setPayoutSuccess(result.message);
      setPayoutAmount('');
      setShowPayout(false);
      refresh();
    } else {
      if (result.requires2FA) {
        setPayoutError('2FA required — enter your code on the Compliance page first');
      } else {
        setPayoutError(result.error);
      }
    }
  }

  // ============================================
  // NETWORK HELPERS
  // ============================================
  const net = PAYOUT_NETWORKS.find(n => n.id === addNetwork);
  const networkCurrencies = net ? net.currencies : [];

  function statusColor(status) {
    return {
      verified: '#22c55e',
      pending: 'var(--gold)',
      expired: 'var(--hot)',
      failed: 'var(--accent)',
    }[status] || 'var(--muted)';
  }

  function statusBg(status) {
    return {
      verified: 'rgba(34,197,94,0.12)',
      pending: 'rgba(245,158,11,0.12)',
      expired: 'rgba(255,107,44,0.12)',
      failed: 'rgba(225,29,72,0.12)',
    }[status] || 'rgba(255,255,255,0.05)';
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="page-pad">
      {/* Header */}
      <div className="flex-between mb-20">
        <div>
          <h2 style={{ color: 'var(--cyan)', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>🔗 Wallet Management</h2>
          <p className="text-muted text-sm">Add, verify & manage payout wallets</p>
        </div>
        <button className="config-badge config-badge-violet" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => navigate('/earnings')}>
          ← Earnings
        </button>
      </div>

      {/* Success banner */}
      {verifySuccess && (
        <div style={{
          padding: 14, borderRadius: 12, marginBottom: 16,
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
          color: '#22c55e', fontSize: 13, fontWeight: 600,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>✅ {verifySuccess}</span>
          <button onClick={() => setVerifySuccess('')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Payout success banner */}
      {payoutSuccess && (
        <div style={{
          padding: 14, borderRadius: 12, marginBottom: 16,
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
          color: '#22c55e', fontSize: 13, fontWeight: 600,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>💸 {payoutSuccess}</span>
          <button onClick={() => setPayoutSuccess('')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* ============================================ */}
      {/* WALLET LIST */}
      {/* ============================================ */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-12">
          <h3 style={{ color: 'var(--cyan)', fontSize: 16, fontWeight: 800 }}>
            💳 Your Wallets ({wallets.length})
          </h3>
          <button
            onClick={() => { setShowAdd(!showAdd); setAddError(''); }}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
              color: 'var(--cyan)', cursor: 'pointer',
            }}
          >
            + Add Wallet
          </button>
        </div>

        {wallets.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--dim)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
            <div style={{ fontSize: 13 }}>No wallets configured yet</div>
            <div style={{ fontSize: 11, marginTop: 4, color: 'var(--muted)' }}>
              Add a crypto wallet to receive payouts
            </div>
          </div>
        )}

        {wallets.map(w => {
          const isVerifying = verifyId === w.id;
          const isSigning = sigId === w.id;
          const isRemoving = removeId === w.id;
          const vStatus = w.verification?.status || 'pending';
          const masked = w.address.slice(0, 8) + '...' + w.address.slice(-6);

          return (
            <div key={w.id} style={{
              padding: 14, borderRadius: 12, marginBottom: 10,
              background: w.isPrimary ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${w.isPrimary ? 'rgba(6,182,212,0.25)' : 'var(--border)'}`,
            }}>
              {/* Wallet header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--white)' }}>
                      {w.label || `${w.network.toUpperCase()} Wallet`}
                    </span>
                    {w.isPrimary && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(6,182,212,0.2)', color: 'var(--cyan)',
                      }}>PRIMARY</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {masked}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 10, color: 'var(--dim)' }}>
                    <span>{PAYOUT_NETWORKS.find(n => n.id === w.network)?.name || w.network}</span>
                    <span>•</span>
                    <span>{w.currency}</span>
                  </div>
                </div>
                <div style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: statusBg(vStatus), color: statusColor(vStatus),
                  whiteSpace: 'nowrap',
                }}>
                  {getVerificationStatusLabel(vStatus)}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {vStatus === 'pending' && (
                  <>
                    <button onClick={() => { setVerifyId(w.id); setVerifyAmount(''); setVerifyError(''); setVerifySuccess(''); }}
                      style={actionBtn('#22c55e')}>
                      Verify
                    </button>
                    <button onClick={() => handleGetChallenge(w.id)}
                      style={actionBtn('var(--cyan)')}>
                      Sign Instead
                    </button>
                    <button onClick={() => handleResend(w.id)}
                      style={actionBtn('var(--gold)')}>
                      Resend Deposit
                    </button>
                  </>
                )}
                {vStatus === 'verified' && !w.isPrimary && (
                  <button onClick={() => handleSetPrimary(w.id)}
                    style={actionBtn('var(--cyan)')}>
                    Set Primary
                  </button>
                )}
                {(vStatus === 'expired' || vStatus === 'failed') && (
                  <span style={{ fontSize: 10, color: 'var(--dim)', alignSelf: 'center' }}>
                    Remove and re-add to retry
                  </span>
                )}
                <button onClick={() => setRemoveId(w.id)}
                  style={actionBtn('var(--accent)')}>
                  Remove
                </button>
              </div>

              {/* Verify micro-deposit inline */}
              {isVerifying && vStatus === 'pending' && (
                <div style={{
                  marginTop: 12, padding: 14, borderRadius: 10,
                  background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>
                    💰 Enter Micro-Deposit Amount
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
                    We sent a small amount (between $0.05 and $0.99) to your wallet. Check your wallet and enter the exact amount below.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1.00"
                      placeholder="$0.00"
                      value={verifyAmount}
                      onChange={e => setVerifyAmount(e.target.value)}
                      className="form-input"
                      style={{ flex: 1, fontSize: 16, fontWeight: 700, textAlign: 'center' }}
                    />
                    <button onClick={handleVerify} disabled={verifying}
                      style={{
                        padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                        background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer',
                        opacity: verifying ? 0.6 : 1,
                      }}>
                      {verifying ? '...' : 'Verify'}
                    </button>
                  </div>
                  {w.verification?.attempts > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 6 }}>
                      {w.verification.maxAttempts - w.verification.attempts} attempts remaining
                    </div>
                  )}
                  {verifyError && (
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>⚠️ {verifyError}</div>
                  )}
                  <button onClick={() => setVerifyId(null)}
                    style={{ marginTop: 8, fontSize: 11, color: 'var(--dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Signature verify inline */}
              {isSigning && (
                <div style={{
                  marginTop: 12, padding: 14, borderRadius: 10,
                  background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', marginBottom: 8 }}>
                    🔐 Sign Message to Verify
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                    Open your {w.network === 'tron' ? 'TronLink' : 'MetaMask'} wallet and sign this message:
                  </div>
                  <div style={{
                    padding: 10, borderRadius: 8, fontFamily: 'monospace', fontSize: 11,
                    background: 'rgba(0,0,0,0.3)', color: 'var(--cyan)', wordBreak: 'break-all',
                    marginBottom: 10,
                  }}>
                    {sigChallenge}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Paste the signature here..."
                    value={sigInput}
                    onChange={e => setSigInput(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: 11, marginBottom: 8, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSigId(null)}
                      style={actionBtn('var(--dim)')}>
                      Cancel
                    </button>
                    <button onClick={handleSubmitSignature}
                      style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: 'var(--cyan)', color: '#000', border: 'none', cursor: 'pointer',
                      }}>
                      Submit Signature
                    </button>
                  </div>
                  {sigError && (
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>⚠️ {sigError}</div>
                  )}
                </div>
              )}

              {/* Remove confirm inline */}
              {isRemoving && (
                <div style={{
                  marginTop: 12, padding: 14, borderRadius: 10,
                  background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.2)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                    ⚠️ Remove this wallet?
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
                    {w.verification?.status === 'verified'
                      ? "This wallet is verified. Removing it means you'll need to re-add and re-verify to use it again."
                      : 'This will cancel any pending verification.'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setRemoveId(null)} style={actionBtn('var(--dim)')}>Cancel</button>
                    <button onClick={() => handleRemove(w.id)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
                      }}>
                      Yes, Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* ADD WALLET FORM */}
      {/* ============================================ */}
      {showAdd && (
        <div className="card card-surface mb-16" style={{ borderColor: 'rgba(6,182,212,0.3)' }}>
          <h3 style={{ color: 'var(--cyan)', fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
            ➕ Add Payout Wallet
          </h3>

          {/* Network picker */}
          <div className="form-group">
            <label className="form-label">Network</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PAYOUT_NETWORKS.map(n => (
                <button key={n.id} onClick={() => { setAddNetwork(n.id); setAddCurrency(n.currencies[0]); setAddError(''); }}
                  style={{
                    flex: 1, padding: 12, borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    background: addNetwork === n.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${addNetwork === n.id ? 'rgba(6,182,212,0.4)' : 'var(--border)'}`,
                    color: addNetwork === n.id ? 'var(--cyan)' : 'var(--muted)',
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{n.name}</div>
                  <div style={{ fontSize: 10, marginTop: 2, color: 'var(--dim)' }}>
                    Fee: {n.estimatedFee} • {n.estimatedTime}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Currency picker */}
          <div className="form-group">
            <label className="form-label">Currency</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {networkCurrencies.map(c => (
                <button key={c} onClick={() => setAddCurrency(c)}
                  style={{
                    padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: addCurrency === c ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${addCurrency === c ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                    color: addCurrency === c ? 'var(--gold)' : 'var(--muted)',
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet address */}
          <div className="form-group">
            <label className="form-label">Wallet Address</label>
            <input
              type="text"
              className="form-input"
              placeholder={net ? `Starts with ${net.addressPrefix}...  (${net.addressLength} chars)` : ''}
              value={addAddress}
              onChange={e => { setAddAddress(e.target.value); setAddError(''); }}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
            <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
              {net && `${net.name} addresses start with "${net.addressPrefix}" and are ${net.addressLength} characters long`}
            </div>
          </div>

          {/* Label (optional) */}
          <div className="form-group">
            <label className="form-label">Label (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. My TronLink, Main Wallet"
              value={addLabel}
              onChange={e => setAddLabel(e.target.value)}
              maxLength={30}
            />
          </div>

          {/* Info box */}
          <div style={{
            padding: 12, borderRadius: 10, marginBottom: 16,
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
            fontSize: 11, color: 'var(--muted)', lineHeight: 1.5,
          }}>
            <strong style={{ color: 'var(--gold)' }}>How verification works:</strong> We'll send a small micro-deposit
            ($0.05 – $0.99) in {addCurrency} to your wallet. Enter the exact amount to prove you own it. You have 48
            hours and 5 attempts.
          </div>

          {addError && (
            <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 12, fontWeight: 600 }}>
              ⚠️ {addError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowAdd(false); setAddError(''); }} className="btn-save" style={{ flex: 1 }}>
              Cancel
            </button>
            <button onClick={handleAddWallet} disabled={adding}
              style={{
                flex: 2, padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 800,
                background: 'linear-gradient(135deg, var(--cyan), #0891b2)',
                color: '#fff', border: 'none', cursor: 'pointer',
                opacity: adding ? 0.6 : 1,
              }}>
              {adding ? 'Adding...' : `Add & Send Micro-Deposit`}
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* REQUEST PAYOUT */}
      {/* ============================================ */}
      <div className="card card-surface mb-16" style={{
        borderColor: hasVerified ? 'rgba(34,197,94,0.3)' : 'var(--border)',
      }}>
        <div className="flex-between mb-12">
          <h3 style={{ color: '#22c55e', fontSize: 16, fontWeight: 800 }}>💸 Request Payout</h3>
          {primaryWallet && primaryWallet.verification?.status === 'verified' && (
            <span style={{ fontSize: 10, color: 'var(--cyan)' }}>
              → {primaryWallet.label || 'Primary'} ({primaryWallet.network.toUpperCase()})
            </span>
          )}
        </div>

        {!hasVerified ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--dim)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Verify at least one wallet to enable payouts</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Add a wallet above and complete the micro-deposit verification</div>
          </div>
        ) : (
          <>
            <div style={{
              padding: 14, borderRadius: 10, marginBottom: 14,
              background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(245,158,11,0.05))',
              border: '1px solid rgba(34,197,94,0.15)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 2 }}>Available Balance</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>
                ${availableUSD.toFixed ? availableUSD.toFixed(2) : Number(availableUSD).toFixed(2)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Minimum payout: $20.00
              </div>
            </div>

            {!showPayout ? (
              <button onClick={() => { setShowPayout(true); setPayoutError(''); }}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 800,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                }}>
                💸 Withdraw Funds
              </button>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="20"
                    placeholder="$20.00 minimum"
                    value={payoutAmount}
                    onChange={e => { setPayoutAmount(e.target.value); setPayoutError(''); }}
                    className="form-input form-input-gold"
                    style={{ fontSize: 18, textAlign: 'center' }}
                  />
                  <button
                    onClick={() => setPayoutAmount(Math.floor(availableUSD).toString())}
                    style={{ marginTop: 6, fontSize: 11, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Withdraw max (${Math.floor(availableUSD)})
                  </button>
                </div>

                <div style={{
                  padding: 10, borderRadius: 8, marginBottom: 14,
                  background: 'rgba(6,182,212,0.06)', fontSize: 11, color: 'var(--muted)',
                }}>
                  Payout to: <strong style={{ color: 'var(--cyan)' }}>
                    {primaryWallet.address.slice(0, 8)}...{primaryWallet.address.slice(-4)}
                  </strong> ({primaryWallet.network.toUpperCase()} • {primaryWallet.currency})
                </div>

                {payoutError && (
                  <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 10, fontWeight: 600 }}>
                    ⚠️ {payoutError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setShowPayout(false); setPayoutError(''); }} className="btn-save" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button onClick={handleRequestPayout} disabled={requesting}
                    style={{
                      flex: 2, padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 800,
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      opacity: requesting ? 0.6 : 1,
                    }}>
                    {requesting ? 'Processing...' : 'Confirm Payout'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================ */}
      {/* PAYOUT HISTORY */}
      {/* ============================================ */}
      <div className="card card-surface mb-16">
        <h3 style={{ color: 'var(--violet, var(--accent))', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
          📤 Payout History
        </h3>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--dim)', fontSize: 13 }}>
            No payouts yet
          </div>
        ) : (
          history.map(p => (
            <div key={p.id} style={{
              padding: 12, borderRadius: 10, marginBottom: 8,
              background: statusBg(p.status === 'confirmed' || p.status === 'sent' ? 'verified' : p.status === 'rejected' ? 'failed' : 'pending'),
              border: `1px solid ${statusColor(p.status === 'confirmed' || p.status === 'sent' ? 'verified' : p.status === 'rejected' ? 'failed' : 'pending')}33`,
            }}>
              <div className="flex-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: p.status === 'confirmed' || p.status === 'sent' ? '#22c55e' : 'var(--gold)' }}>
                  ${p.amountUSD?.toFixed(2) || (p.amount * 0.055).toFixed(2)}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: statusBg(p.status === 'confirmed' || p.status === 'sent' ? 'verified' : 'pending'),
                  color: statusColor(p.status === 'confirmed' || p.status === 'sent' ? 'verified' : 'pending'),
                }}>
                  {getPayoutStatusLabel(p.status)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {p.currency || 'USDT'} on {p.network || 'tron'} → {p.walletAddress || 'wallet'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
                Requested {timeAgo(p.requestedAt)}
                {p.processedAt && ` • Processed ${timeAgo(p.processedAt)}`}
              </div>
              {p.txHash && (
                <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace', marginTop: 2 }}>
                  TX: {p.txHash.slice(0, 16)}...
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info footer */}
      <div style={{
        padding: 14, borderRadius: 10,
        background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)',
        fontSize: 11, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 20,
      }}>
        <strong style={{ color: 'var(--cyan)' }}>Payout Info</strong><br />
        Payouts are sent in USDT or USDC on the Tron (TRC-20) or Polygon network.
        You earn $0.055 per token (55% payout rate). Minimum payout is $20.
        A 24-hour hold applies to new payout requests for security.
        Daily limit: $5,000.
      </div>
    </div>
  );
}

// ============================================
// STYLE HELPER
// ============================================
function actionBtn(color) {
  return {
    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`,
    color, cursor: 'pointer',
  };
}
