import React, { useState } from 'react';
import Icon from './icons';

const TYPES    = ['PSG Amplifier','Oximeter','HSAT Device','CPAP Device','BiPAP / NIV Device','Calibrator','A/V System','Other'];
const SITES    = ['Riverside Main Lab','Eastside Paediatric Lab','Home Service – North'];
const STATUSES = ['In service','Quarantined','Loan / out','Decommissioned'];
const V_INTERVALS = [3, 6, 12, 24];

// Prefix map: used to suggest an asset ID prefix for new items
const TYPE_PREFIX = {
  'PSG Amplifier':       'PSG',
  'Oximeter':            'OXI',
  'HSAT Device':         'HSAT',
  'CPAP Device':         'CPAP',
  'BiPAP / NIV Device':  'BIPAP',
  'Calibrator':          'CAL',
  'A/V System':          'AV',
  'Other':               'EQP',
};

export function nextEquipId(items, type) {
  const prefix = TYPE_PREFIX[type] || 'EQP';
  const nums = items
    .filter(i => i.id.startsWith(prefix + '-'))
    .map(i => parseInt(i.id.split('-').pop()))
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function initForm(eq) {
  return {
    name:         eq?.name         || '',
    manufacturer: eq?.manufacturer || '',
    model:        eq?.model        || '',
    type:         eq?.type         || '',
    site:         eq?.site         || '',
    serial:       eq?.serial       || '',
    artg:         eq?.artg         || '',
    purchaseDate: eq?.purchaseDate || '',
    verifyInterval: eq?.verifyInterval ?? 6,
    maintInterval:  eq?.maintInterval  ?? 12,
    status:       eq?.status       || 'In service',
    notes:        eq?.notes        || '',
  };
}

const EquipmentFormDrawer = ({ eq, items, onSave, onClose }) => {
  const isEdit = !!(eq?.id);
  const [form, setForm] = useState(() => initForm(eq));
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name   = 'Required';
    if (!form.type)          e.type   = 'Required';
    if (!form.site)          e.site   = 'Required';
    if (!form.serial.trim()) e.serial = 'Required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const id = isEdit ? eq.id : nextEquipId(items, form.type);
    onSave({
      ...(eq || {}),
      id,
      name:           form.name.trim(),
      manufacturer:   form.manufacturer.trim(),
      model:          form.model.trim(),
      type:           form.type,
      site:           form.site,
      serial:         form.serial.trim(),
      artg:           form.artg.trim() || '—',
      purchaseDate:   form.purchaseDate,
      verifyInterval: Number(form.verifyInterval),
      maintInterval:  Number(form.maintInterval),
      status:         form.status,
      notes:          form.notes.trim(),
      // keep existing history arrays on edit; init for new
      verificationHistory: eq?.verificationHistory || [],
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Equipment register · cl. 5.3</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {isEdit ? `Edit ${eq.id}` : 'Add equipment'}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">
        <div className="form-row">
          <div className="form-field" style={{ flex: 2 }}>
            <label className="form-label">Device name {errors.name && <span className="form-err-inline">{errors.name}</span>}</label>
            <input className={`form-input${errors.name ? ' is-error' : ''}`}
              value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Compumedics Grael PSG Amplifier" />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Type {errors.type && <span className="form-err-inline">{errors.type}</span>}</label>
            <select className={`form-input${errors.type ? ' is-error' : ''}`}
              value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="">— select —</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Manufacturer</label>
            <input className="form-input" value={form.manufacturer}
              onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. Compumedics" />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Model</label>
            <input className="form-input" value={form.model}
              onChange={e => set('model', e.target.value)} placeholder="e.g. Grael 4K" />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Site {errors.site && <span className="form-err-inline">{errors.site}</span>}</label>
          <select className={`form-input${errors.site ? ' is-error' : ''}`}
            value={form.site} onChange={e => set('site', e.target.value)}>
            <option value="">— select —</option>
            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Serial number {errors.serial && <span className="form-err-inline">{errors.serial}</span>}</label>
            <input className={`form-input${errors.serial ? ' is-error' : ''}`}
              value={form.serial} onChange={e => set('serial', e.target.value)} placeholder="Manufacturer serial" />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">ARTG entry <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional)</span></label>
            <input className="form-input" value={form.artg}
              onChange={e => set('artg', e.target.value)} placeholder="e.g. 234156" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Purchase / acceptance date</label>
            <input className="form-input" type="date" value={form.purchaseDate}
              onChange={e => set('purchaseDate', e.target.value)} />
          </div>
          {isEdit && (
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Verification interval</label>
            <select className="form-input" value={form.verifyInterval}
              onChange={e => set('verifyInterval', e.target.value)}>
              {V_INTERVALS.map(m => <option key={m} value={m}>{m} months</option>)}
            </select>
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Maintenance interval</label>
            <select className="form-input" value={form.maintInterval}
              onChange={e => set('maintInterval', e.target.value)}>
              {[6, 12, 24, 36].map(m => <option key={m} value={m}>{m} months</option>)}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={3} value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="ARTG class, calibration references, known issues…"
            style={{ resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <Icon name={isEdit ? 'check' : 'plus'} size={14} />
            {isEdit ? 'Save changes' : 'Add to register'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentFormDrawer;
