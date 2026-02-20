/**
 * API CLIENT
 * ===========
 * Base HTTP client for all backend communication.
 * Handles JWT tokens, auto-refresh, and demo mode fallback.
 *
 * CONFIGURATION:
 * - Set API_BASE_URL to your backend URL
 * - In demo mode (no backend), all calls gracefully fail
 *   and the app falls back to localStorage
 */

// ============================================
// CONFIG — Change this when deploying backend
// ============================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Set to false once your backend is running
let DEMO_MODE = true;

// Token storage
let accessToken = null;
let refreshToken = null;
let tokenRefreshPromise = null;

// ============================================
// TOKEN MANAGEMENT
// ============================================
export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem('sts_access_token', access);
  if (refresh) localStorage.setItem('sts_refresh_token', refresh);
}

export function getAccessToken() {
  if (!accessToken) accessToken = localStorage.getItem('sts_access_token');
  return accessToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('sts_access_token');
  localStorage.removeItem('sts_refresh_token');
}

function getRefreshToken() {
  if (!refreshToken) refreshToken = localStorage.getItem('sts_refresh_token');
  return refreshToken;
}

// ============================================
// TOKEN REFRESH
// ============================================
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Token refresh failed');
  }

  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

// ============================================
// BASE FETCH WITH AUTH
// ============================================
async function apiFetch(path, options = {}) {
  // In demo mode, don't even try to call the API
  if (DEMO_MODE) {
    return { _demo: true };
  }

  const url = `${API_BASE_URL}${path}`;
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    try {
      // Deduplicate refresh calls
      if (!tokenRefreshPromise) {
        tokenRefreshPromise = refreshAccessToken();
      }
      const newToken = await tokenRefreshPromise;
      tokenRefreshPromise = null;

      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    } catch (e) {
      tokenRefreshPromise = null;
      clearTokens();
      // Dispatch event so App.jsx can show login
      window.dispatchEvent(new CustomEvent('sts:auth:expired'));
      throw e;
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(error.error || 'API error'), {
      status: res.status,
      details: error,
    });
  }

  return res.json();
}

// ============================================
// HTTP METHODS
// ============================================
export const api = {
  get: (path) => apiFetch(path, { method: 'GET' }),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
};

// ============================================
// MODE CONTROL
// ============================================
export function setDemoMode(isDemo) {
  DEMO_MODE = isDemo;
  console.log(`[API] ${isDemo ? '🎭 Demo mode' : '🔗 Live mode'}: ${API_BASE_URL}`);
}

export function isDemoMode() {
  return DEMO_MODE;
}

// Auto-detect: try to ping the backend on load
export async function detectBackend() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      setDemoMode(false);
      console.log('[API] ✅ Backend detected — switching to live mode');
      return true;
    }
  } catch (e) {
    // Backend not available
  }
  setDemoMode(true);
  console.log('[API] ℹ️ No backend detected — running in demo mode (localStorage)');
  return false;
}

// ============================================
// WEBSOCKET
// ============================================
let ws = null;
let wsReconnectTimer = null;

export function connectWebSocket(roomId, onMessage) {
  if (DEMO_MODE) return null;

  const token = getAccessToken();
  if (!token) return null;

  const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api', '/ws');
  ws = new WebSocket(`${wsUrl}?token=${token}&room=${roomId}`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    } catch (e) {
      console.warn('[WS] Invalid message:', e);
    }
  };

  ws.onclose = () => {
    // Auto-reconnect after 3 seconds
    wsReconnectTimer = setTimeout(() => connectWebSocket(roomId, onMessage), 3000);
  };

  ws.onerror = (err) => {
    console.warn('[WS] Error:', err);
  };

  return ws;
}

export function sendWebSocketMessage(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function disconnectWebSocket() {
  clearTimeout(wsReconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
}

export default api;
