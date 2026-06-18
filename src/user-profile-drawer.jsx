import React, { useState, useEffect, useRef } from 'react';
import Icon from './icons';
import { useAuth } from './AuthContext';

const BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders() {
  const t = localStorage.getItem('nexus_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function UserProfileDrawer({ onClose }) {
  const { user, selfUpdateProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state — loaded from /api/users/me
  const [name,      setName]      = useState('');
  const [title,     setTitle]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [sigData,   setSigData]   = useState('');   // data URL

  // Password change
  const [pwOpen,    setPwOpen]    = useState(false);
  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [newPw2,    setNewPw2]    = useState('');
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwOk,      setPwOk]      = useState(false);

  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk,    setSaveOk]    = useState(false);

  const sigRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/api/users/me`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setProfile(data);
        setName(data.name ?? '');
        setTitle(data.title ?? '');
        setPhone(data.phone ?? '');
        setSigData(data.signatureData ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSigFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setSigData(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSigDrop = (e) => {
    e.preventDefault();
    handleSigFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveOk(false);
    setSaving(true);
    try {
      await selfUpdateProfile({ name, title, phone, signatureData: sigData });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (e) {
      setSaveError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    setPwOk(false);
    if (newPw !== newPw2) { setPwError('New passwords do not match'); return; }
    if (newPw.length < 6)  { setPwError('New password must be at least 6 characters'); return; }
    setPwSaving(true);
    try {
      const r = await fetch(`${BASE}/api/users/me/password`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body:    JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to change password');
      }
      setCurPw(''); setNewPw(''); setNewPw2('');
      setPwOk(true);
      setTimeout(() => { setPwOk(false); setPwOpen(false); }, 3000);
    } catch (e) {
      setPwError(e.message);
    } finally {
      setPwSaving(false);
    }
  };

  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>My profile</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{profile?.email ?? user?.email ?? ''}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ink-3)' }}>
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Avatar + role (read-only context) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'var(--accent-soft)', fontSize: 20, fontWeight: 700,
                color: 'var(--accent-ink)', flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{name || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{profile?.role ?? user?.role}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Role is managed by administrators</div>
              </div>
            </div>

            {/* Editable fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display name</label>
                <input className="form-input" style={{ fontSize: 13 }}
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title / credentials</label>
                <input className="form-input" style={{ fontSize: 13 }}
                  placeholder="e.g. Dr., RPSGT, PhD"
                  value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                <input className="form-input" style={{ fontSize: 13 }} type="tel"
                  placeholder="+61 2 9xxx xxxx"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>

            {/* Signature */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Signature <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--ink-3)' }}>— used on signed reports</span>
              </label>

              {sigData ? (
                <div style={{ position: 'relative' }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'white', display: 'flex', justifyContent: 'center' }}>
                    <img src={sigData} alt="Signature" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn" style={{ fontSize: 12 }} onClick={() => sigRef.current?.click()}>
                      <Icon name="upload" size={12} />Replace
                    </button>
                    <button className="btn" style={{ fontSize: 12, color: 'var(--bad)' }} onClick={() => setSigData('')}>
                      <Icon name="x" size={12} />Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleSigDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => sigRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 8, padding: '28px 20px',
                    textAlign: 'center', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 13,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <Icon name="upload" size={20} style={{ display: 'block', margin: '0 auto 8px', color: 'var(--ink-3)' }} />
                  <div style={{ fontWeight: 500 }}>Upload signature image</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Drag & drop or click · PNG, JPG, SVG</div>
                </div>
              )}
              <input ref={sigRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleSigFile(e.target.files[0])} />
            </div>

            {/* Save */}
            {saveError && (
              <div style={{ fontSize: 12, color: 'var(--bad)', padding: '8px 12px', background: 'var(--bad-soft)', borderRadius: 6, border: '1px solid var(--bad)' }}>
                {saveError}
              </div>
            )}
            {saveOk && (
              <div style={{ fontSize: 12, color: 'var(--good)', padding: '8px 12px', background: 'var(--good-surface)', borderRadius: 6, border: '1px solid var(--good)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="check" size={12} /> Profile saved
              </div>
            )}
            <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button
                className="btn"
                style={{ fontSize: 13, width: '100%', justifyContent: 'space-between' }}
                onClick={() => { setPwOpen(o => !o); setPwError(''); }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="settings" size={13} />Change password
                </span>
                <Icon name={pwOpen ? 'chev_down' : 'chev_right'} size={12} />
              </button>

              {pwOpen && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current password</label>
                    <input className="form-input" type="password" style={{ fontSize: 13 }}
                      value={curPw} onChange={e => setCurPw(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New password</label>
                    <input className="form-input" type="password" style={{ fontSize: 13 }}
                      value={newPw} onChange={e => setNewPw(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm new password</label>
                    <input className="form-input" type="password" style={{ fontSize: 13 }}
                      value={newPw2} onChange={e => setNewPw2(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordChange()} />
                  </div>
                  {pwError && (
                    <div style={{ fontSize: 12, color: 'var(--bad)', padding: '6px 10px', background: 'var(--bad-soft)', borderRadius: 5 }}>{pwError}</div>
                  )}
                  {pwOk && (
                    <div style={{ fontSize: 12, color: 'var(--good)', padding: '6px 10px', background: 'var(--good-surface)', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="check" size={11} /> Password changed
                    </div>
                  )}
                  <button className="btn btn-primary" style={{ fontSize: 12 }}
                    onClick={handlePasswordChange} disabled={pwSaving || !curPw || !newPw || !newPw2}>
                    {pwSaving ? 'Changing…' : 'Change password'}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
