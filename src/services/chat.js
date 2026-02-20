/**
 * CHAT SERVICE — HYBRID
 * ======================
 * Production: Real-time WebSocket chat
 * Demo: In-memory mock (same as before)
 */

import { connectWebSocket, sendWebSocketMessage, disconnectWebSocket, isDemoMode } from './api.js';

// Mock chat history (demo mode)
let chatHistory = [
  { type: 'system', text: 'Welcome to StreamToStage — 100% verified real performers 🛡️', timestamp: Date.now() - 60000 },
  { type: 'tip', user: 'viewer_42', text: 'hey! 👋', timestamp: Date.now() - 30000 },
  { type: 'tip', user: 'BigSpender', amount: 100, text: '🔥', timestamp: Date.now() - 10000 },
];

let messageCallback = null;
let wsConnection = null;

export function connectChat(roomId, onMessage) {
  messageCallback = onMessage;

  if (isDemoMode()) {
    // Demo: send existing history
    if (onMessage) {
      onMessage([...chatHistory]);
    }
    return;
  }

  // Production: connect via WebSocket
  wsConnection = connectWebSocket(roomId, (msg) => {
    if (msg.type === 'history') {
      // Initial history load
      chatHistory = msg.messages || [];
      if (messageCallback) messageCallback([...chatHistory]);
    } else {
      // New message
      chatHistory.unshift(msg);
      if (messageCallback) messageCallback([...chatHistory]);
    }
  });
}

export function sendChatMessage(message) {
  if (isDemoMode()) {
    // Demo: add locally
    const msg = { ...message, timestamp: Date.now() };
    chatHistory.unshift(msg);
    if (messageCallback) messageCallback([...chatHistory]);
    return;
  }

  // Production: send via WebSocket
  sendWebSocketMessage({
    type: message.type || 'chat',
    text: message.text,
    amount: message.amount,
    isAnonymous: message.isAnonymous,
    message: message.text,
  });
}

export function getChatHistory() {
  return [...chatHistory];
}

export function disconnectChat() {
  messageCallback = null;
  if (!isDemoMode()) {
    disconnectWebSocket();
    wsConnection = null;
  }
}

export function clearChat() {
  chatHistory = [
    { type: 'system', text: 'Welcome to StreamToStage — 100% verified real performers 🛡️', timestamp: Date.now() },
  ];
}
