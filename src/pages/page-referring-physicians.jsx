import React, { useState, useEffect } from 'react';
import Icon from '../icons';

const BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders() {
  const t = localStorage.getItem('nexus_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function api(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`${r.status}${body ? ': ' + body : ''}`);
  }
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

const TYPES = ['GP', 'Specialist', 'Paediatrician', 'Other'];

const TYPE_COLORS = {
  GP:            { color: 'var(--info)',   bg: 'var(--info-soft)' },
  Specialist:    { color: 'var(--accent)', bg: 'var(--accent-soft)' },
  Paediatrician: { color: 'var(--good)',   bg: 'var(--good-soft)' },
  Other:         { color: 'var(--ink-3)',  bg: 'var(--surface-3)' },
};

function initDraft(rp) {
  return {
    name: rp.name, type: rp.type, specialty: rp.specialty ?? '',
    practice: rp.practice ?? '', phone: rp.phone ?? '', fax: rp.fax ?? '',
    email: rp.email ?? '', address: rp.address ?? '',
    providerNumber: rp.providerNumber ?? '', notes: rp.notes ?? '',
    status: rp.status,
  };
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function PhysicianSidebar({ rp, onClose, onSaved, onDeleted }) {
  const [tab, setTab] = useState('details');

  // ── details edit state ─────────────────────────────────────────────────────
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(() => initDraft(rp));
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');

  // ── portal state ───────────────────────────────────────────────────────────
  const [password, setPassword]       = useState('');
  const [pwSaving, setPwSaving]       = useState(false);
  const [pwMsg, setPwMsg]             = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteResult, setInviteResult] = useState(null); // { setupUrl, emailError, email }
  const [copied, setCopied]           = useState(false);

  // reset when physician changes
  useEffect(() => {
    setTab('details');
    setEditing(false);
    setDraft(initDraft(rp));
    setSaveErr('');
    setPwMsg('');
    setInviteResult(null);
    setCopied(false);
  }, [rp.physicianId]);

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const tc = TYPE_COLORS[rp.type] ?? TYPE_COLORS.Other;

  async function handleSave() {
    if (!draft.name.trim()) { setSaveErr('Name is required'); return; }
    setSaving(true); setSaveErr('');
    try {
      const updated = await api(`/api/referring-physicians/${rp.physicianId}`, {
        method: 'PUT', body: JSON.stringify(draft),
      });
      onSaved(updated);
      setEditing(false);
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetPassword() {
    if (!password) return;
    setPwSaving(true); setPwMsg('');
    try {
      await api(`/api/referring-physicians/${rp.physicianId}/set-portal-password`, {
        method: 'POST', body: JSON.stringify({ password }),
      });
      setPwMsg('Password set — portal access is now active.');
      setPassword('');
      onSaved({ ...rp, portalPasswordHash: 'set' });
    } catch (e) {
      setPwMsg(`Error: ${e.message}`);
    } finally {
      setPwSaving(false);
    }
  }

  async function handleSendInvite() {
    setInviteSaving(true); setInviteResult(null);
    try {
      const result = await api(`/api/referring-physicians/${rp.physicianId}/send-invite`, {
        method: 'POST',
        body: JSON.stringify({ baseUrl: window.location.origin }),
      });
      setInviteResult(result);
    } catch (e) {
      setInviteResult({ error: e.message });
    } finally {
      setInviteSaving(false);
    }
  }

  function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${rp.name}? This cannot be undone.`)) return;
    try {
      await api(`/api/referring-physicians/${rp.physicianId}`, { method: 'DELETE' });
      onDeleted(rp.physicianId);
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div className="drawer-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: tc.color, background: tc.bg, padding: '2px 8px', borderRadius: 10 }}>{rp.type}</span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: rp.status === 'active' ? 'var(--good)' : 'var(--ink-3)',
              background: rp.status === 'active' ? 'var(--good-soft)' : 'var(--surface-3)',
              padding: '2px 8px', borderRadius: 10,
            }}>{rp.status === 'active' ? 'Active' : 'Inactive'}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rp.name}</div>
          {rp.practice && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{rp.practice}</div>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button className="icon-btn" title="Delete physician" onClick={handleDelete} style={{ color: 'var(--bad)' }}>
            <Icon name="minus" size={14} />
          </button>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
        {[['details', 'Details'], ['portal', 'Portal access']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: 'none', border: 'none', borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
            padding: '10px 12px 8px', fontSize: 13, fontWeight: tab === id ? 600 : 400,
            color: tab === id ? 'var(--accent)' : 'var(--ink-3)', cursor: 'pointer', marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      <div className="drawer-body">

        {/* ── Details tab ── */}
        {tab === 'details' && (
          <>
            {editing ? (
              <>
                <div className="form-row">
                  <div className="form-field" style={{ flex: 2 }}>
                    <label className="form-label">Name</label>
                    <input className="form-input" value={draft.name} onChange={e => set('name', e.target.value)} autoFocus />
                  </div>
                  <div className="form-field" style={{ flex: 1 }}>
                    <label className="form-label">Type</label>
                    <select className="form-input" value={draft.type} onChange={e => set('type', e.target.value)}>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field" style={{ flex: 1 }}>
                    <label className="form-label">Specialty</label>
                    <input className="form-input" value={draft.specialty} onChange={e => set('specialty', e.target.value)} />
                  </div>
                  <div className="form-field" style={{ flex: 1 }}>
                    <label className="form-label">Practice</label>
                    <input className="form-input" value={draft.practice} onChange={e => set('practice', e.target.value)} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field" style={{ flex: 1 }}>
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={draft.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div className="form-field" style={{ flex: 1 }}>
                    <label className="form-label">Fax</label>
                    <input className="form-input" value={draft.fax} onChange={e => set('fax', e.target.value)} />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={draft.email} onChange={e => set('email', e.target.value)} />
                </div>

                <div className="form-field">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={draft.address} onChange={e => set('address', e.target.value)} />
                </div>

                <div className="form-row">
                  <div className="form-field" style={{ flex: 1 }}>
                    <label className="form-label">Provider number</label>
                    <input className="form-input" value={draft.providerNumber} onChange={e => set('providerNumber', e.target.value)} />
                  </div>
                  <div className="form-field" style={{ flex: 1 }}>
                    <label className="form-label">Status</label>
                    <select className="form-input" value={draft.status} onChange={e => set('status', e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={3} value={draft.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
                </div>

                {saveErr && <div style={{ fontSize: 12, color: 'var(--bad)', marginBottom: 8 }}>{saveErr}</div>}

                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                    <Icon name="check" size={13} /> {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button className="btn" onClick={() => { setEditing(false); setDraft(initDraft(rp)); setSaveErr(''); }}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Read-only detail grid */}
                {[
                  ['Specialty', rp.specialty],
                  ['Practice', rp.practice],
                  ['Phone', rp.phone],
                  ['Fax', rp.fax],
                  ['Email', rp.email],
                  ['Address', rp.address],
                  ['Provider number', rp.providerNumber],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ width: 120, flexShrink: 0, color: 'var(--ink-3)', fontSize: 12 }}>{label}</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}

                {rp.notes && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                    {rp.notes}
                  </div>
                )}

                <button className="btn" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => setEditing(true)}>
                  <Icon name="edit" size={13} /> Edit details
                </button>
              </>
            )}
          </>
        )}

        {/* ── Portal access tab ── */}
        {tab === 'portal' && (
          <>
            {/* Status banner */}
            <div style={{
              padding: '12px 14px', borderRadius: 8, marginBottom: 20,
              background: rp.portalPasswordHash ? 'var(--good-soft)' : 'var(--surface-2)',
              border: `1px solid ${rp.portalPasswordHash ? 'var(--good-soft)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Icon name={rp.portalPasswordHash ? 'check' : 'lock'} size={15}
                style={{ color: rp.portalPasswordHash ? 'var(--good)' : 'var(--ink-4)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: rp.portalPasswordHash ? 'var(--good)' : 'var(--ink-2)' }}>
                  {rp.portalPasswordHash ? 'Portal access active' : 'No portal access yet'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                  {rp.portalPasswordHash
                    ? `${rp.email || 'No email set'} · Login at ${window.location.origin}/?physician_portal`
                    : 'Send an invite or set a password to enable access.'}
                </div>
              </div>
            </div>

            {/* Send invite */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Send portal invite
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
                Generates a one-time setup link so the physician can choose their own password.
                {rp.email ? ` An email will be sent to ${rp.email} if Twilio is configured.` : ' Add an email address in Details first to enable email delivery.'}
              </div>

              <button className="btn btn-primary" onClick={handleSendInvite} disabled={inviteSaving || !rp.email} style={{ width: '100%', justifyContent: 'center' }}>
                <Icon name="mail" size={13} /> {inviteSaving ? 'Generating…' : 'Send portal invite'}
              </button>

              {!rp.email && (
                <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 6 }}>Add an email address in the Details tab first.</div>
              )}

              {inviteResult && !inviteResult.error && (
                <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {inviteResult.emailError ? (
                    <div style={{ fontSize: 12, color: 'var(--warn)', marginBottom: 8 }}>
                      <strong>Email not sent:</strong> {inviteResult.emailError}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--good)', marginBottom: 8 }}>
                      Invite email sent to {inviteResult.email}.
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>Setup link (send manually if needed):</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      readOnly
                      value={inviteResult.setupUrl}
                      style={{ flex: 1, fontSize: 11, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-2)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    />
                    <button className="btn" style={{ fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap' }} onClick={() => copyLink(inviteResult.setupUrl)}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {inviteResult?.error && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--bad)' }}>{inviteResult.error}</div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Set password directly
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
                {rp.portalPasswordHash ? 'Override the existing password.' : 'Set a password instead of sending an invite.'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleSetPassword} disabled={!password || pwSaving}>
                  {pwSaving ? 'Saving…' : 'Set'}
                </button>
              </div>
              {pwMsg && (
                <div style={{ marginTop: 8, fontSize: 12, color: pwMsg.startsWith('Error') ? 'var(--bad)' : 'var(--good)' }}>
                  {pwMsg}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReferringPhysiciansPage() {
  const [physicians, setPhysicians] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [selected, setSelected]     = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [search, setSearch]         = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setPhysicians(await api('/api/referring-physicians') ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  function handleSaved(updated) {
    setPhysicians(ps => ps.map(p => p.physicianId === updated.physicianId ? updated : p));
    if (selected?.physicianId === updated.physicianId) setSelected(updated);
  }

  function handleDeleted(id) {
    setPhysicians(ps => ps.filter(p => p.physicianId !== id));
    setSelected(null);
  }

  const filtered = physicians.filter(rp => {
    if (!search) return true;
    const q = search.toLowerCase();
    return rp.name.toLowerCase().includes(q) ||
           (rp.practice ?? '').toLowerCase().includes(q) ||
           (rp.specialty ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
      {/* Topbar */}
      <div style={{ padding: '24px 28px 0' }}>
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <div className="page-eyebrow">Administration</div>
              <h1 className="page-title">Referring Physicians</h1>
              <p className="page-subtitle">Manage contacts and physician portal access</p>
            </div>
            <div className="page-actions">
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Icon name="plus" size={14} /> Add physician
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--bad-soft)', color: 'var(--bad)', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>

      {/* Content + Sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '0 28px 40px' }}>

        {/* List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {physicians.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="search" style={{ width: 280 }}>
                <Icon name="search" size={14} />
                <input
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--ink)', flex: 1, fontFamily: 'inherit' }}
                  placeholder="Search by name, practice, specialty…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{filtered.length} of {physicians.length}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-3)' }}>Loading…</div>
          ) : physicians.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <Icon name="users" size={28} style={{ color: 'var(--ink-4)', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No referring physicians yet</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>Add physicians to manage contacts and enable portal access.</div>
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Icon name="plus" size={14} /> Add first physician
              </button>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                    {['Name', 'Type', 'Practice', 'Phone', 'Email', 'Provider #', 'Portal', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rp, i) => {
                    const tc = TYPE_COLORS[rp.type] ?? TYPE_COLORS.Other;
                    const isActive = selected?.physicianId === rp.physicianId;
                    return (
                      <tr
                        key={rp.physicianId}
                        onClick={() => setSelected(rp)}
                        style={{
                          borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                          cursor: 'pointer',
                          background: isActive ? 'var(--accent-soft)' : '',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = ''; }}
                      >
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: isActive ? 'var(--accent-ink)' : 'var(--ink)' }}>{rp.name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: tc.color, background: tc.bg, padding: '2px 8px', borderRadius: 10 }}>{rp.type}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-2)' }}>{rp.practice || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{rp.phone || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-2)' }}>{rp.email || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-2)', fontFamily: 'monospace' }}>{rp.providerNumber || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {rp.portalPasswordHash
                            ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--good)', background: 'var(--good-soft)', padding: '2px 8px', borderRadius: 10 }}>Active</span>
                            : <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: rp.status === 'active' ? 'var(--good)' : 'var(--ink-3)',
                            background: rp.status === 'active' ? 'var(--good-soft)' : 'var(--surface-3)',
                            padding: '2px 8px', borderRadius: 10,
                          }}>{rp.status === 'active' ? 'Active' : 'Inactive'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail sidebar */}
        {selected && (
          <div style={{ width: 360, flexShrink: 0, marginLeft: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', boxShadow: 'var(--shadow)' }}>
            <PhysicianSidebar
              rp={selected}
              onClose={() => setSelected(null)}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          </div>
        )}
      </div>

      {/* Add physician modal */}
      {showAdd && <AddPhysicianModal onClose={() => setShowAdd(false)} onAdded={rp => { setPhysicians(ps => [...ps, rp]); setShowAdd(false); setSelected(rp); }} />}
    </div>
  );
}

// ── Add modal ─────────────────────────────────────────────────────────────────

function AddPhysicianModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', type: 'GP', specialty: '', practice: '', phone: '', fax: '', email: '', address: '', providerNumber: '', notes: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const rp = await api('/api/referring-physicians', { method: 'POST', body: JSON.stringify(form) });
      onAdded(rp);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="drawer-head">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Referring Physician</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Add referring physician</div>
            </div>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
          </div>
          <div className="drawer-body">
            <div className="form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Jane Smith" autoFocus />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Type</label>
                <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Specialty</label>
                <input className="form-input" value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="e.g. Respiratory Medicine" />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Practice</label>
                <input className="form-input" value={form.practice} onChange={e => set('practice', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Fax</label>
                <input className="form-input" value={form.fax} onChange={e => set('fax', e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="doctor@practice.com.au" />
            </div>
            <div className="form-field">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Provider number</label>
                <input className="form-input" value={form.providerNumber} onChange={e => set('providerNumber', e.target.value)} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            {error && <div style={{ fontSize: 12, color: 'var(--bad)', marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                <Icon name="check" size={13} /> {saving ? 'Saving…' : 'Add physician'}
              </button>
              <button className="btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
