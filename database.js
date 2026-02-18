/**
 * LiveStream Tips - Database Abstraction Layer
 * 
 * TEMPORARY: Uses localStorage for client-side storage
 * PRODUCTION: Swap commented sections to use real API/database
 * 
 * This file provides a unified interface for all data operations.
 * When ready for production, simply uncomment the production code
 * and comment out the temporary code. Your app code won't need to change!
 */

class Database {
  constructor() {
    this.initializeDefaults();
  }

  /**
   * Initialize default data if nothing exists in localStorage
   */
  initializeDefaults() {
    // Only set defaults if nothing exists
    if (!localStorage.getItem('livestream_initialized')) {
      // User data
      this.setBalance(250);
      
      // Default tip buttons
      this.saveTipButtons([
        { icon: '🎁', label: 'Small', amount: 10 },
        { icon: '💖', label: 'Medium', amount: 50 },
        { icon: '💝', label: 'Big', amount: 100 },
        { icon: '🐋', label: 'Whale', amount: 500 }
      ]);
      
      // Default Lovense levels
      this.saveLovenseLevels([
        { id: 1, icon: '💗', label: 'Low Vibe', tokens: 15, duration: 10 },
        { id: 2, icon: '💖', label: 'Medium Vibe', tokens: 30, duration: 15 },
        { id: 3, icon: '💝', label: 'High Vibe', tokens: 60, duration: 20 },
        { id: 4, icon: '🔥', label: 'Ultra Vibe', tokens: 100, duration: 30 }
      ]);
      
      // Default schedules
      this.saveOnlineSchedule([
        { id: 1, day: 'Monday', startTime: '18:00', endTime: '23:00' },
        { id: 2, day: 'Wednesday', startTime: '19:00', endTime: '00:00' },
        { id: 3, day: 'Friday', startTime: '20:00', endTime: '02:00' }
      ]);
      
      this.saveLiveSchedule([
        { id: 1, day: 'Monday', startTime: '20:00', endTime: '22:00' },
        { id: 2, day: 'Friday', startTime: '21:00', endTime: '23:00' }
      ]);
      
      // Default private show settings
      this.savePrivateShowSettings({
        tokensPerMin: 60,
        minDuration: 10,
        extensions: [
          { minutes: 5, tokens: 250 },
          { minutes: 10, tokens: 450 },
          { minutes: 15, tokens: 650 }
        ]
      });
      
      localStorage.setItem('livestream_initialized', 'true');
    }
  }

  // ============================================
  // USER / WALLET METHODS
  // ============================================

  /**
   * Get user's token balance
   * @returns {number} Token balance
   */
  getBalance() {
    // TEMPORARY: localStorage
    const balance = localStorage.getItem('livestream_balance');
    return balance ? parseInt(balance) : 250;
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/user/balance', {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // const data = await response.json();
    // return data.balance;
  }

  /**
   * Set user's token balance
   * @param {number} amount - New balance
   */
  setBalance(amount) {
    // TEMPORARY: localStorage
    localStorage.setItem('livestream_balance', amount.toString());
    
    // PRODUCTION: Don't allow direct balance setting
    // Balance should only be updated server-side after validated transactions
    // This method would not exist in production
  }

  /**
   * Add tokens to balance (purchase)
   * @param {number} amount - Tokens to add
   * @returns {Object} Transaction result
   */
  async addTokens(amount) {
    // TEMPORARY: localStorage
    const current = this.getBalance();
    this.setBalance(current + amount);
    
    // Save transaction
    this.addTransaction({
      type: 'purchase',
      amount: amount,
      timestamp: Date.now()
    });
    
    return { success: true, newBalance: current + amount };
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/wallet/purchase', {
    //   method: 'POST',
    //   headers: { 
    //     'Authorization': `Bearer ${this.getAuthToken()}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ amount, paymentMethod: 'ccbill' })
    // });
    // return response.json();
  }

  /**
   * Deduct tokens from balance
   * @param {number} amount - Tokens to deduct
   * @param {string} reason - Transaction reason (tip, private, lovense)
   * @returns {Object} Transaction result
   */
  async deductTokens(amount, reason = 'unknown') {
    // TEMPORARY: localStorage
    const current = this.getBalance();
    
    if (current < amount) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    this.setBalance(current - amount);
    
    // Save transaction
    this.addTransaction({
      type: reason,
      amount: -amount,
      timestamp: Date.now()
    });
    
    return { success: true, newBalance: current - amount };
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/wallet/spend', {
    //   method: 'POST',
    //   headers: { 
    //     'Authorization': `Bearer ${this.getAuthToken()}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ amount, reason, streamerId })
    // });
    // return response.json();
  }

  // ============================================
  // TIP BUTTONS
  // ============================================

  /**
   * Get custom tip buttons
   * @returns {Array} Array of tip button configs
   */
  getTipButtons() {
    // TEMPORARY: localStorage
    const stored = localStorage.getItem('livestream_tip_buttons');
    return stored ? JSON.parse(stored) : [];
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/tip-buttons', {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // return response.json();
  }

  /**
   * Save custom tip buttons
   * @param {Array} buttons - Array of tip button configs
   */
  saveTipButtons(buttons) {
    // TEMPORARY: localStorage
    localStorage.setItem('livestream_tip_buttons', JSON.stringify(buttons));
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/tip-buttons', {
    //   method: 'PUT',
    //   headers: { 
    //     'Authorization': `Bearer ${this.getAuthToken()}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ buttons })
    // });
    // return response.json();
  }

  // ============================================
  // LOVENSE LEVELS
  // ============================================

  /**
   * Get Lovense control levels
   * @returns {Array} Array of Lovense level configs
   */
  getLovenseLevels() {
    // TEMPORARY: localStorage
    const stored = localStorage.getItem('livestream_lovense_levels');
    return stored ? JSON.parse(stored) : [];
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/lovense-levels', {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // return response.json();
  }

  /**
   * Save Lovense control levels
   * @param {Array} levels - Array of Lovense level configs
   */
  saveLovenseLevels(levels) {
    // TEMPORARY: localStorage
    localStorage.setItem('livestream_lovense_levels', JSON.stringify(levels));
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/lovense-levels', {
    //   method: 'PUT',
    //   headers: { 
    //     'Authorization': `Bearer ${this.getAuthToken()}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ levels })
    // });
    // return response.json();
  }

  // ============================================
  // SCHEDULES
  // ============================================

  /**
   * Get online hours schedule
   * @returns {Array} Array of schedule slots
   */
  getOnlineSchedule() {
    // TEMPORARY: localStorage
    const stored = localStorage.getItem('livestream_online_schedule');
    return stored ? JSON.parse(stored) : [];
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/schedule/online', {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // return response.json();
  }

  /**
   * Save online hours schedule
   * @param {Array} schedule - Array of schedule slots
   */
  saveOnlineSchedule(schedule) {
    // TEMPORARY: localStorage
    localStorage.setItem('livestream_online_schedule', JSON.stringify(schedule));
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/schedule/online', {
    //   method: 'PUT',
    //   headers: { 
    //     'Authorization': `Bearer ${this.getAuthToken()}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ schedule })
    // });
    // return response.json();
  }

  /**
   * Get live streaming hours schedule
   * @returns {Array} Array of schedule slots
   */
  getLiveSchedule() {
    // TEMPORARY: localStorage
    const stored = localStorage.getItem('livestream_live_schedule');
    return stored ? JSON.parse(stored) : [];
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/schedule/live', {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // return response.json();
  }

  /**
   * Save live streaming hours schedule
   * @param {Array} schedule - Array of schedule slots
   */
  saveLiveSchedule(schedule) {
    // TEMPORARY: localStorage
    localStorage.setItem('livestream_live_schedule', JSON.stringify(schedule));
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/schedule/live', {
    //   method: 'PUT',
    //   headers: { 
    //     'Authorization': `Bearer ${this.getAuthToken()}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ schedule })
    // });
    // return response.json();
  }

  // ============================================
  // PRIVATE SHOW SETTINGS
  // ============================================

  /**
   * Get private show settings
   * @returns {Object} Private show configuration
   */
  getPrivateShowSettings() {
    // TEMPORARY: localStorage
    const stored = localStorage.getItem('livestream_private_settings');
    return stored ? JSON.parse(stored) : {
      tokensPerMin: 60,
      minDuration: 10,
      extensions: []
    };
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/private-settings', {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // return response.json();
  }

  /**
   * Save private show settings
   * @param {Object} settings - Private show configuration
   */
  savePrivateShowSettings(settings) {
    // TEMPORARY: localStorage
    localStorage.setItem('livestream_private_settings', JSON.stringify(settings));
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/dashboard/private-settings', {
    //   method: 'PUT',
    //   headers: { 
    //     'Authorization': `Bearer ${this.getAuthToken()}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(settings)
    // });
    // return response.json();
  }

  // ============================================
  // TRANSACTIONS / HISTORY
  // ============================================

  /**
   * Get transaction history
   * @param {number} limit - Max number of transactions to return
   * @returns {Array} Array of transactions
   */
  getTransactions(limit = 50) {
    // TEMPORARY: localStorage
    const stored = localStorage.getItem('livestream_transactions');
    const transactions = stored ? JSON.parse(stored) : [];
    return transactions.slice(0, limit);
    
    // PRODUCTION: Replace with API call
    // const response = await fetch(`/api/transactions?limit=${limit}`, {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // return response.json();
  }

  /**
   * Add a transaction to history
   * @param {Object} transaction - Transaction details
   */
  addTransaction(transaction) {
    // TEMPORARY: localStorage
    const stored = localStorage.getItem('livestream_transactions');
    const transactions = stored ? JSON.parse(stored) : [];
    
    transactions.unshift({
      id: Date.now(),
      ...transaction
    });
    
    // Keep only last 100 transactions
    const trimmed = transactions.slice(0, 100);
    localStorage.setItem('livestream_transactions', JSON.stringify(trimmed));
    
    // PRODUCTION: Server handles this automatically
    // Transactions are created server-side, not client-side
  }

  // ============================================
  // STREAMERS
  // ============================================

  /**
   * Get streamer profile by ID
   * @param {string} streamerId - Streamer ID
   * @returns {Object} Streamer profile data
   */
  async getStreamerProfile(streamerId) {
    // TEMPORARY: Return mock data (would need actual streamer database)
    return {
      id: streamerId,
      name: 'Crystal Rose',
      avatar: 'C',
      color: '#ff5733',
      isLive: false,
      viewers: 0,
      onlineSchedule: this.getOnlineSchedule(),
      liveSchedule: this.getLiveSchedule()
    };
    
    // PRODUCTION: Replace with API call
    // const response = await fetch(`/api/streamers/${streamerId}`, {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // return response.json();
  }

  /**
   * Get list of all streamers
   * @param {Object} filters - Filter options (isLive, category, etc.)
   * @returns {Array} Array of streamers
   */
  async getStreamers(filters = {}) {
    // TEMPORARY: Return mock data
    return [];
    
    // PRODUCTION: Replace with API call
    // const queryString = new URLSearchParams(filters).toString();
    // const response = await fetch(`/api/streamers?${queryString}`);
    // return response.json();
  }

  // ============================================
  // MESSAGES (Placeholder)
  // ============================================

  /**
   * Get messages inbox
   * @returns {Array} Array of messages
   */
  async getMessages() {
    // TEMPORARY: Return empty array
    return [];
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/messages/inbox', {
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // return response.json();
  }

  /**
   * Send a message
   * @param {string} toUserId - Recipient user ID
   * @param {string} content - Message content
   * @returns {Object} Send result
   */
  async sendMessage(toUserId, content) {
    // TEMPORARY: Just return success
    return { success: true, messageId: Date.now() };
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/messages/send', {
    //   method: 'POST',
    //   headers: { 
    //     'Authorization': `Bearer ${this.getAuthToken()}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ toUserId, content })
    // });
    // return response.json();
  }

  // ============================================
  // AUTHENTICATION (For Production)
  // ============================================

  /**
   * Get authentication token
   * @returns {string} JWT token
   */
  getAuthToken() {
    // TEMPORARY: Not needed for localStorage
    return null;
    
    // PRODUCTION: Return JWT from secure storage
    // return sessionStorage.getItem('auth_token');
  }

  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Object} Login result with token
   */
  async login(username, password) {
    // TEMPORARY: Skip authentication
    return { success: true, token: null };
    
    // PRODUCTION: Replace with API call
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username, password })
    // });
    // const data = await response.json();
    // if (data.token) {
    //   sessionStorage.setItem('auth_token', data.token);
    // }
    // return data;
  }

  /**
   * Logout user
   */
  async logout() {
    // TEMPORARY: Clear all localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('livestream_'));
    keys.forEach(key => localStorage.removeItem(key));
    
    // PRODUCTION: Replace with API call
    // await fetch('/api/auth/logout', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    // });
    // sessionStorage.removeItem('auth_token');
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Clear all data (for testing)
   */
  clearAllData() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('livestream_'));
    keys.forEach(key => localStorage.removeItem(key));
    this.initializeDefaults();
  }

  /**
   * Export all data (for backup)
   * @returns {Object} All user data
   */
  exportData() {
    return {
      balance: this.getBalance(),
      tipButtons: this.getTipButtons(),
      lovenseLevels: this.getLovenseLevels(),
      onlineSchedule: this.getOnlineSchedule(),
      liveSchedule: this.getLiveSchedule(),
      privateSettings: this.getPrivateShowSettings(),
      transactions: this.getTransactions()
    };
  }

  /**
   * Import data (for restore)
   * @param {Object} data - Data to import
   */
  importData(data) {
    if (data.balance) this.setBalance(data.balance);
    if (data.tipButtons) this.saveTipButtons(data.tipButtons);
    if (data.lovenseLevels) this.saveLovenseLevels(data.lovenseLevels);
    if (data.onlineSchedule) this.saveOnlineSchedule(data.onlineSchedule);
    if (data.liveSchedule) this.saveLiveSchedule(data.liveSchedule);
    if (data.privateSettings) this.savePrivateShowSettings(data.privateSettings);
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

// Create and export a single instance
const db = new Database();

// For browser (no module system)
if (typeof window !== 'undefined') {
  window.db = db;
}

// For Node.js / module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = db;
}

// For ES6 modules
export default db;
