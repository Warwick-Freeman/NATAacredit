import React, { useState } from 'react';
import Icon from './icons';
import { ROLE_LEVEL, ASA_ROLES, AASM_ROLES, ALL_SITES } from './AuthContext';
import { useNexusData } from './NexusDataContext';

const AUTH_METHODS = ['Okta', 'Local', 'Magic link', 'SAML'];

function initForm(userData) {
  return {
    name:     userData?.name     || '',
    email:    userData?.email    || '',
    role:     userData?.role     || '',
    auth:     userData?.auth     || 'Okta',
    mfa:      userData?.mfa      ?? true,
    sites:    Array.isArray(userData?.sites) ? userData.sites : [],
    tempPass: '',
  };
}

function initials(name) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const UserFormDrawer = ({ userData, currentUserRole, onSave, onClose }) => {
  const isEdit = !!(userData?.id);
  const [form, setForm] = useState(() => initForm(userData));
  const [errors, setErrors] = useState({});
  const { activeStandard } = useNexusData();

  const currentLevel = ROLE_LEVEL[currentUserRole] ?? 0;
  const standardRoles = activeStandard === 'aasm' ? AASM_ROLES : ASA_ROLES;

  // Roles the current user can assign: only standard-appropriate roles strictly below their own level
  const allowedRoles = standardRoles
    .filter(role => (ROLE_LEVEL[role] ?? 0) < currentLevel)
    .sort((a, b) => (ROLE_LEVEL[b] ?? 0) - (ROLE_LEVEL[a] ?? 0));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.role)         e.role  = 'Required';
    if (!isEdit && !form.tempPass.trim()) e.tempPass = 'Required for new users';
    return e;
  };

  const toggleSite = (siteName) => {
    const allNames = ALL_SITES.map(s => s.name);
    if (form.sites.length === 0) {
      // Currently unrestricted — unchecking one site creates an explicit list of the rest
      set('sites', allNames.filter(n => n !== siteName));
    } else if (form.sites.includes(siteName)) {
      set('sites', form.sites.filter(n => n !== siteName));
    } else {
      const next = [...form.sites, siteName];
      // If all sites are now checked, revert to unrestricted
      set('sites', next.length === allNames.length ? [] : next);
    }
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      ...(userData || {}),
      name:     form.name.trim(),
      email:    form.email.trim(),
      role:     form.role,
      auth:     form.auth,
      mfa:      form.mfa,
      sites:    form.sites,
      initials: initials(form.name.trim()),
      ...((!isEdit && form.tempPass) ? { password: form.tempPass } : {}),
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Settings · Users &amp; roles</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {isEdit ? `Edit ${userData.name}` : 'Invite user'}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">
        <div className="form-field">
          <label className="form-label">Full name {errors.name && <span className="form-err-inline">{errors.name}</span>}</label>
          <input className={`form-input${errors.name ? ' is-error' : ''}`}
            value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Dr. A. Example" />
        </div>

        <div className="form-field">
          <label className="form-label">Email {errors.email && <span className="form-err-inline">{errors.email}</span>}</label>
          <input className={`form-input${errors.email ? ' is-error' : ''}`}
            type="email"
            value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="user@nexus360.com"
            readOnly={isEdit} />
        </div>

        <div className="form-field">
          <label className="form-label">Role {errors.role && <span className="form-err-inline">{errors.role}</span>}</label>
          <select className={`form-input${errors.role ? ' is-error' : ''}`}
            value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="">— select role —</option>
            {allowedRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {form.role && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              Level {ROLE_LEVEL[form.role] ?? 0} · {
                activeStandard === 'aasm'
                  ? ['No QMS access', 'Technician/RPSGT', 'Lead Technologist', 'Site Director', 'Site Director', 'Network Director', 'Network Director'][ROLE_LEVEL[form.role] ?? 0]
                  : ['No QMS access', 'Recording/Scoring', 'Senior tech', 'Physician', 'Physician', 'Quality Manager', 'Medical Director'][ROLE_LEVEL[form.role] ?? 0]
              }
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Authentication</label>
            <select className="form-input" value={form.auth} onChange={e => set('auth', e.target.value)}>
              {AUTH_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ width: 'auto', justifyContent: 'flex-end', paddingTop: 24 }}>
            <label className="form-check" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={form.mfa} onChange={e => set('mfa', e.target.checked)} />
              Require MFA
            </label>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Site access</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {ALL_SITES.map(site => (
              <label key={site.name}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox"
                  checked={form.sites.length === 0 || form.sites.includes(site.name)}
                  onChange={() => toggleSite(site.name)} />
                {site.name}
              </label>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
            {form.sites.length === 0
              ? 'Unrestricted — all sites visible'
              : `Restricted to ${form.sites.length} of ${ALL_SITES.length} sites`}
          </div>
        </div>

        {!isEdit && (
          <div className="form-field">
            <label className="form-label">Temporary password {errors.tempPass && <span className="form-err-inline">{errors.tempPass}</span>}</label>
            <input className={`form-input${errors.tempPass ? ' is-error' : ''}`}
              type="password"
              value={form.tempPass} onChange={e => set('tempPass', e.target.value)}
              placeholder="User must change on first login" />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <Icon name={isEdit ? 'check' : 'user_plus'} size={14} />
            {isEdit ? 'Save changes' : 'Send invite'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default UserFormDrawer;
