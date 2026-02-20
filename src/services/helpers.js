import { CLUBS, STATE_NAMES, FIRST_NAMES, LAST_NAMES, TITLES, HOT_STATES } from '../data/constants.js';

// Seeded random for deterministic streamer state
export function seededRandom(seed) {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

// Time ago formatter
export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return min + 'm ago';
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  return days + 'd ago';
}

// Streamer cache for lazy generation
const streamerCache = {};

export function clearStreamerCache() {
  Object.keys(streamerCache).forEach(k => delete streamerCache[k]);
}

// Generate state counts (live/offline per state)
export function generateStateCounts() {
  const counts = {};
  Object.keys(CLUBS).forEach(s => {
    const n = CLUBS[s].length;
    counts[s] = {
      live: Math.floor(seededRandom(s.charCodeAt(0) * 31 + s.charCodeAt(1)) * Math.min(n, 8)),
      offline: Math.floor(seededRandom(s.charCodeAt(0) * 17) * Math.min(n * 2, 15)),
    };
  });
  return counts;
}

// Generate streamers for a specific club
export function generateStreamers(clubName, stateAbbr, counts) {
  const key = stateAbbr + ':' + clubName;
  if (streamerCache[key]) return streamerCache[key];

  const seed = clubName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = 3 + (seed % 6);
  const liveCount = Math.floor(
    seededRandom(seed + (counts[stateAbbr]?.live || 0)) * Math.min(count, 4)
  );

  const streamers = [];
  for (let i = 0; i < count; i++) {
    const fn = FIRST_NAMES[(seed + i * 7) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(seed + i * 13) % LAST_NAMES.length];
    const isLive = i < liveCount;
    const hue = (seed + i * 30) % 360;
    streamers.push({
      id: stateAbbr + '-' + clubName.replace(/[^a-zA-Z0-9]/g, '') + '-' + i,
      name: fn + ' ' + ln,
      club: clubName,
      state: stateAbbr,
      isLive,
      viewers: isLive ? 50 + Math.floor(seededRandom(seed + i * 99) * 450) : 0,
      avatar: fn[0],
      color: `hsl(${hue},60%,45%)`,
      title: TITLES[(seed + i) % TITLES.length],
    });
  }

  streamerCache[key] = streamers;
  return streamers;
}

// Get trending streamers from hot states
export function getTrendingStreamers(counts) {
  let trending = [];
  HOT_STATES.forEach(st => {
    if (!CLUBS[st]) return;
    CLUBS[st].forEach(club => {
      generateStreamers(club, st, counts).forEach(s => {
        if (s.isLive) trending.push(s);
      });
    });
  });
  trending.sort((a, b) => b.viewers - a.viewers);
  return trending.slice(0, 10);
}

// Search across states, clubs, and performers
export function searchAll(query, counts) {
  const q = query.trim().toLowerCase();
  if (!q) return { states: [], clubs: [], streamers: [] };

  const states = Object.entries(STATE_NAMES)
    .filter(([a, n]) => n.toLowerCase().includes(q) || a.toLowerCase().includes(q))
    .slice(0, 5)
    .map(([abbr, name]) => ({ abbr, name, counts: counts[abbr] || { live: 0, offline: 0 } }));

  const clubs = [];
  Object.entries(CLUBS).forEach(([st, cl]) => {
    cl.forEach(c => {
      if (c.toLowerCase().includes(q)) clubs.push({ name: c, state: st });
    });
  });

  // Search streamers from matching clubs + cached
  const streamers = [];
  clubs.slice(0, 3).forEach(cl => {
    generateStreamers(cl.name, cl.state, counts).forEach(s => {
      if (s.name.toLowerCase().includes(q)) streamers.push(s);
    });
  });
  Object.values(streamerCache).flat().forEach(s => {
    if (s.name.toLowerCase().includes(q) && !streamers.find(x => x.id === s.id)) {
      streamers.push(s);
    }
  });

  return {
    states,
    clubs: clubs.slice(0, 5),
    streamers: streamers.slice(0, 5),
  };
}
