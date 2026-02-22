import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../App.jsx';
import db from '../services/database.js';

// Performer-facing pages get light theme, viewer pages stay dark
const LIGHT_THEME_PAGES = [
  '/dashboard', '/golive', '/earnings', '/verification',
  '/lovense', '/notifications', '/antifraud', '/security-keys',
  '/botshield', '/wallets', '/compliance', '/admin',
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { balance, user } = useApp();
  const path = location.pathname;
  const [unreadCount, setUnreadCount] = useState(db.getUnreadCount());

  // Apply theme based on page context
  const isPerformerPage = LIGHT_THEME_PAGES.includes(path);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isPerformerPage ? 'light' : 'dark');
    return () => document.documentElement.removeAttribute('data-theme');
  }, [isPerformerPage]);

  // Refresh unread count periodically
  useEffect(() => {
    const interval = setInterval(() => setUnreadCount(db.getUnreadCount()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Also refresh when navigating
  useEffect(() => {
    setUnreadCount(db.getUnreadCount());
  }, [path]);

  // Hide nav on room page
  const showNav = path !== '/room';
  const showHeader = true;

  // Different nav items for guests vs logged-in users
  const navItems = user ? [
    { path: '/', icon: '🔍', label: 'Browse' },
    { path: '/tokens', icon: '💳', label: 'Wallet' },
    { path: '/notifications', icon: '🔔', label: 'Alerts', badge: unreadCount },
    { path: '/dashboard', icon: '👤', label: 'Dashboard' },
  ] : [
    { path: '/', icon: '🔍', label: 'Browse' },
    { path: '/clubs', icon: '🏢', label: 'Clubs' },
    { path: '/login', icon: '✨', label: 'Sign Up' },
  ];

  return (
    <>
      {showHeader && (
        <div className="top-header">
          <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="brand-logo">STS</div>
            <div className="brand-name">Stream<span>To</span>Stage</div>
          </div>
          {user ? (
            <div className="token-badge" onClick={() => navigate('/tokens')}>
              🪙 {balance.toLocaleString()}
            </div>
          ) : (
            <div className="token-badge" onClick={() => navigate('/login')} style={{ background: 'var(--violet)', cursor: 'pointer' }}>
              ✨ Sign Up
            </div>
          )}
        </div>
      )}

      <div className="page-container">
        {children}
      </div>

      {showNav && (
        <>
          <div style={{
            textAlign: 'center', padding: '12px 16px 8px',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <a href="#/terms" style={{ fontSize: 10, color: 'var(--dim)', textDecoration: 'none' }}>Terms of Service</a>
              <span style={{ fontSize: 10, color: 'var(--dim)' }}>·</span>
              <a href="#/privacy" style={{ fontSize: 10, color: 'var(--dim)', textDecoration: 'none' }}>Privacy Policy</a>
              <span style={{ fontSize: 10, color: 'var(--dim)' }}>·</span>
              <a href="#/dmca" style={{ fontSize: 10, color: 'var(--dim)', textDecoration: 'none' }}>DMCA</a>
              <span style={{ fontSize: 10, color: 'var(--dim)' }}>·</span>
              <a href="#/compliance" style={{ fontSize: 10, color: 'var(--dim)', textDecoration: 'none' }}>2257 Compliance</a>
            </div>
          </div>
          <nav className="bottom-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${path === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); window.scrollTo(0, 0); }}
              style={{ position: 'relative' }}
            >
              <div className="nav-item-icon">{item.icon}</div>
              <div>{item.label}</div>
              {item.badge > 0 && (
                <div style={{
                  position: 'absolute', top: 2, right: '50%', marginRight: -16,
                  background: 'var(--red)', color: '#fff',
                  width: 16, height: 16, borderRadius: '50%',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </button>
          ))}
        </nav>
        </>
      )}
    </>
  );
}
