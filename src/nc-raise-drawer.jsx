import React, { useState } from 'react';
import Icon from './icons';
import { useAuth } from './AuthContext';

const SOURCES   = ['Audit', 'Equipment check', 'EQA result', 'KPI review', 'Complaint', 'Internal observation', 'Assessment finding'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const CLIN_SIGS  = ['Yes — patient safety impact', 'Possible', 'No'];
const OWNERS     = ['K. Patel', 'Dr. R. Okafor', 'M. Chen', 'Dr. L. Hartono', 'A. Singh'];

export function nextNcId(items) {
  const nums = items.map(i => parseInt(i.id.replace(/\D/g, '').slice(-4))).filter(n => !isNaN(n));
  const max  = nums.length ? Math.max(...nums) : 111;
  return `NC-2026-${String(max + 1).padStart(4, '0')}`;
}

export const DEFAULT_WHYS = [
  { question: 'Why did this non-conformance occur?',         answer: '' },
  { question: 'Why was that the case?',                       answer: '' },
  { question: "Why didn't existing controls prevent it?",     answer: '' },
  { question: 'Why was the process designed this way?',       answer: '' },
  { question: 'What is the underlying systemic root cause?',  answer: '' },
];

const NCRaiseDrawer = ({ items, onSave, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', source: '', clause: '',
    severity: 'Medium', clinicalSig: 'No', owner: user?.name || '', dueDate: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title  = 'Required';
    if (!form.source)       e.source = 'Required';
    if (!form.owner.trim()) e.owner  = 'Required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const today = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    onSave({
      id:                nextNcId(items),
      title:             form.title.trim(),
      description:       form.description.trim(),
      source:            form.source,
      clause:            form.clause.trim() || '—',
      severity:          form.severity,
      clinicalSig:       form.clinicalSig,
      phase:             'raised',
      owner:             form.owner.trim(),
      raised:            today,
      dueDate:           form.dueDate,
      due:               form.dueDate || '—',
      whys:              DEFAULT_WHYS.map(w => ({ ...w })),
      rootCause:         '',
      capaActions:       [],
      effectivenessNote: '',
      closedDate:        null,
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>NC &amp; CAPA · cl. 4.9</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Raise nonconformance</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">
        <div className="form-field">
          <label className="form-label">Title {errors.title && <span className="form-err-inline">{errors.title}</span>}</label>
          <input className={`form-input${errors.title ? ' is-error' : ''}`}
            value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Brief description of the nonconformance" />
        </div>

        <div className="form-field">
          <label className="form-label">Description <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional)</span></label>
          <textarea className="form-input" rows={3}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Context, evidence found, affected records, studies…"
            style={{ resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Source {errors.source && <span className="form-err-inline">{errors.source}</span>}</label>
            <select className={`form-input${errors.source ? ' is-error' : ''}`}
              value={form.source} onChange={e => set('source', e.target.value)}>
              <option value="">— select —</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ width: 110 }}>
            <label className="form-label">Clause</label>
            <input className="form-input" value={form.clause}
              onChange={e => set('clause', e.target.value)} placeholder="4.5.2" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Severity</label>
            <select className="form-input" value={form.severity} onChange={e => set('severity', e.target.value)}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Clinical significance</label>
            <select className="form-input" value={form.clinicalSig} onChange={e => set('clinicalSig', e.target.value)}>
              {CLIN_SIGS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Owner {errors.owner && <span className="form-err-inline">{errors.owner}</span>}</label>
            <input list="nc-raise-owners" className={`form-input${errors.owner ? ' is-error' : ''}`}
              value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Name" />
            <datalist id="nc-raise-owners">
              {OWNERS.map(o => <option key={o} value={o} />)}
            </datalist>
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Due date</label>
            <input className="form-input" type="date"
              value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <Icon name="alert" size={14} />Raise NC
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default NCRaiseDrawer;
