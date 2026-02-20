import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/database.js';
import { timeAgo } from '../services/helpers.js';

const TYPE_CONFIG = {
  tip: { icon: '🎁', color: 'var(--accent)', label: 'Tip' },
  system: { icon: '⚙️', color: 'var(--violet)', label: 'System' },
  follower: { icon: '❤️', color: 'var(--hot)', label: 'Follower' },
  payout: { icon: '💸', color: '#22c55e', label: 'Payout' },
  private: { icon: '🔒', color: 'var(--gold)', label: 'Private Show' },
  alert: { icon: '⚠️', color: 'var(--red)', label: 'Alert' },
  promo: { icon: '🎉', color: 'var(--violet)', label: 'Promo' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(db.getNotifications());
  const [filter, setFilter] = useState('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === filter);

  function markRead(id) {
    const updated = db.markNotificationRead(id);
    setNotifications(updated);
  }

  function markAllRead() {
    const updated = db.markAllNotificationsRead();
    setNotifications(updated);
  }

  function deleteNotification(id) {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    db.saveNotifications(updated);
  }

  function clearAll() {
    if (!window.confirm('Clear all notifications?')) return;
    setNotifications([]);
    db.saveNotifications([]);
  }

  function handleNotificationClick(notif) {
    if (!notif.read) markRead(notif.id);
    if (notif.link) navigate(notif.link);
  }

  return (
    <div className="page-pad">
      <div className="flex-between mb-20">
        <div>
          <h2 className="text-violet text-3xl font-black mb-4">🔔 Notifications</h2>
          <p className="text-muted text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              className="config-badge config-badge-violet"
              style={{ cursor: 'pointer', fontSize: 11 }}
              onClick={markAllRead}
            >
              ✓ Read All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'tip', label: '🎁 Tips' },
          { key: 'system', label: '⚙️ System' },
          { key: 'payout', label: '💸 Payouts' },
          { key: 'follower', label: '❤️ Followers' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: filter === f.key ? 'var(--violet)' : 'rgba(255,255,255,0.05)',
            color: filter === f.key ? '#fff' : 'var(--muted)',
            border: 'none', cursor: 'pointer',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--dim)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔕</div>
          <div style={{ fontSize: 14 }}>No notifications</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {filter !== 'all' ? 'Try a different filter' : 'You\'re all caught up!'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(notif => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  padding: 14, borderRadius: 12, cursor: notif.link ? 'pointer' : 'default',
                  background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${notif.read ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.2)'}`,
                  position: 'relative',
                }}
              >
                {!notif.read && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--violet)',
                  }} />
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${config.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {config.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: notif.read ? 600 : 800,
                      color: notif.read ? 'var(--muted)' : '#fff',
                      marginBottom: 2,
                    }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.4 }}>
                      {notif.body}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--dim)' }}>{timeAgo(notif.timestamp)}</span>
                      <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 4,
                        background: `${config.color}15`, color: config.color,
                        fontWeight: 700,
                      }}>
                        {config.label}
                      </span>
                      {notif.link && (
                        <span style={{ fontSize: 10, color: 'var(--violet)' }}>→ View</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    style={{
                      background: 'none', border: 'none', color: 'var(--dim)',
                      cursor: 'pointer', fontSize: 14, padding: '0 4px',
                      alignSelf: 'flex-start',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear All */}
      {notifications.length > 0 && (
        <button
          onClick={clearAll}
          style={{
            width: '100%', marginTop: 20, padding: 12,
            background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)',
            borderRadius: 10, color: 'var(--red)', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          🗑️ Clear All Notifications
        </button>
      )}
    </div>
  );
}
