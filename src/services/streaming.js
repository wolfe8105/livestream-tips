/**
 * STREAMING SERVICE — HYBRID
 * ============================
 * Production: Ant Media Server WebRTC via API
 * Demo: Mock (avatar placeholder)
 *
 * When AMS is deployed, swap the TODO sections with real WebRTCAdaptor calls.
 */

import { api, isDemoMode } from './api.js';

let activeStream = null;

// ============================================
// CONNECT TO STREAM (Viewer)
// ============================================
export function connectToStream(streamId, _videoElement) {
  if (isDemoMode()) {
    console.log(`[MOCK] Connecting to stream: ${streamId}`);
    activeStream = { id: streamId, status: 'connected', startedAt: Date.now() };
    return activeStream;
  }

  // TODO: Ant Media Server integration
  // import { WebRTCAdaptor } from '@anthropic/ant-media-webrtc-adaptor';
  // const adaptor = new WebRTCAdaptor({
  //   websocket_url: import.meta.env.VITE_ANT_MEDIA_URL,
  //   mediaConstraints: { video: false, audio: false },
  //   remoteVideoElement: _videoElement,
  //   callback: (info) => {
  //     if (info === 'play_started') console.log('Stream playing');
  //   },
  // });
  // adaptor.play(streamId);

  activeStream = { id: streamId, status: 'connected', startedAt: Date.now() };
  return activeStream;
}

// ============================================
// DISCONNECT FROM STREAM (Viewer)
// ============================================
export function disconnectFromStream() {
  console.log('[STREAM] Disconnecting');
  // TODO: adaptor.stop(streamId); adaptor.closeWebSocket();
  activeStream = null;
}

// ============================================
// START BROADCAST (Performer)
// ============================================
export async function startBroadcast(streamId, _videoElement) {
  if (isDemoMode()) {
    console.log(`[MOCK] Starting broadcast: ${streamId}`);
    activeStream = { id: streamId, status: 'broadcasting', startedAt: Date.now() };
    return activeStream;
  }

  try {
    // Create stream on backend
    const data = await api.post('/streams/start', {
      title: '', // Set from GoLive page
      category: '',
    });

    activeStream = {
      id: data.streamId,
      streamKey: data.streamKey,
      status: 'broadcasting',
      startedAt: Date.now(),
    };

    // TODO: Ant Media publish
    // const adaptor = new WebRTCAdaptor({
    //   websocket_url: import.meta.env.VITE_ANT_MEDIA_URL,
    //   mediaConstraints: { video: true, audio: true },
    //   localVideoElement: _videoElement,
    //   callback: (info) => {
    //     if (info === 'initialized') adaptor.publish(data.streamKey);
    //   },
    // });

    return activeStream;
  } catch (err) {
    console.error('[STREAM] Start failed:', err);
    // Fallback to mock
    activeStream = { id: streamId, status: 'broadcasting', startedAt: Date.now() };
    return activeStream;
  }
}

// ============================================
// STOP BROADCAST (Performer)
// ============================================
export async function stopBroadcast() {
  console.log('[STREAM] Stopping broadcast');

  if (!isDemoMode()) {
    try {
      await api.post('/streams/stop');
    } catch (e) {
      console.warn('[STREAM] Stop API call failed:', e.message);
    }
  }

  // TODO: adaptor.stop(streamId);
  activeStream = null;
}

// ============================================
// GET STATUS
// ============================================
export function getStreamStatus() {
  return activeStream;
}

// ============================================
// GET ACTIVE STREAMS (for browse page)
// ============================================
export async function getActiveStreams() {
  if (isDemoMode()) return [];
  try {
    const data = await api.get('/streams/active');
    return data.streams || [];
  } catch (e) {
    return [];
  }
}
