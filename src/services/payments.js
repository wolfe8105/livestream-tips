/**
 * PAYMENTS SERVICE
 * ================
 * Currently: Mock purchases (instant token add, no real payment)
 *
 * TO SWAP FOR PRODUCTION:
 * 
 * Option 1 — CCBill (recommended for adult content):
 *   export async function purchaseTokens(packageId) {
 *     // 1. Create a pending order on your server
 *     const order = await fetch('/api/orders', {
 *       method: 'POST',
 *       body: JSON.stringify({ packageId }),
 *       headers: { 'Authorization': `Bearer ${getToken()}` }
 *     }).then(r => r.json());
 *     
 *     // 2. Redirect to CCBill payment form
 *     window.location.href = order.ccbillPaymentUrl;
 *     // CCBill will redirect back to your callback URL after payment
 *     // Your server webhook handles the confirmation and adds tokens
 *   }
 *
 * Option 2 — Crypto (PayRam / direct wallet):
 *   export async function purchaseTokensCrypto(packageId, walletAddress) {
 *     const order = await fetch('/api/orders/crypto', {
 *       method: 'POST',
 *       body: JSON.stringify({ packageId, walletAddress }),
 *     }).then(r => r.json());
 *     return order; // { address, amount, currency, orderId }
 *   }
 */

import db from './database.js';

// Token packages — $0.10 per token
export const PACKAGES = [
  { id: 'starter',  name: 'Starter',  tokens: 100,   price: 4.99,   popular: false, icon: '💰' },
  { id: 'popular',  name: 'Popular',  tokens: 500,   price: 19.99,  popular: true,  icon: '⭐' },
  { id: 'pro',      name: 'Pro',      tokens: 1200,  price: 39.99,  popular: false, icon: '💎' },
  { id: 'whale',    name: 'Whale',    tokens: 5000,  price: 149.99, popular: false, icon: '🐋' },
];

export async function purchaseTokens(packageId) {
  /**
   * PRODUCTION: Replace with real payment flow
   * See CCBill or crypto examples above
   */
  const pkg = PACKAGES.find(p => p.id === packageId);
  if (!pkg) return { success: false, error: 'Invalid package' };

  // Mock: instantly add tokens
  const result = db.addTokens(pkg.tokens);
  return {
    success: true,
    tokens: pkg.tokens,
    newBalance: result.newBalance,
    orderId: 'mock-' + Date.now(),
  };
}

export function getPackages() {
  return PACKAGES;
}

export function checkDailyLimit(amount) {
  /**
   * PRODUCTION: Check against server-side daily spending tracker
   * const res = await fetch('/api/spending/check', { body: JSON.stringify({ amount }) });
   */
  const limit = db.getDailyLimit();
  if (limit <= 0) return { allowed: true }; // No limit set

  // For now, just check against the limit value (no daily tracking yet)
  // PRODUCTION: Track daily spending on the server
  return { allowed: true, limit, message: 'Daily limit tracking requires server' };
}
