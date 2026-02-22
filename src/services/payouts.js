/**
 * PAYOUTS SERVICE — Wallet Verification + Withdrawal
 * ====================================================
 * Handles crypto wallet management, micro-deposit verification,
 * and payout requests for performers.
 *
 * WALLET VERIFICATION FLOW:
 * 1. Performer adds wallet address (USDT/USDC on Tron or Polygon)
 * 2. System sends random micro-deposit ($0.05–$0.99)
 * 3. Performer enters the exact amount received
 * 4. Match = wallet verified, payouts enabled to that address
 * 5. Verification expires after 48 hours if not completed
 * 6. Changing wallet address requires re-verification
 *
 * ALTERNATIVE (advanced users):
 * - Message signing: performer signs a challenge string with their
 *   wallet's private key — cryptographic proof of ownership, instant,
 *   no cost. Available as opt-in for crypto-savvy performers.
 */

import { api, isDemoMode } from './api.js';
import db from './database.js';

// ============================================
// CONSTANTS
// ============================================
const MICRO_DEPOSIT_MIN = 0.05;
const MICRO_DEPOSIT_MAX = 0.99;
const VERIFICATION_EXPIRY_HOURS = 48;
const MAX_VERIFY_ATTEMPTS = 5;

// Supported payout networks
export const PAYOUT_NETWORKS = [
  {
    id: 'tron',
    name: 'Tron (TRC-20)',
    currencies: ['USDT', 'USDC'],
    addressPrefix: 'T',
    addressLength: 34,
    estimatedFee: '$0.50',
    estimatedTime: '1-5 minutes',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    currencies: ['USDT', 'USDC'],
    addressPrefix: '0x',
    addressLength: 42,
    estimatedFee: '$0.01',
    estimatedTime: '2-5 minutes',
  },
];

// ============================================
// WALLET ADDRESS VALIDATION
// ============================================

/**
 * Basic format validation for wallet addresses.
 * Not a checksum verify — just catches obvious typos.
 */
export function validateWalletAddress(address, network) {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Wallet address is required' };
  }

  const trimmed = address.trim();
  const net = PAYOUT_NETWORKS.find(n => n.id === network);

  if (!net) {
    return { valid: false, error: 'Unsupported network' };
  }

  // Check prefix
  if (!trimmed.startsWith(net.addressPrefix)) {
    return { valid: false, error: `${net.name} addresses must start with "${net.addressPrefix}"` };
  }

  // Check length
  if (trimmed.length !== net.addressLength) {
    return { valid: false, error: `${net.name} addresses must be ${net.addressLength} characters (got ${trimmed.length})` };
  }

  // Check valid characters (base58 for Tron, hex for Polygon)
  if (network === 'tron') {
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)) {
      return { valid: false, error: 'Invalid Tron address format' };
    }
  } else if (network === 'polygon') {
    if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
      return { valid: false, error: 'Invalid Polygon address format' };
    }
  }

  return { valid: true, address: trimmed };
}

// ============================================
// GET PERFORMER'S SAVED WALLETS
// ============================================

export function getWallets() {
  return db.getPayoutWallets();
}

export function getPrimaryWallet() {
  const wallets = db.getPayoutWallets();
  return wallets.find(w => w.isPrimary) || wallets[0] || null;
}

// ============================================
// ADD WALLET — Step 1: Submit address
// ============================================

/**
 * Add a new payout wallet. Triggers micro-deposit verification.
 * Returns the wallet record with pending verification status.
 */
export async function addWallet(address, network, currency = 'USDT', label = '') {
  // Validate address format
  const validation = validateWalletAddress(address, network);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Check for duplicate
  const existing = db.getPayoutWallets();
  const duplicate = existing.find(
    w => w.address.toLowerCase() === validation.address.toLowerCase() && w.network === network
  );
  if (duplicate) {
    return { success: false, error: 'This wallet address is already saved' };
  }

  if (isDemoMode()) {
    // Demo: create wallet locally with pending verification
    const microAmount = generateMicroDepositAmount();
    const wallet = {
      id: 'wallet_' + Date.now(),
      address: validation.address,
      network,
      currency,
      label: label || `${network.toUpperCase()} Wallet`,
      isPrimary: existing.length === 0,
      verification: {
        status: 'pending',            // pending | verified | expired | failed
        microDepositAmount: microAmount,
        microDepositTxHash: null,
        sentAt: Date.now(),
        expiresAt: Date.now() + (VERIFICATION_EXPIRY_HOURS * 3600000),
        attempts: 0,
        maxAttempts: MAX_VERIFY_ATTEMPTS,
        verifiedAt: null,
      },
      addedAt: Date.now(),
      lastUsedAt: null,
    };

    existing.push(wallet);
    db.savePayoutWallets(existing);

    // Log it
    db.addPayoutVerificationLog({
      type: 'wallet_added',
      walletId: wallet.id,
      address: maskAddress(wallet.address),
      network,
      microDeposit: microAmount,
    });

    return {
      success: true,
      wallet,
      message: `We've sent $${microAmount.toFixed(2)} ${currency} to your wallet. Enter the exact amount to verify ownership.`,
    };
  }

  // Production: API creates the wallet and sends the micro-deposit
  try {
    const result = await api.post('/payouts/wallets', {
      address: validation.address,
      network,
      currency,
      label,
    });

    // Cache locally
    existing.push(result.wallet);
    db.savePayoutWallets(existing);

    db.addPayoutVerificationLog({
      type: 'wallet_added',
      walletId: result.wallet.id,
      address: maskAddress(validation.address),
      network,
    });

    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// VERIFY WALLET — Step 2: Confirm micro-deposit amount
// ============================================

/**
 * Performer enters the exact micro-deposit amount they received.
 * Must match within $0.001 tolerance (rounding differences).
 */
export async function verifyWallet(walletId, enteredAmount) {
  const wallets = db.getPayoutWallets();
  const wallet = wallets.find(w => w.id === walletId);

  if (!wallet) {
    return { success: false, error: 'Wallet not found' };
  }

  if (wallet.verification.status === 'verified') {
    return { success: true, message: 'Wallet is already verified' };
  }

  if (wallet.verification.status === 'expired') {
    return { success: false, error: 'Verification expired. Please remove and re-add this wallet.' };
  }

  if (wallet.verification.status === 'failed') {
    return { success: false, error: 'Too many failed attempts. Please remove and re-add this wallet.' };
  }

  // Check expiration
  if (Date.now() > wallet.verification.expiresAt) {
    wallet.verification.status = 'expired';
    db.savePayoutWallets(wallets);
    db.addPayoutVerificationLog({
      type: 'verification_expired',
      walletId,
      address: maskAddress(wallet.address),
    });
    return { success: false, error: 'Verification expired. Please remove and re-add this wallet.' };
  }

  if (isDemoMode()) {
    // Demo: check locally
    const amount = parseFloat(enteredAmount);
    if (isNaN(amount)) {
      return { success: false, error: 'Please enter a valid number' };
    }

    wallet.verification.attempts += 1;

    // Tolerance of $0.001 for rounding
    const match = Math.abs(amount - wallet.verification.microDepositAmount) < 0.001;

    if (match) {
      wallet.verification.status = 'verified';
      wallet.verification.verifiedAt = Date.now();
      db.savePayoutWallets(wallets);

      db.addPayoutVerificationLog({
        type: 'wallet_verified',
        walletId,
        address: maskAddress(wallet.address),
        network: wallet.network,
        attemptsUsed: wallet.verification.attempts,
      });

      return {
        success: true,
        message: 'Wallet verified! You can now receive payouts to this address.',
      };
    }

    // Wrong amount
    const remaining = MAX_VERIFY_ATTEMPTS - wallet.verification.attempts;

    if (remaining <= 0) {
      wallet.verification.status = 'failed';
      db.savePayoutWallets(wallets);

      db.addPayoutVerificationLog({
        type: 'verification_failed',
        walletId,
        address: maskAddress(wallet.address),
        reason: 'max_attempts_exceeded',
      });

      return {
        success: false,
        error: 'Too many incorrect attempts. Please remove this wallet and try again.',
        attemptsRemaining: 0,
      };
    }

    db.savePayoutWallets(wallets);

    db.addPayoutVerificationLog({
      type: 'verification_attempt',
      walletId,
      address: maskAddress(wallet.address),
      attempt: wallet.verification.attempts,
      enteredAmount: amount,
    });

    return {
      success: false,
      error: `Incorrect amount. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      attemptsRemaining: remaining,
    };
  }

  // Production: verify via API
  try {
    const result = await api.post(`/payouts/wallets/${walletId}/verify`, {
      amount: parseFloat(enteredAmount),
    });

    // Update local cache
    if (result.verified) {
      wallet.verification.status = 'verified';
      wallet.verification.verifiedAt = Date.now();
    } else {
      wallet.verification.attempts = result.attempts || wallet.verification.attempts + 1;
      if (result.failed) wallet.verification.status = 'failed';
    }
    db.savePayoutWallets(wallets);

    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// VERIFY WALLET VIA SIGNATURE (Advanced)
// ============================================

/**
 * Alternative: performer signs a challenge message with their wallet.
 * Instant, free, but requires crypto knowledge.
 *
 * Flow:
 * 1. getSignatureChallenge(walletId) → returns challenge string
 * 2. Performer signs it in TronLink/MetaMask
 * 3. submitSignatureProof(walletId, signature) → verified
 */
export async function getSignatureChallenge(walletId) {
  const wallets = db.getPayoutWallets();
  const wallet = wallets.find(w => w.id === walletId);
  if (!wallet) return { success: false, error: 'Wallet not found' };

  if (isDemoMode()) {
    const challenge = `StreamToStage-Verify-${walletId}-${Date.now()}`;
    wallet.verification.signatureChallenge = challenge;
    db.savePayoutWallets(wallets);
    return {
      success: true,
      challenge,
      instructions: `Sign this message in your ${wallet.network === 'tron' ? 'TronLink' : 'MetaMask'} wallet:`,
    };
  }

  try {
    return await api.post(`/payouts/wallets/${walletId}/challenge`, {});
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function submitSignatureProof(walletId, signature) {
  const wallets = db.getPayoutWallets();
  const wallet = wallets.find(w => w.id === walletId);
  if (!wallet) return { success: false, error: 'Wallet not found' };

  if (isDemoMode()) {
    // Demo: accept any non-empty signature
    if (!signature || signature.length < 10) {
      return { success: false, error: 'Invalid signature' };
    }

    wallet.verification.status = 'verified';
    wallet.verification.verifiedAt = Date.now();
    wallet.verification.method = 'signature';
    db.savePayoutWallets(wallets);

    db.addPayoutVerificationLog({
      type: 'wallet_verified_signature',
      walletId,
      address: maskAddress(wallet.address),
      network: wallet.network,
    });

    return {
      success: true,
      message: 'Wallet verified via signature! Payouts enabled.',
    };
  }

  try {
    const result = await api.post(`/payouts/wallets/${walletId}/verify-signature`, { signature });
    if (result.verified) {
      wallet.verification.status = 'verified';
      wallet.verification.verifiedAt = Date.now();
      wallet.verification.method = 'signature';
      db.savePayoutWallets(wallets);
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// RESEND MICRO-DEPOSIT
// ============================================

export async function resendMicroDeposit(walletId) {
  const wallets = db.getPayoutWallets();
  const wallet = wallets.find(w => w.id === walletId);
  if (!wallet) return { success: false, error: 'Wallet not found' };

  if (wallet.verification.status === 'verified') {
    return { success: false, error: 'Wallet is already verified' };
  }

  if (isDemoMode()) {
    const newAmount = generateMicroDepositAmount();
    wallet.verification.microDepositAmount = newAmount;
    wallet.verification.sentAt = Date.now();
    wallet.verification.expiresAt = Date.now() + (VERIFICATION_EXPIRY_HOURS * 3600000);
    wallet.verification.attempts = 0;
    wallet.verification.status = 'pending';
    db.savePayoutWallets(wallets);

    db.addPayoutVerificationLog({
      type: 'micro_deposit_resent',
      walletId,
      address: maskAddress(wallet.address),
      newAmount,
    });

    return {
      success: true,
      message: `New micro-deposit of $${newAmount.toFixed(2)} sent. Previous attempts reset.`,
    };
  }

  try {
    const result = await api.post(`/payouts/wallets/${walletId}/resend`, {});
    if (result.success) {
      wallet.verification.sentAt = Date.now();
      wallet.verification.expiresAt = Date.now() + (VERIFICATION_EXPIRY_HOURS * 3600000);
      wallet.verification.attempts = 0;
      wallet.verification.status = 'pending';
      db.savePayoutWallets(wallets);
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// REMOVE WALLET
// ============================================

export function removeWallet(walletId) {
  let wallets = db.getPayoutWallets();
  const wallet = wallets.find(w => w.id === walletId);
  if (!wallet) return { success: false, error: 'Wallet not found' };

  wallets = wallets.filter(w => w.id !== walletId);

  // If we removed the primary, promote the next one
  if (wallet.isPrimary && wallets.length > 0) {
    wallets[0].isPrimary = true;
  }

  db.savePayoutWallets(wallets);

  db.addPayoutVerificationLog({
    type: 'wallet_removed',
    walletId,
    address: maskAddress(wallet.address),
    network: wallet.network,
  });

  if (!isDemoMode()) {
    api.delete(`/payouts/wallets/${walletId}`).catch(() => {});
  }

  return { success: true };
}

// ============================================
// SET PRIMARY WALLET
// ============================================

export function setPrimaryWallet(walletId) {
  const wallets = db.getPayoutWallets();
  const wallet = wallets.find(w => w.id === walletId);
  if (!wallet) return { success: false, error: 'Wallet not found' };

  if (wallet.verification.status !== 'verified') {
    return { success: false, error: 'Only verified wallets can be set as primary' };
  }

  wallets.forEach(w => (w.isPrimary = w.id === walletId));
  db.savePayoutWallets(wallets);

  if (!isDemoMode()) {
    api.put(`/payouts/wallets/${walletId}/primary`, {}).catch(() => {});
  }

  return { success: true };
}

// ============================================
// REQUEST PAYOUT
// ============================================

/**
 * Request a withdrawal to the performer's verified primary wallet.
 * Enforces:
 *  - Wallet must be verified
 *  - Minimum $20 payout
 *  - Hold period from payout verification settings
 *  - Daily payout limit
 *  - 2FA if enforced for payouts
 */
export async function requestPayout(amountUSD, twoFactorCode = null) {
  const primaryWallet = getPrimaryWallet();
  if (!primaryWallet) {
    return { success: false, error: 'No payout wallet configured. Add a wallet first.' };
  }

  if (primaryWallet.verification.status !== 'verified') {
    return { success: false, error: 'Your payout wallet is not verified. Complete verification first.' };
  }

  if (amountUSD < 20) {
    return { success: false, error: 'Minimum payout is $20.00' };
  }

  // Check earnings
  const earnings = db.getEarnings();
  if (amountUSD > earnings.pendingUSD) {
    return { success: false, error: `Insufficient balance. Available: $${earnings.pendingUSD.toFixed(2)}` };
  }

  // Check daily limit
  const settings = db.getPayoutVerificationSettings();
  const todayPayouts = db.getPayoutHistory().filter(p => {
    return p.requestedAt > (Date.now() - 86400000) && p.status !== 'rejected';
  });
  const todayTotal = todayPayouts.reduce((sum, p) => sum + p.amountUSD, 0);
  if (settings.maxDailyUsd > 0 && (todayTotal + amountUSD) > settings.maxDailyUsd) {
    return {
      success: false,
      error: `Daily payout limit is $${settings.maxDailyUsd}. Already requested: $${todayTotal.toFixed(2)} today.`,
    };
  }

  // Check 2FA requirement
  const twoFa = db.getTwoFactorSettings();
  if (twoFa.isEnabled && twoFa.enforcePayout && !twoFactorCode) {
    return { success: false, requires2FA: true, error: 'Two-factor authentication required for payouts' };
  }

  if (isDemoMode()) {
    // Demo: create payout request locally
    const payout = {
      id: 'payout_' + Date.now(),
      amountUSD,
      amountTokens: Math.round(amountUSD / 0.055),
      currency: primaryWallet.currency,
      network: primaryWallet.network,
      walletAddress: primaryWallet.address,
      walletId: primaryWallet.id,
      status: settings.holdHours > 0 ? 'held' : 'processing',
      holdUntil: settings.holdHours > 0 ? Date.now() + (settings.holdHours * 3600000) : null,
      requestedAt: Date.now(),
      processedAt: null,
      txHash: null,
      flag: amountUSD >= settings.flagThresholdUsd ? 'high_value' : null,
    };

    const history = db.getPayoutHistory();
    history.unshift(payout);
    db.savePayoutHistory(history);

    // Deduct from pending
    earnings.pendingPayout -= Math.round(amountUSD / 0.055);
    earnings.pendingUSD -= amountUSD;
    db.saveEarnings(earnings);

    db.addPayoutVerificationLog({
      type: 'payout_requested',
      payoutId: payout.id,
      amountUSD,
      wallet: maskAddress(primaryWallet.address),
      status: payout.status,
      flag: payout.flag,
    });

    return {
      success: true,
      payout,
      message: payout.status === 'held'
        ? `Payout of $${amountUSD.toFixed(2)} is held for ${settings.holdHours} hours before processing.`
        : `Payout of $${amountUSD.toFixed(2)} is being processed.`,
    };
  }

  // Production: API request
  try {
    const result = await api.post('/payouts/request', {
      amountUSD,
      walletId: primaryWallet.id,
      twoFactorCode,
    });

    if (result.success) {
      // Update local cache
      const history = db.getPayoutHistory();
      history.unshift(result.payout);
      db.savePayoutHistory(history);

      earnings.pendingUSD -= amountUSD;
      db.saveEarnings(earnings);
    }

    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// PAYOUT HISTORY
// ============================================

export function getPayoutHistory() {
  return db.getPayoutHistory();
}

export async function refreshPayoutHistory() {
  if (isDemoMode()) return getPayoutHistory();

  try {
    const result = await api.get('/payouts/history');
    db.savePayoutHistory(result.payouts || []);
    return result.payouts;
  } catch (err) {
    return getPayoutHistory(); // Fallback to cache
  }
}

// ============================================
// PAYOUT STATUS HELPERS
// ============================================

export function getPayoutStatusLabel(status) {
  const labels = {
    held: '⏳ On Hold',
    processing: '🔄 Processing',
    sent: '✅ Sent',
    confirmed: '✅ Confirmed',
    rejected: '❌ Rejected',
    cancelled: '🚫 Cancelled',
  };
  return labels[status] || status;
}

export function getVerificationStatusLabel(status) {
  const labels = {
    pending: '🟡 Pending Verification',
    verified: '✅ Verified',
    expired: '⏰ Expired',
    failed: '❌ Failed',
  };
  return labels[status] || status;
}

// ============================================
// HELPERS
// ============================================

function generateMicroDepositAmount() {
  // Random amount between $0.05 and $0.99, to 2 decimal places
  return Math.round((MICRO_DEPOSIT_MIN + Math.random() * (MICRO_DEPOSIT_MAX - MICRO_DEPOSIT_MIN)) * 100) / 100;
}

function maskAddress(address) {
  if (!address || address.length < 10) return address;
  return address.slice(0, 6) + '...' + address.slice(-4);
}

export default {
  // Wallet management
  getWallets,
  getPrimaryWallet,
  addWallet,
  removeWallet,
  setPrimaryWallet,
  PAYOUT_NETWORKS,

  // Verification
  verifyWallet,
  resendMicroDeposit,
  getSignatureChallenge,
  submitSignatureProof,
  validateWalletAddress,

  // Payouts
  requestPayout,
  getPayoutHistory,
  refreshPayoutHistory,

  // Helpers
  getPayoutStatusLabel,
  getVerificationStatusLabel,
};
