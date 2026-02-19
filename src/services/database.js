/**
 * DATABASE SERVICE
 * ================
 * Currently: localStorage (browser-only, per-device)
 * 
 * TO SWAP FOR PRODUCTION:
 * Replace _get/_set/_del with API calls to your backend.
 * Example:
 *   _get(key) { return fetch(`/api/data/${key}`).then(r => r.json()).then(d => d.value); }
 *   _set(key, val) { return fetch(`/api/data/${key}`, { method: 'PUT', body: JSON.stringify({ value: val }) }); }
 *   _del(key) { return fetch(`/api/data/${key}`, { method: 'DELETE' }); }
 * 
 * Or use Firebase, Supabase, etc:
 *   import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
 */

class Database {
  // ============================================
  // STORAGE HELPERS — SWAP THESE FOR PRODUCTION
  // ============================================
  _get(key) {
    try { return localStorage.getItem(key); }
    catch (e) { console.warn('Storage read failed:', key, e); return null; }
  }

  _set(key, val) {
    try { localStorage.setItem(key, val); }
    catch (e) { console.warn('Storage write failed:', key, e); }
  }

  _del(key) {
    try { localStorage.removeItem(key); }
    catch (e) { console.warn('Storage delete failed:', key, e); }
  }

  constructor() {
    this.initializeDefaults();
  }

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
        tokensPerMin: 60,
        minDuration: 10,
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
  }

  getLiveSchedule() {
    const stored = this._get('livestream_live_schedule');
    return stored ? JSON.parse(stored) : [];
  }

  saveLiveSchedule(schedule) {
    this._set('livestream_live_schedule', JSON.stringify(schedule));
  }

  // ============================================
  // PRIVATE SHOW SETTINGS
  // ============================================
  getPrivateShowSettings() {
    const stored = this._get('livestream_private_settings');
    return stored ? JSON.parse(stored) : {
      tokensPerMin: 60,
      minDuration: 10,
      extensions: [
        { minutes: 5, tokens: 250 },
        { minutes: 10, tokens: 450 },
        { minutes: 15, tokens: 650 },
      ],
    };
  }

  savePrivateShowSettings(settings) {
    this._set('livestream_private_settings', JSON.stringify(settings));
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
  getDisplayName() {
    return this._get('sts_display_name') || '';
  }

  setDisplayName(name) {
    this._set('sts_display_name', name);
  }

  getDailyLimit() {
    const val = this._get('sts_daily_limit');
    return val ? parseInt(val, 10) : 0;
  }

  setDailyLimit(limit) {
    this._set('sts_daily_limit', limit.toString());
  }

  // ============================================
  // VERIFICATION (2257 Compliance + Identity)
  // ============================================
  getVerification() {
    const stored = this._get('sts_verification');
    return stored ? JSON.parse(stored) : {
      status: 'not_started', // not_started, in_progress, pending_review, approved, rejected
      step: 0,
      submittedAt: null,
      reviewedAt: null,
      rejectionReason: null,
      identity: {
        legalFirstName: '',
        legalLastName: '',
        dateOfBirth: '',
        stageNames: '',
        idType: '',
        idUploaded: false,
        selfieUploaded: false,
      },
      venue: {
        clubName: '',
        clubState: '',
        managerName: '',
        managerEmail: '',
        managerPhone: '',
        venueConfirmed: false,
      },
      compliance: {
        custodianAcknowledged: false,
        termsAccepted: false,
        ageConfirmed: false,
      },
    };
  }

  saveVerification(data) {
    this._set('sts_verification', JSON.stringify(data));
  }

  // ============================================
  // ADMIN — VERIFICATION REVIEW QUEUE
  // ============================================
  // In production: these would be API calls to your admin backend
  // e.g., GET /api/admin/verifications?status=pending_review

  getReviewQueue() {
    const stored = this._get('sts_admin_queue');
    return stored ? JSON.parse(stored) : [];
  }

  saveReviewQueue(queue) {
    this._set('sts_admin_queue', JSON.stringify(queue));
  }

  // Seed demo queue if empty
  seedReviewQueue() {
    const queue = this.getReviewQueue();
    if (queue.length > 0) return queue;

    const demoQueue = [
      {
        id: 'v-1001', performerId: 'perf-201', submittedAt: Date.now() - 3600000 * 2,
        status: 'pending_review', reviewedAt: null, reviewedBy: null, rejectionReason: null,
        identity: { legalFirstName: 'Jessica', legalLastName: 'Martinez', dateOfBirth: '1996-03-15', stageNames: 'Jade, JadeXO', idType: 'US Driver License', idUploaded: true, selfieUploaded: true },
        venue: { clubName: 'Sapphire Las Vegas', clubState: 'NV', managerName: 'Tony Russo', managerEmail: 'tony@sapphirelv.com', managerPhone: '(702) 555-0142', venueConfirmed: false },
        compliance: { ageConfirmed: true, custodianAcknowledged: true, termsAccepted: true },
      },
      {
        id: 'v-1002', performerId: 'perf-202', submittedAt: Date.now() - 3600000 * 5,
        status: 'pending_review', reviewedAt: null, reviewedBy: null, rejectionReason: null,
        identity: { legalFirstName: 'Ashley', legalLastName: 'Chen', dateOfBirth: '1999-08-22', stageNames: 'Autumn', idType: 'US Passport', idUploaded: true, selfieUploaded: true },
        venue: { clubName: 'Spearmint Rhino', clubState: 'CA', managerName: 'Lisa Park', managerEmail: 'lisa.p@spearmintrhino.com', managerPhone: '', venueConfirmed: false },
        compliance: { ageConfirmed: true, custodianAcknowledged: true, termsAccepted: true },
      },
      {
        id: 'v-1003', performerId: 'perf-203', submittedAt: Date.now() - 3600000 * 12,
        status: 'pending_review', reviewedAt: null, reviewedBy: null, rejectionReason: null,
        identity: { legalFirstName: 'Brittany', legalLastName: 'Johnson', dateOfBirth: '1994-11-03', stageNames: 'Diamond, BrittStar', idType: 'US State ID', idUploaded: true, selfieUploaded: true },
        venue: { clubName: 'Scores New York', clubState: 'NY', managerName: 'Mike DeLuca', managerEmail: '', managerPhone: '(212) 555-0198', venueConfirmed: false },
        compliance: { ageConfirmed: true, custodianAcknowledged: true, termsAccepted: true },
      },
      {
        id: 'v-1004', performerId: 'perf-204', submittedAt: Date.now() - 3600000 * 26,
        status: 'approved', reviewedAt: Date.now() - 3600000 * 20, reviewedBy: 'admin@streamtostage.com', rejectionReason: null,
        identity: { legalFirstName: 'Taylor', legalLastName: 'Brooks', dateOfBirth: '1997-06-10', stageNames: 'Tay, TaylorMade', idType: 'US Driver License', idUploaded: true, selfieUploaded: true },
        venue: { clubName: 'Cheetah Atlanta', clubState: 'GA', managerName: 'Derek Williams', managerEmail: 'derek@cheetahatlanta.com', managerPhone: '(404) 555-0177', venueConfirmed: true },
        compliance: { ageConfirmed: true, custodianAcknowledged: true, termsAccepted: true },
      },
      {
        id: 'v-1005', performerId: 'perf-205', submittedAt: Date.now() - 3600000 * 48,
        status: 'rejected', reviewedAt: Date.now() - 3600000 * 40, reviewedBy: 'admin@streamtostage.com', rejectionReason: 'ID photo is blurry and unreadable. Please resubmit a clear photo.',
        identity: { legalFirstName: 'Morgan', legalLastName: 'Davis', dateOfBirth: '2000-01-28', stageNames: 'MorganXO', idType: 'US Driver License', idUploaded: true, selfieUploaded: true },
        venue: { clubName: 'Rick\'s Cabaret Houston', clubState: 'TX', managerName: 'Carlos Reyes', managerEmail: 'carlos@rickscabaret.com', managerPhone: '', venueConfirmed: false },
        compliance: { ageConfirmed: true, custodianAcknowledged: true, termsAccepted: true },
      },
      {
        id: 'v-1006', performerId: 'perf-206', submittedAt: Date.now() - 3600000 * 1,
        status: 'pending_review', reviewedAt: null, reviewedBy: null, rejectionReason: null,
        identity: { legalFirstName: 'Kayla', legalLastName: 'Thompson', dateOfBirth: '1998-04-17', stageNames: 'Kay, KaylaRose', idType: 'Foreign Passport', idUploaded: true, selfieUploaded: true },
        venue: { clubName: 'Deja Vu Showgirls', clubState: 'MI', managerName: 'Steve Morris', managerEmail: 'steve.m@dejavu.com', managerPhone: '(313) 555-0211', venueConfirmed: false },
        compliance: { ageConfirmed: true, custodianAcknowledged: true, termsAccepted: true },
      },
    ];

    this.saveReviewQueue(demoQueue);
    return demoQueue;
  }

  updateReviewItem(id, updates) {
    const queue = this.getReviewQueue();
    const idx = queue.findIndex(q => q.id === id);
    if (idx === -1) return null;
    queue[idx] = { ...queue[idx], ...updates };
    this.saveReviewQueue(queue);
    return queue[idx];
  }

  // ============================================
  // FAVORITES
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
    }
  }

  removeFavorite(streamerId) {
    const favs = this.getFavorites().filter(f => f.id !== streamerId);
    this._set('sts_favorites', JSON.stringify(favs));
  }

  isFavorite(streamerId) {
    return this.getFavorites().some(f => f.id === streamerId);
  }

  // ============================================
  // STREAM SETTINGS (Performer Go-Live)
  // ============================================
  getStreamSettings() {
    const stored = this._get('sts_stream_settings');
    return stored ? JSON.parse(stored) : {
      streamKey: 'sts_live_' + Math.random().toString(36).substring(2, 10),
      serverUrl: 'rtmp://ingest.streamtostage.com/live',
      resolution: '1080p',
      bitrate: 4500,
      fps: 30,
      lowLatency: true,
      autoRecord: false,
      webcamId: '',
      micId: '',
      isLive: false,
      startedAt: null,
      totalStreamMinutes: 847,
      peakViewers: 0,
      currentViewers: 0,
    };
  }

  saveStreamSettings(settings) {
    this._set('sts_stream_settings', JSON.stringify(settings));
  }

  // ============================================
  // LOVENSE DEVICE PAIRING
  // ============================================
  getLovenseDevices() {
    const stored = this._get('sts_lovense_devices');
    return stored ? JSON.parse(stored) : [];
  }

  saveLovenseDevices(devices) {
    this._set('sts_lovense_devices', JSON.stringify(devices));
  }

  getLovenseSettings() {
    const stored = this._get('sts_lovense_settings');
    return stored ? JSON.parse(stored) : {
      enabled: false,
      showInRoom: true,
      soundAlerts: true,
      vibrationFeedback: true,
      maxIntensity: 100,
      cooldownSeconds: 5,
      queueMode: 'stack', // 'stack' or 'override'
    };
  }

  saveLovenseSettings(settings) {
    this._set('sts_lovense_settings', JSON.stringify(settings));
  }

  // ============================================
  // EARNINGS & PAYOUTS (Performer)
  // ============================================
  getEarnings() {
    const stored = this._get('sts_earnings');
    return stored ? JSON.parse(stored) : {
      availableBalance: 4825,
      pendingPayout: 0,
      lifetimeEarnings: 28750,
      thisMonth: 4825,
      lastMonth: 6230,
      payoutMethod: null,
      minimumPayout: 500,
      payoutHistory: [
        { id: 'p-1', amount: 6230, method: 'ACH Direct Deposit', status: 'completed', requestedAt: Date.now() - 86400000 * 14, completedAt: Date.now() - 86400000 * 12, reference: 'PAY-20250205-6230' },
        { id: 'p-2', amount: 5100, method: 'ACH Direct Deposit', status: 'completed', requestedAt: Date.now() - 86400000 * 45, completedAt: Date.now() - 86400000 * 43, reference: 'PAY-20250106-5100' },
        { id: 'p-3', amount: 3890, method: 'Bitcoin', status: 'completed', requestedAt: Date.now() - 86400000 * 75, completedAt: Date.now() - 86400000 * 74, reference: 'PAY-20241207-3890' },
      ],
      earningsLog: [
        { id: 'e-1', type: 'tip', amount: 100, from: 'Anonymous', performerCut: 55, timestamp: Date.now() - 3600000 * 2 },
        { id: 'e-2', type: 'tip', amount: 500, from: 'WhaleUser42', performerCut: 275, timestamp: Date.now() - 3600000 * 3 },
        { id: 'e-3', type: 'lovense', amount: 60, from: 'Anonymous', performerCut: 33, timestamp: Date.now() - 3600000 * 5 },
        { id: 'e-4', type: 'private-show', amount: 600, from: 'VIPMember', performerCut: 330, timestamp: Date.now() - 3600000 * 8 },
        { id: 'e-5', type: 'tip', amount: 50, from: 'NewUser', performerCut: 27.5, timestamp: Date.now() - 3600000 * 12 },
        { id: 'e-6', type: 'private-show', amount: 1200, from: 'BigSpender', performerCut: 660, timestamp: Date.now() - 86400000 * 2 },
        { id: 'e-7', type: 'tip', amount: 200, from: 'RegularFan', performerCut: 110, timestamp: Date.now() - 86400000 * 3 },
        { id: 'e-8', type: 'lovense', amount: 100, from: 'Anonymous', performerCut: 55, timestamp: Date.now() - 86400000 * 3 },
      ],
    };
  }

  saveEarnings(data) {
    this._set('sts_earnings', JSON.stringify(data));
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  getNotifications() {
    const stored = this._get('sts_notifications');
    if (stored) return JSON.parse(stored);

    // Seed demo notifications
    const demo = [
      { id: 'n-1', type: 'tip', title: 'New Tip!', body: 'WhaleUser42 sent you 500 tokens', read: false, timestamp: Date.now() - 3600000 * 1, link: '/dashboard' },
      { id: 'n-2', type: 'system', title: 'Verification Approved', body: 'Your performer verification has been approved! Your 🛡️ badge is now active.', read: false, timestamp: Date.now() - 3600000 * 4, link: '/dashboard' },
      { id: 'n-3', type: 'follower', title: 'New Follower', body: 'VIPMember added you to favorites', read: false, timestamp: Date.now() - 3600000 * 6, link: null },
      { id: 'n-4', type: 'payout', title: 'Payout Complete', body: 'Your payout of $623.00 has been deposited via ACH Direct Deposit', read: true, timestamp: Date.now() - 86400000 * 2, link: '/earnings' },
      { id: 'n-5', type: 'private', title: 'Private Show Request', body: 'BigSpender requested a 20-min private show', read: true, timestamp: Date.now() - 86400000 * 2, link: null },
      { id: 'n-6', type: 'system', title: 'Welcome to StreamToStage!', body: 'Thanks for joining. Complete your profile and start streaming.', read: true, timestamp: Date.now() - 86400000 * 7, link: '/dashboard' },
      { id: 'n-7', type: 'tip', title: 'Lovense Activation', body: 'Anonymous activated High Vibe (60 tokens)', read: true, timestamp: Date.now() - 86400000 * 3, link: null },
    ];
    this._set('sts_notifications', JSON.stringify(demo));
    return demo;
  }

  saveNotifications(notifications) {
    this._set('sts_notifications', JSON.stringify(notifications));
  }

  markNotificationRead(id) {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) notifs[idx].read = true;
    this.saveNotifications(notifs);
    return notifs;
  }

  markAllNotificationsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    this.saveNotifications(notifs);
    return notifs;
  }

  getUnreadCount() {
    return this.getNotifications().filter(n => !n.read).length;
  }

  // ============================================
  // BLOCKED USERS & REPORTS
  // ============================================
  getBlockedUsers() {
    const stored = this._get('sts_blocked_users');
    return stored ? JSON.parse(stored) : [];
  }

  blockUser(user) {
    const blocked = this.getBlockedUsers();
    if (!blocked.find(b => b.id === user.id)) {
      blocked.push({ ...user, blockedAt: Date.now() });
      this._set('sts_blocked_users', JSON.stringify(blocked));
    }
  }

  unblockUser(userId) {
    const blocked = this.getBlockedUsers().filter(b => b.id !== userId);
    this._set('sts_blocked_users', JSON.stringify(blocked));
  }

  getReports() {
    const stored = this._get('sts_reports');
    return stored ? JSON.parse(stored) : [];
  }

  addReport(report) {
    const reports = this.getReports();
    reports.unshift({ id: 'rpt-' + Date.now(), timestamp: Date.now(), status: 'submitted', ...report });
    this._set('sts_reports', JSON.stringify(reports));
  }

  // ============================================
  // ANTI-FRAUD / RATE LIMITING SETTINGS
  // ============================================
  getAntifraudSettings() {
    const stored = this._get('sts_antifraud');
    return stored ? JSON.parse(stored) : {
      maxTipsPerMinute: 10,
      maxTipAmount: 5000,
      suspiciousThreshold: 2000,
      requireCaptchaAbove: 1000,
      geoBlocking: false,
      blockedCountries: [],
      vpnDetection: true,
      newAccountCooldown: 24,
      chargebackProtection: true,
      duplicateDetection: true,
      velocityChecks: true,
    };
  }

  saveAntifraudSettings(settings) {
    this._set('sts_antifraud', JSON.stringify(settings));
  }

  getAntifraudLog() {
    const stored = this._get('sts_antifraud_log');
    if (stored) return JSON.parse(stored);

    const demo = [
      { id: 'af-1', type: 'velocity', severity: 'warning', message: 'Rapid tip sequence detected — 8 tips in 30s from user CrazyTipper', action: 'rate_limited', userId: 'u-901', timestamp: Date.now() - 3600000 * 1 },
      { id: 'af-2', type: 'amount', severity: 'warning', message: 'Large single tip: 3,000 tokens from WhaleUser42', action: 'flagged', userId: 'u-902', timestamp: Date.now() - 3600000 * 4 },
      { id: 'af-3', type: 'chargeback', severity: 'critical', message: 'Chargeback attempt on $50 purchase by user ShadyBuyer', action: 'account_frozen', userId: 'u-903', timestamp: Date.now() - 86400000 * 1 },
      { id: 'af-4', type: 'vpn', severity: 'info', message: 'VPN detected for user TravelUser — allowed (low risk)', action: 'allowed', userId: 'u-904', timestamp: Date.now() - 86400000 * 2 },
      { id: 'af-5', type: 'duplicate', severity: 'warning', message: 'Duplicate account detected: same email pattern + device fingerprint', action: 'flagged', userId: 'u-905', timestamp: Date.now() - 86400000 * 3 },
      { id: 'af-6', type: 'geo', severity: 'info', message: 'Login from new country (JP) for user FrequentFlyer', action: 'captcha_required', userId: 'u-906', timestamp: Date.now() - 86400000 * 4 },
    ];
    this._set('sts_antifraud_log', JSON.stringify(demo));
    return demo;
  }

  // ============================================
  // SECURITY KEYS (WebAuthn / FIDO2)
  // ============================================
  getSecurityKeys() {
    const stored = this._get('sts_security_keys');
    return stored ? JSON.parse(stored) : [];
  }

  saveSecurityKeys(keys) {
    this._set('sts_security_keys', JSON.stringify(keys));
  }

  getSecurityKeySettings() {
    const stored = this._get('sts_security_key_settings');
    return stored ? JSON.parse(stored) : {
      requiredForAdmin: false,
      requiredForPayouts: false,
      requiredForGoLive: false,
      requiredForAccountChanges: false,
      requiredForAntifraud: false,
    };
  }

  saveSecurityKeySettings(settings) {
    this._set('sts_security_key_settings', JSON.stringify(settings));
  }

  getSecurityChallengeLog() {
    const stored = this._get('sts_security_challenge_log');
    return stored ? JSON.parse(stored) : [];
  }

  addSecurityChallengeLog(entry) {
    const log = this.getSecurityChallengeLog();
    log.unshift({
      id: 'sc-' + Date.now(),
      timestamp: Date.now(),
      ...entry,
    });
    // Keep last 50 entries
    this._set('sts_security_challenge_log', JSON.stringify(log.slice(0, 50)));
    return log;
  }

  // ============================================
  // BOT SHIELD
  // ============================================
  getBotShieldSettings() {
    const stored = this._get('sts_botshield');
    return stored ? JSON.parse(stored) : {
      autoKickThreshold: 75,
      fingerprinting: {
        enabled: true,
        headlessDetection: true,
        canvasFingerprint: true,
        webglFingerprint: true,
        audioFingerprint: false,
        fontEnumeration: false,
        webrtcLeakDetection: true,
      },
      behaviorAnalysis: {
        enabled: true,
        mouseTracking: true,
        clickCadence: true,
        scrollProfiling: false,
        typingRhythm: false,
        focusBlurCheck: true,
        invisibleChallenge: false,
        challengeAt: 40,
        throttleAt: 60,
        autoKickAt: 80,
      },
      registrationGates: {
        honeypot: true,
        proofOfWork: false,
        progressiveCaptcha: true,
        emailVerification: true,
        disposableEmailBlock: true,
        deviceLock: true,
        maxPerIPPerHour: 3,
        maxPerDevice: 3,
        powDifficulty: 50000,
      },
      connectionLimits: {
        enabled: true,
        maxSessionsPerIP: 5,
        maxWebRTCPerIP: 3,
        maxWSPerIP: 5,
        bandwidthDetection: true,
        velocityCheck: true,
        staleReaper: true,
        datacenterBlock: false,
        torBlock: true,
        residentialProxyDetect: false,
      },
      chatDefense: {
        enabled: true,
        maxMsgPerMinute: 15,
        duplicateCooldown: 30,
        linkFilter: true,
        newUserDelay: true,
        emojiSpamDetect: true,
        shadowBan: true,
        autoMuteOnFlood: true,
        wordFilter: 'https?://\n\\.com\\b\n\\.xyz\\b\nfree tokens\nclick here\nwhatsapp\\b\ntelegram\\.me',
      },
    };
  }

  saveBotShieldSettings(settings) {
    this._set('sts_botshield', JSON.stringify(settings));
  }

  getBotShieldSessions() {
    const stored = this._get('sts_botshield_sessions');
    if (stored) return JSON.parse(stored);

    const demo = [
      { id: 'bs-1', ip: '185.220.101.42', country: 'DE', countryFlag: '🇩🇪', botScore: 92, isHeadless: true, isVPN: true, room: 'amber_rose', connectedAt: Date.now() - 180000, lastActivity: Date.now() - 5000, messageCount: 47, userAgent: 'HeadlessChrome/120.0.6099.0', screen: '1024×768', timezone: 'UTC', language: 'en-US', webglRenderer: 'SwiftShader', canvasHash: '0000...0000', pluginCount: 0, signals: { mouseMovement: false, clickCadence: false, scrollBehavior: false, typingPattern: false, focusBlur: false, touchEvents: false }, flags: ['Headless browser detected', 'No mouse movement', 'SwiftShader GPU (datacenter VM)', 'Zero browser plugins', '47 messages in 3min'] },
      { id: 'bs-2', ip: '91.108.56.170', country: 'RU', countryFlag: '🇷🇺', botScore: 78, isHeadless: false, isVPN: true, room: 'diamond_val', connectedAt: Date.now() - 600000, lastActivity: Date.now() - 12000, messageCount: 23, userAgent: 'Mozilla/5.0 Chrome/121', screen: '1920×1080', timezone: 'Europe/Moscow', language: 'ru', webglRenderer: 'Intel UHD 630', canvasHash: 'b7e2...4f01', pluginCount: 2, signals: { mouseMovement: true, clickCadence: false, scrollBehavior: true, typingPattern: false, focusBlur: false, touchEvents: false }, flags: ['Fixed-interval clicks (σ<8ms)', 'No typing variance detected', 'VPN exit node', 'Known spam IP range'] },
      { id: 'bs-3', ip: '45.33.32.156', country: 'US', countryFlag: '🇺🇸', botScore: 65, isHeadless: false, isVPN: false, room: null, connectedAt: Date.now() - 300000, lastActivity: Date.now() - 90000, messageCount: 0, userAgent: 'Mozilla/5.0 Chrome/122', screen: '1366×768', timezone: 'America/New_York', language: 'en-US', webglRenderer: 'NVIDIA GeForce GTX 1060', canvasHash: 'c4a1...882e', pluginCount: 3, signals: { mouseMovement: true, clickCadence: true, scrollBehavior: false, typingPattern: undefined, focusBlur: false, touchEvents: false }, flags: ['No scroll behavior detected', 'No focus/blur events', 'Idle for 90s with no interaction'] },
      { id: 'bs-4', ip: '203.0.113.50', country: 'JP', countryFlag: '🇯🇵', botScore: 41, isHeadless: false, isVPN: false, room: 'sapphire_sky', connectedAt: Date.now() - 1200000, lastActivity: Date.now() - 30000, messageCount: 5, userAgent: 'Mozilla/5.0 Safari/605.1.15', screen: '390×844', timezone: 'Asia/Tokyo', language: 'ja', webglRenderer: 'Apple GPU', canvasHash: 'e91a...2d4c', pluginCount: 0, signals: { mouseMovement: undefined, clickCadence: true, scrollBehavior: true, typingPattern: true, focusBlur: true, touchEvents: true }, flags: ['Zero plugins (mobile normal)'] },
      { id: 'bs-5', ip: '104.248.96.23', country: 'NL', countryFlag: '🇳🇱', botScore: 88, isHeadless: true, isVPN: true, room: null, connectedAt: Date.now() - 45000, lastActivity: Date.now() - 2000, messageCount: 0, userAgent: 'python-requests/2.31.0', screen: 'N/A', timezone: 'UTC', language: 'en', webglRenderer: 'N/A', canvasHash: 'N/A', pluginCount: 0, signals: { mouseMovement: false, clickCadence: false, scrollBehavior: false, typingPattern: false, focusBlur: false, touchEvents: false }, flags: ['python-requests user agent', 'No browser capabilities', 'DigitalOcean datacenter IP', 'Scraper pattern: rapid page fetches'] },
      { id: 'bs-6', ip: '73.162.44.201', country: 'US', countryFlag: '🇺🇸', botScore: 12, isHeadless: false, isVPN: false, room: 'amber_rose', connectedAt: Date.now() - 2400000, lastActivity: Date.now() - 8000, messageCount: 8, userAgent: 'Mozilla/5.0 Chrome/122', screen: '2560×1440', timezone: 'America/Chicago', language: 'en-US', webglRenderer: 'NVIDIA RTX 3080', canvasHash: 'f7b3...1a92', pluginCount: 7, signals: { mouseMovement: true, clickCadence: true, scrollBehavior: true, typingPattern: true, focusBlur: true, touchEvents: false }, flags: [] },
      { id: 'bs-7', ip: '178.62.232.15', country: 'GB', countryFlag: '🇬🇧', botScore: 71, isHeadless: false, isVPN: true, room: 'diamond_val', connectedAt: Date.now() - 120000, lastActivity: Date.now() - 4000, messageCount: 31, userAgent: 'Mozilla/5.0 Chrome/121', screen: '1920×1080', timezone: 'Europe/London', language: 'en-GB', webglRenderer: 'Intel HD 4000', canvasHash: 'a1c3...5e77', pluginCount: 1, signals: { mouseMovement: true, clickCadence: false, scrollBehavior: true, typingPattern: false, focusBlur: true, touchEvents: false }, flags: ['31 messages in 2min (flood)', 'Repeated message patterns', 'VPN detected'] },
    ];
    this._set('sts_botshield_sessions', JSON.stringify(demo));
    return demo;
  }

  saveBotShieldSessions(sessions) {
    this._set('sts_botshield_sessions', JSON.stringify(sessions));
  }

  getBotShieldLog() {
    const stored = this._get('sts_botshield_log');
    if (stored) return JSON.parse(stored);

    const demo = [
      { id: 'bl-1', type: 'headless', severity: 'critical', action: 'blocked', sessionId: 'bs-1', message: 'HeadlessChrome detected from 185.220.101.42 — connection rejected', timestamp: Date.now() - 180000 },
      { id: 'bl-2', type: 'spam', severity: 'high', action: 'shadow_banned', sessionId: 'bs-7', message: 'Chat flood: 31 messages in 2min from 178.62.232.15 in room diamond_val', timestamp: Date.now() - 120000 },
      { id: 'bl-3', type: 'scraper', severity: 'critical', action: 'blocked', sessionId: 'bs-5', message: 'python-requests bot from DigitalOcean IP 104.248.96.23 — scraping performer profiles', timestamp: Date.now() - 45000 },
      { id: 'bl-4', type: 'fake_acct', severity: 'high', action: 'blocked', sessionId: null, message: 'Registration blocked: 4th account attempt from device fingerprint a3f2...c891 in 1 hour', timestamp: Date.now() - 3600000 },
      { id: 'bl-5', type: 'credential', severity: 'critical', action: 'blocked', sessionId: null, message: 'Credential stuffing detected: 47 failed logins from 91.108.56.0/24 in 5 minutes', timestamp: Date.now() - 7200000 },
      { id: 'bl-6', type: 'viewer_bot', severity: 'medium', action: 'flagged', sessionId: 'bs-3', message: 'Suspicious viewer: no scroll, no focus events, idle 90s in room — possible view inflator', timestamp: Date.now() - 300000 },
      { id: 'bl-7', type: 'flood', severity: 'high', action: 'throttled', sessionId: null, message: 'Connection flood: 14 WebRTC connections in 3s from 185.220.101.0/24', timestamp: Date.now() - 600000 },
      { id: 'bl-8', type: 'tip_fraud', severity: 'critical', action: 'blocked', sessionId: null, message: 'Automated tip pattern: 50 micro-tips ($0.10 each) in 60s from new account — frozen', timestamp: Date.now() - 14400000 },
      { id: 'bl-9', type: 'spam', severity: 'medium', action: 'shadow_banned', sessionId: null, message: 'Link spam in chat: "free tokens at t.me/..." — message hidden, user shadow-banned', timestamp: Date.now() - 28800000 },
      { id: 'bl-10', type: 'fake_acct', severity: 'medium', action: 'challenged', sessionId: null, message: 'Honeypot triggered on registration form — bot filled hidden field', timestamp: Date.now() - 43200000 },
    ];
    this._set('sts_botshield_log', JSON.stringify(demo));
    return demo;
  }

  addBotShieldLog(entry) {
    const log = this.getBotShieldLog();
    log.unshift({
      id: 'bl-' + Date.now(),
      timestamp: Date.now(),
      ...entry,
    });
    this._set('sts_botshield_log', JSON.stringify(log.slice(0, 100)));
    return log;
  }

  // ============================================
  // BROWSE FILTERS
  // ============================================
  getBrowseFilters() {
    const stored = this._get('sts_browse_filters');
    return stored ? JSON.parse(stored) : {
      liveOnly: false,
      selectedStates: [],
      sortBy: 'viewers', // 'viewers', 'name', 'club'
    };
  }

  saveBrowseFilters(filters) {
    this._set('sts_browse_filters', JSON.stringify(filters));
  }

  // ============================================
  // CLEAR ALL
  // ============================================
  clearAllData() {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith('livestream_') || k.startsWith('sts_')
    );
    keys.forEach(key => this._del(key));
    this.initializeDefaults();
  }

  exportData() {
    return {
      balance: this.getBalance(),
      tipButtons: this.getTipButtons(),
      lovenseLevels: this.getLovenseLevels(),
      onlineSchedule: this.getOnlineSchedule(),
      liveSchedule: this.getLiveSchedule(),
      privateSettings: this.getPrivateShowSettings(),
      transactions: this.getTransactions(),
      favorites: this.getFavorites(),
    };
  }
}

// Singleton instance
const db = new Database();
export default db;
