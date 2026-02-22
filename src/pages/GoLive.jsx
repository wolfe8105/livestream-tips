import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import db from '../services/database.js';
import { startBroadcast, stopBroadcast, getStreamStatus } from '../services/streaming.js';

export default function GoLive() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [settings, setSettings] = useState(db.getStreamSettings());
  const [showKey, setShowKey] = useState(false);
  const [isLive, setIsLive] = useState(settings.isLive);
  const [streamTime, setStreamTime] = useState(0);
  const [mockViewers, setMockViewers] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(null);
  const [cameraPreview, setCameraPreview] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Stream timer
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setStreamTime(t => t + 1);
        setMockViewers(v => {
          const delta = Math.floor(Math.random() * 5) - 2;
          return Math.max(0, v + delta);
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [isLive]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  async function toggleCamera() {
    if (cameraPreview) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraPreview(false);
      setCameraError(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraPreview(true);
        setCameraError(null);
      } catch (err) {
        setCameraError('Camera access denied or unavailable. In production, your webcam feed will appear here.');
        setCameraPreview(false);
      }
    }
  }

  function goLive() {
    if (isLive) {
      stopBroadcast();
      setIsLive(false);
      setStreamTime(0);
      setMockViewers(0);
      const updated = { ...settings, isLive: false, startedAt: null };
      setSettings(updated);
      db.saveStreamSettings(updated);
    } else {
      startBroadcast(settings.streamKey);
      setIsLive(true);
      setStreamTime(0);
      setMockViewers(Math.floor(Math.random() * 20) + 5);
      const updated = { ...settings, isLive: true, startedAt: Date.now() };
      setSettings(updated);
      db.saveStreamSettings(updated);
    }
  }

  function regenerateKey() {
    if (!window.confirm('⚠️ Regenerate stream key?\n\nYour old key will stop working immediately. You\'ll need to update OBS/streaming software.')) return;
    const newKey = 'sts_live_' + Math.random().toString(36).substring(2, 10);
    const updated = { ...settings, streamKey: newKey };
    setSettings(updated);
    db.saveStreamSettings(updated);
  }

  function copyToClipboard(text, label) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function saveSetting(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    db.saveStreamSettings(updated);
  }

  function formatTime(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="page-pad">
      <div className="flex-between mb-20">
        <div>
          <h2 className="text-hot text-3xl font-black mb-4">📡 Go Live</h2>
          <p className="text-muted text-sm">Streaming dashboard</p>
        </div>
        <button className="config-badge config-badge-violet" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
      </div>

      {/* Live Status Banner */}
      {isLive && (
        <div className="card mb-16" style={{
          padding: 16, background: 'rgba(225,29,72,0.15)',
          border: '1px solid rgba(225,29,72,0.4)', borderRadius: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="pulse-dot" style={{ width: 12, height: 12 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--red)' }}>YOU ARE LIVE</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatTime(streamTime)}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>👁️ {mockViewers}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>viewers</div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Preview */}
      <div className="card card-surface mb-16" style={{ overflow: 'hidden' }}>
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '16/9',
          background: '#000', borderRadius: 12, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <video ref={videoRef} autoPlay muted playsInline style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: cameraPreview ? 'block' : 'none',
          }} />
          {!cameraPreview && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📹</div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                {cameraError || 'Camera preview off'}
              </div>
            </div>
          )}
          {isLive && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'var(--red)', color: '#fff',
              padding: '4px 10px', borderRadius: 6,
              fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div className="pulse-dot" style={{ width: 8, height: 8 }} /> LIVE
            </div>
          )}
          {isLive && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(0,0,0,0.7)', color: '#fff',
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
            }}>
              {formatTime(streamTime)}
            </div>
          )}
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-save"
              style={{ flex: 1, fontSize: 14, padding: 14 }}
              onClick={toggleCamera}
            >
              {cameraPreview ? '📹 Camera Off' : '📹 Preview Camera'}
            </button>
            <button
              onClick={goLive}
              style={{
                flex: 1, fontSize: 14, padding: 14, borderRadius: 12,
                fontWeight: 800, cursor: 'pointer', border: 'none',
                background: isLive ? 'var(--red)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
              }}
            >
              {isLive ? '⏹ End Stream' : '🔴 Go Live'}
            </button>
          </div>
        </div>
      </div>

      {/* Stream Stats (when live) */}
      {isLive && (
        <div className="grid-2col mb-16">
          <div className="card card-surface text-center" style={{ padding: 14 }}>
            <div className="text-2xl font-black text-hot">{mockViewers}</div>
            <div className="text-xs text-muted mt-4">Current Viewers</div>
          </div>
          <div className="card card-surface text-center" style={{ padding: 14 }}>
            <div className="text-2xl font-black text-gold">{Math.max(mockViewers, settings.peakViewers)}</div>
            <div className="text-xs text-muted mt-4">Peak Viewers</div>
          </div>
        </div>
      )}

      {/* OBS / Stream Key */}
      <div className="card card-surface mb-16">
        <h3 className="text-violet text-xl mb-16">🔑 Stream Key & Server</h3>
        <p className="text-dim text-sm mb-16">Use these in OBS Studio, Streamlabs, or any RTMP-compatible software.</p>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Server URL</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" className="form-input" value={settings.serverUrl} readOnly style={{ flex: 1, fontSize: 12 }} />
            <button
              className="btn-save"
              style={{ padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap' }}
              onClick={() => copyToClipboard(settings.serverUrl, 'url')}
            >
              {copied === 'url' ? '✅' : '📋'} Copy
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Stream Key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="form-input"
              value={settings.streamKey}
              readOnly
              style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }}
            />
            <button
              className="btn-save"
              style={{ padding: '8px 14px', fontSize: 12 }}
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
            <button
              className="btn-save"
              style={{ padding: '8px 14px', fontSize: 12 }}
              onClick={() => copyToClipboard(settings.streamKey, 'key')}
            >
              {copied === 'key' ? '✅' : '📋'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-pink" style={{ fontSize: 12, padding: '8px 14px' }} onClick={regenerateKey}>
            🔄 Regenerate Key
          </button>
        </div>

        <div style={{
          marginTop: 16, padding: 12, borderRadius: 10,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          fontSize: 11, color: 'var(--gold)',
        }}>
          ⚠️ Never share your stream key publicly. Anyone with this key can stream to your channel.
        </div>
      </div>

      {/* Quick OBS Setup Guide */}
      <div className="card card-surface mb-16" style={{ borderColor: 'rgba(99,102,241,0.25)' }}>
        <h3 className="text-violet text-lg mb-12">📋 OBS Quick Setup</h3>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          <div><strong className="text-white">1.</strong> Open OBS Studio → Settings → Stream</div>
          <div><strong className="text-white">2.</strong> Service: <strong className="text-violet">Custom</strong></div>
          <div><strong className="text-white">3.</strong> Server: paste the Server URL above</div>
          <div><strong className="text-white">4.</strong> Stream Key: paste your Stream Key above</div>
          <div><strong className="text-white">5.</strong> Click "Start Streaming" in OBS</div>
          <div style={{ marginTop: 8, color: 'var(--dim)', fontSize: 11 }}>
            Recommended: 1080p, 4500 kbps, 30 fps, x264 encoder
          </div>
        </div>
      </div>

      {/* Stream Settings */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-16" onClick={() => setShowSettings(!showSettings)} style={{ cursor: 'pointer' }}>
          <h3 className="text-gold text-xl">⚙️ Stream Settings</h3>
          <span style={{ color: 'var(--muted)' }}>{showSettings ? '▼' : '▶'}</span>
        </div>

        {showSettings && (
          <>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Resolution</label>
              <select className="form-select" value={settings.resolution} onChange={(e) => saveSetting('resolution', e.target.value)}>
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="1440p">1440p (2K)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Bitrate (kbps)</label>
              <input type="number" className="form-input form-input-gold" value={settings.bitrate} min={1000} max={10000} step={500}
                onChange={(e) => saveSetting('bitrate', parseInt(e.target.value) || 4500)} />
              <div className="hint">Higher = better quality, requires faster upload speed</div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">FPS</label>
              <select className="form-select" value={settings.fps} onChange={(e) => saveSetting('fps', parseInt(e.target.value))}>
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.lowLatency} onChange={(e) => saveSetting('lowLatency', e.target.checked)} />
                <span>⚡ Low Latency Mode</span>
                <span style={{ fontSize: 11, color: 'var(--dim)' }}>~2s delay</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.autoRecord} onChange={(e) => saveSetting('autoRecord', e.target.checked)} />
                <span>🎬 Auto-Record Streams</span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Lifetime Stats */}
      <div className="card card-surface mb-16">
        <h3 className="text-violet text-lg mb-12">📊 Stream Stats</h3>
        <div className="grid-2col">
          <div className="card card-surface text-center" style={{ padding: 12 }}>
            <div className="text-xl font-black text-gold">{Math.floor(settings.totalStreamMinutes / 60)}h</div>
            <div className="text-xs text-muted mt-4">Total Stream Time</div>
          </div>
          <div className="card card-surface text-center" style={{ padding: 12 }}>
            <div className="text-xl font-black text-hot">{settings.peakViewers || 247}</div>
            <div className="text-xs text-muted mt-4">All-Time Peak</div>
          </div>
        </div>
      </div>
    </div>
  );
}
