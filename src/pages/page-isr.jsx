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
  const r = await fetch(`${BASE}${path}`, { headers: { ...authHeaders(), ...opts.headers }, ...opts });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
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

// ── ConcordanceRow ────────────────────────────────────────────────────────────

const ConcordanceRow = ({ param, concordance, threshold, onChange, readOnly }) => {
  const val = concordance ?? null;
  const thr = threshold ?? DEFAULT_THRESHOLDS[param.id] ?? 80;
  const kind = val != null ? statusColor(val, thr) : 'outline';
  return (
    <tr>
      <td style={{ fontSize: 12 }}>
        {param.label}
        {!param.required && <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>(optional)</span>}
      </td>
      <td style={{ textAlign: 'center' }}>
        {readOnly ? (
          <span className="mono" style={{ fontSize: 12 }}>{val != null ? `${val}%` : '—'}</span>
        ) : (
          <input type="number" className="input" min={0} max={100} step={0.1}
            style={{ width: 72, textAlign: 'right', fontSize: 12, padding: '2px 6px' }}
            value={val ?? ''} placeholder="—"
            onChange={e => onChange(param.id, 'concordance', e.target.value === '' ? null : parseFloat(e.target.value))} />
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        {readOnly ? (
          <span className="mono" style={{ fontSize: 12 }}>{thr}%</span>
        ) : (
          <input type="number" className="input" min={0} max={100}
            style={{ width: 72, textAlign: 'right', fontSize: 12, padding: '2px 6px' }}
            value={thr}
            onChange={e => onChange(param.id, 'threshold', parseFloat(e.target.value) || 80)} />
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        {val != null ? <Pill kind={kind}>{val >= thr ? 'Met' : 'Not met'}</Pill> : <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>—</span>}
      </td>
    </tr>
  );
};

// ── AssessmentCard ────────────────────────────────────────────────────────────

const AssessmentCard = ({ assessment, onUpdate, onSign, users }) => {
  const results    = (() => { try { return JSON.parse(assessment.results || '{}'); } catch { return {}; } })();
  const thresholds = (() => { try { return JSON.parse(assessment.thresholds || '{}'); } catch { return {}; } })();
  const studyIds   = (() => { try { return JSON.parse(assessment.studyIds || '[]'); } catch { return []; } })();
  const { user } = useAuth();

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
    {
      headerName: 'Parameter', field: 'label', flex: 1,
      cellRenderer: p => (
        <span style={{ fontSize: 12 }}>
          {p.data.label}
          {!p.data.required && <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>(optional)</span>}
        </span>
      ),
    },
    {
      headerName: 'Concordance %', field: 'concordance', width: 130,
      cellStyle: { textAlign: 'center' },
      cellRenderer: p => (
        <span className="mono" style={{ fontSize: 12 }}>
          {p.data.concordance != null ? `${p.data.concordance}%` : '—'}
        </span>
      ),
    },
    {
      headerName: 'Threshold %', field: 'threshold', width: 130,
      cellStyle: { textAlign: 'center' },
      cellRenderer: p => (
        <span className="mono" style={{ fontSize: 12 }}>{p.data.threshold}%</span>
      ),
    },
    {
      headerName: 'Result', field: 'concordance', width: 120, sortable: false,
      cellStyle: { textAlign: 'center' },
      cellRenderer: p => {
        const val = p.data.concordance;
        const thr = p.data.threshold;
        const kind = val != null ? statusColor(val, thr) : 'outline';
        return val != null
          ? <Pill kind={kind}>{val >= thr ? 'Met' : 'Not met'}</Pill>
          : <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>—</span>;
      },
    },
  ];

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {/* Header row */}
      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
        <Icon name={expanded ? 'chev_up' : 'chev_down'} size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{assessment.assessmentRef}</span>
            <span style={{ fontSize: 12 }}>{assessment.scorer}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>vs {assessment.reviewer}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {assessment.quarter} · {studyIds.length}/3 studies
            {assessment.signedAt && ` · Signed ${fmtDate(assessment.signedAt)} by ${assessment.signedBy}`}
          </div>
        </div>
        <Pill kind={statusKind}>{assessment.status === 'signed' ? 'Signed' : assessment.status === 'complete' ? (allMet ? 'Passed' : 'Failed') : assessment.status === 'in-progress' ? 'In progress' : 'Pending'}</Pill>
        {anyData && <Pill kind={allMet ? 'good' : 'bad'}>{allMet ? '✓ All thresholds met' : '✗ Threshold not met'}</Pill>}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px' }}>
          {/* Studies */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Studies (3 PSGs × 200 epochs = 600 epochs/quarter)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ padding: '4px 12px', borderRadius: 6, background: studyIds[i] ? 'var(--accent-soft)' : 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12 }}>
                  {studyIds[i] ? <><span className="mono" style={{ fontWeight: 600, color: 'var(--accent-ink)' }}>{studyIds[i]}</span></> : <span style={{ color: 'var(--ink-3)' }}>Study {i + 1} not selected</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Concordance results grid */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Concordance results
            </div>
            <NexusGrid rowData={concordanceRowData} columnDefs={concordanceColDefs} />
          </div>

          {/* Attestation / Sign-off */}
          {assessment.reviewerRole === 'Medical Staff' && (
            <div className="callout" style={{ marginBottom: 10 }}>
              <strong>Network Director attestation required</strong><br />
              Reviewer is a board-certified medical staff member (not the Network Director).
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
              <Icon name="check" size={13} />Sign & date report
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── NewAssessmentForm ─────────────────────────────────────────────────────────

const NewAssessmentForm = ({ onSaved, onCancel }) => {
  const [form, setForm] = useState({
    quarter: currentQuarter(), scorer: '', reviewer: '', reviewerRole: 'Network Director',
    thresholds: { ...DEFAULT_THRESHOLDS },
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.quarter || !form.scorer || !form.reviewer) return;
    setSaving(true);
    try {
      const res = await api('/api/isr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quarter: form.quarter, scorer: form.scorer,
          reviewer: form.reviewer, reviewerRole: form.reviewerRole,
          thresholds: JSON.stringify(form.thresholds),
        }),
      });
      onSaved(res);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 18, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--accent)', marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>New ISR assessment</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <div>
          <label className="form-label">Quarter</label>
          <input className="form-input" placeholder="e.g. Q2 2026" value={form.quarter} onChange={e => set('quarter', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Scorer (technologist)</label>
          <input className="form-input" placeholder="e.g. M. Chen" value={form.scorer} onChange={e => set('scorer', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Reviewer</label>
          <input className="form-input" placeholder="e.g. Dr. R. Okafor" value={form.reviewer} onChange={e => set('reviewer', e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
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
        {form.reviewerRole === 'Medical Staff' && (
          <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>
            Network Director must provide written attestation of reviewing the ISR results (per N-24).
          </div>
        )}
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

// ── AdminTab ──────────────────────────────────────────────────────────────────

const AdminTab = ({ assessments, onRefresh }) => {
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [studySearch, setStudySearch]   = useState('');
  const [studies,     setStudies]       = useState(null);
  const [studyLoading,setStudyLoading]  = useState(false);
  const [pickedStudies, setPickedStudies] = useState([]);
  const [resultStudyId, setResultStudyId] = useState('');
  const [scorerId,    setScorerId]      = useState('');
  const [launchResult, setLaunchResult] = useState(null);
  const [fetchedResults, setFetchedResults] = useState(null);
  const [saving, setSaving] = useState(false);

  const pendingAssessments = assessments.filter(a => a.status !== 'signed');

  const fetchStudies = useCallback(() => {
    setStudyLoading(true);
    api(`/api/isr/prodigi/studies${studySearch ? `?q=${encodeURIComponent(studySearch)}` : ''}`)
      .then(r => setStudies(r.studies ?? []))
      .catch(() => setStudies([]))
      .finally(() => setStudyLoading(false));
  }, [studySearch]);

  useEffect(() => { fetchStudies(); }, []);

  const toggleStudy = (id) => {
    setPickedStudies(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleLaunch = async () => {
    if (!resultStudyId || !scorerId) return;
    try {
      const r = await api('/api/isr/prodigi/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyId: resultStudyId, scorerId }),
      });
      setLaunchResult(r);
    } catch { setLaunchResult({ error: 'Launch failed' }); }
  };

  const handleFetchResults = async () => {
    if (!resultStudyId) return;
    try {
      const r = await api(`/api/isr/prodigi/results/${encodeURIComponent(resultStudyId)}?scorerId=${encodeURIComponent(scorerId)}`);
      setFetchedResults(r);
    } catch { setFetchedResults({ error: 'Fetch failed' }); }
  };

  const handleSaveStudiesToAssessment = async () => {
    if (!selectedAssessment || pickedStudies.length === 0) return;
    setSaving(true);
    try {
      await api(`/api/isr/${selectedAssessment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyIds: JSON.stringify(pickedStudies), status: 'in-progress' }),
      });
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleSaveResults = async () => {
    if (!selectedAssessment || !fetchedResults?.concordance) return;
    setSaving(true);
    try {
      // Build results map from Prodigi response
      const results = {};
      Object.entries(fetchedResults.concordance).forEach(([k, v]) => { results[k] = v.value; });
      await api(`/api/isr/${selectedAssessment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: JSON.stringify(results), status: 'complete' }),
      });
      onRefresh();
    } finally { setSaving(false); }
  };

  const prodigiRowData = fetchedResults && !fetchedResults.error && fetchedResults.concordance
    ? Object.entries(fetchedResults.concordance).map(([k, v]) => ({ key: k, label: v.label, value: v.value }))
    : [];

  const prodigiColDefs = [
    { headerName: 'Parameter', field: 'label', flex: 1 },
    {
      headerName: 'Concordance %', field: 'value', width: 160,
      cellStyle: { textAlign: 'center' },
      cellRenderer: p => <span style={{ fontWeight: 600 }}>{p.data.value}%</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Prodigi API notice */}
      <div className="callout">
        <strong>Prodigi PSG integration</strong> — The endpoints below are placeholders. Configure your Prodigi instance URL in <code>appsettings.json</code> under <code>Prodigi:BaseUrl</code>. The API calls follow the Prodigi Cloud REST API pattern for ISR launching and result retrieval.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Study selection */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Study selection</div>
              <div className="card-sub">Select 3 PSGs per quarter · 200 consecutive 30-second epochs each</div>
            </div>
          </div>
          <div className="card-pad">
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Assign to assessment</label>
              <select className="form-input" value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)}>
                <option value="">Select…</option>
                {pendingAssessments.map(a => (
                  <option key={a.id} value={a.id}>{a.assessmentRef} — {a.scorer} ({a.quarter})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="Search studies…"
                value={studySearch} onChange={e => setStudySearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchStudies()} />
              <button className="btn" onClick={fetchStudies} disabled={studyLoading}>
                <Icon name="search" size={12} />{studyLoading ? '…' : 'Search'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>
              {pickedStudies.length}/3 studies selected
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(studies ?? []).map(s => {
                const picked = pickedStudies.includes(s.studyId);
                const disabled = !picked && pickedStudies.length >= 3;
                return (
                  <div key={s.studyId} onClick={() => !disabled && toggleStudy(s.studyId)}
                    style={{ padding: '7px 10px', borderRadius: 6, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
                      border: `1.5px solid ${picked ? 'var(--accent)' : 'var(--border)'}`,
                      background: picked ? 'var(--accent-soft)' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: picked ? 'var(--accent-ink)' : 'var(--ink-2)' }}>{s.studyId}</span>
                      <span style={{ fontSize: 11, flex: 1 }}>{s.patientInitials} · {s.type}</span>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.date}</span>
                      {picked && <Icon name="check" size={12} style={{ color: 'var(--accent)' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }}
              onClick={handleSaveStudiesToAssessment}
              disabled={saving || !selectedAssessment || pickedStudies.length === 0}>
              <Icon name="check" size={13} />Assign studies to assessment
            </button>
          </div>
        </div>

        {/* Prodigi ISR launch + results */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Prodigi ISR scoring</div>
              <div className="card-sub">Launch scoring session and fetch concordance results</div>
            </div>
          </div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-label">Study ID</label>
              <input className="form-input" placeholder="e.g. PSG-2026-0440" value={resultStudyId} onChange={e => setResultStudyId(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Scorer</label>
              <input className="form-input" placeholder="e.g. M. Chen" value={scorerId} onChange={e => setScorerId(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1 }} onClick={handleLaunch} disabled={!resultStudyId || !scorerId}>
                <Icon name="arrow_up_right" size={13} />Launch in Prodigi
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleFetchResults} disabled={!resultStudyId}>
                <Icon name="download" size={13} />Fetch results
              </button>
            </div>

            {launchResult && !launchResult.error && (
              <div style={{ padding: 10, background: 'var(--accent-soft)', borderRadius: 6, fontSize: 11 }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-ink)', marginBottom: 4 }}>Session launched (placeholder)</div>
                <div style={{ color: 'var(--ink-2)' }}>URL: <code style={{ fontSize: 10 }}>{launchResult.launchUrl}</code></div>
                <div style={{ color: 'var(--ink-3)', marginTop: 4, fontStyle: 'italic' }}>{launchResult.message}</div>
              </div>
            )}

            {fetchedResults && !fetchedResults.error && fetchedResults.concordance && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8 }}>
                  Results from Prodigi <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(placeholder data)</span>
                </div>
                <NexusGrid rowData={prodigiRowData} columnDefs={prodigiColDefs} />
                <button className="btn btn-primary" style={{ marginTop: 8, width: '100%', fontSize: 12 }}
                  onClick={handleSaveResults} disabled={saving || !selectedAssessment}>
                  <Icon name="check" size={12} />Save results to assessment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const ISRPage = () => {
  const { user } = useAuth();
  const [tab, setTab]                 = useState('overview');
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

  // Overview stats
  const quarter = currentQuarter();
  const thisQ   = assessments.filter(a => a.quarter === quarter);
  const signed  = assessments.filter(a => a.status === 'signed').length;

  const handleSign = async (a) => {
    const tok = localStorage.getItem('nexus_token');
    await fetch(`${BASE}/api/isr/${a.id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
      body: JSON.stringify({ notes: signNotes }),
    });
    setSignTarget(null);
    setSignNotes('');
    load();
  };

  const quarterlyRowData = thisQ.map(a => {
    const res = (() => { try { return JSON.parse(a.results || '{}'); } catch { return {}; } })();
    const thr = (() => { try { return JSON.parse(a.thresholds || '{}'); } catch { return {}; } })();
    const allMet = PARAMS.filter(p => p.required).every(p => { const v = res[p.id]; const t = thr[p.id] ?? DEFAULT_THRESHOLDS[p.id]; return v != null && v >= t; });
    const anyData = PARAMS.some(p => res[p.id] != null);
    return { ...a, allMet, anyData, studyCount: JSON.parse(a.studyIds || '[]').length };
  });

  const quarterlyColDefs = [
    {
      headerName: 'Scorer', field: 'scorer', flex: 1,
      cellRenderer: p => <span style={{ fontWeight: 500 }}>{p.data.scorer}</span>,
    },
    { headerName: 'Reviewer', field: 'reviewer', flex: 1, cellStyle: { fontSize: 12 } },
    {
      headerName: 'Studies', field: 'studyCount', width: 100,
      cellRenderer: p => <span className="mono" style={{ fontSize: 11 }}>{p.data.studyCount}/3</span>,
    },
    {
      headerName: 'Status', field: 'status', width: 130,
      cellRenderer: p => (
        <Pill kind={p.data.status === 'signed' ? 'good' : p.data.status === 'complete' ? 'warn' : 'outline'}>
          {p.data.status}
        </Pill>
      ),
    },
    {
      headerName: 'All met?', field: 'allMet', width: 110,
      cellRenderer: p => p.data.anyData
        ? <Pill kind={p.data.allMet ? 'good' : 'bad'}>{p.data.allMet ? 'Yes' : 'No'}</Pill>
        : <span className="muted">—</span>,
    },
  ];

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · AASM N-24"
        title="Inter-Scorer Reliability"
        subtitle="Quarterly concordance assessment per AASM Standard N-24 · reports retained ≥5 years"
        actions={
          <>
            <button className="btn btn-primary" onClick={() => { setTab('reports'); setShowNew(true); }}>
              <Icon name="plus" size={14} />New assessment
            </button>
          </>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'reports',  label: 'Quarterly reports', count: assessments.length },
        { id: 'admin',    label: 'Admin / Prodigi' },
      ]} />

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div>
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: 18 }}>
            <div className="stat">
              <div className="stat-label"><Icon name="shield" size={13} />Current quarter</div>
              <div className="stat-value">{quarter}</div>
              <div className="stat-meta">{thisQ.length} assessment{thisQ.length !== 1 ? 's' : ''} this quarter</div>
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
              <div className="stat-label"><Icon name="paper" size={13} />Studies used</div>
              <div className="stat-value">{assessments.reduce((n, a) => n + (JSON.parse(a.studyIds || '[]').length), 0)}</div>
              <div className="stat-meta">PSGs across all assessments</div>
            </div>
          </div>

          {/* N-24 requirement summary */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-head"><div className="card-title">N-24 requirements checklist</div></div>
            <div className="card-pad">
              {[
                ['Each scorer assessed vs Network Director or board-certified medical staff member', assessments.length > 0],
                ['3 polysomnograms per scorer per quarter (200 epochs each)', thisQ.some(a => JSON.parse(a.studyIds || '[]').length >= 3)],
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

          {/* This quarter's assessments at a glance */}
          <div className="card">
            <div className="card-head">
              <div><div className="card-title">{quarter} assessments</div></div>
              <div className="topbar-spacer" />
              <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => { setTab('reports'); setShowNew(true); }}>
                <Icon name="plus" size={11} />Add
              </button>
            </div>
            {thisQ.length === 0 ? (
              <div style={{ padding: '18px 18px', fontSize: 12, color: 'var(--ink-3)' }}>
                No assessments for {quarter} yet. Click "New assessment" to create one.
              </div>
            ) : (
              <NexusGrid
                rowData={quarterlyRowData}
                columnDefs={quarterlyColDefs}
                onRowClicked={() => setTab('reports')}
              />
            )}
          </div>
        </div>
      )}

      {/* ── QUARTERLY REPORTS ── */}
      {tab === 'reports' && (
        <div>
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

          {signTarget && (
            <div className="banner" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 8, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="check" size={18} style={{ color: 'var(--accent-ink)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Sign report: {signTarget.assessmentRef}</div>
                <input className="form-input" style={{ marginTop: 6, fontSize: 12 }} placeholder="Optional notes…"
                  value={signNotes} onChange={e => setSignNotes(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={() => handleSign(signTarget)}>
                <Icon name="check" size={13} />Sign &amp; date
              </button>
              <button className="btn" onClick={() => setSignTarget(null)}>Cancel</button>
            </div>
          )}

          {assessments.map(a => (
            <AssessmentCard key={a.id} assessment={a}
              onUpdate={load}
              onSign={a => setSignTarget(a)} />
          ))}
        </div>
      )}

      {/* ── ADMIN / PRODIGI ── */}
      {tab === 'admin' && (
        <AdminTab assessments={assessments} onRefresh={load} />
      )}
    </div>
  );
};

export default ISRPage;
