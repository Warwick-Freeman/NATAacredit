import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Tabs } from '../components';
import { useAuth } from '../AuthContext';
import NexusGrid from '../nexus-grid';

const BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders() {
  const t = localStorage.getItem('nexus_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function api(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { headers: { ...authHeaders(), 'Content-Type': 'application/json', ...opts.headers }, ...opts });
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

const DEFAULT_THRESHOLDS = { staging: 90, obstructiveApnea: 80, centralApnea: 80, hypopnea: 80, legMovements: 80, arousals: 80, rera: 80 };

function currentQuarter() {
  const d = new Date();
  return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
}

function statusColor(concordance, threshold) {
  if (concordance == null) return 'outline';
  return concordance >= threshold ? 'good' : concordance >= threshold * 0.9 ? 'warn' : 'bad';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

// ── ScoringTab ────────────────────────────────────────────────────────────────

const ScoringTab = ({ quarter }) => {
  const { user } = useAuth();
  const scorerName = user?.name ?? '';
  const [studies,  setStudies]  = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [opening,  setOpening]  = useState(null);
  const [marking,  setMarking]  = useState(null);
  const [error,    setError]    = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api(`/api/isr/sessions?quarter=${encodeURIComponent(quarter)}`)
      .then(r => { setStudies(r.studies ?? []); setSessions(r.sessions ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [quarter]);

  useEffect(() => { load(); }, [load]);

  const mySession = (refId) => sessions.find(s => s.referenceStudyId === refId && s.scorerName === scorerName);

  const handleOpen = async (study) => {
    setError('');
    setOpening(study.id);
    try {
      const { url } = await api(`/api/isr/prodigi-url/${encodeURIComponent(study.studyId)}`);
      window.open(url, '_blank');
      // record opened session
      await api('/api/isr/sessions', {
        method: 'POST',
        body: JSON.stringify({ referenceStudyId: study.id, scorerName, status: 'opened' }),
      });
      load();
    } catch (e) {
      // Extract the server's error message if present (format: "400: {\"error\":\"...\"}")
      const bodyMatch = e.message.match(/^\d+: (.+)$/s);
      if (bodyMatch) {
        try { setError(JSON.parse(bodyMatch[1]).error || bodyMatch[1]); }
        catch { setError(bodyMatch[1]); }
      } else {
        setError(`Could not open ProDigi: ${e.message}`);
      }
    } finally {
      setOpening(null);
    }
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

  if (loading) return <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-3)' }}>Loading…</div>;

  if (studies.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-3)', fontSize: 13 }}>
      <Icon name="paper" size={32} style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
      No reference studies have been assigned for {quarter} yet.<br />
      Ask your administrator to add study IDs in the Admin tab.
    </div>
  );

  const completed = studies.filter(s => mySession(s.id)?.status === 'completed').length;

  return (
    <div>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 7, background: 'var(--bad-soft)', border: '1px solid var(--bad)', color: 'var(--bad)', fontSize: 12, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Progress summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Your scoring progress — {quarter}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
            {completed} of {studies.length} reference studies completed
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {studies.map(s => {
            const sess = mySession(s.id);
            const status = sess?.status ?? 'pending';
            return (
              <div key={s.id} title={`${s.studyId}: ${status}`} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: status === 'completed' ? 'var(--good)' : status === 'opened' ? 'var(--warn)' : 'var(--border)',
              }} />
            );
          })}
        </div>
        <Pill kind={completed === studies.length ? 'good' : completed > 0 ? 'warn' : 'outline'}>
          {completed === studies.length ? 'All done' : `${completed}/${studies.length}`}
        </Pill>
      </div>

      {/* Study list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {studies.map(study => {
          const sess = mySession(study.id);
          const status = sess?.status ?? 'pending';
          const statusKind = status === 'completed' ? 'good' : status === 'opened' ? 'warn' : 'outline';
          const statusLabel = status === 'completed' ? 'Scored' : status === 'opened' ? 'Opened' : 'Pending';

          return (
            <div key={study.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Status dot */}
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: status === 'completed' ? 'var(--good)' : status === 'opened' ? 'var(--warn)' : 'var(--border)' }} />

              {/* Study info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{study.label || study.studyId}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                  {sess?.openedAt  && `Opened ${fmtDate(sess.openedAt)}`}
                  {sess?.completedAt && ` · Scored ${fmtDate(sess.completedAt)}`}
                  {!sess && 'Not yet started'}
                </div>
              </div>

              {/* Status pill */}
              <Pill kind={statusKind}>{statusLabel}</Pill>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn"
                  style={{ fontSize: 12 }}
                  onClick={() => handleOpen(study)}
                  disabled={opening === study.id}
                >
                  <Icon name="arrow_up_right" size={12} />
                  {opening === study.id ? 'Opening…' : 'Open in ProDigi'}
                </button>
                {status !== 'completed' && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12 }}
                    onClick={() => handleMarkDone(study)}
                    disabled={marking === study.id}
                  >
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
  );
};

// ── AdminTab ──────────────────────────────────────────────────────────────────

const AdminTab = ({ assessments, onRefresh }) => {
  const [adminQuarter, setAdminQuarter] = useState(currentQuarter());
  const [refStudies,   setRefStudies]   = useState([]);
  const [allSessions,  setAllSessions]  = useState([]);
  const [addStudyId,   setAddStudyId]   = useState('');
  const [addLabel,     setAddLabel]     = useState('');
  const [addSaving,    setAddSaving]    = useState(false);
  const [addError,     setAddError]     = useState('');
  const [loadingRef,   setLoadingRef]   = useState(false);

  const loadRef = useCallback(() => {
    setLoadingRef(true);
    api(`/api/isr/sessions?quarter=${encodeURIComponent(adminQuarter)}`)
      .then(r => { setRefStudies(r.studies ?? []); setAllSessions(r.sessions ?? []); })
      .catch(() => {})
      .finally(() => setLoadingRef(false));
  }, [adminQuarter]);

  useEffect(() => { loadRef(); }, [loadRef]);

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
      setAddError(e.message || 'Failed to add study. Check that the API is running.');
    } finally { setAddSaving(false); }
  };

  const handleDeleteRef = async (id) => {
    if (!window.confirm('Remove this reference study and all associated scoring records?')) return;
    try { await api(`/api/isr/reference/${id}`, { method: 'DELETE' }); } catch {}
    loadRef();
  };

  // Build scoring matrix: rows = scorers, cols = refStudies
  const scorers = [...new Set(allSessions.map(s => s.scorerName))].sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Reference Studies ────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Reference studies</div>
            <div className="card-sub">Studies assigned to all scorers for ISR scoring</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Quarter</label>
            <input className="form-input" style={{ width: 100, fontSize: 12, padding: '3px 8px' }}
              value={adminQuarter} onChange={e => setAdminQuarter(e.target.value)} placeholder="Q2 2026" />
          </div>
        </div>
        <div className="card-pad">
          {/* Add form */}
          <div style={{ display: 'flex', gap: 8, marginBottom: addError ? 8 : 14 }}>
            <input className="form-input" style={{ flex: '0 0 320px', fontFamily: 'monospace', fontSize: 12 }}
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

          {loadingRef ? (
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
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--ink-2)' }}>Added</th>
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
                        <Icon name="trash" size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Scoring progress matrix ───────────────────────────────────────── */}
      {refStudies.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Scoring progress — {adminQuarter}</div>
              <div className="card-sub">Live status per scorer · updates as staff complete studies</div>
            </div>
          </div>
          <div className="card-pad" style={{ overflowX: 'auto' }}>
            {scorers.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                No scoring activity yet. Staff will appear here once they open or complete studies.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: 'var(--ink-2)', minWidth: 140 }}>Scorer</th>
                    {refStudies.map(s => (
                      <th key={s.id} style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 600, color: 'var(--ink-2)', minWidth: 100 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.studyId}</div>
                        {s.label && <div style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 10 }}>{s.label}</div>}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 600, color: 'var(--ink-2)' }}>Done</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.map(scorer => {
                    const doneCount = refStudies.filter(s => {
                      const sess = allSessions.find(ss => ss.referenceStudyId === s.id && ss.scorerName === scorer);
                      return sess?.status === 'completed';
                    }).length;
                    return (
                      <tr key={scorer} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>{scorer}</td>
                        {refStudies.map(s => {
                          const sess = allSessions.find(ss => ss.referenceStudyId === s.id && ss.scorerName === scorer);
                          const status = sess?.status ?? 'pending';
                          return (
                            <td key={s.id} style={{ textAlign: 'center', padding: '8px' }}>
                              {status === 'completed' ? (
                                <span title={`Scored ${fmtDate(sess.completedAt)}`}>
                                  <Icon name="check" size={14} style={{ color: 'var(--good)' }} />
                                </span>
                              ) : status === 'opened' ? (
                                <span title={`Opened ${fmtDate(sess.openedAt)}`}>
                                  <Icon name="arrow_up_right" size={14} style={{ color: 'var(--warn)' }} />
                                </span>
                              ) : (
                                <span style={{ color: 'var(--border)', fontSize: 16 }}>○</span>
                              )}
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

    </div>
  );
};

// ── AssessmentCard (compliance / quarterly reports) ───────────────────────────

const AssessmentCard = ({ assessment, onSign }) => {
  const results    = (() => { try { return JSON.parse(assessment.results || '{}'); } catch { return {}; } })();
  const thresholds = (() => { try { return JSON.parse(assessment.thresholds || '{}'); } catch { return {}; } })();
  const studyIds   = (() => { try { return JSON.parse(assessment.studyIds || '[]'); } catch { return []; } })();

  const allMet  = PARAMS.filter(p => p.required).every(p => {
    const v = results[p.id]; const t = thresholds[p.id] ?? DEFAULT_THRESHOLDS[p.id];
    return v != null && v >= t;
  });
  const anyData = PARAMS.some(p => results[p.id] != null);
  const statusKind = assessment.status === 'signed' ? 'good' : assessment.status === 'complete' ? (allMet ? 'good' : 'bad') : assessment.status === 'in-progress' ? 'warn' : 'outline';
  const [expanded, setExpanded] = useState(false);

  const concordanceRowData = PARAMS.map(p => {
    const val = results[p.id] ?? null;
    const thr = thresholds[p.id] ?? DEFAULT_THRESHOLDS[p.id] ?? 80;
    return { id: p.id, label: p.label, required: p.required, concordance: val, threshold: thr };
  });

  const concordanceColDefs = [
    { headerName: 'Parameter', field: 'label', flex: 1,
      cellRenderer: p => <span style={{ fontSize: 12 }}>{p.data.label}{!p.data.required && <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>(optional)</span>}</span> },
    { headerName: 'Concordance %', field: 'concordance', width: 130, cellStyle: { textAlign: 'center' },
      cellRenderer: p => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.data.concordance != null ? `${p.data.concordance}%` : '—'}</span> },
    { headerName: 'Threshold %', field: 'threshold', width: 130, cellStyle: { textAlign: 'center' },
      cellRenderer: p => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.data.threshold}%</span> },
    { headerName: 'Result', field: 'concordance', width: 120, sortable: false, cellStyle: { textAlign: 'center' },
      cellRenderer: p => {
        const v = p.data.concordance; const t = p.data.threshold;
        return v != null ? <Pill kind={statusColor(v, t)}>{v >= t ? 'Met' : 'Not met'}</Pill> : <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>—</span>;
      } },
  ];

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
        <Icon name={expanded ? 'chev_up' : 'chev_down'} size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{assessment.assessmentRef}</span>
            <span style={{ fontSize: 12 }}>{assessment.scorer}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>vs {assessment.reviewer}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {assessment.quarter} · {studyIds.length}/3 studies
            {assessment.signedAt && ` · Signed ${fmtDate(assessment.signedAt)} by ${assessment.signedBy}`}
          </div>
        </div>
        <Pill kind={statusKind}>{assessment.status === 'signed' ? 'Signed' : assessment.status === 'complete' ? (allMet ? 'Passed' : 'Failed') : assessment.status === 'in-progress' ? 'In progress' : 'Pending'}</Pill>
        {anyData && <Pill kind={allMet ? 'good' : 'bad'}>{allMet ? '✓ All met' : '✗ Not met'}</Pill>}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Studies (3 PSGs × 200 epochs)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ padding: '4px 12px', borderRadius: 6, background: studyIds[i] ? 'var(--accent-soft)' : 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12 }}>
                  {studyIds[i] ? <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-ink)' }}>{studyIds[i]}</span> : <span style={{ color: 'var(--ink-3)' }}>Study {i + 1} not selected</span>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Concordance results</div>
            <NexusGrid rowData={concordanceRowData} columnDefs={concordanceColDefs} />
          </div>
          {assessment.reviewerRole === 'Medical Staff' && (
            <div className="callout" style={{ marginBottom: 10 }}>
              <strong>Network Director attestation required</strong> — Reviewer is board-certified medical staff.
              {assessment.attestationBy
                ? <span style={{ marginLeft: 8 }}>Attested by <strong>{assessment.attestationBy}</strong> on {fmtDate(assessment.attestationDate)}.</span>
                : <span style={{ marginLeft: 8, color: 'var(--warn)' }}>Pending attestation.</span>}
            </div>
          )}
          {assessment.notes && (
            <div style={{ fontSize: 12, color: 'var(--ink-2)', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6, marginBottom: 10 }}>
              <strong>Notes:</strong> {assessment.notes}
            </div>
          )}
          {assessment.status !== 'signed' && (
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => onSign(assessment)}>
              <Icon name="check" size={13} />Sign &amp; date report
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const NewAssessmentForm = ({ onSaved, onCancel }) => {
  const [form, setForm] = useState({ quarter: currentQuarter(), scorer: '', reviewer: '', reviewerRole: 'Network Director', thresholds: { ...DEFAULT_THRESHOLDS } });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.quarter || !form.scorer || !form.reviewer) return;
    setSaving(true);
    try {
      const res = await api('/api/isr', { method: 'POST', body: JSON.stringify({ quarter: form.quarter, scorer: form.scorer, reviewer: form.reviewer, reviewerRole: form.reviewerRole, thresholds: JSON.stringify(form.thresholds) }) });
      onSaved(res);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 18, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--accent)', marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>New ISR assessment</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <div><label className="form-label">Quarter</label><input className="form-input" placeholder="Q2 2026" value={form.quarter} onChange={e => set('quarter', e.target.value)} /></div>
        <div><label className="form-label">Scorer</label><input className="form-input" placeholder="M. Chen" value={form.scorer} onChange={e => set('scorer', e.target.value)} /></div>
        <div><label className="form-label">Reviewer</label><input className="form-input" placeholder="Dr. R. Okafor" value={form.reviewer} onChange={e => set('reviewer', e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label className="form-label">Reviewer role</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Network Director', 'Medical Staff'].map(r => (
            <button key={r} onClick={() => set('reviewerRole', r)}
              style={{ padding: '4px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: `1.5px solid ${form.reviewerRole === r ? 'var(--accent)' : 'var(--border)'}`,
                background: form.reviewerRole === r ? 'var(--accent-soft)' : 'transparent',
                color: form.reviewerRole === r ? 'var(--accent-ink)' : 'var(--ink-2)' }}>
              {r}
            </button>
          ))}
        </div>
        {form.reviewerRole === 'Medical Staff' && <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>Network Director must provide written attestation (per N-24).</div>}
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Minimum concordance thresholds (%)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {PARAMS.map(p => (
            <div key={p.id}>
              <label style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', marginBottom: 2 }}>{p.label.split('(')[0].trim()}</label>
              <input type="number" className="form-input" min={0} max={100} style={{ fontSize: 12, padding: '3px 6px' }}
                value={form.thresholds[p.id] ?? DEFAULT_THRESHOLDS[p.id]}
                onChange={e => set('thresholds', { ...form.thresholds, [p.id]: parseFloat(e.target.value) || 0 })} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.quarter || !form.scorer || !form.reviewer}>
          <Icon name="check" size={13} />{saving ? 'Creating…' : 'Create assessment'}
        </button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const ISRPage = () => {
  const [tab, setTab]                 = useState('scoring');
  const [quarter, setQuarter]         = useState(currentQuarter());
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showNew, setShowNew]         = useState(false);
  const [signTarget, setSignTarget]   = useState(null);
  const [signNotes, setSignNotes]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api('/api/isr')
      .then(r => setAssessments(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const quarter2 = currentQuarter();
  const thisQ    = assessments.filter(a => a.quarter === quarter2);
  const signed   = assessments.filter(a => a.status === 'signed').length;

  const handleSign = async (a) => {
    const tok = localStorage.getItem('nexus_token');
    await fetch(`${BASE}/api/isr/${a.id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
      body: JSON.stringify({ notes: signNotes }),
    });
    setSignTarget(null); setSignNotes('');
    load();
  };

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · AASM N-24"
        title="Inter-Scorer Reliability"
        subtitle="Quarterly concordance assessment per AASM Standard N-24 · reports retained ≥5 years"
        actions={
          <button className="btn btn-primary" onClick={() => { setTab('compliance'); setShowNew(true); }}>
            <Icon name="plus" size={14} />New assessment
          </button>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'scoring',    label: 'Scoring studies' },
        { id: 'compliance', label: 'Compliance reports', count: assessments.length },
        { id: 'admin',      label: 'Admin' },
      ]} />

      {/* ── Quarter selector (shared) ── */}
      {tab === 'scoring' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>Quarter</label>
          <input className="form-input" style={{ width: 110, fontSize: 12, padding: '4px 10px' }}
            value={quarter} onChange={e => setQuarter(e.target.value)} />
        </div>
      )}

      {/* ── SCORING TAB ── */}
      {tab === 'scoring' && <ScoringTab quarter={quarter} />}

      {/* ── COMPLIANCE REPORTS ── */}
      {tab === 'compliance' && (
        <div>
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: 18 }}>
            <div className="stat">
              <div className="stat-label"><Icon name="shield" size={13} />Current quarter</div>
              <div className="stat-value">{quarter2}</div>
              <div className="stat-meta">{thisQ.length} assessment{thisQ.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="stat">
              <div className="stat-label"><Icon name="check" size={13} />Signed reports</div>
              <div className="stat-value" style={{ color: signed === assessments.length && assessments.length > 0 ? 'var(--good)' : 'var(--ink)' }}>{signed}</div>
              <div className="stat-meta">of {assessments.length} total</div>
            </div>
            <div className="stat">
              <div className="stat-label"><Icon name="users" size={13} />Scorers assessed</div>
              <div className="stat-value">{new Set(assessments.map(a => a.scorer)).size}</div>
              <div className="stat-meta">unique scorers</div>
            </div>
            <div className="stat">
              <div className="stat-label"><Icon name="paper" size={13} />PSGs used</div>
              <div className="stat-value">{assessments.reduce((n, a) => n + (JSON.parse(a.studyIds || '[]').length), 0)}</div>
              <div className="stat-meta">across all assessments</div>
            </div>
          </div>

          {/* N-24 checklist */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-head"><div className="card-title">N-24 requirements checklist</div></div>
            <div className="card-pad">
              {[
                ['Each scorer assessed vs Network Director or board-certified medical staff', assessments.length > 0],
                ['3 PSGs per scorer per quarter (200 epochs each)', thisQ.some(a => JSON.parse(a.studyIds || '[]').length >= 3)],
                ['12 PSGs per scorer per year', assessments.filter(a => a.scorer).length >= 4],
                ['Parameters: staging, obstructive apnea, central apnea, hypopnea, leg movements, arousals', true],
                ['Minimum thresholds defined by the lab', assessments.some(a => a.thresholds && a.thresholds !== '{}')],
                ['Quarterly reports signed and dated by Network Director', signed > 0],
                ['Reports retained ≥5 years', signed > 0],
              ].map(([label, met], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 6 ? '1px solid var(--border)' : 'none' }}>
                  <Icon name={met ? 'check' : 'alert'} size={14} style={{ color: met ? 'var(--good)' : 'var(--warn)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{label}</span>
                  <Pill kind={met ? 'good' : 'outline'}>{met ? 'In place' : 'Action needed'}</Pill>
                </div>
              ))}
            </div>
          </div>

          {/* Sign banner */}
          {signTarget && (
            <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 8, marginBottom: 18, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="check" size={18} style={{ color: 'var(--accent-ink)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Sign report: {signTarget.assessmentRef}</div>
                <input className="form-input" style={{ marginTop: 6, fontSize: 12 }} placeholder="Optional notes…"
                  value={signNotes} onChange={e => setSignNotes(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={() => handleSign(signTarget)}><Icon name="check" size={13} />Sign &amp; date</button>
              <button className="btn" onClick={() => setSignTarget(null)}>Cancel</button>
            </div>
          )}

          {/* New assessment form */}
          {showNew && (
            <NewAssessmentForm
              onSaved={a => { setAssessments(prev => [a, ...prev]); setShowNew(false); }}
              onCancel={() => setShowNew(false)}
            />
          )}
          {!showNew && (
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowNew(true)}>
                <Icon name="plus" size={14} />New assessment
              </button>
            </div>
          )}

          {loading && <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: 18 }}>Loading…</div>}
          {!loading && assessments.length === 0 && !showNew && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--ink-3)', fontSize: 13 }}>
              No ISR assessments yet. Click "New assessment" to create the first quarterly report.
            </div>
          )}
          {assessments.map(a => (
            <AssessmentCard key={a.id} assessment={a} onSign={a => setSignTarget(a)} />
          ))}
        </div>
      )}

      {/* ── ADMIN ── */}
      {tab === 'admin' && (
        <AdminTab assessments={assessments} onRefresh={load} />
      )}
    </div>
  );
};

export default ISRPage;
