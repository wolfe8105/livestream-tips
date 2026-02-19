/**
 * CHAT SERVICE
 * =============
 * Currently: Mock in-memory chat (no real-time)
 *
 * TO SWAP FOR PRODUCTION (WebSocket):
 *
 *   const CHAT_WS_URL = 'wss://your-server.com/chat';
 *   let socket = null;
 *   let messageCallback = null;
 *
 *   export function connectChat(roomId, onMessage) {
 *     socket = new WebSocket(`${CHAT_WS_URL}?room=${roomId}`);
 *     messageCallback = onMessage;
 *     socket.onmessage = (event) => {
 *       const msg = JSON.parse(event.data);
 *       messageCallback(msg);
 *     };
 *     socket.onclose = () => console.log('Chat disconnected');
 *   }
 *
 *   export function sendChatMessage(text) {
 *     if (socket?.readyState === WebSocket.OPEN) {
 *       socket.send(JSON.stringify({ type: 'chat', text }));
 *     }
 *   }
 *
 *   export function disconnectChat() {
 *     socket?.close();
 *     socket = null;
 *   }
 */

// Mock chat history (in-memory, resets on page refresh)
let chatHistory = [
  { type: 'system', text: 'Welcome to StreamToStage — 100% verified real performers 🛡️', timestamp: Date.now() - 60000 },
  { type: 'tip', user: 'viewer_42', text: 'hey! 👋', timestamp: Date.now() - 30000 },
  { type: 'tip', user: 'BigSpender', amount: 100, text: '🔥', timestamp: Date.now() - 10000 },
];

let messageCallback = null;

export function connectChat(_roomId, onMessage) {
  /**
   * PRODUCTION: Replace with WebSocket connection
   */
  messageCallback = onMessage;
  // Send existing history
  if (onMessage) {
    onMessage([...chatHistory]);
  }
}

export function sendChatMessage(message) {
  /**
   * PRODUCTION: Send over WebSocket
   */
  const msg = {
    ...message,
    timestamp: Date.now(),
  };
  chatHistory.unshift(msg);

  // Notify listener
  if (messageCallback) {
    messageCallback([...chatHistory]);
  }
}

export function getChatHistory() {
  return [...chatHistory];
}

export function disconnectChat() {
  /**
   * PRODUCTION: Close WebSocket
   */
  messageCallback = null;
}

export function clearChat() {
  chatHistory = [
    { type: 'system', text: 'Welcome to StreamToStage — 100% verified real performers 🛡️', timestamp: Date.now() },
  ];
}
