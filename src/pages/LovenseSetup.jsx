import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/database.js';

const DEVICE_TYPES = [
  { id: 'lush3', name: 'Lush 3', icon: '💗', type: 'Internal Vibrator', battery: 85 },
  { id: 'nora', name: 'Nora', icon: '💖', type: 'Rabbit Vibrator', battery: 72 },
  { id: 'hush2', name: 'Hush 2', icon: '🔮', type: 'Butt Plug', battery: 90 },
  { id: 'domi2', name: 'Domi 2', icon: '🔥', type: 'Mini Wand', battery: 68 },
  { id: 'ferri', name: 'Ferri', icon: '✨', type: 'Panty Vibrator', battery: 95 },
  { id: 'diamo', name: 'Diamo', icon: '💎', type: 'Cock Ring', battery: 77 },
];

export default function LovenseSetup() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState(db.getLovenseDevices());
  const [settings, setSettings] = useState(db.getLovenseSettings());
  const [scanning, setScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState([]);
  const [testingDevice, setTestingDevice] = useState(null);
  const [testIntensity, setTestIntensity] = useState(50);
  const [showPairHelp, setShowPairHelp] = useState(false);
  const levels = db.getLovenseLevels();

  function startScan() {
    setScanning(true);
    setFoundDevices([]);

    // Simulate Bluetooth scanning
    setTimeout(() => {
      const available = DEVICE_TYPES.filter(d => !devices.find(pd => pd.id === d.id));
      const found = available.slice(0, Math.min(3, available.length));
      setFoundDevices(found);
      setScanning(false);
    }, 2500);
  }

  function pairDevice(device) {
    const paired = [...devices, { ...device, paired: true, connected: true, pairedAt: Date.now() }];
    setDevices(paired);
    db.saveLovenseDevices(paired);
    setFoundDevices(foundDevices.filter(d => d.id !== device.id));
  }

  function unpairDevice(deviceId) {
    if (!window.confirm('Unpair this device? You can pair it again later.')) return;
    const updated = devices.filter(d => d.id !== deviceId);
    setDevices(updated);
    db.saveLovenseDevices(updated);
  }

  function toggleConnection(deviceId) {
    const updated = devices.map(d =>
      d.id === deviceId ? { ...d, connected: !d.connected } : d
    );
    setDevices(updated);
    db.saveLovenseDevices(updated);
  }

  function testVibration(deviceId) {
    setTestingDevice(deviceId);
    // Simulate vibration test
    setTimeout(() => setTestingDevice(null), 2000);
  }

  function updateSetting(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    db.saveLovenseSettings(updated);
  }

  const connectedCount = devices.filter(d => d.connected).length;

  return (
    <div className="page-pad">
      <div className="flex-between mb-20">
        <div>
          <h2 className="text-hot text-3xl font-black mb-4">💗 Lovense Setup</h2>
          <p className="text-muted text-sm">Device pairing & controls</p>
        </div>
        <button className="config-badge config-badge-violet" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
      </div>

      {/* Connection Status */}
      <div className="card mb-16" style={{
        padding: 16, borderRadius: 16,
        background: connectedCount > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(225,29,72,0.1)',
        border: `1px solid ${connectedCount > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(225,29,72,0.3)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>{connectedCount > 0 ? '✅' : '📡'}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: connectedCount > 0 ? '#22c55e' : 'var(--red)' }}>
              {connectedCount > 0 ? `${connectedCount} Device${connectedCount > 1 ? 's' : ''} Connected` : 'No Devices Connected'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {connectedCount > 0 ? 'Ready to receive viewer interactions' : 'Pair a device to enable viewer-controlled vibrations'}
            </div>
          </div>
        </div>
      </div>

      {/* Paired Devices */}
      <div className="card card-surface mb-16">
        <div className="flex-between mb-16">
          <h3 className="text-hot text-xl">📱 Paired Devices</h3>
          <div className="config-badge config-badge-pink">{devices.length} paired</div>
        </div>

        {devices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--dim)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
            <div style={{ fontSize: 13 }}>No devices paired yet</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Scan for nearby Lovense devices to get started</div>
          </div>
        ) : (
          devices.map(device => (
            <div key={device.id} className="config-card" style={{
              borderColor: device.connected ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{device.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{device.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{device.type}</div>
                  </div>
                </div>
                <div style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: device.connected ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                  color: device.connected ? '#22c55e' : 'var(--dim)',
                }}>
                  {device.connected ? '● Connected' : '○ Disconnected'}
                </div>
              </div>

              {/* Battery */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12 }}>🔋</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{
                    width: `${device.battery}%`, height: '100%', borderRadius: 3,
                    background: device.battery > 50 ? '#22c55e' : device.battery > 20 ? 'var(--gold)' : 'var(--red)',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{device.battery}%</span>
              </div>

              {/* Test Controls */}
              {device.connected && (
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Test Intensity</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range" min={0} max={100} value={testIntensity}
                      onChange={(e) => setTestIntensity(parseInt(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 36 }}>{testIntensity}%</span>
                    <button
                      className="btn-pink"
                      style={{ padding: '6px 12px', fontSize: 11 }}
                      onClick={() => testVibration(device.id)}
                      disabled={testingDevice === device.id}
                    >
                      {testingDevice === device.id ? '〰️ Testing...' : '📳 Test'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-save" style={{ flex: 1, fontSize: 12, padding: 10 }} onClick={() => toggleConnection(device.id)}>
                  {device.connected ? '⏸ Disconnect' : '▶ Connect'}
                </button>
                <button className="btn-delete" style={{ padding: '10px 14px', fontSize: 12 }} onClick={() => unpairDevice(device.id)}>
                  ✕
                </button>
              </div>
            </div>
          ))
        )}

        {/* Scan Button */}
        <button
          className="btn-pink w-full"
          style={{ marginTop: 12, padding: 14 }}
          onClick={startScan}
          disabled={scanning}
        >
          {scanning ? '📡 Scanning...' : '📡 Scan for Devices'}
        </button>

        {/* Found Devices */}
        {foundDevices.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
              Found {foundDevices.length} device{foundDevices.length > 1 ? 's' : ''}:
            </div>
            {foundDevices.map(device => (
              <div key={device.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 12, borderRadius: 10, background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{device.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{device.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{device.type}</div>
                  </div>
                </div>
                <button className="btn-save" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => pairDevice(device)}>
                  Pair
                </button>
              </div>
            ))}
          </div>
        )}

        {scanning && (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--muted)', fontSize: 13 }}>
            <div className="pulse-dot" style={{ width: 12, height: 12, margin: '0 auto 8px', background: 'var(--hot)' }} />
            Scanning for nearby Lovense devices...
          </div>
        )}
      </div>

      {/* Lovense Settings */}
      <div className="card card-surface mb-16">
        <h3 className="text-gold text-xl mb-16">⚙️ Interaction Settings</h3>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.enabled} onChange={(e) => updateSetting('enabled', e.target.checked)} />
          <span>Enable Viewer-Controlled Vibrations</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.showInRoom} onChange={(e) => updateSetting('showInRoom', e.target.checked)} />
          <span>Show Lovense Button in Room</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.soundAlerts} onChange={(e) => updateSetting('soundAlerts', e.target.checked)} />
          <span>🔊 Sound Alerts on Activation</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.vibrationFeedback} onChange={(e) => updateSetting('vibrationFeedback', e.target.checked)} />
          <span>📳 Vibration Feedback</span>
        </label>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Max Intensity Cap</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="range" min={10} max={100} value={settings.maxIntensity} onChange={(e) => updateSetting('maxIntensity', parseInt(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 40 }}>{settings.maxIntensity}%</span>
          </div>
          <div className="hint">Limits the maximum vibration intensity viewers can trigger</div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Cooldown Between Activations</label>
          <select className="form-select" value={settings.cooldownSeconds} onChange={(e) => updateSetting('cooldownSeconds', parseInt(e.target.value))}>
            <option value={0}>No cooldown</option>
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
          </select>
          <div className="hint">Prevents spam — minimum wait between viewer activations</div>
        </div>

        <div className="form-group">
          <label className="form-label">Queue Mode</label>
          <select className="form-select" value={settings.queueMode} onChange={(e) => updateSetting('queueMode', e.target.value)}>
            <option value="stack">Stack (queue multiple)</option>
            <option value="override">Override (newest replaces current)</option>
          </select>
          <div className="hint">How to handle multiple activations at once</div>
        </div>
      </div>

      {/* Current Tip Menu Preview */}
      <div className="card card-surface mb-16" style={{ borderColor: 'rgba(255,107,44,0.25)' }}>
        <h3 className="text-hot text-lg mb-12">💰 Your Lovense Tip Menu</h3>
        <p className="text-dim text-sm mb-12">Configured in Dashboard → Lovense Levels</p>
        {levels.length > 0 ? (
          levels.map(l => (
            <div key={l.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 10, borderRadius: 8, background: 'rgba(255,107,44,0.08)',
              border: '1px solid rgba(255,107,44,0.15)', marginBottom: 6,
            }}>
              <span style={{ fontSize: 14 }}>{l.icon} {l.label}</span>
              <span style={{ fontSize: 12, color: 'var(--gold)' }}>{l.tokens} tokens • {l.duration}s</span>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--dim)', fontSize: 13, textAlign: 'center', padding: 16 }}>
            No levels configured — go to Dashboard → Lovense Levels
          </div>
        )}
        <button className="btn-save mt-12" style={{ fontSize: 12, width: '100%' }} onClick={() => navigate('/dashboard')}>
          ✏️ Edit Levels in Dashboard
        </button>
      </div>

      {/* Help */}
      <div className="card card-surface mb-16">
        <div className="flex-between" onClick={() => setShowPairHelp(!showPairHelp)} style={{ cursor: 'pointer' }}>
          <h3 className="text-violet text-lg">❓ Pairing Help</h3>
          <span style={{ color: 'var(--muted)' }}>{showPairHelp ? '▼' : '▶'}</span>
        </div>
        {showPairHelp && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
            <div><strong className="text-white">1.</strong> Turn on your Lovense device (long press button)</div>
            <div><strong className="text-white">2.</strong> Make sure Bluetooth is enabled on this device</div>
            <div><strong className="text-white">3.</strong> Tap "Scan for Devices" above</div>
            <div><strong className="text-white">4.</strong> Select your device from the list and tap "Pair"</div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--dim)' }}>
              Note: In this demo, scanning simulates finding Lovense devices. In production, this uses the Lovense Connect API + Web Bluetooth.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
