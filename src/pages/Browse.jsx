import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import { CLUBS, STATE_NAMES } from '../data/constants.js';
import { generateStreamers, getTrendingStreamers, searchAll, seededRandom } from '../services/helpers.js';

export default function Browse() {
  const navigate = useNavigate();
  const { counts, refreshCounts, setCurrentStreamer, setCurrentProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsData, setSearchResultsData] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const searchTimeout = useRef(null);

  // Auto-refresh counts every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshCounts, 30000);
    return () => clearInterval(interval);
  }, [refreshCounts]);

  // Debounced search
  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setShowSearchResults(false); return; }
    searchTimeout.current = setTimeout(() => {
      const results = searchAll(q, counts);
      setSearchResultsData(results);
      setShowSearchResults(true);
    }, 150);
  }, [counts]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.search-container')) setShowSearchResults(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Trending streamers
  const trending = getTrendingStreamers(counts);

  // Sorted states (live first, then alphabetical)
  const sortedStates = Object.keys(STATE_NAMES).sort((a, b) => {
    const al = counts[a]?.live || 0;
    const bl = counts[b]?.live || 0;
    if (al > 0 && bl === 0) return -1;
    if (bl > 0 && al === 0) return 1;
    return STATE_NAMES[a].localeCompare(STATE_NAMES[b]);
  });

  const totalLive = Object.values(counts).reduce((s, c) => s + c.live, 0);
  const totalOffline = Object.values(counts).reduce((s, c) => s + c.offline, 0);

  // Navigate to room
  function goToRoom(streamer) {
    setCurrentStreamer(streamer);
    navigate('/room');
  }

  // Navigate to profile
  function goToProfile(streamer) {
    setCurrentProfile({
      name: streamer.name,
      avatar: streamer.avatar,
      color: streamer.color,
      club: streamer.club,
      state: streamer.state,
    });
    navigate('/profile');
  }

  // Open state sheet
  function openState(abbr) {
    setSearchQuery('');
    setShowSearchResults(false);
    setSelectedClub(null);
    setSelectedState(abbr);
  }

  // Open club sheet
  function openClub(clubName, state) {
    setSelectedClub({ name: clubName, state });
  }

  function closeSheets() {
    setSelectedState(null);
    setSelectedClub(null);
  }

  // Get clubs data for selected state
  function getClubsForState(abbr) {
    const clubs = CLUBS[abbr] || [];
    const c = counts[abbr] || { live: 0, offline: 0 };
    return clubs.map((club, i) => ({
      name: club,
      isLive: i < c.live,
      viewers: i < c.live ? 50 + Math.floor(seededRandom(club.length * 31 + i) * 450) : 0,
    }));
  }

  // Get streamers for selected club
  function getStreamersForClub(clubName, state) {
    return generateStreamers(clubName, state, counts);
  }

  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">🛡️ 100% Verified Real Performers</div>
        <h1>The Only <span className="accent">Proof</span><br />It's <span className="accent">Real</span></h1>
        <p>Every performer works at a real venue you can walk into. No AI. No filters. No fakes. See them live on stage — that's the guarantee.</p>
      </div>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          className="search-bar"
          inputMode="search"
          placeholder="Search states, clubs, performers..."
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {showSearchResults && searchResultsData && (
          <div className="search-results" style={{ display: 'block' }}>
            {searchResultsData.states.length > 0 && (
              <>
                <div className="search-category">🗺️ States</div>
                {searchResultsData.states.map(s => (
                  <div key={s.abbr} className="search-item" onClick={() => { openState(s.abbr); setShowSearchResults(false); }}>
                    <div className="search-icon">🗺️</div>
                    <div className="search-item-info">
                      <div className="search-item-name">{s.name}</div>
                      <div className="search-item-meta">{s.counts.live} live • {s.counts.offline} offline</div>
                    </div>
                    {s.counts.live > 0 && <div className="search-live-badge">LIVE</div>}
                  </div>
                ))}
              </>
            )}
            {searchResultsData.clubs.length > 0 && (
              <>
                <div className="search-category">🏢 Clubs</div>
                {searchResultsData.clubs.map((cl, i) => (
                  <div key={i} className="search-item" onClick={() => { openClub(cl.name, cl.state); setShowSearchResults(false); }}>
                    <div className="search-icon">🏢</div>
                    <div className="search-item-info">
                      <div className="search-item-name">{cl.name}</div>
                      <div className="search-item-meta">{STATE_NAMES[cl.state]}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {searchResultsData.streamers.length > 0 && (
              <>
                <div className="search-category">👤 Performers</div>
                {searchResultsData.streamers.map(s => (
                  <div key={s.id} className="search-item" onClick={() => {
                    setShowSearchResults(false);
                    setSearchQuery('');
                    if (s.isLive) goToRoom(s);
                    else goToProfile(s);
                  }}>
                    <div className="search-icon">👤</div>
                    <div className="search-item-info">
                      <div className="search-item-name">{s.name}</div>
                      <div className="search-item-meta">{s.club}, {STATE_NAMES[s.state]}</div>
                    </div>
                    {s.isLive && <div className="search-live-badge">LIVE</div>}
                  </div>
                ))}
              </>
            )}
            {searchResultsData.states.length === 0 && searchResultsData.clubs.length === 0 && searchResultsData.streamers.length === 0 && (
              <div className="no-results">No results found</div>
            )}
          </div>
        )}
      </div>

      {/* Trust Banner */}
      <div className="trust-banner">
        <div style={{ fontSize: '24px' }}>🛡️</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>Verified Performers Only</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Every performer is verified at a real venue — 667 clubs, 50 states</div>
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div className="trending">
          <div className="trending-header">
            <span style={{ color: 'var(--red)' }}>🔴</span>
            <h3>Live Right Now</h3>
          </div>
          <div className="trending-scroll">
            {trending.map(s => (
              <div key={s.id} className="trending-card" onClick={() => goToRoom(s)}>
                <div className="trending-thumb" style={{ background: s.color }}>
                  {s.avatar}
                  <div className="trending-live">LIVE</div>
                </div>
                <div className="trending-info">
                  <div className="trending-name">{s.name}</div>
                  <div className="trending-viewers">👁️ {s.viewers}</div>
                  <div className="trending-club">🛡️ {s.club}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="how-it-works">
        <div className="how-grid">
          <div className="how-step">
            <div className="how-icon">📱</div>
            <div className="how-label">Stream</div>
            <div className="how-desc">Watch her live from anywhere</div>
          </div>
          <div className="how-step" style={{ borderColor: 'rgba(225,29,72,0.3)' }}>
            <div className="how-icon">🛡️</div>
            <div className="how-label">Verified</div>
            <div className="how-desc">Verified at a real club</div>
          </div>
          <div className="how-step">
            <div className="how-icon">🎟️</div>
            <div className="how-label">Visit</div>
            <div className="how-desc">Go see them on stage IRL</div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat"><div className="stat-dot" style={{ background: 'var(--red)' }} /><span>{totalLive} Live</span></div>
        <div className="stat"><div className="stat-dot" style={{ background: 'var(--dim)' }} /><span>{totalOffline} Offline</span></div>
        <div className="stat clubs">667 Clubs</div>
      </div>

      {/* State Grid */}
      <div className="section-label">All States</div>
      <div className="state-grid">
        {sortedStates.map(abbr => {
          const c = counts[abbr] || { live: 0, offline: 0 };
          const clubCount = CLUBS[abbr]?.length || 0;
          return (
            <div
              key={abbr}
              className={`state-card ${c.live > 0 ? 'has-live' : ''}`}
              onClick={() => openState(abbr)}
            >
              <div className="state-name">{STATE_NAMES[abbr]}</div>
              <div className="state-counts">
                {c.live > 0 && <div className="count-item"><span className="count-live">🔴 {c.live}</span></div>}
                {c.offline > 0 && <div className="count-item"><span className="count-offline">⚫ {c.offline}</span></div>}
              </div>
              <div className="state-clubs">{clubCount} clubs</div>
            </div>
          );
        })}
      </div>

      {/* State Sheet (clubs) */}
      <div className={`overlay ${selectedState ? 'visible' : ''}`} onClick={closeSheets} />
      <div className={`bottom-sheet ${selectedState && !selectedClub ? 'open' : ''}`}>
        {selectedState && (
          <>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h2 className="sheet-title">{STATE_NAMES[selectedState]}</h2>
              <p className="sheet-subtitle">
                {CLUBS[selectedState]?.length || 0} clubs • {counts[selectedState]?.live || 0} live
              </p>
            </div>
            <div className="sheet-content">
              {getClubsForState(selectedState).map((club, i) => (
                <div
                  key={i}
                  className={`sheet-item ${club.isLive ? 'live' : ''}`}
                  onClick={() => openClub(club.name, selectedState)}
                >
                  <div>
                    <div className={`item-name ${club.isLive ? 'live' : ''}`}>{club.name}</div>
                    {!club.isLive && <div className="item-status">Offline</div>}
                  </div>
                  {club.isLive && (
                    <div className="live-badge">
                      <div className="pulse-dot" />
                      <span>{club.viewers} watching</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Streamer Sheet (for a club) */}
      <div className={`bottom-sheet ${selectedClub ? 'open' : ''}`}>
        {selectedClub && (() => {
          const streamers = getStreamersForClub(selectedClub.name, selectedClub.state);
          const live = streamers.filter(s => s.isLive);
          const offline = streamers.filter(s => !s.isLive);
          return (
            <>
              <div className="sheet-handle" />
              <div className="sheet-header" style={{ display: 'flex', alignItems: 'center' }}>
                <button className="back-btn-sheet" onClick={() => setSelectedClub(null)}>←</button>
                <div>
                  <h2 className="sheet-title">{selectedClub.name}</h2>
                  <p className="sheet-subtitle">
                    {STATE_NAMES[selectedClub.state]} • {live.length} live • {offline.length} offline
                  </p>
                </div>
              </div>
              <div className="sheet-content">
                {live.length > 0 && (
                  <>
                    <div className="section-header live">🔴 LIVE NOW ({live.length})</div>
                    {live.map(s => (
                      <div key={s.id} className="sheet-item live" onClick={() => { closeSheets(); goToRoom(s); }}>
                        <div className="streamer-item">
                          <div className="streamer-avatar" style={{ background: s.color }}>{s.avatar}</div>
                          <div className="streamer-info">
                            <div className="streamer-name live">{s.name}</div>
                            <div className="streamer-viewers">👁️ {s.viewers} watching</div>
                          </div>
                        </div>
                        <div style={{ color: 'var(--red)', fontSize: 16 }}>▶</div>
                      </div>
                    ))}
                  </>
                )}
                {offline.length > 0 && (
                  <>
                    <div className="section-header offline">⚫ OFFLINE ({offline.length})</div>
                    {offline.map(s => (
                      <div key={s.id} className="sheet-item" style={{ opacity: 0.6 }} onClick={() => { closeSheets(); goToProfile(s); }}>
                        <div className="streamer-item">
                          <div className="streamer-avatar offline" style={{ background: s.color }}>{s.avatar}</div>
                          <div className="streamer-info">
                            <div className="streamer-name offline">{s.name}</div>
                            <div className="streamer-viewers" style={{ color: 'var(--dim)' }}>View profile</div>
                          </div>
                        </div>
                        <div style={{ color: 'var(--dim)' }}>👤</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </>
  );
}
