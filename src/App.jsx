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
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import DMCAPolicy from './pages/DMCAPolicy.jsx';
import AgeGate, { isAgeVerified } from './components/AgeGate.jsx';
import CookieConsent from './components/CookieConsent.jsx';
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
  const [ageVerified, setAgeVerified] = useState(() => isAgeVerified());
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

  // Legal pages accessible without age gate or login
  // Age gate shown before login/main app
  if (!ageVerified) {
    return (
      <AppContext.Provider value={value}>
        <HashRouter>
          <AgeGateRoutes onVerified={() => setAgeVerified(true)} />
        </HashRouter>
      </AppContext.Provider>
    );
  }

  // After age gate: allow guest browsing (Browse + Room in view-only mode)
  // Other pages require login
  return (
    <AppContext.Provider value={value}>
      <HashRouter>
        <AppRoutes />
        <CookieConsent />
      </HashRouter>
    </AppContext.Provider>
  );
}

// Age gate with legal page bypass
function AgeGateRoutes({ onVerified }) {
  const location = useLocation();
  const legalPaths = ['/compliance', '/terms', '/privacy', '/dmca'];
  const isLegal = legalPaths.includes(location.pathname);

  if (isLegal) {
    return (
      <Routes>
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/dmca" element={<DMCAPolicy />} />
      </Routes>
    );
  }

  return <AgeGate onVerified={onVerified} />;
}

// Separate component so useLocation works inside HashRouter
function AppRoutes() {
  const location = useLocation();
  const { user } = useApp();
  const legalPaths = ['/compliance', '/terms', '/privacy', '/dmca'];
  const isLegal = legalPaths.includes(location.pathname);

  if (isLegal) {
    return (
      <Routes>
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/dmca" element={<DMCAPolicy />} />
      </Routes>
    );
  }

  // Guest-accessible pages (Browse, Room, Profile, Clubs, Login)
  // All other pages require login
  const guestPages = ['/', '/room', '/profile', '/clubs', '/login'];
  const isGuestPage = guestPages.includes(location.pathname);

  if (!user && !isGuestPage) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/room" element={<Room />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/login" element={<Login />} />
        {/* Protected routes — require login */}
        <Route path="/tokens" element={user ? <Tokens /> : <Login />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Login />} />
        <Route path="/verification" element={user ? <Verification /> : <Login />} />
        <Route path="/admin" element={user ? <Admin /> : <Login />} />
        <Route path="/golive" element={user ? <GoLive /> : <Login />} />
        <Route path="/lovense" element={user ? <LovenseSetup /> : <Login />} />
        <Route path="/earnings" element={user ? <Earnings /> : <Login />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Login />} />
        <Route path="/antifraud" element={user ? <Antifraud /> : <Login />} />
        <Route path="/security-keys" element={user ? <SecurityKeys /> : <Login />} />
        <Route path="/botshield" element={user ? <BotShield /> : <Login />} />
        <Route path="/wallets" element={user ? <Wallets /> : <Login />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/dmca" element={<DMCAPolicy />} />
      </Routes>
    </Layout>
  );
}
