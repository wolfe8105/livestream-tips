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
