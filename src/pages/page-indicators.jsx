import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Sparkline, Drawer } from '../components';
import { useTaskContext } from '../TaskContext';
import IndicatorDetailDrawer from '../indicator-detail-drawer';

const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

// Period slices: indices into the 12-element trend array
const PERIOD_SLICE = { '3m': [9, 12], '6m': [6, 12], '12m': [0, 12] };
// YTD = Jan 2026 onwards = index 8
const YTD_START = 8;

const PHASE_LABELS = { pre: 'Pre-study', study: 'Study', post: 'Post-study' };
const DOMAINS = ['Workforce', 'Equipment', 'QA', 'Clinical', 'Admin'];

// ─── EQA seed data ────────────────────────────────────────────────────────────

const SEED_EQA = [
  { id: 1, name: 'M. Chen',       last: 'Mar 2026', result: 'Pass · 96%',            status: 'good', next: 'Sep 2026', provider: 'BRPT EQA', type: 'PSG scoring'       },
  { id: 2, name: 'A. Singh',      last: 'Feb 2026', result: 'Pass · 91%',            status: 'good', next: 'Aug 2026', provider: 'BRPT EQA', type: 'PSG scoring'       },
  { id: 3, name: 'J. Owusu',      last: 'Jan 2026', result: 'Investigate · 78%',     status: 'warn', next: 'Jul 2026', provider: 'BRPT EQA', type: 'PSG scoring'       },
  { id: 4, name: 'Dr. R. Okafor', last: 'Dec 2025', result: 'Peer concord. κ=0.84', status: 'good', next: 'Jun 2026', provider: 'Internal', type: 'Physician review'  },
  { id: 5, name: 'Dr. L. Hartono',last: 'Nov 2025', result: 'Peer concord. κ=0.79', status: 'good', next: 'May 2026', provider: 'Internal', type: 'Paediatric review' },
];

const SCORERS = ['M. Chen', 'A. Singh', 'J. Owusu', 'Dr. R. Okafor', 'Dr. L. Hartono'];
const EQA_TYPES = ['PSG scoring', 'Paediatric PSG scoring', 'HSAT scoring', 'Physician review', 'Paediatric review'];

// ─── Trend direction ──────────────────────────────────────────────────────────

function trendDir(trend) {
  const last3 = trend.slice(-3);
  const delta = last3[2] - last3[0];
  if (Math.abs(delta) < 0.01 * last3[0]) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

function TrendArrow({ dir, goodDir }) {
  if (dir === 'flat') return <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>→</span>;
  const icon  = dir === 'up' ? '↑' : '↓';
  const isGood = (dir === 'up') === (goodDir === 'up');
  return <span style={{ fontSize: 11, color: isGood ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>{icon}</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const IndicatorsPage = ({ data: D }) => {
  const { openCreateTask } = useTaskContext();

  // Local indicator state (augmented from API)
  const [indicators, setIndicators] = useState(() => D?.indicators || []);
  useEffect(() => { if (D?.indicators) setIndicators(D.indicators); }, [D]);

  // Filters
  const [phase, setPhase]   = useState('all');
  const [period, setPeriod] = useState('12m');
  const [view, setView]     = useState('grid'); // 'grid' | 'table'
  const [search, setSearch] = useState('');

  // Drawer
  const [selectedId, setSelectedId] = useState(null);

  // New indicator
  const [addOpen, setAddOpen] = useState(false);
  const [newInd, setNewInd]   = useState({ name: '', phase: 'pre', unit: '', target: '', owner: 'K. Patel', description: '' });

  // EQA
  const [eqaRecords, setEqaRecords]     = useState(SEED_EQA);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [newEqa, setNewEqa]             = useState({ name: '', type: 'PSG scoring', date: '', provider: 'BRPT EQA' });

  // Mgmt review toast
  const [toast, setToast] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const [sliceStart, sliceEnd] = period === 'ytd' ? [YTD_START, 12] : (PERIOD_SLICE[period] || [0, 12]);
  const periodMonths = MONTHS.slice(sliceStart, sliceEnd);

  const displayIndicators = useMemo(() => {
    return indicators
      .filter(k => phase === 'all' || k.phase === phase)
      .filter(k => !search || k.name.toLowerCase().includes(search.toLowerCase()))
      .map(k => ({ ...k, trend: k.trend.slice(sliceStart, sliceEnd) }));
  }, [indicators, phase, search, sliceStart, sliceEnd]);

  const counts = useMemo(() => ({
    good: indicators.filter(k => k.status === 'good').length,
    warn: indicators.filter(k => k.status === 'warn').length,
    bad:  indicators.filter(k => k.status === 'bad').length,
  }), [indicators]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function parseDir(target) {
    return target.startsWith('≥') ? 'up' : 'down';
  }

  function goodDirFor(k) {
    return { dir: parseDir(k.target) };
  }

  function addIndicator() {
    if (!newInd.name.trim()) return;
    const k = {
      id: `KPI-${String(indicators.length + 1).padStart(2, '0')}`,
      name: newInd.name,
      phase: newInd.phase,
      unit: newInd.unit,
      target: newInd.target,
      status: 'good',
      trend: Array(12).fill(0),
      value: '—',
    };
    setIndicators(prev => [...prev, k]);
    setNewInd({ name: '', phase: 'pre', unit: '', target: '', owner: 'K. Patel', description: '' });
    setAddOpen(false);
  }

  function handleUpdate(updated) {
    setIndicators(prev => prev.map(k => k.id === updated.id ? updated : k));
  }

  function addEqa() {
    if (!newEqa.name || !newEqa.date) return;
    setEqaRecords(prev => [...prev, {
      id: Date.now(),
      name: newEqa.name,
      last: newEqa.date,
      result: 'Pending',
      status: 'outline',
      next: '—',
      provider: newEqa.provider,
      type: newEqa.type,
    }]);
    setNewEqa({ name: '', type: 'PSG scoring', date: '', provider: 'BRPT EQA' });
    setScheduleOpen(false);
  }

  function sendToReview() {
    setToast(true);
    setTimeout(() => setToast(false), 4000);
  }

  const selectedIndicator = indicators.find(k => k.id === selectedId);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · cl. 5.6.3 – 5.6.5"
        title="Quality indicators"
        subtitle="Pre-study, study, and post-study KPIs with traffic-light targets. Auto-fed into management review."
        actions={
          <>
            <button className="btn" onClick={() => setAddOpen(v => !v)}><Icon name="plus" size={14} />New indicator</button>
            <button className="btn btn-primary" onClick={sendToReview}><Icon name="flag" size={14} />Send to mgmt review</button>
          </>
        }
      />

      {/* Toast */}
      {toast && (
        <div className="banner info" style={{ marginBottom: 18 }}>
          <Icon name="check" size={16} />
          <div style={{ flex: 1 }}>
            <strong>Indicator dashboard added to Q2 2026 management review pack.</strong>
            <div style={{ fontSize: 12, marginTop: 2 }}>All 12 KPIs with current status have been included as cl. 4.15.2.f input.</div>
          </div>
          <button className="btn-icon" onClick={() => setToast(false)}><Icon name="x" size={14} /></button>
        </div>
      )}

      {/* Add indicator form */}
      {addOpen && (
        <div className="card" style={{ border: '1px solid var(--accent)', marginBottom: 18 }}>
          <div className="card-head">
            <div className="card-title">New quality indicator</div>
            <div className="topbar-spacer" />
            <button className="btn-icon" onClick={() => setAddOpen(false)}><Icon name="x" size={14} /></button>
          </div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Indicator name</label>
                <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. Patient wait time for results" value={newInd.name} onChange={e => setNewInd(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Phase</label>
                <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newInd.phase} onChange={e => setNewInd(p => ({ ...p, phase: e.target.value }))}>
                  <option value="pre">Pre-study</option>
                  <option value="study">Study</option>
                  <option value="post">Post-study</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Unit</label>
                <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. %, days, /5" value={newInd.unit} onChange={e => setNewInd(p => ({ ...p, unit: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Target</label>
                <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. ≥ 95% or ≤ 14d" value={newInd.target} onChange={e => setNewInd(p => ({ ...p, target: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Owner</label>
                <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newInd.owner} onChange={e => setNewInd(p => ({ ...p, owner: e.target.value }))}>
                  {['K. Patel', 'M. Chen', 'Dr. R. Okafor', 'Dr. L. Hartono', 'F. Olsson'].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addIndicator}>Add indicator</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary band */}
      <div className="grid-3" style={{ marginBottom: 18 }}>
        {[
          { kind: 'good', label: 'On target',  count: counts.good },
          { kind: 'warn', label: 'Watch',      count: counts.warn },
          { kind: 'bad',  label: 'Off target', count: counts.bad  },
        ].map(({ kind, label, count }) => (
          <div key={kind} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className={`traffic-dot ${kind}`} style={{ width: 14, height: 14, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>
                {count}
                {kind === 'good' && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 6 }}>/ {indicators.length}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar" style={{ marginBottom: 18 }}>
        {['all', 'pre', 'study', 'post'].map(p => (
          <button key={p} className={`chip-btn ${phase === p ? 'active' : ''}`} onClick={() => setPhase(p)}>
            {p === 'all' ? 'All phases' : PHASE_LABELS[p]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
          <input
            style={{ paddingLeft: 28, height: 30, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 12, color: 'var(--ink)', width: 160 }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        {['3m', '6m', '12m', 'ytd'].map(p => (
          <button key={p} className={`chip-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p.toUpperCase()}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        <button className={`chip-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} title="Grid view">
          <Icon name="dot_grid" size={13} />
        </button>
        <button className={`chip-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')} title="Table view">
          <Icon name="clipboard" size={13} />
        </button>
      </div>

      {/* KPI grid view */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {displayIndicators.map(k => {
            const dir = parseDir(k.target);
            const td  = trendDir(k.trend);
            return (
              <div
                key={k.id}
                className="kpi-tile"
                onClick={() => setSelectedId(k.id)}
                style={{ cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                <div className="traffic">
                  <div className={`traffic-dot ${k.status}`} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className="kpi-name" style={{ flex: 1 }}>{k.name}</div>
                  <TrendArrow dir={td} goodDir={{ dir }} />
                </div>
                <div className="kpi-value">
                  {k.value}
                  {k.unit && <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, marginLeft: 2 }}>{k.unit}</span>}
                </div>
                <div className="kpi-target">target {k.target}</div>
                <div className="kpi-spark">
                  <Sparkline
                    data={k.trend}
                    width={180} height={32}
                    color={k.status === 'good' ? 'var(--good)' : k.status === 'warn' ? 'var(--warn)' : 'var(--bad)'}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{periodMonths[0]}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{periodMonths[periodMonths.length - 1]}</span>
                </div>
              </div>
            );
          })}
          {displayIndicators.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: '32px 0' }}>
              No indicators match the current filter.
            </div>
          )}
        </div>
      )}

      {/* KPI table view */}
      {view === 'table' && (
        <div className="card" style={{ marginBottom: 32 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Phase</th>
                <th>Current</th>
                <th>Target</th>
                <th>Trend ({period.toUpperCase()})</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayIndicators.map(k => {
                const dir = parseDir(k.target);
                const td  = trendDir(k.trend);
                return (
                  <tr key={k.id} className="row-clickable" onClick={() => setSelectedId(k.id)}>
                    <td style={{ fontWeight: 500 }}>{k.name}</td>
                    <td><Pill kind="outline">{PHASE_LABELS[k.phase]}</Pill></td>
                    <td style={{ fontWeight: 600 }}>{k.value}{k.unit ? ' ' + k.unit : ''}</td>
                    <td className="muted">{k.target}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkline data={k.trend} width={80} height={22}
                          color={k.status === 'good' ? 'var(--good)' : k.status === 'warn' ? 'var(--warn)' : 'var(--bad)'} />
                        <TrendArrow dir={td} goodDir={{ dir }} />
                      </div>
                    </td>
                    <td>
                      <Pill kind={k.status} dot>
                        {k.status === 'good' ? 'On target' : k.status === 'warn' ? 'Watch' : 'Off target'}
                      </Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Proficiency testing + inter-scorer concordance */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">External proficiency testing · cl. 5.6.8</div>
              <div className="card-sub">≥ 2 events / year per analysing staff member</div>
            </div>
            <div className="topbar-spacer" />
            <button className="btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setScheduleOpen(v => !v)}>
              <Icon name="plus" size={13} />Schedule
            </button>
          </div>

          {scheduleOpen && (
            <div style={{ margin: '0 18px 14px', background: 'var(--surface-2)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Scorer</label>
                  <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newEqa.name} onChange={e => setNewEqa(p => ({ ...p, name: e.target.value }))}>
                    <option value="">Select…</option>
                    {SCORERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Event type</label>
                  <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newEqa.type} onChange={e => setNewEqa(p => ({ ...p, type: e.target.value }))}>
                    {EQA_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Event date</label>
                  <input className="input" type="date" style={{ width: '100%', boxSizing: 'border-box' }} value={newEqa.date} onChange={e => setNewEqa(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Provider</label>
                  <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. BRPT EQA" value={newEqa.provider} onChange={e => setNewEqa(p => ({ ...p, provider: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setScheduleOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addEqa}>Add event</button>
              </div>
            </div>
          )}

          <table className="tbl">
            <thead>
              <tr><th>Scorer</th><th>Provider</th><th>Last event</th><th>Result</th><th>Next due</th></tr>
            </thead>
            <tbody>
              {eqaRecords.map((r, i) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={r.name} idx={i} size={22} />
                      {r.name}
                    </div>
                  </td>
                  <td className="muted">{r.provider}</td>
                  <td className="muted">{r.last}</td>
                  <td><Pill kind={r.status}>{r.result}</Pill></td>
                  <td className="muted">{r.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Inter-observer concordance · cl. 5.6.6</div>
              <div className="card-sub">Blind re-score sample · Cohen's κ per quarter</div>
            </div>
            <div className="topbar-spacer" />
            <button className="btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setSelectedId('KPI-06')}>
              View detail →
            </button>
          </div>
          <div className="card-pad">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, marginBottom: 8 }}>
              {[
                { q: 'Q1 24', v: 0.74 }, { q: 'Q2 24', v: 0.76 }, { q: 'Q3 24', v: 0.78 },
                { q: 'Q4 24', v: 0.79 }, { q: 'Q1 25', v: 0.81 }, { q: 'Q2 25', v: 0.80 },
                { q: 'Q3 25', v: 0.82 }, { q: 'Q4 25', v: 0.83 }, { q: 'Q1 26', v: 0.82 },
              ].map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>{b.v.toFixed(2)}</div>
                  <div style={{
                    width: '70%', height: `${b.v * 110}px`,
                    background: b.v >= 0.75 ? '#22c55e' : '#f59e0b',
                    borderRadius: '3px 3px 0 0', opacity: 0.75 + i * 0.02,
                  }} />
                  <div style={{ fontSize: 9, color: 'var(--ink-4)' }}>{b.q}</div>
                </div>
              ))}
            </div>
            {/* threshold line label */}
            <div style={{ position: 'relative', height: 0 }}>
              <div style={{ borderTop: '1px dashed var(--ink-3)', position: 'absolute', bottom: 82, left: 0, right: 0, pointerEvents: 'none' }}>
                <span style={{ fontSize: 9, color: 'var(--ink-3)', position: 'absolute', right: 0, top: -12 }}>κ=0.75 threshold</span>
              </div>
            </div>
            <div style={{ marginTop: 4, padding: 10, background: 'var(--good-soft)', color: 'var(--good)', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={14} />Trending up · current κ = 0.82, well above 0.75 threshold
            </div>
          </div>
        </div>
      </div>

      {/* Indicator detail drawer */}
      <Drawer open={!!selectedId} onClose={() => setSelectedId(null)}>
        {selectedIndicator && (
          <IndicatorDetailDrawer
            indicator={selectedIndicator}
            onClose={() => setSelectedId(null)}
            onUpdate={handleUpdate}
          />
        )}
      </Drawer>
    </div>
  );
};

export default IndicatorsPage;
