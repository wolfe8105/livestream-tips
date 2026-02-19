import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import { STATE_NAMES } from '../data/constants.js';
import db from '../services/database.js';

export default function Profile() {
  const navigate = useNavigate();
  const { currentProfile } = useApp();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!currentProfile) navigate('/');
    else setIsFav(db.isFavorite(currentProfile.id));
  }, [currentProfile, navigate]);

  if (!currentProfile) return null;

  function toggleFavorite() {
    if (isFav) {
      db.removeFavorite(currentProfile.id);
      setIsFav(false);
    } else {
      db.addFavorite({
        id: currentProfile.id,
        name: currentProfile.name,
        avatar: currentProfile.avatar,
        color: currentProfile.color,
        club: currentProfile.club,
        state: currentProfile.state,
      });
      setIsFav(true);
    }
  }

  const p = currentProfile;
  const onlineSchedule = db.getOnlineSchedule();
  const liveSchedule = db.getLiveSchedule();

  return (
    <>
      <div className="profile-header">
        <button className="btn-back" onClick={() => navigate('/')}>←</button>
        <div className="flex-col-center" style={{ marginTop: 36 }}>
          <div className="profile-avatar" style={{ background: p.color }}>{p.avatar}</div>
          <h2 className="profile-name">{p.name}</h2>
          <div className="offline-badge"><span className="text-muted text-sm">⚫ Currently Offline</span></div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gold)' }}>
            🛡️ Verified at {p.club || 'Venue'}, {STATE_NAMES[p.state] || p.state || ''}
          </div>
          <button
            onClick={toggleFavorite}
            style={{
              marginTop: 10, padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
              background: isFav ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.06)',
              border: isFav ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              color: isFav ? 'var(--accent)' : 'var(--muted)',
              fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
            }}
          >
            {isFav ? '❤️ Favorited' : '🤍 Add to Favorites'}
          </button>
        </div>
      </div>

      <div className="page-pad">
        <div className="card card-surface mb-16">
          <h3 className="text-violet mb-16 text-xl">📅 Schedule</h3>

          <div className="mb-20">
            <div className="flex-gap mb-8"><div className="text-2xl">🟢</div><div className="text-lg font-bold">Online Hours</div></div>
            <div className="text-muted text-sm mb-8">Available for chat & private bookings</div>
            <div className="flex-col-gap">
              {onlineSchedule.length > 0 ? onlineSchedule.map(s => (
                <div key={s.id} className="profile-schedule-item profile-schedule-online">
                  <span className="text-md font-bold">{s.day}</span>
                  <span className="text-sm text-gold">{s.startTime} - {s.endTime}</span>
                </div>
              )) : <div className="text-dim text-md">No hours set</div>}
            </div>
          </div>

          <div>
            <div className="flex-gap mb-8"><div className="text-2xl">🔴</div><div className="text-lg font-bold text-red">Live Streaming</div></div>
            <div className="text-muted text-sm mb-8">Public shows & broadcasts</div>
            <div className="flex-col-gap">
              {liveSchedule.length > 0 ? liveSchedule.map(s => (
                <div key={s.id} className="profile-schedule-item profile-schedule-live">
                  <span className="text-md font-bold">{s.day}</span>
                  <span className="text-sm text-red">{s.startTime} - {s.endTime}</span>
                </div>
              )) : <div className="text-dim text-md">No hours set</div>}
            </div>
          </div>
        </div>

        <button className="btn-primary mb-12" onClick={() => alert(`📅 Book Private Show\n\n${p.name}\n\nComing soon!`)}>📅 Book Private Show</button>
        <button className="btn-pink-lg" onClick={() => alert(`💌 Send Message\n\n${p.name}\n\nComing soon!`)}>💌 Send Message</button>
      </div>
    </>
  );
}
