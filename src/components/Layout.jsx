import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../App.jsx';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { balance } = useApp();
  const path = location.pathname;

  // Hide nav on room page
  const showNav = path !== '/room';
  const showHeader = true;

  const navItems = [
    { path: '/', icon: '🔍', label: 'Browse' },
    { path: '/tokens', icon: '💳', label: 'Wallet' },
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  ];

  return (
    <>
      {showHeader && (
        <div className="top-header">
          <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="brand-logo">STS</div>
            <div className="brand-name">Stream<span>To</span>Stage</div>
          </div>
          <div className="token-badge" onClick={() => navigate('/tokens')}>
            🪙 {balance.toLocaleString()}
          </div>
        </div>
      )}

      <div className="page-container">
        {children}
      </div>

      {showNav && (
        <nav className="bottom-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${path === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); window.scrollTo(0, 0); }}
            >
              <div className="nav-item-icon">{item.icon}</div>
              <div>{item.label}</div>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
