import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Browse from './pages/Browse.jsx';
import Room from './pages/Room.jsx';
import Profile from './pages/Profile.jsx';
import Tokens from './pages/Tokens.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Verification from './pages/Verification.jsx';
import Compliance from './pages/Compliance.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import GoLive from './pages/GoLive.jsx';
import LovenseSetup from './pages/LovenseSetup.jsx';
import Earnings from './pages/Earnings.jsx';
import Notifications from './pages/Notifications.jsx';
import Antifraud from './pages/Antifraud.jsx';
import SecurityKeys from './pages/SecurityKeys.jsx';
import BotShield from './pages/BotShield.jsx';
import Wallets from './pages/Wallets.jsx';
import Clubs from './pages/Clubs.jsx';
import db from './services/database.js';
import { login, signup, logout, isLoggedIn, getUser } from './services/auth.js';
import { generateStateCounts, clearStreamerCache } from './services/helpers.js';
import { CLUBS } from './data/constants.js';

// ============================================
// GLOBAL APP CONTEXT
// Shared state accessible from any component
// ============================================
const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export default function App() {
  const [balance, setBalance] = useState(db.getBalance());
  const [counts, setCounts] = useState(() => generateStateCounts());
  const [currentStreamer, setCurrentStreamer] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [user, setUser] = useState(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem('sts_auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Re-hydrate the auth service
        login(parsed.email, '').then(() => {});
        return parsed;
      } catch { return null; }
    }
    return null;
  });

  const refreshBalance = useCallback(() => {
    setBalance(db.getBalance());
  }, []);

  const refreshCounts = useCallback(() => {
    const newCounts = {};
    Object.keys(CLUBS).forEach(s => {
      const n = CLUBS[s].length;
      newCounts[s] = {
        live: Math.floor(Math.random() * Math.min(n, 8)),
        offline: Math.floor(Math.random() * Math.min(n * 2, 15)),
      };
    });
    clearStreamerCache();
    setCounts(newCounts);
  }, []);

  async function loginUser(email, password) {
    const result = await login(email, password);
    if (result.success) {
      setUser(result.user);
      localStorage.setItem('sts_auth_user', JSON.stringify(result.user));
    }
    return result;
  }

  async function signupUser(email, password, role) {
    const result = await signup(email, password, role);
    if (result.success) {
      setUser(result.user);
      localStorage.setItem('sts_auth_user', JSON.stringify(result.user));
    }
    return result;
  }

  async function logoutUser() {
    await logout();
    setUser(null);
    localStorage.removeItem('sts_auth_user');
  }

  const value = {
    balance,
    refreshBalance,
    counts,
    setCounts,
    refreshCounts,
    currentStreamer,
    setCurrentStreamer,
    currentProfile,
    setCurrentProfile,
    user,
    loginUser,
    signupUser,
    logoutUser,
  };

  // Show login screen if not authenticated (but allow compliance page)
  if (!user) {
    return (
      <AppContext.Provider value={value}>
        <HashRouter>
          <Routes>
            <Route path="/compliance" element={<Compliance />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </HashRouter>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={value}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppContext.Provider>
  );
}

// Separate component so useLocation works inside HashRouter
function AppRoutes() {
  const location = useLocation();
  const isCompliance = location.pathname === '/compliance';

  if (isCompliance) {
    return <Compliance />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/room" element={<Room />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tokens" element={<Tokens />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/golive" element={<GoLive />} />
        <Route path="/lovense" element={<LovenseSetup />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/antifraud" element={<Antifraud />} />
        <Route path="/security-keys" element={<SecurityKeys />} />
        <Route path="/botshield" element={<BotShield />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/clubs" element={<Clubs />} />
      </Routes>
    </Layout>
  );
}
