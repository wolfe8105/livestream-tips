/**
 * AUTH SERVICE
 * ============
 * Currently: Mock authentication (always "logged in" as viewer)
 *
 * TO SWAP FOR PRODUCTION:
 * Option 1 — Firebase Auth:
 *   import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
 *   const auth = getAuth();
 *   export async function login(email, password) {
 *     const cred = await signInWithEmailAndPassword(auth, email, password);
 *     return { success: true, user: cred.user, token: await cred.user.getIdToken() };
 *   }
 *
 * Option 2 — Your own API:
 *   export async function login(email, password) {
 *     const res = await fetch('https://your-api.com/auth/login', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ email, password }),
 *     });
 *     const data = await res.json();
 *     localStorage.setItem('auth_token', data.token);
 *     return data;
 *   }
 */

// Mock user state
let currentUser = null;

export function getUser() {
  return currentUser;
}

export function getRole() {
  // Returns 'viewer' or 'performer'
  return currentUser?.role || 'viewer';
}

export function isLoggedIn() {
  return currentUser !== null;
}

export function getToken() {
  // PRODUCTION: return localStorage.getItem('auth_token');
  return null;
}

export async function login(email, password) {
  /**
   * PRODUCTION: Replace with real API call
   * const res = await fetch('/api/auth/login', { ... });
   */
  currentUser = {
    id: 'mock-user-1',
    email: email || 'viewer@example.com',
    displayName: 'Anonymous Viewer',
    role: 'viewer', // or 'performer'
  };
  return { success: true, user: currentUser };
}

export async function signup(email, password, role = 'viewer') {
  /**
   * PRODUCTION: Replace with real API call
   * const res = await fetch('/api/auth/signup', { ... });
   */
  currentUser = {
    id: 'mock-user-' + Date.now(),
    email,
    displayName: '',
    role,
  };
  return { success: true, user: currentUser };
}

export async function logout() {
  /**
   * PRODUCTION:
   * localStorage.removeItem('auth_token');
   * await fetch('/api/auth/logout', { method: 'POST' });
   */
  currentUser = null;
  return { success: true };
}

export function switchRole(role) {
  if (currentUser) {
    currentUser.role = role;
  }
  return currentUser;
}
