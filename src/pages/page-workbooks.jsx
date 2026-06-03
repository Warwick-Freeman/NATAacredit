import React, { useState, useEffect } from 'react';
import Icon from '../icons';
import { PageHeader, Pill } from '../components';
import { useTaskContext } from '../TaskContext';
import { useAuth } from '../AuthContext';
import WorkbookFormPage from './page-workbook-form';

const BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders() {
  const token = localStorage.getItem('nexus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const FREQ_OPTIONS = [
  { value: 'quarterly',    label: 'Quarterly',     months: 3 },
  { value: 'semi-annual',  label: 'Semi-annually', months: 6 },
  { value: 'annual',       label: 'Annually',       months: 12 },
];

const CONDITION_ICONS = {
  'adult-osa':     'heart',
  'insomnia':      'moon',
  'narcolepsy':    'alert',
  'pediatric-osa': 'users',
  'restless-legs': 'pulse',
};

function workbookStatus(w) {
  if (!w.nextDue) return 'pending';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(w.nextDue);
  const days  = Math.round((due - today) / 86400000);
  if (days < 0)  return 'overdue';
  if (days <= 14) return 'due-soon';
  return 'on-track';
}

function daysLabel(nextDue) {
  if (!nextDue) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days  = Math.round((new Date(nextDue) - today) / 86400000);
  if (days < 0)  return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function nextPeriodLabel(nextDue, frequency) {
  if (!nextDue) return '';
  const d = new Date(nextDue);
  if (frequency === 'annual') return `FY ${d.getFullYear()}`;
  if (frequency === 'semi-annual') {
    const half = d.getMonth() < 6 ? 'H1' : 'H2';
    return `${half} ${d.getFullYear()}`;
  }
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

const STATUS_STYLE = {
  'overdue':  { kind: 'bad',  label: 'Overdue'   },
  'due-soon': { kind: 'warn', label: 'Due soon'  },
  'on-track': { kind: 'good', label: 'On track'  },
  'pending':  { kind: 'outline', label: 'Not started' },
};

// ── Component ─────────────────────────────────────────────────────────────────

const WorkbooksPage = () => {
  const { addTask } = useTaskContext();
  const { user } = useAuth();

  const [workbooks,  setWorkbooks]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [completing, setCompleting] = useState(null);
  const [completeForm, setCompleteForm] = useState({ date: new Date().toISOString().slice(0, 10), notes: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  // Form navigation
  const [formView, setFormView] = useState(null); // { workbookId, period, completionId, readOnly }

  // History (completions per workbook)
  const [history, setHistory] = useState({}); // { [workbookId]: [...completions] }
  const [historyOpen, setHistoryOpen] = useState({}); // { [workbookId]: bool }

  useEffect(() => {
    fetch(`${BASE}/api/workbooks`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(list => setWorkbooks(list.map(normalise)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadHistory = (workbookId) => {
    fetch(`${BASE}/api/workbooks/${workbookId}/completions`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(list => setHistory(prev => ({ ...prev, [workbookId]: list })))
      .catch(() => {});
  };

  const toggleHistory = (workbookId) => {
    const nowOpen = !historyOpen[workbookId];
    setHistoryOpen(prev => ({ ...prev, [workbookId]: nowOpen }));
    if (nowOpen && !history[workbookId]) loadHistory(workbookId);
  };

  const openNewForm = (w) => {
    const period = nextPeriodLabel(w.nextDue, w.frequency);
    setFormView({ workbookId: w.id, period, completionId: null, readOnly: false });
  };

  const openCompletion = (workbookId, completion) => {
    setFormView({ workbookId, period: completion.period, completionId: completion.id, readOnly: completion.status === 'complete' });
  };

  const handleFormBack = (workbookId) => {
    setFormView(null);
    loadHistory(workbookId);
  };

  function normalise(w) {
    return {
      id:            w.workbookId,
      title:         w.title,
      condition:     w.condition,
      fileName:      w.fileName,
      frequency:     w.frequency,
      lastCompleted: w.lastCompleted || '',
      nextDue:       w.nextDue || '',
      assignedTo:    w.assignedTo || '',
      notes:         w.notes || '',
    };
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleFrequencyChange(id, frequency) {
    const res = await fetch(`${BASE}/api/workbooks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ frequency }),
    });
    if (res.ok) {
      const updated = normalise(await res.json());
      setWorkbooks(prev => prev.map(w => w.id === id ? updated : w));
    }
  }

  async function handleComplete(id) {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/workbooks/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ completedDate: completeForm.date, notes: completeForm.notes }),
      });
      if (res.ok) {
        const updated = normalise(await res.json());
        setWorkbooks(prev => prev.map(w => w.id === id ? updated : w));
        setCompleting(null);
        setCompleteForm({ date: new Date().toISOString().slice(0, 10), notes: '' });
        showToast('Workbook marked as completed.');
      }
    } finally { setSaving(false); }
  }

  function handleGenerateTasks() {
    const due = workbooks.filter(w => {
      const s = workbookStatus(w);
      return s === 'overdue' || s === 'due-soon';
    });
    if (due.length === 0) { showToast('No workbooks are currently due or overdue.'); return; }
    due.forEach(w => {
      const s = workbookStatus(w);
      const period = nextPeriodLabel(w.nextDue, w.frequency);
      addTask({
        title:      `Complete ${w.title} — ${period}`,
        priority:   s === 'overdue' ? 'high' : 'medium',
        dueDate:    w.nextDue,
        assignedTo: w.assignedTo || (user?.name ?? ''),
        clause:     'N-22',
        source:     w.id,
        sourceType: 'workbook',
        description: `AASM measure reporting workbook: ${w.condition}. Period: ${period}.`,
      });
    });
    showToast(`${due.length} task${due.length > 1 ? 's' : ''} created.`);
  }

  const overdueCount  = workbooks.filter(w => workbookStatus(w) === 'overdue').length;
  const dueSoonCount  = workbooks.filter(w => workbookStatus(w) === 'due-soon').length;

  // Show form when navigating to a workbook
  if (formView) {
    return (
      <WorkbookFormPage
        workbookId={formView.workbookId}
        period={formView.period}
        completionId={formView.completionId}
        readOnly={formView.readOnly}
        onBack={() => handleFormBack(formView.workbookId)}
      />
    );
  }

  if (loading) return (
    <div style={{ padding: 32, fontSize: 13, color: 'var(--ink-3)' }}>Loading workbooks…</div>
  );

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Operations · AASM"
        title="Measure Reporting Workbooks"
        subtitle="Periodic quality measure completion tracked against AASM Standard N-22 / N-23"
        actions={
          <button className="btn btn-primary" onClick={handleGenerateTasks}>
            <Icon name="clipboard" size={14} />Generate tasks
            {(overdueCount + dueSoonCount) > 0 && (
              <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                {overdueCount + dueSoonCount}
              </span>
            )}
          </button>
        }
      />

      {toast && (
        <div className="banner info" style={{ marginBottom: 18 }}>
          <Icon name="check" size={16} />
          <span>{toast}</span>
          <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={() => setToast(null)}><Icon name="x" size={14} /></button>
        </div>
      )}

      {/* Summary strip */}
      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="banner" style={{ background: overdueCount > 0 ? 'var(--bad-soft)' : 'var(--warn-soft)', border: `1px solid ${overdueCount > 0 ? 'var(--bad)' : 'var(--warn)'}`, borderRadius: 8, marginBottom: 18 }}>
          <Icon name="alert" size={18} style={{ color: overdueCount > 0 ? 'var(--bad)' : 'var(--warn)' }} />
          <div style={{ flex: 1, fontSize: 13 }}>
            {overdueCount > 0 && <strong>{overdueCount} workbook{overdueCount > 1 ? 's' : ''} overdue. </strong>}
            {dueSoonCount > 0 && <span>{dueSoonCount} due within 14 days. </span>}
            Click <strong>Generate tasks</strong> to push these to My Tasks.
          </div>
        </div>
      )}

      {/* Workbook cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {workbooks.map(w => {
          const status      = workbookStatus(w);
          const statusStyle = STATUS_STYLE[status];
          const isCompleting = completing === w.id;
          const dLabel      = daysLabel(w.nextDue);

          return (
            <div key={w.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Card header */}
              <div className="card-head" style={{ paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0, display: 'grid', placeItems: 'center',
                    background: status === 'overdue' ? 'var(--bad-soft)' : status === 'due-soon' ? 'var(--warn-soft)' : 'var(--accent-soft)',
                    color: status === 'overdue' ? 'var(--bad)' : status === 'due-soon' ? 'var(--warn)' : 'var(--accent-ink)',
                  }}>
                    <Icon name={CONDITION_ICONS[w.id] ?? 'file'} size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.condition}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</div>
                  </div>
                </div>
                <Pill kind={statusStyle.kind}>{statusStyle.label}</Pill>
              </div>

              {/* Meta row */}
              <div style={{ padding: '0 18px 12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>

                {/* Schedule row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <Icon name="calendar" size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 90, flexShrink: 0 }}>Frequency</span>
                  <select
                    className="input"
                    style={{ flex: 1, fontSize: 12, padding: '3px 6px' }}
                    value={w.frequency}
                    onChange={e => handleFrequencyChange(w.id, e.target.value)}
                  >
                    {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Last completed */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="check" size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 90, flexShrink: 0 }}>Last completed</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{fmtDate(w.lastCompleted)}</span>
                </div>

                {/* Next due */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="alert" size={13} style={{ color: status === 'overdue' ? 'var(--bad)' : status === 'due-soon' ? 'var(--warn)' : 'var(--ink-3)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 90, flexShrink: 0 }}>Next due</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    {fmtDate(w.nextDue)}
                    {dLabel && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: status === 'overdue' ? 'var(--bad)' : status === 'due-soon' ? 'var(--warn)' : 'var(--ink-3)' }}>
                        ({dLabel})
                      </span>
                    )}
                  </span>
                </div>

                {/* Period */}
                {w.nextDue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="paper" size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 90, flexShrink: 0 }}>Period</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{nextPeriodLabel(w.nextDue, w.frequency)}</span>
                  </div>
                )}

                {/* Complete form */}
                {isCompleting && (
                  <div style={{ marginTop: 4, padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-ink)' }}>Record completion</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Date completed</label>
                        <input type="date" className="input" style={{ width: '100%', boxSizing: 'border-box', fontSize: 12 }}
                          value={completeForm.date}
                          onChange={e => setCompleteForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Notes <span style={{ fontWeight: 400 }}>(optional)</span></label>
                      <input className="input" style={{ width: '100%', boxSizing: 'border-box', fontSize: 12 }}
                        placeholder="Findings, data source, reviewer…"
                        value={completeForm.notes}
                        onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={() => handleComplete(w.id)} disabled={saving || !completeForm.date}>
                        <Icon name="check" size={12} />{saving ? 'Saving…' : 'Save completion'}
                      </button>
                      <button className="btn" style={{ fontSize: 12 }} onClick={() => setCompleting(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card footer — actions */}
              <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: 12, minWidth: 140 }} onClick={() => openNewForm(w)}>
                  <Icon name="edit" size={12} />Start online workbook
                </button>
                <a
                  href={`${BASE}/api/workbooks/${w.id}/file`}
                  target="_blank" rel="noreferrer"
                  className="btn"
                  style={{ fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Icon name="eye" size={12} />PDF
                </a>
                {!isCompleting && (
                  <button className="btn" style={{ fontSize: 12 }}
                    onClick={() => { setCompleting(w.id); setCompleteForm({ date: new Date().toISOString().slice(0, 10), notes: '' }); }}>
                    <Icon name="check" size={12} />Record
                  </button>
                )}
              </div>

              {/* History toggle */}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => toggleHistory(w.id)}
                  style={{ width: '100%', padding: '8px 18px', fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                  <Icon name={historyOpen[w.id] ? 'chev_up' : 'chev_down'} size={12} />
                  Completion history
                  {history[w.id]?.length > 0 && (
                    <span style={{ marginLeft: 4, fontSize: 10, background: 'var(--surface-2)', borderRadius: 8, padding: '1px 6px' }}>{history[w.id].length}</span>
                  )}
                </button>
                {historyOpen[w.id] && (
                  <div style={{ padding: '0 14px 12px' }}>
                    {!history[w.id] && <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '4px 4px' }}>Loading…</div>}
                    {history[w.id]?.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '4px 4px' }}>No completions yet.</div>}
                    {history[w.id]?.map(c => (
                      <div key={c.id}
                        onClick={() => openCompletion(w.id, c)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 4, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{c.period}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                            {c.completedAt ? `Completed ${c.completedAt.slice(0, 10)}` : `Started ${c.startedAt?.slice(0, 10)}`} · {c.completedBy}
                          </div>
                        </div>
                        <Pill kind={c.status === 'complete' ? 'good' : 'warn'}>
                          {c.status === 'complete' ? 'Complete' : 'In progress'}
                        </Pill>
                        <Icon name="chev_right" size={12} style={{ color: 'var(--ink-3)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>AASM Standards N-22 / N-23</span>
        <span>Quality assurance program must track ≥3 sleep medicine quality measures</span>
        <span>·</span>
        <span>Network Director reviews quarterly and attests to improvement efforts</span>
        <span>·</span>
        <span>Reports retained ≥5 years</span>
      </div>
    </div>
  );
};

export default WorkbooksPage;
