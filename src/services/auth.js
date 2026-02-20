/**
 * AUTH SERVICE
 * ============
 * Hybrid: Uses real API when backend is available, falls back to demo mode.
 * 
 * Production: POST /api/auth/login → JWT → stored in api.js
 * Demo: Mock login, always succeeds
 */

import { api, setTokens, clearTokens, isDemoMode } from './api.js';

// Current user (cached from API or mock)
let currentUser = null;

export function getUser() {
  return currentUser;
}

export function getRole() {
  return currentUser?.role || 'viewer';
}

export function isLoggedIn() {
  return currentUser !== null;
}

export function getToken() {
  // Used by components that need raw JWT
  return localStorage.getItem('sts_access_token');
}

// ============================================
// LOGIN
// ============================================
export async function login(email, password) {
  if (isDemoMode()) {
    // Demo mode — instant mock login
    currentUser = {
      id: 'demo-user-1',
      email: email || 'viewer@demo.com',
      displayName: 'Demo Viewer',
      role: 'viewer',
      balance: 250,
    };
    return { success: true, user: currentUser };
  }

  // Real API login
  try {
    const data = await api.post('/auth/login', { email, password });

    if (data.requires2FA) {
      return {
        success: true,
        requires2FA: true,
        method: data.method,
        tempToken: data.tempToken,
      };
    }

    setTokens(data.accessToken, data.refreshToken);
    currentUser = data.user;
    return { success: true, user: currentUser };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// 2FA VERIFICATION (completes login)
// ============================================
export async function verify2FA(tempToken, code) {
  if (isDemoMode()) {
    return { success: true, user: currentUser };
  }

  try {
    const data = await api.post('/auth/verify-2fa', { tempToken, code });
    setTokens(data.accessToken, data.refreshToken);
    currentUser = data.user;
    return { success: true, user: currentUser };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// SIGNUP
// ============================================
export async function signup(email, password, role = 'viewer') {
  if (isDemoMode()) {
    currentUser = {
      id: 'demo-user-' + Date.now(),
      email,
      displayName: '',
      role,
      balance: 250,
    };
    return { success: true, user: currentUser };
  }

  try {
    const data = await api.post('/auth/signup', { email, password, role });
    setTokens(data.accessToken, data.refreshToken);
    currentUser = data.user;
    return { success: true, user: currentUser };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// LOGOUT
// ============================================
export async function logout() {
  if (!isDemoMode()) {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore — clear local state regardless
    }
  }

  clearTokens();
  currentUser = null;
  return { success: true };
}

// ============================================
// FETCH CURRENT USER (on page load)
// ============================================
export async function fetchCurrentUser() {
  if (isDemoMode()) {
    return currentUser;
  }

  // Check if we have a stored token
  const token = localStorage.getItem('sts_access_token');
  if (!token) return null;

  try {
    const data = await api.get('/auth/me');
    currentUser = {
      id: data.id,
      email: data.email,
      role: data.role,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      balance: data.balance,
      lifetimePurchased: data.lifetimePurchased,
      lifetimeSpent: data.lifetimeSpent,
      dailyLimit: data.dailyLimit,
    };
    return currentUser;
  } catch (e) {
    clearTokens();
    currentUser = null;
    return null;
  }
}

// ============================================
// UPDATE PROFILE
// ============================================
export async function updateProfile(updates) {
  if (isDemoMode()) {
    if (updates.displayName !== undefined) currentUser.displayName = updates.displayName;
    return { success: true };
  }

  try {
    await api.put('/auth/me', updates);
    if (updates.displayName !== undefined) currentUser.displayName = updates.displayName;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// CHANGE PASSWORD
// ============================================
export async function changePassword(currentPassword, newPassword) {
  if (isDemoMode()) {
    return { success: true };
  }

  try {
    await api.post('/auth/change-password', { currentPassword, newPassword });
    clearTokens();
    currentUser = null;
    return { success: true, message: 'Password changed. Please login again.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// SWITCH ROLE (works in both modes)
// ============================================
export async function switchRole(role) {
  if (isDemoMode()) {
    if (currentUser) currentUser.role = role;
    return currentUser;
  }

  try {
    const data = await api.post('/auth/switch-role', { role });
    setTokens(data.accessToken, data.refreshToken);
    if (currentUser) currentUser.role = role;
    return currentUser;
  } catch (err) {
    // Fallback: just switch locally
    if (currentUser) currentUser.role = role;
    return currentUser;
  }
}
