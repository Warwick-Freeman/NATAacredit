import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../icons';
import { Pill } from '../components';
import { getWorkbookSchema } from '../workbookSchemas';
import { useAuth } from '../AuthContext';

const BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders() {
  const t = localStorage.getItem('nexus_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ── Empty form data factory ────────────────────────────────────────────────────

function emptyMeasureData() {
  return {
    chartsReviewed: '',
    ineligibleReasons: '',
    charts: Array.from({ length: 10 }, () => ({ numeratorMet: '', exceptionReason: '' })),
    dataSource: { denominator: '', exceptions: '', numerator: '' },
    threshold: '',
    thresholdMet: '',
  };
}

function emptyFormData(schema) {
  const intro = {};
  schema.intro.fields.forEach(f => { intro[f.id] = ''; });
  const measures = {};
  schema.measures.forEach(m => { measures[m.id] = emptyMeasureData(); });
  return { intro, measures };
}

// ── Calculated summary for a measure ─────────────────────────────────────────

function calcSummary(md) {
  const charts = md.charts || [];
  const met = charts.filter(c => c.numeratorMet === '1' || c.numeratorMet === 1).length;
  const notMet = charts.filter(c => c.numeratorMet === '0' || c.numeratorMet === 0).length;
  const exceptions = charts.filter(c => (c.numeratorMet === '0' || c.numeratorMet === 0) && c.exceptionReason?.trim()).length;
  const total = met + notMet;
  const perfRate = total > 0 ? ((met / total) * 100).toFixed(1) : '—';
  const excRate  = total > 0 ? ((exceptions / total) * 100).toFixed(1) : '—';
  return { met, total, perfRate, excRate };
}

// ── Measure section component ─────────────────────────────────────────────────

const MeasureSection = ({ measure, data, onChange, readOnly }) => {
  const [showDef, setShowDef] = useState(false);
  const summary = calcSummary(data);

  const setField = (key, val) => onChange({ ...data, [key]: val });
  const setChart = (i, key, val) => {
    const charts = data.charts.map((c, idx) => idx === i ? { ...c, [key]: val } : c);
    onChange({ ...data, charts });
  };
  const setSource = (key, val) => onChange({ ...data, dataSource: { ...data.dataSource, [key]: val } });

  const typeLabel = measure.type === 'Outcome' ? 'Outcome Measure' : measure.type === 'Screening' ? 'Screening Measure' : 'Process Measure';
  const headerLabel = measure.number ? `${typeLabel} #${measure.number}` : typeLabel;

  return (
    <div style={{ marginBottom: 32, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      {/* Measure header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-ink)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {headerLabel}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink)' }}>{measure.title}</div>
          </div>
          {summary.total > 0 && (
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: Number(summary.perfRate) >= 80 ? 'var(--good)' : 'var(--bad)' }}>{summary.perfRate}%</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>performance rate</div>
            </div>
          )}
        </div>
        <button onClick={() => setShowDef(v => !v)}
          style={{ marginTop: 8, fontSize: 11, color: 'var(--accent-ink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name={showDef ? 'chev_up' : 'chev_down'} size={12} />
          {showDef ? 'Hide' : 'Show'} measure definition
        </button>
        {showDef && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['Denominator', measure.denominator], ['Exceptions', measure.exceptions], ['Numerator', measure.numerator]].map(([label, text]) => (
              <div key={label} style={{ padding: 10, background: 'var(--surface)', borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, marginBottom: 3, color: 'var(--ink-2)' }}>{label}</div>
                <div style={{ color: 'var(--ink-3)', whiteSpace: 'pre-wrap' }}>{text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* A & B */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
              A) Charts reviewed before finding 10 eligible
            </label>
            <input className="form-input" type="number" min={0} placeholder="e.g. 12"
              value={data.chartsReviewed} disabled={readOnly}
              onChange={e => setField('chartsReviewed', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
              B) Common reasons for ineligibility
            </label>
            <input className="form-input" placeholder="e.g. Patient declined screening"
              value={data.ineligibleReasons} disabled={readOnly}
              onChange={e => setField('ineligibleReasons', e.target.value)} />
          </div>
        </div>

        {/* Chart review table */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>C) Chart review (10 eligible charts)</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '7px 10px', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>Chart</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>Numerator criteria met?</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>If NOT met — exception reason?</div>
            </div>
            {data.charts.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', padding: '6px 10px', gap: 8, borderBottom: i < 9 ? '1px solid var(--border)' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>#{i + 1}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['1', 'Met'], ['0', 'Not met']].map(([val, lbl]) => (
                    <button key={val} disabled={readOnly}
                      onClick={() => setChart(i, 'numeratorMet', c.numeratorMet === val ? '' : val)}
                      style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: readOnly ? 'default' : 'pointer', border: '1.5px solid',
                        borderColor: c.numeratorMet === val ? (val === '1' ? 'var(--good)' : 'var(--bad)') : 'var(--border)',
                        background: c.numeratorMet === val ? (val === '1' ? 'var(--good-soft)' : 'var(--bad-soft)') : 'transparent',
                        color: c.numeratorMet === val ? (val === '1' ? 'var(--good)' : 'var(--bad)') : 'var(--ink-3)' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <input className="form-input"
                  style={{ fontSize: 11, padding: '4px 8px', opacity: c.numeratorMet !== '0' ? 0.4 : 1 }}
                  placeholder={c.numeratorMet === '0' ? 'Exception or reason…' : '—'}
                  value={c.exceptionReason} disabled={readOnly || c.numeratorMet !== '0'}
                  onChange={e => setChart(i, 'exceptionReason', e.target.value)} />
              </div>
            ))}
            {/* Summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', padding: '8px 10px', gap: 8, background: 'var(--surface-2)', borderTop: '2px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', gridColumn: '1/3' }}>
                Total met: {summary.met} / {data.charts.filter(c => c.numeratorMet !== '').length || 10}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                <span style={{ fontWeight: 600 }}>Performance: {summary.perfRate}%</span>
                {' · '}
                Exception rate: {summary.excRate}%
              </div>
            </div>
          </div>
        </div>

        {/* D: Data source */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>D) Data extraction method</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[['denominator', 'Denominator'], ['exceptions', 'Exceptions'], ['numerator', 'Numerator']].map(([key, lbl]) => (
              <div key={key}>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>{lbl}</label>
                <select className="form-input" style={{ fontSize: 12 }} value={data.dataSource[key]} disabled={readOnly}
                  onChange={e => setSource(key, e.target.value)}>
                  <option value="">Select…</option>
                  <option value="EHR">EHR</option>
                  <option value="Chart Review">Chart Review</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* E & F */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>E) Measure threshold (%)</label>
            <input className="form-input" type="number" min={0} max={100} placeholder="e.g. 80"
              value={data.threshold} disabled={readOnly}
              onChange={e => setField('threshold', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>F) Was threshold met?</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              {[['1', 'Met'], ['0', 'Not met']].map(([val, lbl]) => (
                <button key={val} disabled={readOnly}
                  onClick={() => setField('thresholdMet', data.thresholdMet === val ? '' : val)}
                  style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: readOnly ? 'default' : 'pointer', border: '1.5px solid',
                    borderColor: data.thresholdMet === val ? (val === '1' ? 'var(--good)' : 'var(--bad)') : 'var(--border)',
                    background: data.thresholdMet === val ? (val === '1' ? 'var(--good-soft)' : 'var(--bad-soft)') : 'transparent',
                    color: data.thresholdMet === val ? (val === '1' ? 'var(--good)' : 'var(--bad)') : 'var(--ink-3)' }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main form page ─────────────────────────────────────────────────────────────

const WorkbookFormPage = ({ workbookId, period, completionId: initialCompletionId, readOnly: initialReadOnly, onBack }) => {
  const schema = getWorkbookSchema(workbookId);
  const { user } = useAuth();

  const [formData, setFormData]         = useState(() => schema ? emptyFormData(schema) : {});
  const [completionId, setCompletionId] = useState(initialCompletionId ?? null);
  const [readOnly, setReadOnly]         = useState(initialReadOnly ?? false);
  const [saving, setSaving]             = useState(false);
  const [saveStatus, setSaveStatus]     = useState(null); // 'saved' | 'error'
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(initialReadOnly ?? false);
  const saveTimer = useRef(null);

  // Load existing completion if provided
  useEffect(() => {
    if (initialCompletionId) {
      fetch(`${BASE}/api/workbooks/${workbookId}/completions`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(list => {
          const c = list.find(x => x.id === initialCompletionId);
          if (c?.formData) {
            try { setFormData(JSON.parse(c.formData)); } catch {}
          }
        })
        .catch(() => {});
    }
  }, []);

  const doSave = useCallback(async (data, cId, final = false) => {
    if (readOnly) return cId;
    setSaving(true);
    try {
      if (!cId) {
        // Create new completion
        const res = await fetch(`${BASE}/api/workbooks/${workbookId}/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ period, formData: JSON.stringify(data), status: final ? 'complete' : 'in-progress' }),
        });
        if (res.ok) {
          const c = await res.json();
          setCompletionId(c.id);
          setSaveStatus('saved');
          return c.id;
        }
      } else {
        await fetch(`${BASE}/api/workbooks/${workbookId}/completions/${cId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ period, formData: JSON.stringify(data), status: final ? 'complete' : 'in-progress' }),
        });
        setSaveStatus('saved');
        return cId;
      }
    } catch { setSaveStatus('error'); } finally { setSaving(false); }
    return cId;
  }, [workbookId, period, readOnly]);

  // Auto-save with debounce
  const handleFormChange = (data) => {
    setFormData(data);
    setSaveStatus(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      doSave(data, completionId);
    }, 1500);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const newId = await doSave(formData, completionId, true);
    if (newId) {
      setSubmitted(true);
      setReadOnly(true);
    }
    setSubmitting(false);
  };

  if (!schema) return <div style={{ padding: 32 }}>Workbook not found.</div>;

  // Overall completion stats
  const allMeasures = schema.measures.map(m => {
    const md = formData.measures?.[m.id] || emptyMeasureData();
    return { ...m, summary: calcSummary(md) };
  });
  const anyStarted = allMeasures.some(m => m.summary.total > 0);

  return (
    <div className="page">
      {/* Sticky top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn" onClick={onBack}><Icon name="chev_left" size={13} />Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{schema.title}</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{period}</div>
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saveStatus === 'saved' && <span style={{ fontSize: 11, color: 'var(--good)' }}><Icon name="check" size={12} /> Auto-saved</span>}
            {saveStatus === 'error' && <span style={{ fontSize: 11, color: 'var(--bad)' }}>Save failed</span>}
            {saving && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Saving…</span>}
            <button className="btn" onClick={() => doSave(formData, completionId)} disabled={saving}>
              <Icon name="paper" size={13} />Save draft
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || saving}>
              <Icon name="check" size={13} />{submitting ? 'Submitting…' : 'Submit workbook'}
            </button>
          </div>
        )}
        {readOnly && (
          <Pill kind="good"><Icon name="check" size={11} /> Completed</Pill>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 48px' }}>
        {/* Intro */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{schema.title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>Reporting period: <strong>{period}</strong></div>
          <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: 16 }}>
            {schema.intro.instructions}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {schema.intro.fields.map(f => (
              <div key={f.id}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <textarea className="form-input" rows={2} style={{ width: '100%', boxSizing: 'border-box', fontSize: 12 }}
                  value={formData.intro?.[f.id] ?? ''} disabled={readOnly}
                  onChange={e => handleFormChange({ ...formData, intro: { ...formData.intro, [f.id]: e.target.value } })} />
              </div>
            ))}
          </div>
        </div>

        {/* Measures */}
        {schema.measures.map(m => (
          <MeasureSection
            key={m.id}
            measure={m}
            data={formData.measures?.[m.id] || emptyMeasureData()}
            readOnly={readOnly}
            onChange={md => handleFormChange({ ...formData, measures: { ...formData.measures, [m.id]: md } })}
          />
        ))}

        {/* Summary */}
        {anyStarted && (
          <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Workbook summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allMeasures.map(m => {
                const kind = m.summary.total === 0 ? 'outline'
                  : Number(m.summary.perfRate) >= 80 ? 'good' : 'bad';
                const label = m.number ? `${m.type} #${m.number}` : m.type;
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 90, fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', flexShrink: 0 }}>{label}</div>
                    <div style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{m.title}</div>
                    <Pill kind={kind}>
                      {m.summary.total === 0 ? 'Not started' : `${m.summary.perfRate}%`}
                    </Pill>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!readOnly && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn" onClick={onBack}>Cancel</button>
            <button className="btn btn-primary" style={{ minWidth: 160 }} onClick={handleSubmit} disabled={submitting}>
              <Icon name="check" size={14} />{submitting ? 'Submitting…' : 'Submit workbook'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkbookFormPage;
