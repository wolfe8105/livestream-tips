import React, { useState } from 'react';
import { useApp } from '../App.jsx';

export default function Login() {
  const { loginUser, signupUser } = useApp();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signupUser(email, password, role);
      } else {
        await loginUser(email, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎭</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: -0.5 }}>
          Stream<span style={{ color: 'var(--gold)' }}>To</span>Stage
        </h1>
        <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Watch Live, Visit Real</p>
      </div>

      {/* Form Card */}
      <div className="card card-surface" style={{ padding: 24, maxWidth: 380, width: '100%', margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, textAlign: 'center' }}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text)', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text)', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Role selector for signup */}
          {isSignup && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>I am a...</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setRole('viewer')}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: role === 'viewer' ? 'rgba(225,29,72,0.15)' : 'var(--surface)',
                    border: role === 'viewer' ? '2px solid var(--accent)' : '1px solid var(--border)',
                    color: role === 'viewer' ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  👁️ Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('performer')}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: role === 'performer' ? 'rgba(212,175,55,0.15)' : 'var(--surface)',
                    border: role === 'performer' ? '2px solid var(--gold)' : '1px solid var(--border)',
                    color: role === 'performer' ? 'var(--gold)' : 'var(--muted)',
                  }}
                >
                  🎭 Performer
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 14, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {isSignup && (
            <div style={{ marginBottom: 14, fontSize: 11, color: 'var(--dim)', lineHeight: 1.7, textAlign: 'center' }}>
              By creating an account, you agree to our{' '}
              <a href="#/terms" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Terms of Service</a>{' '}
              and{' '}
              <a href="#/privacy" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Privacy Policy</a>.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginBottom: 12, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '...' : (isSignup ? 'Create Account' : 'Log In')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', padding: 8, textDecoration: 'underline' }}
          >
            {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>

      {/* Demo skip */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={() => loginUser('demo@streamtostage.com', 'demo123')}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--muted)', fontSize: 12, cursor: 'pointer', padding: '8px 20px' }}
        >
          Skip → Demo Mode
        </button>
      </div>

      {/* Legal */}
      <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
          <a href="#/terms" style={{ fontSize: 10, color: 'var(--dim)', textDecoration: 'none' }}>Terms of Service</a>
          <span style={{ fontSize: 10, color: 'var(--dim)' }}>·</span>
          <a href="#/privacy" style={{ fontSize: 10, color: 'var(--dim)', textDecoration: 'none' }}>Privacy Policy</a>
          <span style={{ fontSize: 10, color: 'var(--dim)' }}>·</span>
          <a href="#/dmca" style={{ fontSize: 10, color: 'var(--dim)', textDecoration: 'none' }}>DMCA</a>
          <span style={{ fontSize: 10, color: 'var(--dim)' }}>·</span>
          <a href="#/compliance" style={{ fontSize: 10, color: 'var(--dim)', textDecoration: 'none' }}>2257 Compliance</a>
        </div>
      </div>
    </div>
  );
}
