import React, { useState } from 'react';
import Icon from './icons';
import { Pill } from './components';
import { useAuth } from './AuthContext';

const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const PRIO_KIND  = { critical: 'bad', high: 'warn', medium: 'info', low: 'outline' };
const STATUSES   = ['open', 'in-progress', 'done'];

const SOURCE_LABELS = { nc: 'NC/CAPA', equipment: 'Equipment', document: 'Document', staff: 'Staff', audit: 'Audit', manual: 'Manual' };

function initForm(prefill, currentUser) {
  return {
    title:       prefill?.title       || '',
    description: prefill?.description || '',
    priority:    prefill?.priority    || 'medium',
    assignedTo:  prefill?.assignedTo  || currentUser?.name || '',
    dueDate:     prefill?.dueDate     || '',
    clause:      prefill?.clause      || '',
    source:      prefill?.source      || '',
    sourceType:  prefill?.sourceType  || 'manual',
    status:      prefill?.status      || 'open',
  };
}

const TaskFormDrawer = ({ prefill, isEdit, onSave, onDelete, onClose }) => {
  const { user, users } = useAuth();
  const [form, setForm]     = useState(() => initForm(prefill, user));
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title   = 'Required';
    if (!form.dueDate)      e.dueDate = 'Required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      ...(prefill || {}),
      title:       form.title.trim(),
      description: form.description.trim(),
      priority:    form.priority,
      assignedTo:  form.assignedTo,
      dueDate:     form.dueDate,
      clause:      form.clause.trim(),
      source:      form.source.trim(),
      sourceType:  form.sourceType,
      status:      form.status,
    });
    onClose();
  };

  const hasSource = prefill?.source && prefill?.sourceType && prefill.sourceType !== 'manual';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Workspace · My tasks</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {isEdit ? 'Edit task' : 'Create task'}
          </div>
          {hasSource && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              Linked to {SOURCE_LABELS[prefill.sourceType] || prefill.sourceType}:{' '}
              <span className="mono" style={{ color: 'var(--accent-ink)' }}>{prefill.source}</span>
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">
        <div className="form-field">
          <label className="form-label">Title {errors.title && <span className="form-err-inline">{errors.title}</span>}</label>
          <input className={`form-input${errors.title ? ' is-error' : ''}`}
            value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="What needs to be done?" autoFocus />
        </div>

        <div className="form-field">
          <label className="form-label">Description <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional)</span></label>
          <textarea className="form-input" rows={2}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Additional context, acceptance criteria…"
            style={{ resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Priority</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {PRIORITIES.map(p => (
                <button key={p}
                  className={`btn${form.priority === p ? '' : ' btn-ghost'}`}
                  style={{ padding: '4px 10px', fontSize: 11 }}
                  onClick={() => set('priority', p)}>
                  <Pill kind={PRIO_KIND[p]}>{p}</Pill>
                </button>
              ))}
            </div>
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
            <label className="form-label">Assigned to</label>
            <select className="form-input" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
              <option value="">— unassigned —</option>
              {(users || []).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Due date {errors.dueDate && <span className="form-err-inline">{errors.dueDate}</span>}</label>
            <input className={`form-input${errors.dueDate ? ' is-error' : ''}`}
              type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Clause ref.</label>
            <input className="form-input" value={form.clause}
              onChange={e => set('clause', e.target.value)} placeholder="e.g. 5.3.4" />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label">Source / context</label>
            <input className="form-input" value={form.source}
              onChange={e => set('source', e.target.value)} placeholder="NC-2026-0111, audit…"
              readOnly={hasSource} style={hasSource ? { background: 'var(--surface-2)', color: 'var(--ink-3)' } : {}} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <Icon name={isEdit ? 'check' : 'plus'} size={14} />
            {isEdit ? 'Save changes' : 'Create task'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
          {isEdit && onDelete && (
            <button className="btn" style={{ color: 'var(--bad)', borderColor: 'var(--bad-soft)' }}
              onClick={() => { onDelete(prefill.id); onClose(); }}>
              <Icon name="x" size={14} />Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskFormDrawer;
