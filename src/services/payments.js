/**
 * PAYMENTS SERVICE — HYBRID
 * ==========================
 * Production: Creates crypto orders via API, user sends USDT/USDC
 * Demo: Instant mock token add (same as before)
 */

import { api, isDemoMode } from './api.js';
import db from './database.js';

// Token packages — $0.10 per token
export const PACKAGES = [
  { id: 'starter',  name: 'Starter',  tokens: 100,   price: 4.99,   popular: false, icon: '💰' },
  { id: 'popular',  name: 'Popular',  tokens: 500,   price: 19.99,  popular: true,  icon: '⭐' },
  { id: 'pro',      name: 'Pro',      tokens: 1200,  price: 39.99,  popular: false, icon: '💎' },
  { id: 'whale',    name: 'Whale',    tokens: 5000,  price: 149.99, popular: false, icon: '🐋' },
];

export function getPackages() {
  return PACKAGES;
}

// ============================================
// PURCHASE TOKENS
// ============================================
export async function purchaseTokens(packageId) {
  if (isDemoMode()) {
    // Demo: instant add
    const pkg = PACKAGES.find(p => p.id === packageId);
    if (!pkg) return { success: false, error: 'Invalid package' };
    const result = db.addTokens(pkg.tokens);
    return {
      success: true,
      tokens: pkg.tokens,
      newBalance: result.newBalance,
      orderId: 'demo-' + Date.now(),
    };
  }

  // Production: redirects to crypto payment flow
  // This should open the CryptoPayment component instead
  return {
    success: false,
    requiresCrypto: true,
    message: 'Use the crypto payment flow',
  };
}

// ============================================
// CRYPTO PURCHASE FLOW
// ============================================

// Get supported networks
export async function getCryptoNetworks() {
  if (isDemoMode()) {
    return {
      networks: [
        { id: 'tron', name: 'Tron (TRC-20)', currencies: ['USDT', 'USDC'], estimatedFee: '$0.50', confirmations: 20 },
        { id: 'polygon', name: 'Polygon', currencies: ['USDT', 'USDC'], estimatedFee: '$0.01', confirmations: 30 },
      ],
      packages: PACKAGES,
    };
  }
  return api.get('/crypto/networks');
}

// Create a crypto purchase order
export async function createCryptoOrder(packageId, currency = 'USDT', network = 'tron') {
  if (isDemoMode()) {
    const pkg = PACKAGES.find(p => p.id === packageId);
    return {
      orderId: 'demo-' + Date.now(),
      status: 'pending',
      package: packageId,
      tokens: pkg.tokens,
      cryptoAmount: pkg.price,
      currency,
      network,
      depositAddress: 'TDemoAddress1234567890DemoAddress',
      expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      instructions: `[DEMO] Send ${pkg.price} ${currency} to the address above.`,
    };
  }
  return api.post('/crypto/create-order', { packageId, currency, network });
}

// Check order status
export async function checkCryptoOrder(orderId) {
  if (isDemoMode()) {
    return { orderId, status: 'pending', confirmations: 0 };
  }
  return api.get(`/crypto/order/${orderId}`);
}

// Submit transaction hash
export async function submitTxHash(orderId, txHash) {
  if (isDemoMode()) {
    // In demo, just credit the tokens immediately
    const pkg = PACKAGES.find(p => p.id === 'popular'); // Default to popular
    db.addTokens(pkg.tokens);
    return { success: true, message: 'Demo: tokens credited instantly' };
  }
  return api.post(`/crypto/verify/${orderId}`, { txHash });
}

// Get order history
export async function getCryptoOrders() {
  if (isDemoMode()) {
    return { orders: [] };
  }
  return api.get('/crypto/orders');
}

// ============================================
// SEND TIP (via API)
// ============================================
export async function sendTip(performerId, amount, message = '', isAnonymous = false, streamId = null) {
  if (isDemoMode()) {
    // Demo: deduct locally
    const result = db.deductTokens(amount, 'tip');
    if (!result.success) return result;
    db.addLifetimeSpend(amount);
    return { success: true, newBalance: result.newBalance };
  }

  try {
    const data = await api.post('/tips/send', { performerId, amount, message, isAnonymous, streamId });
    // Update local cache with new balance
    db.setBalance(data.newBalance);
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// DAILY LIMIT CHECK
// ============================================
export function checkDailyLimit(amount) {
  const limit = db.getDailyLimit();
  if (limit <= 0) return { allowed: true };
  return { allowed: true, limit, message: 'Daily limit tracking requires server' };
}
