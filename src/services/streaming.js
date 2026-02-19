/**
 * STREAMING SERVICE
 * =================
 * Currently: Mock (shows avatar placeholder instead of video)
 *
 * TO SWAP FOR PRODUCTION (Ant Media Server):
 * 
 * 1. Install Ant Media Server on your server
 * 2. Install their JS SDK:
 *    npm install @anthropic/ant-media-webrtc-adaptor
 *    (or use their CDN script)
 *
 * 3. Replace the functions below:
 *
 *   import { WebRTCAdaptor } from '@anthropic/ant-media-webrtc-adaptor';
 *
 *   const ANT_MEDIA_URL = 'wss://your-server.com:5443/WebRTCAppEE/websocket';
 *
 *   export function connectToStream(streamId, videoElement) {
 *     const adaptor = new WebRTCAdaptor({
 *       websocket_url: ANT_MEDIA_URL,
 *       mediaConstraints: { video: false, audio: false },
 *       remoteVideoElement: videoElement,
 *       callback: (info) => {
 *         if (info === 'play_started') console.log('Stream playing');
 *       },
 *     });
 *     adaptor.play(streamId);
 *     return adaptor;
 *   }
 *
 *   export function startBroadcast(streamId, videoElement) {
 *     const adaptor = new WebRTCAdaptor({
 *       websocket_url: ANT_MEDIA_URL,
 *       mediaConstraints: { video: true, audio: true },
 *       localVideoElement: videoElement,
 *       callback: (info) => {
 *         if (info === 'initialized') adaptor.publish(streamId);
 *       },
 *     });
 *     return adaptor;
 *   }
 */

// Mock streaming state
let activeStream = null;

export function connectToStream(streamId, _videoElement) {
  /**
   * PRODUCTION: Replace with Ant Media WebRTC connection
   */
  console.log(`[MOCK] Connecting to stream: ${streamId}`);
  activeStream = {
    id: streamId,
    status: 'connected',
    startedAt: Date.now(),
  };
  return activeStream;
}

export function disconnectFromStream() {
  /**
   * PRODUCTION: adaptor.stop(streamId); adaptor.closeWebSocket();
   */
  console.log('[MOCK] Disconnecting from stream');
  activeStream = null;
}

export function startBroadcast(streamId, _videoElement) {
  /**
   * PRODUCTION: Replace with Ant Media publish flow
   */
  console.log(`[MOCK] Starting broadcast: ${streamId}`);
  activeStream = {
    id: streamId,
    status: 'broadcasting',
    startedAt: Date.now(),
  };
  return activeStream;
}

export function stopBroadcast() {
  /**
   * PRODUCTION: adaptor.stop(streamId);
   */
  console.log('[MOCK] Stopping broadcast');
  activeStream = null;
}

export function getStreamStatus() {
  return activeStream;
}
