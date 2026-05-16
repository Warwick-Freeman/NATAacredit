import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'kavya.patel@nexus360.com',   role: 'Quality Manager' },
  { email: 'rafael.okafor@nexus360.com', role: 'Medical Director' },
  { email: 'meilin.chen@nexus360.com',   role: 'Senior Technologist' },
];

const LoginPage = () => {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = signIn(email.trim(), password);
      if (!ok) setError('Incorrect email or password.');
      setLoading(false);
    }, 350);
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword('demo');
    setError('');
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark" style={{ width: 38, height: 38, borderRadius: 10, fontSize: 17 }}>N</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Nexus 360</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Accreditation Platform</div>
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 3px', letterSpacing: '-0.02em' }}>Sign in</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Riverside Sleep &amp; Respiratory Centre</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@nexus360.com"
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-accent"
            style={{ width: '100%', justifyContent: 'center', padding: '9px 12px' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in to Nexus 360'}
          </button>
        </form>

        <div className="login-demo">
          <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Demo accounts · password: <span style={{ fontFamily: 'monospace' }}>demo</span>
          </div>
          {DEMO_ACCOUNTS.map(acc => (
            <button key={acc.email} type="button" className="login-demo-row" onClick={() => fillDemo(acc)}>
              <span style={{ fontWeight: 500 }}>{acc.email}</span>
              <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>{acc.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
