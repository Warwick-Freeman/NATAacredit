import React, { useState } from 'react';
import Icon from './icons';
import { Pill, Avatar } from './components';
import { useTaskContext } from './TaskContext';
import NexusGrid from './nexus-grid';

const MONTHS_SHORT = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

const KPI_META = {
  'KPI-01': {
    clause: '5.4.1', owner: 'F. Olsson',
    description: 'Mean calendar days from referral receipt to study commencement. Reflects scheduling efficiency and patient access equity.',
    benchmark: '≤21d (AASM reference labs)',
    calculation: 'Sum(study_date − referral_date) ÷ referral count for the period',
    note: 'Target tightened to ≤12d from Jul 2026 following Q2 management review decision.',
  },
  'KPI-02': {
    clause: '5.4.1', owner: 'F. Olsson',
    description: 'Percentage of inbound referrals missing required clinical information on first receipt. High rates create downstream workflow delays.',
    benchmark: '<8% (Australian AHHA benchmark)',
    calculation: 'Incomplete referrals ÷ total referrals received × 100',
    note: '',
  },
  'KPI-03': {
    clause: '5.5.1', owner: 'F. Olsson',
    description: 'Rate of study cancellations occurring after booking confirmation but before study commencement, from any cause.',
    benchmark: '<10% (sleep lab peer network)',
    calculation: 'Cancelled studies ÷ booked studies × 100',
    note: '',
  },
  'KPI-04': {
    clause: '5.5.3', owner: 'M. Chen',
    description: 'Percentage of studies requiring repeat recording or substantially incomplete data due to technical fault (equipment, signal quality, procedure deviation).',
    benchmark: '<3% (AASM guidance)',
    calculation: 'Technical failure studies ÷ total studies × 100',
    note: 'Excludes patient-initiated early terminations.',
  },
  'KPI-05': {
    clause: '5.5.2', owner: 'M. Chen',
    description: 'Proportion of EEG channels where bio-signal impedance checks passed ≤10 kΩ at study start as required by SOP-PSG-002.',
    benchmark: '≥95% (SOP minimum)',
    calculation: 'Channels within spec ÷ total channels checked × 100',
    note: '',
  },
  'KPI-06': {
    clause: '5.6.6', owner: 'M. Chen',
    description: "Mean Cohen's κ across all blind re-score pairs completed in the quarter. Measures scoring consistency between technologists.",
    benchmark: '≥0.75 (AASM inter-rater threshold)',
    calculation: 'Mean Cohen\'s κ from quarterly blind re-score sample (10% of studies)',
    note: 'Current κ = 0.82 is excellent. Trending up over 9 quarters.',
  },
  'KPI-07': {
    clause: '5.8.1', owner: 'Dr. R. Okafor',
    description: 'Percentage of final signed reports issued to referring physician within 10 business days of study completion.',
    benchmark: '≥95% (NATA RMP benchmark)',
    calculation: 'Reports issued ≤10d ÷ total reports issued × 100',
    note: 'Currently 0.1% below 98% target. Driven by 2 complex paediatric cases in April.',
  },
  'KPI-08': {
    clause: '5.8.2', owner: 'Dr. R. Okafor',
    description: 'Rate of issued reports subsequently amended due to clinical or administrative error. Measures report quality at release.',
    benchmark: '<3% (industry)',
    calculation: 'Amended reports ÷ total issued reports × 100',
    note: '',
  },
  'KPI-09': {
    clause: '4.8.1', owner: 'K. Patel',
    description: 'Mean satisfaction score from referring physician feedback surveys (5-point Likert). Administered quarterly by post and digital link.',
    benchmark: '≥4.2 (sector benchmark)',
    calculation: 'Sum of scores ÷ number of responses (scale 1–5)',
    note: 'Q1 2026 survey: n=89. Response rate 22%.',
  },
  'KPI-10': {
    clause: '5.3.4', owner: 'M. Chen',
    description: 'Percentage of equipment items whose next scheduled verification was completed on or before the due date in the period.',
    benchmark: '≥95% (accreditation requirement)',
    calculation: 'Equipment verified on time ÷ equipment due for verification × 100',
    note: 'HSAT-NOX-014 removal from service artificially improved rate in Feb–Mar.',
  },
  'KPI-11': {
    clause: '5.6.8', owner: 'Dr. R. Okafor',
    description: 'Percentage of external quality assurance (EQA) events where the laboratory achieved a satisfactory or acceptable result.',
    benchmark: '≥90% (NATA minimum)',
    calculation: 'Satisfactory EQA events ÷ total EQA events participated × 100',
    note: 'J. Owusu\'s Jan 2026 EQA result (78%) is under investigation per NC-2026-0110.',
  },
  'KPI-12': {
    clause: '4.10.1', owner: 'K. Patel',
    description: 'Rate of corrective and preventive actions (CAPAs) assessed as fully effective at the defined effectiveness review date.',
    benchmark: '≥85% (internal target)',
    calculation: 'Effective CAPAs at review date ÷ total CAPAs reviewed × 100',
    note: '',
  },
};

function parseTarget(target) {
  const match = target.match(/([0-9.]+)/);
  const num = match ? parseFloat(match[1]) : null;
  const dir = target.startsWith('≥') ? 'up' : 'down';
  return { num, dir };
}

function statColor(value, targetNum, dir) {
  if (targetNum === null) return 'var(--ink)';
  const ok = dir === 'up' ? value >= targetNum : value <= targetNum;
  return ok ? 'var(--good)' : 'var(--warn)';
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

const BarChart = ({ trend, months, targetNum, dir }) => {
  const allVals = targetNum != null ? [...trend, targetNum] : trend;
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const pad  = (maxV - minV) * 0.12 || 0.5;
  const lo   = Math.max(0, minV - pad);
  const hi   = maxV + pad;
  const rng  = hi - lo || 1;
  const BAR_H = 80;

  const targetPct = targetNum != null ? Math.min(1, Math.max(0, (targetNum - lo) / rng)) : null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Target line */}
      {targetPct != null && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          bottom: 20 + targetPct * BAR_H,
          pointerEvents: 'none', zIndex: 2,
        }}>
          <div style={{ borderTop: '1.5px dashed var(--ink-3)', width: '100%', position: 'relative' }}>
            <span style={{ position: 'absolute', right: 0, top: -14, fontSize: 9, color: 'var(--ink-3)', background: 'var(--surface)', padding: '0 3px' }}>target</span>
          </div>
        </div>
      )}

      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: BAR_H, position: 'relative', zIndex: 1 }}>
        {trend.map((v, i) => {
          const h = Math.max(2, ((v - lo) / rng) * BAR_H);
          const isGood = dir === 'up'
            ? (targetNum == null || v >= targetNum)
            : (targetNum == null || v <= targetNum);
          return (
            <div key={i} title={`${months[i]}: ${v}`} style={{
              flex: 1, height: `${h}px`,
              background: isGood ? '#22c55e' : '#f59e0b',
              borderRadius: '2px 2px 0 0',
              opacity: 0.82,
              cursor: 'default',
            }} />
          );
        })}
      </div>

      {/* Month labels */}
      <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
        {months.map(m => (
          <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--ink-3)' }}>{m}</div>
        ))}
      </div>
    </div>
  );
};

// ─── Main drawer ──────────────────────────────────────────────────────────────

const IndicatorDetailDrawer = ({ indicator, onClose, onUpdate }) => {
  const { openCreateTask } = useTaskContext();
  const [notes, setNotes]       = useState('');
  const [editNotes, setEditNotes] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [editTarget, setEditTarget] = useState(false);
  const [draftTarget, setDraftTarget] = useState(indicator.target);

  const meta = KPI_META[indicator.id] || {};
  const { num: targetNum, dir } = parseTarget(indicator.target);
  const trend = indicator.trend;

  const avg12 = (trend.reduce((s, v) => s + v, 0) / trend.length);
  const avg3  = (trend.slice(-3).reduce((s, v) => s + v, 0) / 3);
  const minVal = Math.min(...trend);
  const maxVal = Math.max(...trend);

  function saveTarget() {
    onUpdate?.({ ...indicator, target: draftTarget });
    setEditTarget(false);
  }

  const PHASE_LABEL = { pre: 'Pre-study', study: 'Study', post: 'Post-study' };
  const offTarget = indicator.status === 'warn' || indicator.status === 'bad';

  const monthlyRowData = trend.map((v, i) => {
    const ok = dir === 'up' ? (targetNum == null || v >= targetNum) : (targetNum == null || v <= targetNum);
    return {
      month: MONTHS_SHORT[i],
      value: v + (indicator.unit ? ' ' + indicator.unit : ''),
      ok,
    };
  });

  const monthlyColDefs = [
    { headerName: 'Month', field: 'month', flex: 1,
      cellRenderer: p => <span style={{ color: 'var(--ink-3)' }}>{p.value}</span> },
    { headerName: 'Value', field: 'value', flex: 1,
      cellRenderer: p => <span style={{ fontWeight: 500 }}>{p.value}</span> },
    { headerName: 'vs Target', field: 'ok', width: 130,
      cellRenderer: p => <Pill kind={p.value ? 'good' : 'warn'}>{p.value ? 'On target' : 'Off target'}</Pill> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '22px 22px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <Pill kind="outline">{PHASE_LABEL[indicator.phase] || indicator.phase}</Pill>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{indicator.id}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>{indicator.name}</div>
          </div>
          <button className="btn-icon" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Value + target hero */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Current value</div>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', color: statColor(parseFloat(indicator.value), targetNum, dir) }}>
              {indicator.value}
              {indicator.unit && <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink-3)', marginLeft: 4 }}>{indicator.unit}</span>}
            </div>
          </div>
          <div style={{ paddingBottom: 6 }}>
            {editTarget ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  className="input"
                  style={{ width: 120, fontSize: 13 }}
                  value={draftTarget}
                  onChange={e => setDraftTarget(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveTarget()}
                />
                <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={saveTarget}>Save</button>
                <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => { setEditTarget(false); setDraftTarget(indicator.target); }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 2 }}>Target</div>
                  <Pill kind={indicator.status === 'good' ? 'good' : indicator.status === 'warn' ? 'warn' : 'bad'} dot>
                    {indicator.target}
                  </Pill>
                </div>
                <button className="btn-icon" style={{ opacity: 0.5, marginTop: 14 }} title="Edit target" onClick={() => setEditTarget(true)}>
                  <Icon name="pen" size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            ['12M avg',  avg12.toFixed(2) + (indicator.unit ? ' ' + indicator.unit : '')],
            ['3M avg',   avg3.toFixed(2)  + (indicator.unit ? ' ' + indicator.unit : '')],
            ['12M low',  minVal + (indicator.unit ? ' ' + indicator.unit : '')],
            ['12M high', maxVal + (indicator.unit ? ' ' + indicator.unit : '')],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>12-month trend</div>
          <BarChart trend={trend} months={MONTHS_SHORT} targetNum={targetNum} dir={dir} />
          {meta.benchmark && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>Industry benchmark: <strong>{meta.benchmark}</strong></div>
          )}
        </div>

        {/* Toggle monthly table */}
        <div>
          <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setShowTable(v => !v)}>
            <Icon name={showTable ? 'chev_down' : 'chev_right'} size={11} />Monthly data
          </button>
          {showTable && (
            <div className="card" style={{ marginTop: 10 }}>
              <NexusGrid rowData={monthlyRowData} columnDefs={monthlyColDefs} />
            </div>
          )}
        </div>

        {/* Definition */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Definition</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', marginBottom: 12 }}>{meta.description || '—'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {[
              ['Clause', meta.clause || '—'],
              ['Owner', meta.owner || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
          {meta.calculation && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 11, color: 'var(--ink-2)', fontFamily: 'monospace', lineHeight: 1.5 }}>
              {meta.calculation}
            </div>
          )}
          {meta.note && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--accent-soft)', borderRadius: 6, fontSize: 12, color: 'var(--accent)', lineHeight: 1.5 }}>
              <Icon name="info" size={12} /> {meta.note}
            </div>
          )}
        </div>

        {/* Commentary / notes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>Commentary</div>
            {!editNotes && <button className="btn" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => setEditNotes(true)}><Icon name="pen" size={10} />Edit</button>}
          </div>
          {editNotes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                className="input"
                rows={3}
                style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', fontSize: 13 }}
                placeholder="Add commentary for this indicator…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setEditNotes(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => setEditNotes(false)}>Save</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: notes ? 'var(--ink-2)' : 'var(--ink-3)', lineHeight: 1.6, fontStyle: notes ? 'normal' : 'italic' }}>
              {notes || 'No commentary added.'}
            </div>
          )}
        </div>

        {/* Actions */}
        {offTarget && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
              This indicator is {indicator.status === 'bad' ? 'off' : 'approaching'} target. Consider creating a corrective action task.
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => openCreateTask({
              title: `Investigate ${indicator.name} — ${indicator.status === 'bad' ? 'off' : 'below'} target (${indicator.value}${indicator.unit} vs ${indicator.target})`,
              clause: meta.clause || '',
              source: indicator.id,
              sourceType: 'indicator',
              priority: indicator.status === 'bad' ? 'high' : 'medium',
              assignedTo: meta.owner,
            })}>
              <Icon name="plus" size={13} />Create corrective action task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndicatorDetailDrawer;
