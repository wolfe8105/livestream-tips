import React, { createContext, useState, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Browse from './pages/Browse.jsx';
import Room from './pages/Room.jsx';
import Profile from './pages/Profile.jsx';
import Tokens from './pages/Tokens.jsx';
import Dashboard from './pages/Dashboard.jsx';
import db from './services/database.js';
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
  };

  return (
    <AppContext.Provider value={value}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Browse />} />
            <Route path="/room" element={<Room />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
}
