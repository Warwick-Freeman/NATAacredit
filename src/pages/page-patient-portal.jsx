import React, { useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL ?? '';

function portalFetch(path, token, opts = {}) {
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
}

export default function PatientPortalPage({ setupToken }) {
  const [view, setView] = useState('loading');
  const [setupInfo, setSetupInfo] = useState(null);   // { email, patientName }
  const [authToken, setAuthToken] = useState(null);
  const [patient, setPatient] = useState(null);        // { name, dob, mrn, site }
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupError, setSetupError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSaving, setLoginSaving] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (setupToken) {
      fetch(`${BASE}/api/portal/setup/${setupToken}`)
        .then(r => r.ok ? r.json() : Promise.reject('invalid'))
        .then(data => { setSetupInfo(data); setView('setup'); })
        .catch(() => { setError('This invite link is invalid or has already been used.'); setView('error'); });
    } else {
      const saved = localStorage.getItem('portal_token');
      if (saved) {
        loadDashboard(saved);
      } else {
        setView('login');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupToken]);

  function loadDashboard(token) {
    setView('loading');
    Promise.all([
      portalFetch('/api/portal/me', token),
      portalFetch('/api/portal/forms', token),
    ]).then(async ([meRes, formsRes]) => {
      if (!meRes.ok) throw new Error('auth');
      const [me, formList] = await Promise.all([meRes.json(), formsRes.json()]);
      setPatient(me);
      setForms(formList ?? []);
      setAuthToken(token);
      setView('dashboard');
    }).catch(() => {
      localStorage.removeItem('portal_token');
      setView('login');
    });
  }

  async function handleSetup(e) {
    e.preventDefault();
    setSetupError('');
    if (password.length < 8) { setSetupError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setSetupError('Passwords do not match.'); return; }
    setSetupSaving(true);
    try {
      const res = await fetch(`${BASE}/api/portal/setup/${setupToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || 'Setup failed'); }
      const data = await res.json();
      localStorage.setItem('portal_token', data.token);
      window.history.replaceState({}, '', '?portal');
      loadDashboard(data.token);
    } catch (e) {
      setSetupError(e.message || 'Setup failed. Please try again.');
    } finally {
      setSetupSaving(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginSaving(true);
    try {
      const res = await fetch(`${BASE}/api/portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!res.ok) { setLoginError('Invalid email or password.'); return; }
      const data = await res.json();
      localStorage.setItem('portal_token', data.token);
      loadDashboard(data.token);
    } catch { setLoginError('Could not connect. Please try again.'); }
    finally { setLoginSaving(false); }
  }

  function logout() {
    localStorage.removeItem('portal_token');
    setAuthToken(null); setPatient(null); setForms([]);
    setView('login');
    window.history.replaceState({}, '', '?portal');
  }

  function openForm(link) {
    window.open(`${window.location.origin}${window.location.pathname}?fill=${link.token}`, '_blank');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-1, #f8fafc)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: view === 'dashboard' ? 'flex-start' : 'center', padding: '24px 16px' }}>
      {view === 'loading' && <LoadingSpinner />}
      {view === 'error' && <ErrorCard message={error} />}
      {view === 'setup' && (
        <SetupCard
          setupInfo={setupInfo}
          password={password} setPassword={setPassword}
          confirm={confirm} setConfirm={setConfirm}
          saving={setupSaving} error={setupError}
          onSubmit={handleSetup}
        />
      )}
      {view === 'login' && (
        <LoginCard
          email={loginEmail} setEmail={setLoginEmail}
          password={loginPassword} setPassword={setLoginPassword}
          saving={loginSaving} error={loginError}
          onSubmit={handleLogin}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          patient={patient}
          forms={forms}
          onOpenForm={openForm}
          onLogout={logout}
        />
      )}
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
          <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-9v4l3 1.5-.75 1.5L8 12V7h1z" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1, #1e293b)', lineHeight: 1.2 }}>Nexus 360</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3, #94a3b8)', lineHeight: 1.2 }}>Patient Portal</div>
      </div>
    </div>
  );
}

function Card({ children, maxWidth = 420 }) {
  return (
    <div style={{ width: '100%', maxWidth, background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.06)', padding: 32 }}>
      {children}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ textAlign: 'center', color: 'var(--ink-3, #94a3b8)' }}>
      <Logo />
      <div style={{ fontSize: 14 }}>Loading…</div>
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <Card>
      <Logo />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1, #1e293b)', marginBottom: 8 }}>Link unavailable</div>
        <div style={{ fontSize: 14, color: 'var(--ink-3, #64748b)', marginBottom: 20 }}>{message}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3, #94a3b8)' }}>
          Contact your healthcare provider if you need a new invitation.
        </div>
      </div>
    </Card>
  );
}

function SetupCard({ setupInfo, password, setPassword, confirm, setConfirm, saving, error, onSubmit }) {
  return (
    <Card>
      <Logo />
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1, #1e293b)', marginBottom: 4 }}>
          Set up your account
        </div>
        {setupInfo && (
          <div style={{ fontSize: 13, color: 'var(--ink-3, #64748b)' }}>
            Welcome, <strong>{setupInfo.patientName || setupInfo.email}</strong>. Create a password to access your patient portal.
          </div>
        )}
      </div>
      <form onSubmit={onSubmit}>
        <Field label="Email address">
          <input
            type="email"
            value={setupInfo?.email ?? ''}
            disabled
            style={inputStyle({ disabled: true })}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            autoFocus
            style={inputStyle()}
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            required
            style={inputStyle()}
          />
        </Field>
        {error && <div style={errorStyle}>{error}</div>}
        <button type="submit" disabled={saving} style={primaryBtnStyle(saving)}>
          {saving ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </Card>
  );
}

function LoginCard({ email, setEmail, password, setPassword, saving, error, onSubmit }) {
  return (
    <Card>
      <Logo />
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1, #1e293b)', marginBottom: 4 }}>
          Sign in to your portal
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3, #64748b)' }}>
          Access your health forms and appointment information.
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <Field label="Email address">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            style={inputStyle()}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={inputStyle()}
          />
        </Field>
        {error && <div style={errorStyle}>{error}</div>}
        <button type="submit" disabled={saving} style={primaryBtnStyle(saving)}>
          {saving ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </Card>
  );
}

function Dashboard({ patient, forms, onOpenForm, onLogout }) {
  const pending = forms.filter(f => f.status === 'pending');
  const completed = forms.filter(f => f.status === 'complete');

  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {patient && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1, #1e293b)' }}>{patient.name}</div>
              {patient.mrn && <div style={{ fontSize: 11, color: 'var(--ink-3, #94a3b8)' }}>MRN: {patient.mrn}</div>}
            </div>
          )}
          <button onClick={onLogout} style={{ fontSize: 12, color: 'var(--ink-3, #64748b)', background: 'none', border: '1px solid var(--border, #e2e8f0)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-1, #1e293b)', marginBottom: 4 }}>
          Welcome{patient?.name ? `, ${patient.name.split(' ')[0]}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3, #64748b)' }}>
          {pending.length === 0
            ? 'You have no pending forms at this time.'
            : `You have ${pending.length} form${pending.length > 1 ? 's' : ''} waiting to be completed.`}
        </div>
      </div>

      {/* Pending forms */}
      {pending.length > 0 && (
        <Section title="Forms to complete">
          {pending.map(f => (
            <FormRow key={f.id} form={f} onClick={() => onOpenForm(f)} />
          ))}
        </Section>
      )}

      {/* Completed forms */}
      {completed.length > 0 && (
        <Section title="Completed forms">
          {completed.map(f => (
            <FormRow key={f.id} form={f} completed />
          ))}
        </Section>
      )}

      {forms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-3, #94a3b8)', fontSize: 14 }}>
          No forms have been sent to you yet.
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--ink-3, #94a3b8)' }}>
        Nexus 360 Patient Portal · If you have questions, contact your healthcare provider.
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingLeft: 4 }}>
        {title}
      </div>
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  );
}

function FormRow({ form, onClick, completed }) {
  const date = form.sentAt ? form.sentAt.slice(0, 10) : '';
  const completedDate = form.completedAt ? form.completedAt.slice(0, 10) : '';
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
        borderBottom: '1px solid var(--border, #f1f5f9)',
        cursor: completed ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!completed) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: completed ? '#22c55e' : '#f59e0b',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-1, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {form.formTitle || form.formId}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3, #94a3b8)' }}>
          {completed ? `Completed ${completedDate}` : `Sent ${date}`}
        </div>
      </div>
      {!completed && (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent, #2563eb)', flexShrink: 0 }}>
          Complete →
        </div>
      )}
      {completed && (
        <div style={{ fontSize: 12, color: '#22c55e', flexShrink: 0 }}>
          Done
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-2, #475569)', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle({ disabled } = {}) {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px', fontSize: 14,
    border: '1px solid var(--border, #e2e8f0)', borderRadius: 7,
    background: disabled ? 'var(--bg-1, #f8fafc)' : 'white',
    color: disabled ? 'var(--ink-3, #94a3b8)' : 'var(--ink-1, #1e293b)',
    outline: 'none',
  };
}

function primaryBtnStyle(disabled) {
  return {
    width: '100%', padding: '10px 0', marginTop: 4,
    background: disabled ? 'var(--border, #e2e8f0)' : 'var(--accent, #2563eb)',
    color: disabled ? 'var(--ink-3, #94a3b8)' : 'white',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

const errorStyle = {
  fontSize: 13, color: '#dc2626',
  background: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: 6, padding: '8px 12px', marginBottom: 12,
};
