import React, { useState } from 'react';
import Icon from './icons';

const ROLES = [
  'Medical Director',
  'Paediatric Sleep Physician',
  'Reporting Physician',
  'Quality Manager',
  'Senior Technologist',
  'Scoring Technologist',
  'Recording Tech',
  'Reception / Bookings',
];

const SITES = ['All', 'Riverside Main', 'Eastside Paed.', 'Home Service N.'];

function initForm(staff) {
  if (staff && staff.name) {
    return {
      name:      staff.name,
      role:      staff.role,
      site:      staff.site,
      rpsgt:     !!staff.rpsgt,
      paedsBLS:  !!staff.paedsBLS,
      blsOk:     staff.bls.ok,
      blsExpiry: staff.bls.expires,
      eqa:       staff.eqa,
      training:  staff.training,
    };
  }
  return { name: '', role: '', site: 'All', rpsgt: false, paedsBLS: false, blsOk: true, blsExpiry: '', eqa: '—', training: 100 };
}

const StaffFormDrawer = ({ staff, onSave, onClose }) => {
  const isEdit = !!(staff && staff.name);
  const [form, setForm]     = useState(() => initForm(staff));
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name      = 'Required';
    if (!form.role)           e.role      = 'Required';
    if (!form.blsExpiry.trim()) e.blsExpiry = 'Required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      name:     form.name.trim(),
      role:     form.role,
      site:     form.site,
      rpsgt:    form.rpsgt || undefined,
      paedsBLS: form.paedsBLS || undefined,
      bls:      { ok: form.blsOk, expires: form.blsExpiry.trim() },
      eqa:      form.eqa || '—',
      training: Number(form.training),
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Staff &amp; training · cl. 5.1</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {isEdit ? `Edit: ${staff.name}` : 'Add staff member'}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">
        {/* Name */}
        <div className="form-field">
          <label className="form-label">
            Full name
            {errors.name && <span className="form-err-inline">{errors.name}</span>}
          </label>
          <input
            className={`form-input${errors.name ? ' is-error' : ''}`}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. J. Smith"
            autoFocus
          />
        </div>

        {/* Role + Site */}
        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">
              Role
              {errors.role && <span className="form-err-inline">{errors.role}</span>}
            </label>
            <select
              className={`form-input${errors.role ? ' is-error' : ''}`}
              value={form.role}
              onChange={e => set('role', e.target.value)}
            >
              <option value="">Select role…</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Site</label>
            <select className="form-input" value={form.site} onChange={e => set('site', e.target.value)}>
              {SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Credentials */}
        <div className="form-field">
          <div className="form-label">Credentials</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 2 }}>
            <label className="form-check">
              <input type="checkbox" checked={form.rpsgt} onChange={e => set('rpsgt', e.target.checked)} />
              RPSGT
            </label>
            <label className="form-check">
              <input type="checkbox" checked={form.paedsBLS} onChange={e => set('paedsBLS', e.target.checked)} />
              Paediatric BLS
            </label>
          </div>
        </div>

        {/* BLS */}
        <div className="form-field">
          <div className="form-label">BLS status</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 2, marginBottom: 10 }}>
            <label className="form-check">
              <input type="radio" checked={form.blsOk} onChange={() => set('blsOk', true)} />
              Current
            </label>
            <label className="form-check">
              <input type="radio" checked={!form.blsOk} onChange={() => set('blsOk', false)} />
              Lapsed
            </label>
          </div>
          <label className="form-label">
            {form.blsOk ? 'Expiry date' : 'Lapse description'}
            {errors.blsExpiry && <span className="form-err-inline">{errors.blsExpiry}</span>}
          </label>
          <input
            className={`form-input${errors.blsExpiry ? ' is-error' : ''}`}
            value={form.blsExpiry}
            onChange={e => set('blsExpiry', e.target.value)}
            placeholder={form.blsOk ? 'e.g. Aug 2026' : 'e.g. Lapsed 7d'}
          />
        </div>

        {/* EQA */}
        <div className="form-field">
          <label className="form-label">EQA / κ result</label>
          <input
            className="form-input"
            value={form.eqa}
            onChange={e => set('eqa', e.target.value)}
            placeholder="e.g. Current · 96%  or  —"
          />
        </div>

        {/* Training */}
        <div className="form-field">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Training completion</span>
            <span style={{ fontWeight: 600, color: form.training >= 95 ? 'var(--good)' : form.training >= 85 ? 'var(--warn)' : 'var(--bad)' }}>
              {form.training}%
            </span>
          </label>
          <input
            type="range"
            min={0} max={100} step={1}
            value={form.training}
            onChange={e => set('training', e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <Icon name="check" size={14} />
            {isEdit ? 'Save changes' : 'Add staff member'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default StaffFormDrawer;
