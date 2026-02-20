/**
 * DATABASE SERVICE — HYBRID
 * ==========================
 * Same synchronous interface as before (all pages work unchanged).
 * 
 * HOW IT WORKS:
 * - Reads: Return from in-memory cache (instant, synchronous)
 * - Writes: Update cache immediately + fire async API call in background
 * - On login: Fetch all user data from API → populate cache
 * - Fallback: If API unavailable, uses localStorage (demo mode)
 *
 * PAGES DO NOT NEED TO CHANGE. They still call db.getBalance(), db.getTipButtons(), etc.
 */

import { api, isDemoMode } from './api.js';

class Database {
  constructor() {
    // In-memory cache — this is what pages read from (synchronous)
    this._cache = {};
    this._initialized = false;
    this.initializeDefaults();
  }

  // ============================================
  // STORAGE HELPERS — HYBRID
  // ============================================
  _get(key) {
    // First check in-memory cache
    if (this._cache[key] !== undefined) return this._cache[key];
    // Fallback to localStorage
    try {
      const val = localStorage.getItem(key);
      if (val !== null) this._cache[key] = val; // Populate cache
      return val;
    } catch (e) { return null; }
  }

  _set(key, val) {
    // Always update cache immediately (synchronous for UI)
    this._cache[key] = val;
    // Also persist to localStorage as backup
    try { localStorage.setItem(key, val); } catch (e) {}
  }

  _del(key) {
    delete this._cache[key];
    try { localStorage.removeItem(key); } catch (e) {}
  }

  // ============================================
  // SYNC FROM API (called after login)
  // ============================================
  async syncFromApi() {
    if (isDemoMode()) return;

    try {
      // Fetch user data and populate cache
      const [wallet, profile, verification, earnings] = await Promise.allSettled([
        api.get('/wallet/balance'),
        api.get('/performer/profile').catch(() => null),
        api.get('/performer/verification').catch(() => null),
        api.get('/performer/earnings').catch(() => null),
      ]);

      // Wallet
      if (wallet.status === 'fulfilled' && wallet.value) {
        const w = wallet.value;
        this._set('livestream_balance', String(w.balance || 0));
        this._set('sts_daily_limit', String(w.dailyLimit || 0));
      }

      // Performer profile
      if (profile.status === 'fulfilled' && profile.value && profile.value.user_id) {
        const p = profile.value;
        if (p.tip_buttons) this._set('livestream_tip_buttons', JSON.stringify(p.tip_buttons));
        if (p.lovense_levels) this._set('livestream_lovense_levels', JSON.stringify(p.lovense_levels));
        if (p.online_schedule) this._set('livestream_online_schedule', JSON.stringify(p.online_schedule));
        if (p.live_schedule) this._set('livestream_live_schedule', JSON.stringify(p.live_schedule));
        if (p.private_show_settings) this._set('livestream_private_settings', JSON.stringify(p.private_show_settings));
        if (p.stream_settings) this._set('sts_stream_settings', JSON.stringify(p.stream_settings));
        if (p.lovense_settings) this._set('sts_lovense_settings', JSON.stringify(p.lovense_settings));
        if (p.stage_name) this._set('sts_display_name', p.stage_name);
      }

      // Verification
      if (verification.status === 'fulfilled' && verification.value) {
        this._set('sts_verification', JSON.stringify(verification.value));
      }

      console.log('[DB] ✅ Synced from API');
    } catch (err) {
      console.warn('[DB] API sync failed, using cached data:', err.message);
    }
  }

  // ============================================
  // BACKGROUND API WRITE (fire and forget)
  // ============================================
  _apiWrite(method, path, data) {
    if (isDemoMode()) return;
    // Fire async, don't block the UI
    api[method](path, data).catch(err => {
      console.warn(`[DB] Background write failed: ${path}`, err.message);
    });
  }

  // ============================================
  // DEFAULTS
  // ============================================
  initializeDefaults() {
    if (!this._get('livestream_initialized')) {
      this.setBalance(250);
      this.saveTipButtons([
        { icon: '🎁', label: 'Small', amount: 10 },
        { icon: '💖', label: 'Medium', amount: 50 },
        { icon: '💝', label: 'Big', amount: 100 },
        { icon: '🐋', label: 'Whale', amount: 500 },
      ]);
      this.saveLovenseLevels([
        { id: 1, icon: '💗', label: 'Low Vibe', tokens: 15, duration: 10 },
        { id: 2, icon: '💖', label: 'Medium Vibe', tokens: 30, duration: 15 },
        { id: 3, icon: '💝', label: 'High Vibe', tokens: 60, duration: 20 },
        { id: 4, icon: '🔥', label: 'Ultra Vibe', tokens: 100, duration: 30 },
      ]);
      this.saveOnlineSchedule([
        { id: 1, day: 'Monday', startTime: '18:00', endTime: '23:00' },
        { id: 2, day: 'Wednesday', startTime: '19:00', endTime: '00:00' },
        { id: 3, day: 'Friday', startTime: '20:00', endTime: '02:00' },
      ]);
      this.saveLiveSchedule([
        { id: 1, day: 'Monday', startTime: '20:00', endTime: '22:00' },
        { id: 2, day: 'Friday', startTime: '21:00', endTime: '23:00' },
      ]);
      this.savePrivateShowSettings({
        tokensPerMin: 60, minDuration: 10,
        extensions: [
          { minutes: 5, tokens: 250 },
          { minutes: 10, tokens: 450 },
          { minutes: 15, tokens: 650 },
        ],
      });
      this._set('livestream_initialized', 'true');
    }
  }

  // ============================================
  // BALANCE / WALLET
  // ============================================
  getBalance() {
    const val = this._get('livestream_balance');
    return val ? parseInt(val, 10) : 250;
  }

  setBalance(amount) {
    this._set('livestream_balance', amount.toString());
  }

  addTokens(amount) {
    const current = this.getBalance();
    this.setBalance(current + amount);
    this.addTransaction({ type: 'purchase', amount, timestamp: Date.now() });
    return { success: true, newBalance: current + amount };
  }

  deductTokens(amount, reason = 'unknown') {
    const current = this.getBalance();
    if (current < amount) {
      return { success: false, error: 'Insufficient balance' };
    }
    this.setBalance(current - amount);
    this.addTransaction({ type: reason, amount: -amount, timestamp: Date.now() });

    // Sync tip to API if it's a tip
    if (reason === 'tip' || reason === 'lovense' || reason === 'private-show') {
      // The tip API call is handled by the component via payments.js
    }

    return { success: true, newBalance: current - amount };
  }

  // ============================================
  // TIP BUTTONS
  // ============================================
  getTipButtons() {
    const stored = this._get('livestream_tip_buttons');
    return stored ? JSON.parse(stored) : [];
  }

  saveTipButtons(buttons) {
    this._set('livestream_tip_buttons', JSON.stringify(buttons));
    this._apiWrite('put', '/performer/profile', { tipButtons: buttons });
  }

  // ============================================
  // LOVENSE LEVELS
  // ============================================
  getLovenseLevels() {
    const stored = this._get('livestream_lovense_levels');
    return stored ? JSON.parse(stored) : [];
  }

  saveLovenseLevels(levels) {
    this._set('livestream_lovense_levels', JSON.stringify(levels));
    this._apiWrite('put', '/performer/profile', { lovenseLevels: levels });
  }

  // ============================================
  // SCHEDULES
  // ============================================
  getOnlineSchedule() {
    const stored = this._get('livestream_online_schedule');
    return stored ? JSON.parse(stored) : [];
  }

  saveOnlineSchedule(schedule) {
    this._set('livestream_online_schedule', JSON.stringify(schedule));
    this._apiWrite('put', '/performer/profile', { onlineSchedule: schedule });
  }

  getLiveSchedule() {
    const stored = this._get('livestream_live_schedule');
    return stored ? JSON.parse(stored) : [];
  }

  saveLiveSchedule(schedule) {
    this._set('livestream_live_schedule', JSON.stringify(schedule));
    this._apiWrite('put', '/performer/profile', { liveSchedule: schedule });
  }

  // ============================================
  // PRIVATE SHOW SETTINGS
  // ============================================
  getPrivateShowSettings() {
    const stored = this._get('livestream_private_settings');
    return stored ? JSON.parse(stored) : {
      tokensPerMin: 60, minDuration: 10,
      extensions: [
        { minutes: 5, tokens: 250 },
        { minutes: 10, tokens: 450 },
        { minutes: 15, tokens: 650 },
      ],
    };
  }

  savePrivateShowSettings(settings) {
    this._set('livestream_private_settings', JSON.stringify(settings));
    this._apiWrite('put', '/performer/profile', { privateShowSettings: settings });
  }

  // ============================================
  // TRANSACTIONS
  // ============================================
  getTransactions(limit = 50) {
    const stored = this._get('livestream_transactions');
    const transactions = stored ? JSON.parse(stored) : [];
    return transactions.slice(0, limit);
  }

  addTransaction(transaction) {
    const stored = this._get('livestream_transactions');
    const transactions = stored ? JSON.parse(stored) : [];
    transactions.unshift({ id: Date.now(), ...transaction });
    this._set('livestream_transactions', JSON.stringify(transactions.slice(0, 100)));
  }

  // ============================================
  // VIEWER SETTINGS
  // ============================================
  getDisplayName() { return this._get('sts_display_name') || ''; }
  setDisplayName(name) {
    this._set('sts_display_name', name);
    this._apiWrite('put', '/auth/me', { displayName: name });
  }

  getDailyLimit() {
    const val = this._get('sts_daily_limit');
    return val ? parseInt(val, 10) : 0;
  }

  setDailyLimit(limit) {
    this._set('sts_daily_limit', limit.toString());
    this._apiWrite('put', '/wallet/daily-limit', { limit });
  }

  // ============================================
  // VERIFICATION
  // ============================================
  getVerification() {
    const stored = this._get('sts_verification');
    return stored ? JSON.parse(stored) : {
      status: 'not_started', step: 0, submittedAt: null, reviewedAt: null, rejectionReason: null,
      identity: { legalFirstName: '', legalLastName: '', dateOfBirth: '', stageNames: '', idType: '', idUploaded: false, selfieUploaded: false },
      venue: { clubName: '', clubState: '', managerName: '', managerEmail: '', managerPhone: '', venueConfirmed: false },
      compliance: { custodianAcknowledged: false, termsAccepted: false, ageConfirmed: false },
    };
  }

  saveVerification(data) {
    this._set('sts_verification', JSON.stringify(data));
    this._apiWrite('put', '/performer/verification', data);
  }

  // ============================================
  // ADMIN — VERIFICATION REVIEW QUEUE
  // ============================================
  getReviewQueue() {
    const stored = this._get('sts_admin_queue');
    return stored ? JSON.parse(stored) : [
      { id: 'rev-1', performerName: 'Jessica M.', email: 'jessica@example.com', clubName: 'The Diamond Lounge', clubState: 'NV', submittedAt: Date.now() - 86400000, status: 'pending_review', idType: 'drivers_license', idUploaded: true, selfieUploaded: true },
      { id: 'rev-2', performerName: 'Ashley T.', email: 'ashley@example.com', clubName: 'Sapphire Club', clubState: 'NY', submittedAt: Date.now() - 172800000, status: 'pending_review', idType: 'passport', idUploaded: true, selfieUploaded: true },
      { id: 'rev-3', performerName: 'Crystal W.', email: 'crystal@example.com', clubName: 'Scores', clubState: 'NJ', submittedAt: Date.now() - 259200000, status: 'pending_review', idType: 'state_id', idUploaded: true, selfieUploaded: false },
    ];
  }

  saveReviewQueue(queue) { this._set('sts_admin_queue', JSON.stringify(queue)); }

  updateReviewItem(id, updates) {
    const queue = this.getReviewQueue();
    const idx = queue.findIndex(q => q.id === id);
    if (idx >= 0) {
      queue[idx] = { ...queue[idx], ...updates };
      this.saveReviewQueue(queue);
    }
    return queue;
  }

  // ============================================
  // FAVORITES / FOLLOWING / SUBSCRIPTIONS
  // ============================================
  getFavorites() {
    const stored = this._get('sts_favorites');
    return stored ? JSON.parse(stored) : [];
  }

  addFavorite(streamer) {
    const favs = this.getFavorites();
    if (!favs.find(f => f.id === streamer.id)) {
      favs.push(streamer);
      this._set('sts_favorites', JSON.stringify(favs));
      this._apiWrite('post', `/performer/favorites/${streamer.id}`);
    }
  }

  removeFavorite(streamerId) {
    const favs = this.getFavorites().filter(f => f.id !== streamerId);
    this._set('sts_favorites', JSON.stringify(favs));
    this._apiWrite('delete', `/performer/favorites/${streamerId}`);
  }

  isFavorite(streamerId) {
    return this.getFavorites().some(f => f.id === streamerId);
  }

  // Following
  getFollowing() {
    const stored = this._get('sts_following');
    return stored ? JSON.parse(stored) : [];
  }

  followPerformer(performer) {
    const following = this.getFollowing();
    if (!following.find(f => f.id === performer.id)) {
      following.push({ ...performer, followedAt: Date.now() });
      this._set('sts_following', JSON.stringify(following));
      this._apiWrite('post', `/performer/follow/${performer.id}`);
    }
  }

  unfollowPerformer(performerId) {
    const following = this.getFollowing().filter(f => f.id !== performerId);
    this._set('sts_following', JSON.stringify(following));
    this._apiWrite('delete', `/performer/follow/${performerId}`);
  }

  isFollowing(performerId) {
    return this.getFollowing().some(f => f.id === performerId);
  }

  // Subscriptions
  getSubscriptions() {
    const stored = this._get('sts_subscriptions');
    return stored ? JSON.parse(stored) : [];
  }

  subscribeToPerformer(performer, cost) {
    const subs = this.getSubscriptions();
    if (!subs.find(s => s.id === performer.id)) {
      subs.push({ ...performer, subscribedAt: Date.now(), monthlyTokens: cost });
      this._set('sts_subscriptions', JSON.stringify(subs));
    }
  }

  isSubscribed(performerId) {
    return this.getSubscriptions().some(s => s.id === performerId);
  }

  getPerformerFollowerStats() {
    const stored = this._get('sts_follower_stats');
    return stored ? JSON.parse(stored) : { totalFollowers: 47, newThisWeek: 12, totalSubscribers: 8 };
  }

  // ============================================
  // STREAM SETTINGS
  // ============================================
  getStreamSettings() {
    const stored = this._get('sts_stream_settings');
    return stored ? JSON.parse(stored) : {
      resolution: '720p', bitrate: 2500, fps: 30,
      lowLatency: true, autoRecord: false, dvr: false,
      chatOverlay: true, tipAlerts: true, alertVolume: 80,
    };
  }

  saveStreamSettings(settings) {
    this._set('sts_stream_settings', JSON.stringify(settings));
    this._apiWrite('put', '/performer/profile', { streamSettings: settings });
  }

  // ============================================
  // LOVENSE DEVICES & SETTINGS
  // ============================================
  getLovenseDevices() {
    const stored = this._get('sts_lovense_devices');
    return stored ? JSON.parse(stored) : [];
  }

  saveLovenseDevices(devices) { this._set('sts_lovense_devices', JSON.stringify(devices)); }

  getLovenseSettings() {
    const stored = this._get('sts_lovense_settings');
    return stored ? JSON.parse(stored) : {
      autoConnect: true, soundAlerts: true, showInChat: true,
      randomPatterns: false, cooldownSeconds: 5, maxIntensity: 100,
    };
  }

  saveLovenseSettings(settings) {
    this._set('sts_lovense_settings', JSON.stringify(settings));
    this._apiWrite('put', '/performer/profile', { lovenseSettings: settings });
  }

  // ============================================
  // EARNINGS
  // ============================================
  getEarnings() {
    const stored = this._get('sts_earnings');
    return stored ? JSON.parse(stored) : {
      todayTokens: 340, todayUSD: 18.70,
      weekTokens: 2180, weekUSD: 119.90,
      monthTokens: 8750, monthUSD: 481.25,
      allTimeTokens: 42300, allTimeUSD: 2326.50,
      pendingPayout: 1200, pendingUSD: 66.00,
      recentSessions: [
        { date: Date.now() - 86400000, duration: 180, tokens: 680, viewers: 142 },
        { date: Date.now() - 172800000, duration: 240, tokens: 920, viewers: 198 },
        { date: Date.now() - 259200000, duration: 120, tokens: 440, viewers: 87 },
      ],
    };
  }

  saveEarnings(data) { this._set('sts_earnings', JSON.stringify(data)); }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  getNotifications() {
    const stored = this._get('sts_notifications');
    return stored ? JSON.parse(stored) : [
      { id: 'n1', type: 'tip', title: 'New Tip!', body: 'BigSpender tipped 100 tokens 🔥', isRead: false, timestamp: Date.now() - 300000 },
      { id: 'n2', type: 'follow', title: 'New Follower', body: 'viewer_42 is now following you', isRead: false, timestamp: Date.now() - 600000 },
      { id: 'n3', type: 'system', title: 'Payout Processed', body: 'Your withdrawal of $250 has been sent', isRead: true, timestamp: Date.now() - 3600000 },
    ];
  }

  saveNotifications(notifications) { this._set('sts_notifications', JSON.stringify(notifications)); }

  getUnreadCount() {
    return this.getNotifications().filter(n => !n.isRead).length;
  }

  // ============================================
  // BLOCKED USERS & REPORTS
  // ============================================
  getBlockedUsers() {
    const stored = this._get('sts_blocked');
    return stored ? JSON.parse(stored) : [
      { id: 'blk-1', name: 'TrollUser99', reason: 'Harassment', blockedAt: Date.now() - 86400000 },
    ];
  }

  getReports() {
    const stored = this._get('sts_reports');
    return stored ? JSON.parse(stored) : [];
  }

  addReport(report) {
    const reports = this.getReports();
    reports.unshift({ id: 'rpt-' + Date.now(), ...report, timestamp: Date.now() });
    this._set('sts_reports', JSON.stringify(reports));
    this._apiWrite('post', '/settings/reports', report);
  }

  // ============================================
  // ANTIFRAUD SETTINGS
  // ============================================
  getAntifraudSettings() {
    const stored = this._get('sts_antifraud');
    return stored ? JSON.parse(stored) : {
      tipFloodEnabled: true, tipFloodMax: 10, tipFloodWindow: 60,
      newAccountGuard: true, newAccountMinAge: 24,
      vpnDetection: false, duplicateDetection: true, autoBlock: false,
    };
  }

  saveAntifraudSettings(settings) {
    this._set('sts_antifraud', JSON.stringify(settings));
    this._apiWrite('put', '/settings/antifraud', settings);
  }

  getAntifraudLog() {
    const stored = this._get('sts_antifraud_log');
    return stored ? JSON.parse(stored) : [
      { id: 'af-1', event: 'Tip flood blocked', user: 'rapid_tipper', timestamp: Date.now() - 120000, details: '12 tips in 30s' },
      { id: 'af-2', event: 'New account guard', user: 'newuser_123', timestamp: Date.now() - 3600000, details: 'Account age: 2 hours' },
    ];
  }

  // ============================================
  // SECURITY KEYS
  // ============================================
  getSecurityKeys() {
    const stored = this._get('sts_security_keys');
    return stored ? JSON.parse(stored) : [];
  }

  saveSecurityKeys(keys) { this._set('sts_security_keys', JSON.stringify(keys)); }

  getSecurityKeySettings() {
    const stored = this._get('sts_seckey_settings');
    return stored ? JSON.parse(stored) : {
      requireForLogin: false, requireForPayout: false,
      requireForAccountChanges: false, allowPasswordFallback: true,
    };
  }

  saveSecurityKeySettings(settings) { this._set('sts_seckey_settings', JSON.stringify(settings)); }

  getSecurityChallengeLog() {
    const stored = this._get('sts_seckey_log');
    return stored ? JSON.parse(stored) : [];
  }

  addSecurityChallengeLog(entry) {
    const log = this.getSecurityChallengeLog();
    log.unshift({ id: Date.now(), ...entry, timestamp: Date.now() });
    this._set('sts_seckey_log', JSON.stringify(log.slice(0, 50)));
  }

  // ============================================
  // BOT SHIELD
  // ============================================
  getBotShieldSettings() {
    const stored = this._get('sts_botshield');
    if (stored) return JSON.parse(stored);
    return {
      enabled: true, captchaOnJoin: true, captchaBeforeTip: false,
      browserFingerprint: true, rateLimitChat: 5, rateLimitWindow: 10,
      blockTor: false, blockDatacenter: true, minAccountAgeHours: 1,
      proofOfWork: false, honeypotEnabled: true, autoBanThreshold: 3,
      challengeTypes: { slider: true, math: true, image: false, invisible: true },
      ipReputation: { enabled: true, provider: 'ipqualityscore', blockBelow: 50 },
      geoRestrictions: { enabled: false, allowedCountries: ['US'], blockVPN: false },
    };
  }

  saveBotShieldSettings(settings) {
    this._set('sts_botshield', JSON.stringify(settings));
    this._apiWrite('put', '/settings/botshield', settings);
  }

  getBotShieldSessions() {
    const stored = this._get('sts_botshield_sessions');
    return stored ? JSON.parse(stored) : [];
  }

  saveBotShieldSessions(sessions) { this._set('sts_botshield_sessions', JSON.stringify(sessions)); }

  getBotShieldLog() {
    const stored = this._get('sts_botshield_log');
    return stored ? JSON.parse(stored) : [
      { id: 'bs-1', event: 'CAPTCHA failed', ip: '203.0.113.42', timestamp: Date.now() - 60000, action: 'blocked', fingerprint: 'fp_abc123' },
      { id: 'bs-2', event: 'Datacenter IP detected', ip: '198.51.100.1', timestamp: Date.now() - 120000, action: 'challenged', fingerprint: 'fp_xyz789' },
    ];
  }

  addBotShieldLog(entry) {
    const log = this.getBotShieldLog();
    log.unshift({ id: 'bs-' + Date.now(), ...entry, timestamp: Date.now() });
    this._set('sts_botshield_log', JSON.stringify(log.slice(0, 100)));
  }

  // ============================================
  // LEADERBOARD
  // ============================================
  getRoomLeaderboard(performerId) {
    const stored = this._get('sts_leaderboard_' + performerId);
    return stored ? JSON.parse(stored) : [
      { rank: 1, name: 'BigSpender', tokens: 4200, badge: '👑' },
      { rank: 2, name: 'TipKing99', tokens: 2800, badge: '💎' },
      { rank: 3, name: 'GenerousGuy', tokens: 1500, badge: '🥉' },
    ];
  }

  addToLeaderboard(performerId, viewerId, viewerName, amount) {
    const lb = this.getRoomLeaderboard(performerId);
    const existing = lb.find(e => e.name === viewerName);
    if (existing) {
      existing.tokens += amount;
    } else {
      lb.push({ rank: lb.length + 1, name: viewerName, tokens: amount, badge: '' });
    }
    lb.sort((a, b) => b.tokens - a.tokens);
    lb.forEach((e, i) => {
      e.rank = i + 1;
      e.badge = i === 0 ? '👑' : i === 1 ? '💎' : i === 2 ? '🥉' : '';
    });
    this._set('sts_leaderboard_' + performerId, JSON.stringify(lb));
  }

  // ============================================
  // VIEWER TIER & SPEND
  // ============================================
  getViewerBadge(viewerId, performerId) {
    const lb = this.getRoomLeaderboard(performerId);
    const entry = lb.find(e => e.name === (this.getDisplayName() || 'You'));
    return entry?.badge || '';
  }

  getViewerLifetimeSpend() {
    const val = this._get('sts_lifetime_spend');
    return val ? parseInt(val, 10) : 0;
  }

  addLifetimeSpend(amount) {
    const current = this.getViewerLifetimeSpend();
    this._set('sts_lifetime_spend', (current + amount).toString());
  }

  getViewerTier() {
    const spend = this.getViewerLifetimeSpend();
    if (spend >= 10000) return { name: 'Diamond', icon: '💎', color: '#b9f2ff' };
    if (spend >= 5000) return { name: 'Gold', icon: '👑', color: '#ffd700' };
    if (spend >= 1000) return { name: 'Silver', icon: '🥈', color: '#c0c0c0' };
    return { name: 'Bronze', icon: '🥉', color: '#cd7f32' };
  }

  // ============================================
  // CLUB EVENTS
  // ============================================
  getClubEvents() {
    const stored = this._get('sts_club_events');
    return stored ? JSON.parse(stored) : [
      { id: 'evt-1', clubName: 'The Diamond Lounge', eventName: 'Friday Night Special', eventDate: '2026-02-21', startTime: '21:00', endTime: '02:00', description: 'Double tips night!' },
      { id: 'evt-2', clubName: 'Sapphire Club', eventName: 'Valentine\'s Week', eventDate: '2026-02-14', startTime: '20:00', endTime: '01:00', description: 'Special Valentine\'s performances' },
    ];
  }

  saveClubEvents(events) { this._set('sts_club_events', JSON.stringify(events)); }

  // ============================================
  // EXCLUSIVE / PINNED / REACTIONS / BROWSE FILTERS
  // ============================================
  getExclusiveStatus() { return this._get('sts_exclusive') === 'true'; }
  setExclusiveStatus(isExclusive) { this._set('sts_exclusive', isExclusive.toString()); }

  getPinnedMessage() {
    const stored = this._get('sts_pinned');
    return stored ? JSON.parse(stored) : null;
  }
  setPinnedMessage(msg) { this._set('sts_pinned', msg ? JSON.stringify(msg) : null); }

  getChatReactions() {
    const stored = this._get('sts_reactions');
    return stored ? JSON.parse(stored) : { '❤️': 0, '🔥': 0, '😍': 0, '🎉': 0, '💰': 0 };
  }

  getBrowseFilters() {
    const stored = this._get('sts_browse_filters');
    return stored ? JSON.parse(stored) : {
      sortBy: 'viewers', showOffline: false, category: 'all', state: 'all',
    };
  }

  saveBrowseFilters(filters) { this._set('sts_browse_filters', JSON.stringify(filters)); }

  // ============================================
  // PAYOUT WALLETS (Crypto)
  // ============================================
  getPayoutWallets() {
    const stored = this._get('sts_payout_wallets');
    return stored ? JSON.parse(stored) : [];
  }

  savePayoutWallets(wallets) {
    this._set('sts_payout_wallets', JSON.stringify(wallets));
    this._apiWrite('put', '/payouts/wallets/sync', wallets);
  }

  // ============================================
  // PAYOUT HISTORY
  // ============================================
  getPayoutHistory() {
    const stored = this._get('sts_payout_history');
    return stored ? JSON.parse(stored) : [
      { id: 'payout_demo_1', amountUSD: 250.00, currency: 'USDT', network: 'tron', walletAddress: 'TDemo...5678', status: 'confirmed', requestedAt: Date.now() - 604800000, processedAt: Date.now() - 518400000, txHash: 'demo_tx_confirmed_001' },
      { id: 'payout_demo_2', amountUSD: 180.00, currency: 'USDT', network: 'tron', walletAddress: 'TDemo...5678', status: 'sent', requestedAt: Date.now() - 172800000, processedAt: Date.now() - 86400000, txHash: 'demo_tx_sent_001' },
    ];
  }

  savePayoutHistory(history) {
    this._set('sts_payout_history', JSON.stringify(history));
  }

  // ============================================
  // PAYOUT METHODS (Legacy) & VERIFICATION
  // ============================================
  getPayoutMethods() {
    const stored = this._get('sts_payout_methods');
    return stored ? JSON.parse(stored) : [];
  }

  savePayoutMethods(methods) { this._set('sts_payout_methods', JSON.stringify(methods)); }

  getPayoutVerificationSettings() {
    const stored = this._get('sts_payout_verify_settings');
    return stored ? JSON.parse(stored) : {
      holdHours: 24, cooldownHours: 72,
      emailVerification: true, smsVerification: false,
      maxDailyUsd: 5000, flagThresholdUsd: 2000,
    };
  }

  savePayoutVerificationSettings(s) {
    this._set('sts_payout_verify_settings', JSON.stringify(s));
    this._apiWrite('put', '/payouts/settings', s);
  }

  getPayoutVerificationLog() {
    const stored = this._get('sts_payout_verify_log');
    return stored ? JSON.parse(stored) : [];
  }

  addPayoutVerificationLog(entry) {
    const log = this.getPayoutVerificationLog();
    log.unshift({ id: Date.now(), ...entry, timestamp: Date.now() });
    this._set('sts_payout_verify_log', JSON.stringify(log.slice(0, 50)));
  }

  // ============================================
  // TWO-FACTOR AUTH
  // ============================================
  getTwoFactorSettings() {
    const stored = this._get('sts_2fa_settings');
    return stored ? JSON.parse(stored) : {
      isEnabled: false, method: null,
      enforceLogin: true, enforcePayout: true, enforceAccountChanges: true,
      recoveryCodes: [], setupCompletedAt: null,
    };
  }

  saveTwoFactorSettings(s) {
    this._set('sts_2fa_settings', JSON.stringify(s));
    if (s.enforceLogin !== undefined || s.enforcePayout !== undefined) {
      this._apiWrite('put', '/settings/2fa', s);
    }
  }

  getTwoFactorLog() {
    const stored = this._get('sts_2fa_log');
    return stored ? JSON.parse(stored) : [];
  }

  addTwoFactorLog(entry) {
    const log = this.getTwoFactorLog();
    log.unshift({ id: Date.now(), ...entry, timestamp: Date.now() });
    this._set('sts_2fa_log', JSON.stringify(log.slice(0, 50)));
  }

  // ============================================
  // AML
  // ============================================
  getAMLSettings() {
    const stored = this._get('sts_aml_settings');
    return stored ? JSON.parse(stored) : {
      structuringThreshold: 3000, timeWindowHours: 24,
      largeTxThreshold: 10000, maxTxPerHour: 30,
      peerMonitoring: true, crossAccount: true,
      autoFreeze: false, autoSarDraft: false,
    };
  }

  saveAMLSettings(s) {
    this._set('sts_aml_settings', JSON.stringify(s));
    this._apiWrite('put', '/admin/aml/settings', s);
  }

  getAMLAlerts() {
    const stored = this._get('sts_aml_alerts');
    if (stored) return JSON.parse(stored);
    return [
      { id: 'aml-1', type: 'structuring', severity: 'high', user: 'user_8821', amount: 2950, txCount: 6, description: '6 transactions totaling $2,950 in 4 hours — just below $3,000 threshold', status: 'open', createdAt: Date.now() - 3600000 },
      { id: 'aml-2', type: 'velocity', severity: 'medium', user: 'viewer_3344', amount: 1200, txCount: 35, description: '35 transactions in 1 hour — exceeds 30/hour limit', status: 'open', createdAt: Date.now() - 7200000 },
      { id: 'aml-3', type: 'large_tx', severity: 'critical', user: 'whale_9901', amount: 15000, txCount: 1, description: 'Single transaction of $15,000 — above $10,000 threshold', status: 'frozen', createdAt: Date.now() - 86400000 },
    ];
  }

  saveAMLAlerts(alerts) { this._set('sts_aml_alerts', JSON.stringify(alerts)); }

  getAMLSARReports() {
    const stored = this._get('sts_aml_sar');
    return stored ? JSON.parse(stored) : [];
  }

  addSARReport(report) {
    const reports = this.getAMLSARReports();
    reports.unshift({ id: 'sar-' + Date.now(), ...report, filedAt: Date.now() });
    this._set('sts_aml_sar', JSON.stringify(reports));
    this._apiWrite('post', '/admin/aml/sar-reports', report);
  }

  // ============================================
  // AGE GATE
  // ============================================
  getAgeGateSettings() {
    const stored = this._get('sts_age_gate_settings');
    return stored ? JSON.parse(stored) : {
      enabled: true, defaultMethod: 'click_through',
      strictStateMethod: 'dob', vpnBlocking: false,
      rememberDays: 30, provider: 'yoti',
    };
  }

  saveAgeGateSettings(s) {
    this._set('sts_age_gate_settings', JSON.stringify(s));
    this._apiWrite('put', '/settings/age-gate', s);
  }

  getAgeVerificationLog() {
    const stored = this._get('sts_age_log');
    return stored ? JSON.parse(stored) : [
      { id: 'age-1', method: 'click_through', state: 'CA', result: 'pass', timestamp: Date.now() - 60000 },
      { id: 'age-2', method: 'dob', state: 'LA', result: 'pass', timestamp: Date.now() - 120000 },
      { id: 'age-3', method: 'dob', state: 'TX', result: 'block', timestamp: Date.now() - 180000 },
    ];
  }

  addAgeVerificationLog(entry) {
    const log = this.getAgeVerificationLog();
    log.unshift({ id: 'age-' + Date.now(), ...entry, timestamp: Date.now() });
    this._set('sts_age_log', JSON.stringify(log.slice(0, 100)));
  }

  // ============================================
  // TAX REPORTING
  // ============================================
  getTaxSettings() {
    const stored = this._get('sts_tax_settings');
    return stored ? JSON.parse(stored) : {
      taxYear: 2026, reportingThreshold: 600,
      requireW9BeforePayout: true, autoGenerate1099: false, deadlineReminders: true,
    };
  }

  saveTaxSettings(s) {
    this._set('sts_tax_settings', JSON.stringify(s));
    this._apiWrite('put', '/admin/tax/settings', s);
  }

  getTaxPerformers() {
    const stored = this._get('sts_tax_performers');
    if (stored) return JSON.parse(stored);
    return [
      { id: 'tax-1', name: 'Crystal W.', email: 'crystal@example.com', totalEarnings: 12500, w9Status: 'received', form1099Status: 'pending' },
      { id: 'tax-2', name: 'Jessica M.', email: 'jessica@example.com', totalEarnings: 8200, w9Status: 'requested', form1099Status: 'pending' },
      { id: 'tax-3', name: 'Ashley T.', email: 'ashley@example.com', totalEarnings: 450, w9Status: 'not_requested', form1099Status: 'pending' },
    ];
  }

  saveTaxPerformers(performers) { this._set('sts_tax_performers', JSON.stringify(performers)); }

  // ============================================
  // DMCA
  // ============================================
  getDMCASettings() {
    const stored = this._get('sts_dmca_settings');
    return stored ? JSON.parse(stored) : {
      agentName: '', agentEmail: '', agentPhone: '', agentAddress: '',
      uscoRegistered: false, contentHashing: false,
      streamWatermark: false, autoTakedown: false,
    };
  }

  saveDMCASettings(s) {
    this._set('sts_dmca_settings', JSON.stringify(s));
    this._apiWrite('put', '/admin/dmca/settings', s);
  }

  getDMCACases() {
    const stored = this._get('sts_dmca_cases');
    return stored ? JSON.parse(stored) : [];
  }

  saveDMCACases(cases) { this._set('sts_dmca_cases', JSON.stringify(cases)); }

  addDMCACase(c) {
    const cases = this.getDMCACases();
    cases.unshift({ id: 'dmca-' + Date.now(), ...c, createdAt: Date.now(), status: 'pending' });
    this.saveDMCACases(cases);
    this._apiWrite('post', '/admin/dmca/cases', c);
  }

  // ============================================
  // CLEAR ALL
  // ============================================
  clearAllData() {
    this._cache = {};
    try { localStorage.clear(); } catch (e) {}
    this.initializeDefaults();
  }
}

const db = new Database();
export default db;
