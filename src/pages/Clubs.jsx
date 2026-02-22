import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLUBS, STATE_NAMES } from '../data/constants.js';

// Build flat club list with disambiguation
function buildClubList() {
  const nameCount = {};
  const nameStateCount = {};

  // First pass: count occurrences
  Object.entries(CLUBS).forEach(([state, clubs]) => {
    clubs.forEach(name => {
      nameCount[name] = (nameCount[name] || 0) + 1;
      const key = `${name}|${state}`;
      nameStateCount[key] = (nameStateCount[key] || 0) + 1;
    });
  });

  // Second pass: build list with display names
  const list = [];
  Object.entries(CLUBS).forEach(([state, clubs]) => {
    clubs.forEach(name => {
      let displayName = name;
      if (nameCount[name] > 1) {
        const key = `${name}|${state}`;
        if (nameStateCount[key] > 1) {
          // Same name, same state — would need city but we don't have it yet
          displayName = `${name} — ${state}`;
        } else {
          displayName = `${name} — ${state}`;
        }
      }
      list.push({ name, displayName, state });
    });
  });

  return list;
}

const ALL_CLUBS = buildClubList();
const TOTAL = ALL_CLUBS.length;

export default function Clubs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const searchTimeout = useRef(null);

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(() => {
      const lower = q.toLowerCase();
      const results = ALL_CLUBS
        .filter(c => c.name.toLowerCase().includes(lower) || STATE_NAMES[c.state].toLowerCase().includes(lower))
        .slice(0, 15);
      setSearchResults(results);
    }, 150);
  }, []);

  const sortedStates = Object.keys(STATE_NAMES).sort((a, b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b]));

  return (
    <div className="page-pad">
      <div className="flex-between mb-12">
        <div>
          <h2 className="text-violet text-3xl font-black mb-4">🏢 Club Directory</h2>
          <p className="text-muted text-sm">{TOTAL} clubs across 50 states</p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
            padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >← Back</button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="text"
          inputMode="search"
          placeholder="Search clubs by name or state..."
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            color: '#fff', fontSize: 14,
          }}
        />
        {searchResults && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#1e293b', border: '1px solid var(--border)', borderRadius: 10,
            maxHeight: 300, overflowY: 'auto', marginTop: 4,
          }}>
            {searchResults.length > 0 ? searchResults.map((c, i) => (
              <div
                key={`${c.state}-${c.name}-${i}`}
                onClick={() => { setSearchQuery(''); setSearchResults(null); setSelectedState(c.state); }}
                style={{
                  padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.displayName}</div>
                  <div style={{ fontSize: 10, color: 'var(--dim)' }}>{STATE_NAMES[c.state]}</div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--violet)', fontWeight: 700 }}>{c.state}</div>
              </div>
            )) : (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--dim)', fontSize: 12 }}>No clubs found</div>
            )}
          </div>
        )}
      </div>

      {/* Selected State Expanded */}
      {selectedState && (
        <div className="card card-surface mb-16" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
          <div className="flex-between mb-12">
            <div>
              <h3 className="text-violet text-lg font-black">{STATE_NAMES[selectedState]}</h3>
              <p className="text-dim text-xs">{CLUBS[selectedState]?.length || 0} clubs</p>
            </div>
            <button
              onClick={() => setSelectedState(null)}
              style={{
                background: 'rgba(225,29,72,0.1)', border: 'none', color: 'var(--red)',
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >✕ Close</button>
          </div>
          {(CLUBS[selectedState] || []).map((club, i) => {
            // Check if this club name exists in other states for disambiguation
            const dupeStates = Object.entries(CLUBS).filter(([st, clubs]) => st !== selectedState && clubs.includes(club));
            return (
              <div
                key={i}
                style={{
                  padding: '12px 0', borderBottom: i < (CLUBS[selectedState]?.length || 0) - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>🏢</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{club}</div>
                  {dupeStates.length > 0 && (
                    <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 1 }}>
                      Also in: {dupeStates.map(([st]) => st).join(', ')}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: 'var(--violet)',
                  background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: 4,
                }}>🛡️ Verified</div>
              </div>
            );
          })}
        </div>
      )}

      {/* State Grid */}
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', marginBottom: 10 }}>
        {selectedState ? 'All States' : 'Select a State'}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
      }}>
        {sortedStates.map(abbr => {
          const clubCount = CLUBS[abbr]?.length || 0;
          const isSelected = selectedState === abbr;
          return (
            <div
              key={abbr}
              onClick={() => setSelectedState(isSelected ? null : abbr)}
              style={{
                padding: 14, borderRadius: 12, cursor: 'pointer',
                background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: isSelected ? '1px solid var(--violet)' : '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: isSelected ? 'var(--violet)' : '#fff' }}>
                {STATE_NAMES[abbr]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4 }}>
                {clubCount} club{clubCount !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
