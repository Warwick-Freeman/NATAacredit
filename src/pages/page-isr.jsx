import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Tabs } from '../components';
import { useAuth } from '../AuthContext';

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

// ── Constants ─────────────────────────────────────────────────────────────────

const PARAMS = [
  { id: 'staging',          label: 'Sleep staging (epoch-by-epoch)',  required: true  },
  { id: 'obstructiveApnea', label: 'Obstructive apnea',               required: true  },
  { id: 'centralApnea',     label: 'Central apnea',                   required: true  },
  { id: 'hypopnea',         label: 'Hypopnea',                        required: true  },
  { id: 'legMovements',     label: 'Leg movements',                   required: true  },
  { id: 'arousals',         label: 'Arousals',                        required: true  },
  { id: 'rera',             label: 'RERA (if lab reports)',           required: false },
];

const DEFAULT_THRESHOLDS = {
  staging: 90, obstructiveApnea: 80, centralApnea: 80,
  hypopnea: 80, legMovements: 80, arousals: 80, rera: 80,
};

const ADMIN_ROLES = ['Network Director', 'Quality Manager', 'Medical Director', 'Site Director'];

const CORRECTIVE_ACTIONS = [
  'Review AASM scoring rules for affected parameter(s)',
  'Attend targeted inter-scorer calibration session',
  'Complete online scoring module for affected parameter',
  'Shadow Network Director scoring session (≥1 full PSG)',
  'Independent re-score of reference PSGs with ND review',
  'Attend sleep medicine grand rounds / CME session',
  'Formal performance improvement plan (PIP) initiated',
];

function currentQuarter() {
  const d = new Date();
  return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
}

function quarterList(n = 6) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(`Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`);
    d.setMonth(d.getMonth() - 3);
  }
  return out;
}

function statusColor(concordance, threshold) {
  if (concordance == null) return 'outline';
  return concordance >= threshold ? 'good' : concordance >= threshold * 0.9 ? 'warn' : 'bad';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

function parseJson(s, fallback) {
  try { return JSON.parse(s || JSON.stringify(fallback)); } catch { return fallback; }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function SegmentedBar({ steps }) {
  // steps: [{label, done, active}]
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1, height: 6, borderRadius: 3,
          background: s.done ? 'var(--good)' : s.active ? 'var(--warn)' : 'var(--border)' }}
          title={s.label} />
      ))}
    </div>
  );
}

// ── PAGE A — MY SCORING ───────────────────────────────────────────────────────

const MyScoringTab = ({ quarter, onQuarterChange }) => {
  const { user } = useAuth();
  const scorerName = user?.name ?? '';
  const [studies,     setStudies]     = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [myAssess,    setMyAssess]    = useState([]); // signed assessments for this scorer
  const [loading,     setLoading]     = useState(true);
  const [opening,     setOpening]     = useState(null);
  const [marking,     setMarking]     = useState(null);
  const [error,       setError]       = useState('');
  const [ackSaving,   setAckSaving]   = useState(null);

  const quarters = quarterList(6);

  const load = useCallback(() => {
    setLoading(true);
    api(`/api/isr/sessions?quarter=${encodeURIComponent(quarter)}`)
      .then(r => { setStudies(r.studies ?? []); setSessions(r.sessions ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Load signed assessments independently so a failure here doesn't block study display
    api(`/api/isr?quarter=${encodeURIComponent(quarter)}`)
      .then(data => setMyAssess((data ?? []).filter(a => a.scorer === scorerName)))
      .catch(() => {});
  }, [quarter, scorerName]);

  useEffect(() => { load(); }, [load]);

  const mySession = (refId) =>
    sessions.find(s => s.referenceStudyId === refId && s.scorerName === scorerName);

  const handleOpen = async (study) => {
    setError('');
    setOpening(study.id);
    try {
      const { url } = await api(`/api/isr/prodigi-url/${encodeURIComponent(study.studyId)}`);
      window.open(url, '_blank');
      await api('/api/isr/sessions', {
        method: 'POST',
        body: JSON.stringify({ referenceStudyId: study.id, scorerName, status: 'opened' }),
      });
      load();
    } catch (e) {
      const m = e.message.match(/^\d+: (.+)$/s);
      if (m) {
        try { setError(JSON.parse(m[1]).error || m[1]); } catch { setError(m[1]); }
      } else {
        setError(`Could not open ProDigi: ${e.message}`);
      }
    } finally { setOpening(null); }
  };

  const handleMarkDone = async (study) => {
    setMarking(study.id);
    try {
      await api('/api/isr/sessions', {
        method: 'POST',
        body: JSON.stringify({ referenceStudyId: study.id, scorerName, status: 'completed' }),
      });
      load();
    } finally { setMarking(null); }
  };

  const handleAcknowledge = async (assessment) => {
    setAckSaving(assessment.id);
    try {
      await api(`/api/isr/${assessment.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          quarter: assessment.quarter,
          scorerAcknowledgedAt: new Date().toISOString().slice(0, 16),
        }),
      });
      load();
    } finally { setAckSaving(null); }
  };

  const completed   = studies.filter(s => mySession(s.id)?.status === 'completed').length;
  const total       = studies.length;
  const allDone     = total > 0 && completed === total;
  const barSteps    = studies.map(s => {
    const sess = mySession(s.id);
    return { label: s.label || s.studyId, done: sess?.status === 'completed', active: sess?.status === 'opened' };
  });

  // My signed assessments with action plans needing acknowledgement
  const needsAck = myAssess.filter(a => {
    const plan = parseJson(a.actionPlanJson, {});
    return a.status === 'signed' && plan.items?.length > 0 && !a.scorerAcknowledgedAt;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Quarter selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>Quarter</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {quarters.map(q => (
            <button key={q} onClick={() => onQuarterChange(q)}
              style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: `1.5px solid ${q === quarter ? 'var(--accent)' : 'var(--border)'}`,
                background: q === quarter ? 'var(--accent-soft)' : 'transparent',
                color: q === quarter ? 'var(--accent-ink)' : 'var(--ink-2)' }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 7, background: 'var(--bad-soft)', border: '1px solid var(--bad)', color: 'var(--bad)', fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Action plan acknowledgement banner */}
      {needsAck.map(a => {
        const plan = parseJson(a.actionPlanJson, {});
        return (
          <div key={a.id} style={{ background: 'var(--warn-surface)', border: '1px solid var(--warn)', borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              <Icon name="alert" size={14} style={{ color: 'var(--warn)', marginRight: 6 }} />
              Action plan requires your acknowledgement — {a.assessmentRef}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 10 }}>
              Your ISR review for {a.quarter} identified areas below threshold. Please review the action plan below and acknowledge.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {(plan.items ?? []).map((item, i) => (
                <div key={i} style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                  <Icon name="dot_grid" size={10} style={{ color: 'var(--ink-3)', marginTop: 2, flexShrink: 0 }} />
                  <span>{item.action}</span>
                  {item.dueDate && <span style={{ color: 'var(--ink-3)' }}>· Due {item.dueDate}</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ fontSize: 12 }}
              disabled={ackSaving === a.id}
              onClick={() => handleAcknowledge(a)}>
              <Icon name="check" size={12} />
              {ackSaving === a.id ? 'Saving…' : 'I acknowledge this action plan'}
            </button>
          </div>
        );
      })}

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: 24 }}>Loading…</div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-3)', fontSize: 13 }}>
          <Icon name="paper" size={32} style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          No reference studies assigned for {quarter} yet.
        </div>
      ) : (
        <>
          {/* Progress header */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '14px 18px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Your scoring progress — {quarter}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
                  {completed} of {total} reference studies scored
                </div>
              </div>
              <Pill kind={allDone ? 'good' : completed > 0 ? 'warn' : 'outline'}>
                {allDone ? 'All done' : `${completed}/${total}`}
              </Pill>
            </div>
            <SegmentedBar steps={barSteps} />
            {!allDone && (
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 5 }}>
                {studies.filter((_, i) => !barSteps[i].done).map(s => s.label || s.studyId).join(', ')} · pending
              </div>
            )}
          </div>

          {/* Study cards */}
          <div>
            <SectionLabel>Assigned reference studies</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {studies.map(study => {
                const sess   = mySession(study.id);
                const status = sess?.status ?? 'pending';
                const kind   = status === 'completed' ? 'good' : status === 'opened' ? 'warn' : 'outline';
                const label  = status === 'completed' ? 'Scored' : status === 'opened' ? 'Opened' : 'Pending';
                return (
                  <div key={study.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: status === 'completed' ? 'var(--good)' : status === 'opened' ? 'var(--warn)' : 'var(--border)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{study.label || study.studyId}</span>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        {study.studyId}
                        {sess?.openedAt    && ` · Opened ${fmtDate(sess.openedAt)}`}
                        {sess?.completedAt && ` · Scored ${fmtDate(sess.completedAt)}`}
                        {!sess             && ' · Not yet started'}
                      </div>
                    </div>
                    <Pill kind={kind}>{label}</Pill>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn" style={{ fontSize: 12 }}
                        onClick={() => handleOpen(study)} disabled={opening === study.id}>
                        <Icon name="arrow_up_right" size={12} />
                        {opening === study.id ? 'Opening…' : 'Open in ProDigi'}
                      </button>
                      {status !== 'completed' && (
                        <button className="btn btn-primary" style={{ fontSize: 12 }}
                          onClick={() => handleMarkDone(study)} disabled={marking === study.id}>
                          <Icon name="check" size={12} />
                          {marking === study.id ? '…' : 'Mark as scored'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* My results — only signed assessments */}
          {myAssess.filter(a => a.status === 'signed').length > 0 && (
            <div>
              <SectionLabel>My results — {quarter}</SectionLabel>
              {myAssess.filter(a => a.status === 'signed').map(a => {
                const results    = parseJson(a.results, {});
                const thresholds = parseJson(a.thresholds, {});
                const allMet     = PARAMS.filter(p => p.required).every(p => {
                  const v = results[p.id]; const t = thresholds[p.id] ?? DEFAULT_THRESHOLDS[p.id];
                  return v != null && v >= t;
                });
                return (
                  <div key={a.id} className="card" style={{ marginBottom: 8 }}>
                    <div style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{a.assessmentRef}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>vs {a.reviewer} · Signed {fmtDate(a.signedAt)}</span>
                        <div style={{ marginLeft: 'auto' }}>
                          <Pill kind={allMet ? 'good' : 'bad'}>{allMet ? 'All thresholds met' : 'Below threshold'}</Pill>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
                        {PARAMS.map(p => {
                          const val = results[p.id];
                          const thr = thresholds[p.id] ?? DEFAULT_THRESHOLDS[p.id];
                          if (val == null && !p.required) return null;
                          return (
                            <div key={p.id} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: 5, background: 'var(--surface-2)' }}>
                              <span style={{ color: 'var(--ink-2)' }}>{p.label.split('(')[0].trim()}</span>
                              {val != null
                                ? <span style={{ fontWeight: 700, color: val >= thr ? 'var(--good)' : 'var(--bad)', fontFamily: 'monospace' }}>{val}%</span>
                                : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                            </div>
                          );
                        })}
                      </div>
                      {a.scorerAcknowledgedAt && (
                        <div style={{ fontSize: 11, color: 'var(--good)', marginTop: 8 }}>
                          <Icon name="check" size={11} /> Acknowledged {fmtDate(a.scorerAcknowledgedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── PAGE B — ISR ADMINISTRATION ───────────────────────────────────────────────

// Sub: concordance entry form for one assessment
const ConcordanceForm = ({ assessment, onSaved }) => {
  const results    = parseJson(assessment.results, {});
  const thresholds = parseJson(assessment.thresholds, {});
  const [vals,  setVals]  = useState(() => {
    const init = {};
    PARAMS.forEach(p => { init[p.id] = results[p.id] ?? ''; });
    return init;
  });
  const [kappa, setKappa]   = useState(parseJson(assessment.results, {}).kappa ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const merged = { ...results };
    PARAMS.forEach(p => { if (vals[p.id] !== '') merged[p.id] = parseFloat(vals[p.id]); });
    if (kappa !== '') merged.kappa = parseFloat(kappa);
    try {
      const updated = await api(`/api/isr/${assessment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quarter: assessment.quarter, results: JSON.stringify(merged), status: 'in-progress' }),
      });
      onSaved(updated);
    } finally { setSaving(false); }
  };

  const thr = (id) => thresholds[id] ?? DEFAULT_THRESHOLDS[id];

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '14px 18px', border: '1px solid var(--border)', marginTop: 12 }}>
      <SectionLabel>Concordance results</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {PARAMS.map(p => {
          const v = vals[p.id] === '' ? null : parseFloat(vals[p.id]);
          const t = thr(p.id);
          const col = statusColor(v, t);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)' }}>
                {p.label}
                {!p.required && <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>(optional)</span>}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', width: 60, textAlign: 'right' }}>≥{t}%</span>
              <input type="number" min={0} max={100} step={0.1}
                className="form-input" style={{ width: 80, fontSize: 12, padding: '3px 8px', textAlign: 'right' }}
                placeholder="—"
                value={vals[p.id]}
                onChange={e => setVals(v => ({ ...v, [p.id]: e.target.value }))} />
              <div style={{ width: 24, textAlign: 'center' }}>
                {v != null && <Icon name={col === 'good' ? 'check' : 'x'} size={13}
                  style={{ color: `var(--${col})` }} />}
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-3)' }}>Cohen's κ (optional secondary)</div>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', width: 60 }} />
          <input type="number" min={-1} max={1} step={0.01}
            className="form-input" style={{ width: 80, fontSize: 12, padding: '3px 8px', textAlign: 'right' }}
            placeholder="0.00"
            value={kappa} onChange={e => setKappa(e.target.value)} />
          <div style={{ width: 24 }} />
        </div>
      </div>
      <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSave} disabled={saving}>
        <Icon name="check" size={12} />{saving ? 'Saving…' : 'Save results'}
      </button>
    </div>
  );
};

// Sub: action plan editor for one assessment
const ActionPlanEditor = ({ assessment, onSaved }) => {
  const plan    = parseJson(assessment.actionPlanJson, { items: [] });
  const results = parseJson(assessment.results, {});
  const thr     = (id) => (parseJson(assessment.thresholds, {})[id] ?? DEFAULT_THRESHOLDS[id]);

  const failedParams = PARAMS.filter(p => {
    const v = results[p.id];
    return v != null && v < thr(p.id);
  });

  const [selected, setSelected] = useState(() =>
    (plan.items ?? []).map(i => i.action)
  );
  const [custom,   setCustom]   = useState('');
  const [items,    setItems]    = useState(plan.items ?? []);
  const [saving,   setSaving]   = useState(false);

  const toggleStd = (action) => {
    if (selected.includes(action)) {
      setSelected(s => s.filter(a => a !== action));
      setItems(prev => prev.filter(i => i.action !== action));
    } else {
      setSelected(s => [...s, action]);
      setItems(prev => [...prev, { action, owner: assessment.scorer, dueDate: '', status: 'open' }]);
    }
  };

  const addCustom = () => {
    if (!custom.trim()) return;
    setItems(prev => [...prev, { action: custom.trim(), owner: assessment.scorer, dueDate: '', status: 'open' }]);
    setSelected(s => [...s, custom.trim()]);
    setCustom('');
  };

  const updateItem = (idx, key, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: value } : it));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api(`/api/isr/${assessment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quarter: assessment.quarter, actionPlanJson: JSON.stringify({ items }) }),
      });
      onSaved(updated);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '14px 18px', border: '1px solid var(--border)', marginTop: 12 }}>
      <SectionLabel>Action plan</SectionLabel>
      {failedParams.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--bad)', marginBottom: 10, padding: '6px 10px', borderRadius: 5, background: 'var(--bad-soft)' }}>
          Below threshold: {failedParams.map(p => p.label.split('(')[0].trim()).join(', ')}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: 8, fontWeight: 600 }}>Select corrective actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {CORRECTIVE_ACTIONS.map(action => (
          <label key={action} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 12 }}>
            <input type="checkbox" style={{ marginTop: 2, accentColor: 'var(--accent)' }}
              checked={selected.includes(action)}
              onChange={() => toggleStd(action)} />
            <span>{action}</span>
          </label>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input className="form-input" style={{ flex: 1, fontSize: 12 }}
            placeholder="Custom action…" value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()} />
          <button className="btn" style={{ fontSize: 12 }} onClick={addCustom} disabled={!custom.trim()}>
            <Icon name="plus" size={12} />Add
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 600, marginBottom: 6 }}>Action items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <div style={{ flex: 1, color: 'var(--ink-1)' }}>{item.action}</div>
                <input className="form-input" style={{ width: 130, fontSize: 11, padding: '3px 8px' }}
                  placeholder="Owner" value={item.owner}
                  onChange={e => updateItem(idx, 'owner', e.target.value)} />
                <input type="date" className="form-input" style={{ width: 130, fontSize: 11, padding: '3px 8px' }}
                  value={item.dueDate}
                  onChange={e => updateItem(idx, 'dueDate', e.target.value)} />
                <select className="form-input" style={{ width: 100, fontSize: 11, padding: '3px 6px' }}
                  value={item.status}
                  onChange={e => updateItem(idx, 'status', e.target.value)}>
                  <option value="open">Open</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSave} disabled={saving || items.length === 0}>
        <Icon name="check" size={12} />{saving ? 'Saving…' : 'Save action plan'}
      </button>
    </div>
  );
};

// Sub: sign/export section for one assessment
const SignSection = ({ assessment, onSigned }) => {
  const [showAtt,  setShowAtt]  = useState(false);
  const [attBy,    setAttBy]    = useState(assessment.attestationBy   || '');
  const [attDate,  setAttDate]  = useState(assessment.attestationDate || '');
  const [notes,    setNotes]    = useState('');
  const [signing,  setSigning]  = useState(false);
  const [attSaving, setAttSaving] = useState(false);

  const needsAtt   = assessment.reviewerRole === 'Medical Staff' && !assessment.attestationBy;
  const canSign    = !needsAtt;

  const handleSaveAtt = async () => {
    setAttSaving(true);
    try {
      await api(`/api/isr/${assessment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quarter: assessment.quarter, attestationBy: attBy, attestationDate: attDate }),
      });
      setShowAtt(false);
    } finally { setAttSaving(false); }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      const updated = await api(`/api/isr/${assessment.id}/sign`, {
        method: 'POST',
        body: JSON.stringify({ attestationBy: attBy || null, attestationDate: attDate || null, notes: notes || null }),
      });
      onSigned(updated);
    } finally { setSigning(false); }
  };

  if (assessment.status === 'signed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--good)', marginTop: 10 }}>
        <Icon name="check" size={14} />
        Signed by {assessment.signedBy} on {fmtDate(assessment.signedAt)}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      {assessment.reviewerRole === 'Medical Staff' && (
        <div style={{ marginBottom: 10 }}>
          <div className="callout" style={{ marginBottom: 8 }}>
            <strong>Network Director attestation required</strong> — reviewer is Medical Staff.
            {assessment.attestationBy
              ? <span style={{ color: 'var(--good)', marginLeft: 8 }}>
                  <Icon name="check" size={12} /> Attested by {assessment.attestationBy} on {fmtDate(assessment.attestationDate)}
                </span>
              : <span style={{ color: 'var(--warn)', marginLeft: 8 }}>Pending. Sign is blocked until attested.</span>}
          </div>
          {!assessment.attestationBy && (
            showAtt ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className="form-input" style={{ flex: 1, fontSize: 12 }}
                  placeholder="Network Director name" value={attBy} onChange={e => setAttBy(e.target.value)} />
                <input type="date" className="form-input" style={{ width: 140, fontSize: 12 }}
                  value={attDate} onChange={e => setAttDate(e.target.value)} />
                <button className="btn btn-primary" style={{ fontSize: 12 }}
                  onClick={handleSaveAtt} disabled={attSaving || !attBy || !attDate}>
                  {attSaving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn" style={{ fontSize: 12 }} onClick={() => setShowAtt(false)}>Cancel</button>
              </div>
            ) : (
              <button className="btn" style={{ fontSize: 12 }} onClick={() => setShowAtt(true)}>
                <Icon name="pen" size={12} />Record attestation
              </button>
            )
          )}
        </div>
      )}
      {canSign && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <input className="form-input" style={{ flex: 1, fontSize: 12 }}
            placeholder="Optional notes…" value={notes} onChange={e => setNotes(e.target.value)} />
          <button className="btn btn-primary" style={{ fontSize: 12 }}
            onClick={handleSign} disabled={signing}>
            <Icon name="pen" size={12} />{signing ? 'Signing…' : 'Sign & date report'}
          </button>
        </div>
      )}
    </div>
  );
};

// Sub: expandable assessment row for admin
const AdminAssessmentRow = ({ assessment, onUpdated }) => {
  const [expanded, setExpanded] = useState(false);
  const [mode,     setMode]     = useState(null); // 'concordance' | 'action' | null

  const results    = parseJson(assessment.results, {});
  const thresholds = parseJson(assessment.thresholds, {});
  const plan       = parseJson(assessment.actionPlanJson, { items: [] });

  const requiredMet = PARAMS.filter(p => p.required).every(p => {
    const v = results[p.id]; const t = thresholds[p.id] ?? DEFAULT_THRESHOLDS[p.id];
    return v != null && v >= t;
  });
  const anyData    = PARAMS.some(p => results[p.id] != null);
  const needsPlan  = anyData && !requiredMet && plan.items.length === 0;
  const statusKind = assessment.status === 'signed' ? 'good'
    : assessment.status === 'in-progress' ? (anyData ? (requiredMet ? 'good' : 'bad') : 'warn')
    : 'outline';

  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}>
        <Icon name={expanded ? 'chev_down' : 'chev_right'} size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{assessment.assessmentRef}</span>
            <span style={{ fontSize: 12 }}>{assessment.scorer}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>vs {assessment.reviewer}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {assessment.reviewerRole}
            {assessment.signedAt && ` · Signed ${fmtDate(assessment.signedAt)} by ${assessment.signedBy}`}
            {needsPlan && <span style={{ color: 'var(--warn)', marginLeft: 8 }}>· Action plan needed</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {anyData && <Pill kind={requiredMet ? 'good' : 'bad'}>{requiredMet ? 'All met' : 'Below threshold'}</Pill>}
          <Pill kind={statusKind}>
            {assessment.status === 'signed' ? 'Signed'
              : assessment.status === 'in-progress' ? 'In progress'
              : 'Pending'}
          </Pill>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px' }}>
          {/* Results summary */}
          {anyData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 5, marginBottom: 12 }}>
              {PARAMS.map(p => {
                const v = results[p.id]; const t = thresholds[p.id] ?? DEFAULT_THRESHOLDS[p.id];
                if (v == null && !p.required) return null;
                return (
                  <div key={p.id} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderRadius: 5,
                    background: v != null ? (v >= t ? 'var(--good-surface)' : 'var(--bad-soft)') : 'var(--surface-2)' }}>
                    <span style={{ color: 'var(--ink-2)' }}>{p.label.split('(')[0].trim()}</span>
                    {v != null
                      ? <span style={{ fontWeight: 700, fontFamily: 'monospace', color: v >= t ? 'var(--good)' : 'var(--bad)' }}>{v}%</span>
                      : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          {assessment.status !== 'signed' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: mode ? 0 : 0 }}>
              <button className="btn" style={{ fontSize: 12 }}
                onClick={() => setMode(m => m === 'concordance' ? null : 'concordance')}>
                <Icon name="edit" size={12} />Enter concordance
              </button>
              <button className="btn" style={{ fontSize: 12 }}
                onClick={() => setMode(m => m === 'action' ? null : 'action')}>
                <Icon name="flag" size={12} />
                Action plan {plan.items.length > 0 ? `(${plan.items.length})` : ''}
              </button>
            </div>
          )}

          {mode === 'concordance' && (
            <ConcordanceForm assessment={assessment} onSaved={u => { onUpdated(u); setMode(null); }} />
          )}
          {mode === 'action' && (
            <ActionPlanEditor assessment={assessment} onSaved={u => { onUpdated(u); setMode(null); }} />
          )}

          {/* Action plan display (when saved and not editing) */}
          {mode !== 'action' && plan.items.length > 0 && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--warn-surface)', borderRadius: 7, border: '1px solid var(--warn)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>ACTION PLAN</div>
              {plan.items.map((item, i) => (
                <div key={i} style={{ fontSize: 12, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                  <Pill kind={item.status === 'completed' ? 'good' : item.status === 'in-progress' ? 'warn' : 'outline'}
                    style={{ fontSize: 10 }}>{item.status}</Pill>
                  <span style={{ flex: 1 }}>{item.action}</span>
                  <span style={{ color: 'var(--ink-3)' }}>{item.owner}</span>
                  {item.dueDate && <span style={{ color: 'var(--ink-3)' }}>Due {item.dueDate}</span>}
                  {assessment.scorerAcknowledgedAt && (
                    <span style={{ color: 'var(--good)', fontSize: 11 }}>
                      <Icon name="check" size={11} /> Scorer acknowledged {fmtDate(assessment.scorerAcknowledgedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <SignSection assessment={assessment} onSigned={onUpdated} />
        </div>
      )}
    </div>
  );
};

const AdminTab = () => {
  const { user } = useAuth();
  const [adminQuarter, setAdminQuarter] = useState(currentQuarter());
  const [refStudies,   setRefStudies]   = useState([]);
  const [allSessions,  setAllSessions]  = useState([]);
  const [assessments,  setAssessments]  = useState([]);
  const [addStudyId,   setAddStudyId]   = useState('');
  const [addLabel,     setAddLabel]     = useState('');
  const [addSaving,    setAddSaving]    = useState(false);
  const [addError,     setAddError]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showNew,      setShowNew]      = useState(false);

  // New assessment form state
  const [newForm, setNewForm] = useState({ scorer: '', reviewer: '', reviewerRole: 'Network Director' });
  const [newSaving, setNewSaving] = useState(false);

  const quarters = quarterList(6);

  const loadRef = useCallback(() => {
    setLoading(true);
    api(`/api/isr/sessions?quarter=${encodeURIComponent(adminQuarter)}`)
      .then(r => { setRefStudies(r.studies ?? []); setAllSessions(r.sessions ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminQuarter]);

  const loadAssessments = useCallback(() => {
    api(`/api/isr?quarter=${encodeURIComponent(adminQuarter)}`)
      .then(data => setAssessments(data ?? []))
      .catch(() => {});
  }, [adminQuarter]);

  useEffect(() => { loadRef(); loadAssessments(); }, [loadRef, loadAssessments]);

  const handleAddStudy = async () => {
    if (!addStudyId.trim()) return;
    setAddError('');
    setAddSaving(true);
    try {
      await api('/api/isr/reference', {
        method: 'POST',
        body: JSON.stringify({ studyId: addStudyId.trim(), quarter: adminQuarter, label: addLabel.trim() }),
      });
      setAddStudyId(''); setAddLabel('');
      loadRef();
    } catch (e) {
      setAddError(e.message || 'Failed to add study');
    } finally { setAddSaving(false); }
  };

  const handleDeleteRef = async (id) => {
    if (!window.confirm('Remove this reference study and all associated scoring records?')) return;
    try { await api(`/api/isr/reference/${id}`, { method: 'DELETE' }); } catch {}
    loadRef();
  };

  const handleCreateAssessment = async () => {
    if (!newForm.scorer || !newForm.reviewer) return;
    setNewSaving(true);
    try {
      await api('/api/isr', {
        method: 'POST',
        body: JSON.stringify({
          quarter: adminQuarter,
          scorer: newForm.scorer,
          reviewer: newForm.reviewer,
          reviewerRole: newForm.reviewerRole,
          thresholds: JSON.stringify(DEFAULT_THRESHOLDS),
        }),
      });
      setNewForm({ scorer: '', reviewer: '', reviewerRole: 'Network Director' });
      setShowNew(false);
      loadAssessments();
    } finally { setNewSaving(false); }
  };

  const scorers      = [...new Set(allSessions.map(s => s.scorerName))].sort();
  const totalScored  = allSessions.filter(s => s.status === 'completed').length;
  const signed       = assessments.filter(a => a.status === 'signed').length;
  const refOk        = refStudies.length >= 3;

  // Compliance checklist data
  const checklist = [
    ['≥3 PSG reference studies per quarter', refOk],
    ['All scorers have opened their studies', scorers.length > 0 && scorers.every(sc => {
      return refStudies.every(s => {
        const sess = allSessions.find(ss => ss.referenceStudyId === s.id && ss.scorerName === sc);
        return sess != null;
      });
    })],
    ['Concordance results entered for all assessments', assessments.length > 0 && assessments.every(a => PARAMS.filter(p => p.required).every(p => parseJson(a.results, {})[p.id] != null))],
    ['Action plans in place where required', assessments.filter(a => {
      const r = parseJson(a.results, {}); const t = parseJson(a.thresholds, {});
      return PARAMS.filter(p => p.required).some(p => { const v = r[p.id]; return v != null && v < (t[p.id] ?? DEFAULT_THRESHOLDS[p.id]); });
    }).every(a => parseJson(a.actionPlanJson, { items: [] }).items.length > 0)],
    ['All reports signed for the quarter', assessments.length > 0 && signed === assessments.length],
    ['Reports retained ≥5 years (never hard-deleted)', signed > 0],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Quarter selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>Quarter</label>
        {quarters.map(q => (
          <button key={q} onClick={() => setAdminQuarter(q)}
            style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${q === adminQuarter ? 'var(--accent)' : 'var(--border)'}`,
              background: q === adminQuarter ? 'var(--accent-soft)' : 'transparent',
              color: q === adminQuarter ? 'var(--accent-ink)' : 'var(--ink-2)' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Stat strip */}
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label"><Icon name="users" size={13} />Scorers</div>
          <div className="stat-value">{scorers.length}</div>
          <div className="stat-meta">with sessions</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="paper" size={13} />Reference PSGs</div>
          <div className="stat-value" style={{ color: refOk ? 'var(--good)' : 'var(--bad)' }}>{refStudies.length}</div>
          <div className="stat-meta">{refOk ? 'Meets ≥3 requirement' : '< 3 — add more'}</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="check" size={13} />Scored</div>
          <div className="stat-value">{totalScored}</div>
          <div className="stat-meta">sessions completed</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="shield" size={13} />Signed reports</div>
          <div className="stat-value" style={{ color: signed > 0 && signed === assessments.length ? 'var(--good)' : 'var(--ink)' }}>
            {signed}/{assessments.length}
          </div>
          <div className="stat-meta">this quarter</div>
        </div>
      </div>

      {/* Reference studies */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Reference studies — {adminQuarter}</div>
            <div className="card-sub">≥3 PSGs required per quarter · 200 epochs each</div>
          </div>
          {!refOk && <Pill kind="bad">Needs {3 - refStudies.length} more</Pill>}
          {refOk  && <Pill kind="good">Requirement met</Pill>}
        </div>
        <div className="card-pad">
          <div style={{ display: 'flex', gap: 8, marginBottom: addError ? 8 : 12 }}>
            <input className="form-input" style={{ flex: '0 0 280px', fontFamily: 'monospace', fontSize: 12 }}
              placeholder="Study ID (GUID or number)"
              value={addStudyId} onChange={e => { setAddStudyId(e.target.value); setAddError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAddStudy()} />
            <input className="form-input" style={{ flex: 1, fontSize: 12 }}
              placeholder="Label (optional)"
              value={addLabel} onChange={e => setAddLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddStudy()} />
            <button className="btn btn-primary" onClick={handleAddStudy}
              disabled={addSaving || !addStudyId.trim()}>
              <Icon name="plus" size={12} />{addSaving ? 'Adding…' : 'Add'}
            </button>
          </div>
          {addError && (
            <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bad-soft)', border: '1px solid var(--bad)', color: 'var(--bad)', fontSize: 12, marginBottom: 12 }}>
              {addError}
            </div>
          )}
          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Loading…</div>
          ) : refStudies.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>No reference studies for {adminQuarter}.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--ink-2)' }}>Study ID</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--ink-2)' }}>Label</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--ink-2)' }}>Added by</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--ink-2)' }}>Date</th>
                  <th style={{ width: 32 }} />
                </tr>
              </thead>
              <tbody>
                {refStudies.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-ink)' }}>{s.studyId}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--ink-2)' }}>{s.label || '—'}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--ink-3)' }}>{s.addedBy}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--ink-3)' }}>{fmtDate(s.addedAt)}</td>
                    <td style={{ padding: '7px 4px' }}>
                      <button className="btn btn-ghost" style={{ padding: '2px 6px', color: 'var(--bad)' }}
                        onClick={() => handleDeleteRef(s.id)}>
                        <Icon name="x" size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Scoring progress matrix */}
      {refStudies.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Scoring progress</div>
              <div className="card-sub">Live status per scorer</div>
            </div>
          </div>
          <div className="card-pad" style={{ overflowX: 'auto' }}>
            {scorers.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                No scoring activity yet. Staff appear here once they open a study.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: 'var(--ink-2)', minWidth: 140 }}>Scorer</th>
                    {refStudies.map(s => (
                      <th key={s.id} style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 600, color: 'var(--ink-2)', minWidth: 110 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.studyId}</div>
                        {s.label && <div style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 10 }}>{s.label}</div>}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 600, color: 'var(--ink-2)' }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.map((scorer, si) => {
                    const doneCount = refStudies.filter(s => {
                      const sess = allSessions.find(ss => ss.referenceStudyId === s.id && ss.scorerName === scorer);
                      return sess?.status === 'completed';
                    }).length;
                    return (
                      <tr key={scorer} style={{ borderBottom: '1px solid var(--border)', background: si % 2 === 1 ? 'var(--surface-2)' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>{scorer}</td>
                        {refStudies.map(s => {
                          const sess   = allSessions.find(ss => ss.referenceStudyId === s.id && ss.scorerName === scorer);
                          const status = sess?.status ?? 'pending';
                          return (
                            <td key={s.id} style={{ textAlign: 'center', padding: '8px' }}>
                              {status === 'completed'
                                ? <span title={`Scored ${fmtDate(sess.completedAt)}`}><Icon name="check" size={14} style={{ color: 'var(--good)' }} /></span>
                                : status === 'opened'
                                ? <span title={`Opened ${fmtDate(sess.openedAt)}`}><Icon name="arrow_up_right" size={14} style={{ color: 'var(--warn)' }} /></span>
                                : <span style={{ color: 'var(--border)', fontSize: 16 }}>○</span>}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <Pill kind={doneCount === refStudies.length ? 'good' : doneCount > 0 ? 'warn' : 'outline'}>
                            {doneCount}/{refStudies.length}
                          </Pill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Assessments + concordance */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionLabel>Assessments &amp; reports — {adminQuarter}</SectionLabel>
          <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setShowNew(v => !v)}>
            <Icon name="plus" size={12} />New assessment
          </button>
        </div>

        {showNew && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--accent)', borderRadius: 8, padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>New assessment — {adminQuarter}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label className="form-label">Scorer name</label>
                <input className="form-input" style={{ fontSize: 12 }} placeholder="M. Chen"
                  value={newForm.scorer} onChange={e => setNewForm(f => ({ ...f, scorer: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Reviewer (gold standard)</label>
                <input className="form-input" style={{ fontSize: 12 }} placeholder="Dr. R. Okafor"
                  value={newForm.reviewer} onChange={e => setNewForm(f => ({ ...f, reviewer: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Reviewer role</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Network Director', 'Medical Staff'].map(r => (
                  <button key={r} onClick={() => setNewForm(f => ({ ...f, reviewerRole: r }))}
                    style={{ padding: '4px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      border: `1.5px solid ${newForm.reviewerRole === r ? 'var(--accent)' : 'var(--border)'}`,
                      background: newForm.reviewerRole === r ? 'var(--accent-soft)' : 'transparent',
                      color: newForm.reviewerRole === r ? 'var(--accent-ink)' : 'var(--ink-2)' }}>
                    {r}
                  </button>
                ))}
              </div>
              {newForm.reviewerRole === 'Medical Staff' && (
                <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>
                  ND written attestation required before this report can be signed.
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ fontSize: 12 }}
                onClick={handleCreateAssessment}
                disabled={newSaving || !newForm.scorer || !newForm.reviewer}>
                <Icon name="check" size={12} />{newSaving ? 'Creating…' : 'Create'}
              </button>
              <button className="btn" style={{ fontSize: 12 }} onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        )}

        {loading && <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: 18 }}>Loading…</div>}
        {!loading && assessments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--ink-3)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 8 }}>
            No assessments for {adminQuarter}. Create one above.
          </div>
        )}
        {assessments.map(a => (
          <AdminAssessmentRow key={a.id} assessment={a}
            onUpdated={updated => setAssessments(prev => prev.map(x => x.id === updated.id ? updated : x))} />
        ))}
      </div>

      {/* N-24 compliance checklist */}
      <div className="card">
        <div className="card-head"><div className="card-title">Compliance checklist — {adminQuarter}</div></div>
        <div className="card-pad">
          {checklist.map(([label, met], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < checklist.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Icon name={met ? 'check' : 'alert'} size={14} style={{ color: met ? 'var(--good)' : 'var(--warn)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, flex: 1 }}>{label}</span>
              <Pill kind={met ? 'good' : 'outline'}>{met ? 'In place' : 'Action needed'}</Pill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const ISRPage = () => {
  const { user } = useAuth();
  const isAdmin  = ADMIN_ROLES.includes(user?.role);
  const [tab, setTab]       = useState('scoring');
  const [quarter, setQuarter] = useState(currentQuarter());

  const tabs = [
    { id: 'scoring', label: 'My ISR scoring' },
    ...(isAdmin ? [{ id: 'admin', label: 'ISR administration' }] : []),
  ];

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · AASM N-24"
        title="Inter-Scorer Reliability"
        subtitle="Quarterly concordance assessment · ≥3 PSGs/quarter · reports retained ≥5 years"
      />

      <Tabs value={tab} onChange={setTab} tabs={tabs} />

      <div style={{ marginTop: 20 }}>
        {tab === 'scoring' && (
          <MyScoringTab quarter={quarter} onQuarterChange={setQuarter} />
        )}
        {tab === 'admin' && isAdmin && (
          <AdminTab />
        )}
        {tab === 'admin' && !isAdmin && (
          <div style={{ padding: 24, color: 'var(--ink-3)', fontSize: 13 }}>
            Access restricted to administrators.
          </div>
        )}
      </div>
    </div>
  );
};

export default ISRPage;
