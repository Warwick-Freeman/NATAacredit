import React, { useState, useMemo } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Tabs, Donut, Drawer } from '../components';
import NCRaiseDrawer, { DEFAULT_WHYS } from '../nc-raise-drawer';
import NCDetailDrawer from '../nc-detail-drawer';

// --- Seed data ---------------------------------------------------------------
const SEED_NCS = [
  {
    id: "NC-2026-0112", title: "Subcontractor scoring evidence missing",
    description: "External scorer J. Owusu has no documented competency sign-off on file. Evidence of training and credentials must be held by the lab per cl. 4.5.2.",
    source: "Audit", clause: "4.5.2", severity: "High", clinicalSig: "Possible",
    phase: "rca", owner: "K. Patel", raised: "08 Apr 2026", dueDate: "2026-04-15", due: "in 7d",
    whys: [
      { question: "Why did this non-conformance occur?",        answer: "Credentialing checklist was not followed for the subcontractor onboarding." },
      { question: "Why was that the case?",                      answer: "" },
      { question: "Why didn't existing controls prevent it?",    answer: "" },
      { question: "Why was the process designed this way?",      answer: "" },
      { question: "What is the underlying systemic root cause?", answer: "" },
    ],
    rootCause: "", capaActions: [], effectivenessNote: "", closedDate: null,
  },
  {
    id: "NC-2026-0111", title: "HSAT-NOX-014 verification overdue 12d",
    description: "Home-sleep device HSAT-NOX-014 passed its verification due date without re-verification. 3 studies were conducted during the lapsed period.",
    source: "Equipment check", clause: "5.3.4", severity: "Critical", clinicalSig: "Yes — patient safety impact",
    phase: "capa", owner: "M. Chen", raised: "01 Apr 2026", dueDate: "2026-04-03", due: "Overdue 2d",
    whys: [
      { question: "Why did this non-conformance occur?",        answer: "Calendar reminder did not trigger for the device." },
      { question: "Why was that the case?",                      answer: "Device was assigned to retired location 'Eastside-temp'." },
      { question: "Why didn't existing controls prevent it?",    answer: "Site move in Feb 2026 didn't reassign mobile HSAT devices." },
      { question: "Why was the process designed this way?",      answer: "SOP-EQP-009 (Site change) doesn't cover loaned/mobile equipment." },
      { question: "What is the underlying systemic root cause?", answer: "Mobile HSAT fleet was introduced after SOP last reviewed (2023)." },
    ],
    rootCause: "SOP-EQP-009 doesn't cover mobile equipment, and inventory location ontology lacks a 'mobile fleet' concept.",
    capaActions: [
      { id: 1, type: "corrective", description: "Re-verify HSAT-NOX-014 and review the 3 affected studies for reporting accuracy", owner: "M. Chen",  dueDate: "2026-05-14", done: true  },
      { id: 2, type: "preventive", description: "Update SOP-EQP-009 to include mobile and loaned equipment in site-change procedures", owner: "K. Patel", dueDate: "2026-05-28", done: false },
      { id: 3, type: "preventive", description: "Add 'mobile fleet' location category to equipment inventory; migrate all HSAT devices", owner: "M. Chen",  dueDate: "2026-06-01", done: false },
    ],
    effectivenessNote: "", closedDate: null,
  },
  {
    id: "NC-2026-0110", title: "EQA result <80% for scorer J. Owusu",
    description: "Latest EQA submission scored 78%. NATA requirement is ≥80%. Scorer must be supervised pending investigation.",
    source: "EQA result", clause: "5.6.8", severity: "Medium", clinicalSig: "Possible",
    phase: "rca", owner: "Dr. R. Okafor", raised: "20 Mar 2026", dueDate: "2026-04-17", due: "in 14d",
    whys: DEFAULT_WHYS.map(w => ({ ...w })),
    rootCause: "", capaActions: [], effectivenessNote: "", closedDate: null,
  },
  {
    id: "NC-2026-0109", title: "BLS recert lapsed — 4 staff",
    description: "T. Brooks (21d), R. Patel (7d), S. Nakamura (3d), J. Owusu (14d) all have lapsed BLS certificates.",
    source: "Audit", clause: "5.1.4", severity: "High", clinicalSig: "No",
    phase: "capa", owner: "M. Chen", raised: "15 Mar 2026", dueDate: "2026-04-22", due: "in 7d",
    whys: [
      { question: "Why did this non-conformance occur?",        answer: "BLS renewal calendar alerts not set up in the new HR system." },
      { question: "Why was that the case?",                      answer: "HR system migration in Jan 2026 did not carry over renewal dates." },
      { question: "Why didn't existing controls prevent it?",    answer: "The manual BLS register was not cross-checked after migration." },
      { question: "Why was the process designed this way?",      answer: "No documented data migration validation checklist exists." },
      { question: "What is the underlying systemic root cause?", answer: "System migration process lacks a formal data validation step." },
    ],
    rootCause: "HR system migration process lacked a data validation step; renewal reminders were silently dropped.",
    capaActions: [
      { id: 4, type: "corrective", description: "Book BLS recertification for all 4 lapsed staff within 14 days", owner: "M. Chen",  dueDate: "2026-04-29", done: false },
      { id: 5, type: "preventive", description: "Implement monthly automated BLS expiry report from HR system", owner: "K. Patel", dueDate: "2026-05-15", done: false },
    ],
    effectivenessNote: "", closedDate: null,
  },
  {
    id: "NC-2026-0108", title: "Report delivered after 10 business days × 3",
    description: "Three reports in Q1 2026 exceeded the 10-business-day delivery target. Review of scoring and sign-off queue revealed backlog.",
    source: "KPI review", clause: "5.8.1", severity: "Low", clinicalSig: "No",
    phase: "effectiveness", owner: "K. Patel", raised: "05 Mar 2026", dueDate: "2026-04-26", due: "in 21d",
    whys: [
      { question: "Why did this non-conformance occur?",        answer: "Scorer absence created a 3-day backlog in the scoring queue." },
      { question: "Why was that the case?",                      answer: "No cross-trained backup scorer was rostered during leave." },
      { question: "Why didn't existing controls prevent it?",    answer: "Rostering policy doesn't require scorer cover during leave." },
      { question: "Why was the process designed this way?",      answer: "Historically scoring volume was low enough not to require cover." },
      { question: "What is the underlying systemic root cause?", answer: "Growth in study volume outpaced staffing redundancy planning." },
    ],
    rootCause: "Staffing redundancy policy not updated as study volume grew; no mandatory backup scorer during leave.",
    capaActions: [
      { id: 6, type: "corrective", description: "Clear existing scoring backlog and re-prioritise overdue reports", owner: "M. Chen",  dueDate: "2026-03-20", done: true },
      { id: 7, type: "preventive", description: "Update rostering policy to mandate backup scorer during any leave > 2 days", owner: "K. Patel", dueDate: "2026-04-15", done: true },
    ],
    effectivenessNote: "Rostering policy updated and approved on 16 Apr 2026. Monitoring of report turnaround time in May shows no further breaches over 10 business days.",
    closedDate: null,
  },
  {
    id: "NC-2026-0107", title: "Paeds A/V recording retention gap",
    description: "3 paediatric studies found without associated A/V recordings stored. Retention policy requires A/V retained for diagnostic studies.",
    source: "Audit", clause: "5.3", severity: "Medium", clinicalSig: "No",
    phase: "capa", owner: "M. Chen", raised: "02 Mar 2026", dueDate: "2026-04-16", due: "in 4d",
    whys: [
      { question: "Why did this non-conformance occur?",        answer: "Storage path misconfigured in Compumedics after lab PC replacement." },
      { question: "Why was that the case?",                      answer: "PC setup checklist didn't include the A/V storage path config step." },
      { question: "Why didn't existing controls prevent it?",    answer: "Post-installation verification only checks signal acquisition, not storage." },
      { question: "Why was the process designed this way?",      answer: "A/V storage is a separate subsystem added after the original SOP was written." },
      { question: "What is the underlying systemic root cause?", answer: "PC setup SOP (SOP-IT-002) has not been updated to include A/V path verification." },
    ],
    rootCause: "SOP-IT-002 lacks A/V storage path verification step; introduced blind spot after A/V subsystem was added.",
    capaActions: [
      { id: 8,  type: "corrective", description: "Recover or reconstruct A/V recordings for the 3 affected studies where possible", owner: "M. Chen",  dueDate: "2026-04-10", done: true },
      { id: 9,  type: "preventive", description: "Update SOP-IT-002 to include A/V path configuration and post-install verification steps", owner: "K. Patel", dueDate: "2026-04-30", done: false },
      { id: 10, type: "preventive", description: "Add automated A/V storage health check to monthly IT review checklist", owner: "M. Chen",  dueDate: "2026-05-01", done: false },
    ],
    effectivenessNote: "", closedDate: null,
  },
  {
    id: "NC-2026-0106", title: "Complaint — late results disclosure",
    description: "Patient complaint received regarding 14-day delay in receiving results. Investigated and found to be a referrer fax failure (not lab delay).",
    source: "Complaint", clause: "4.8", severity: "Medium", clinicalSig: "No",
    phase: "closed", owner: "K. Patel", raised: "12 Feb 2026", dueDate: "2026-03-12", due: "—",
    whys: [
      { question: "Why did this non-conformance occur?",        answer: "Referrer fax number had changed; lab dispatch used old number." },
      { question: "Why was that the case?",                      answer: "Referrer directory not updated when fax number changed in Jan 2026." },
      { question: "Why didn't existing controls prevent it?",    answer: "No automated validation of referrer contact details at dispatch." },
      { question: "Why was the process designed this way?",      answer: "Directory updates rely on manual notification from referrers." },
      { question: "What is the underlying systemic root cause?", answer: "No systematic re-validation of referrer contact details — process relies on passive notification." },
    ],
    rootCause: "Referrer directory update process is passive — relies on referrers notifying the lab. No systematic re-validation exists.",
    capaActions: [
      { id: 11, type: "corrective", description: "Send report directly to patient via secure portal; apologise and explain delay", owner: "K. Patel", dueDate: "2026-02-20", done: true },
      { id: 12, type: "preventive", description: "Implement quarterly referrer contact validation step in admin checklist", owner: "K. Patel", dueDate: "2026-03-01", done: true },
    ],
    effectivenessNote: "Quarterly validation process implemented and first cycle completed on 28 Feb 2026. No further failed deliveries detected in 6-week post-implementation monitoring period.",
    closedDate: "05 Mar 2026",
  },
  {
    id: "NC-2026-0105", title: "EEG cable fault during overnight study",
    description: "Intermittent EEG signal loss detected in overnight study PSG-2026-0892. Study was extended and repeated electrode placement resolved the fault.",
    source: "Internal observation", clause: "5.3.6", severity: "Medium", clinicalSig: "No",
    phase: "closed", owner: "M. Chen", raised: "08 Feb 2026", dueDate: "2026-03-08", due: "—",
    whys: [
      { question: "Why did this non-conformance occur?",        answer: "EEG cable showed visible wear but was not flagged during pre-study check." },
      { question: "Why was that the case?",                      answer: "Pre-study equipment checklist only checks impedance, not visual cable condition." },
      { question: "Why didn't existing controls prevent it?",    answer: "Visual cable inspection was removed from checklist in 2024 to reduce setup time." },
      { question: "Why was the process designed this way?",      answer: "Efficiency improvement project in 2024 reduced checklist length." },
      { question: "What is the underlying systemic root cause?", answer: "Risk of removing visual cable inspection was not assessed during the 2024 checklist revision." },
    ],
    rootCause: "2024 efficiency review removed visual cable inspection without formal risk assessment; created an undetected equipment failure pathway.",
    capaActions: [
      { id: 13, type: "corrective", description: "Inspect and replace all EEG cables showing visible wear immediately", owner: "M. Chen",  dueDate: "2026-02-15", done: true },
      { id: 14, type: "preventive", description: "Reinstate visual cable condition check to pre-study equipment checklist (SOP-EQP-002)", owner: "M. Chen",  dueDate: "2026-02-28", done: true },
    ],
    effectivenessNote: "Pre-study checklist updated and re-approved on 25 Feb 2026. 4-week post-implementation review showed zero cable faults in 42 overnight studies.",
    closedDate: "10 Mar 2026",
  },
];

const SEV_KIND    = { Critical: 'bad', High: 'warn', Medium: 'info', Low: 'outline' };
const PHASE_KIND  = { raised: 'warn', rca: 'warn', capa: 'warn', effectiveness: 'accent', closed: 'good' };
const PHASE_LABEL = { raised: 'Open · Raised', rca: 'Open · RCA', capa: 'Open · CAPA', effectiveness: 'Effectiveness review', closed: 'Closed' };

// --- Component ---------------------------------------------------------------
const NCRPage = () => {
  const [items, setItems]   = useState(SEED_NCS);
  const [tab, setTab]       = useState("register");
  const [filter, setFilter] = useState("open");

  // Drawer state
  const [raiseOpen,  setRaiseOpen]  = useState(false);
  const [detailNcId, setDetailNcId] = useState(null);

  const detailNc = items.find(i => i.id === detailNcId) || null;

  const handleRaise = (newNc) => {
    setItems(prev => [newNc, ...prev]);
    setRaiseOpen(false);
    setDetailNcId(newNc.id);
  };

  const handleUpdate = (updated) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  // Derived stats
  const openItems   = useMemo(() => items.filter(i => i.phase !== 'closed'), [items]);
  const closedItems = useMemo(() => items.filter(i => i.phase === 'closed'), [items]);

  const filtered = useMemo(() => items.filter(i => {
    if (filter === 'open')   return i.phase !== 'closed';
    if (filter === 'closed') return i.phase === 'closed';
    return true;
  }), [items, filter]);

  // All CAPA actions from open NCs
  const allCapaActions = useMemo(() =>
    items.filter(i => i.phase !== 'closed' && i.capaActions.length > 0)
      .flatMap(i => i.capaActions.map(a => ({ ...a, ncId: i.id, ncTitle: i.title, ncOwner: i.owner }))),
    [items]);

  const pendingCapas = allCapaActions.filter(a => !a.done);
  const doneCapas    = allCapaActions.filter(a => a.done);

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · cl. 4.9, 4.10, 4.11"
        title="Nonconformance & CAPA"
        subtitle="NC register · root-cause analysis · corrective & preventive actions · effectiveness review"
        actions={
          <>
            <button className="btn"><Icon name="chart" size={14} />Trend report</button>
            <button className="btn btn-primary" onClick={() => setRaiseOpen(true)}>
              <Icon name="plus" size={14} />Raise NC
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Open NCs</div>
          <div className="stat-value">{openItems.length}</div>
          <div className="stat-meta" style={{ color: openItems.some(i => i.severity === 'Critical') ? 'var(--bad)' : 'inherit' }}>
            {openItems.filter(i => i.severity === 'Critical').length > 0
              ? `${openItems.filter(i => i.severity === 'Critical').length} critical`
              : 'no critical'}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="clock" size={13} />Avg time to close</div>
          <div className="stat-value">14<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, marginLeft: 4 }}>days</span></div>
          <div className="stat-meta up">3d faster than Q4</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="check" size={13} />CAPA actions outstanding</div>
          <div className="stat-value" style={{ color: pendingCapas.length > 0 ? 'var(--warn)' : 'var(--good)' }}>
            {pendingCapas.length}
          </div>
          <div className="stat-meta">{doneCapas.length} completed</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="pulse" size={13} />Sources (12 mo)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Donut size={50} stroke={9} segments={[
              { value: 12, color: 'var(--accent)' },
              { value: 9,  color: 'var(--warn)'   },
              { value: 7,  color: 'var(--good)'   },
              { value: 5,  color: 'var(--bad)'    },
              { value: 5,  color: 'var(--info)'   },
            ]} />
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              Audit · Eqp · KPI<br />Cmplnt · EQA
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "register",  label: "Register",      count: items.length },
        { id: "capaboard", label: "CAPA actions",  count: pendingCapas.length || undefined },
        { id: "trends",    label: "Trends"         },
      ]} />

      {/* ── REGISTER TAB ── */}
      {tab === "register" && (
        <>
          <div className="filter-bar">
            <button className={`chip-btn ${filter === 'open'   ? 'active' : ''}`} onClick={() => setFilter('open')}>
              Open <span style={{ marginLeft: 4, fontSize: 11 }}>({openItems.length})</span>
            </button>
            <button className={`chip-btn ${filter === 'closed' ? 'active' : ''}`} onClick={() => setFilter('closed')}>
              Closed <span style={{ marginLeft: 4, fontSize: 11 }}>({closedItems.length})</span>
            </button>
            <button className={`chip-btn ${filter === 'all'    ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{filtered.length} items</span>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>NC ID</th><th>Title</th><th>Source</th><th>Clause</th>
                  <th>Severity</th><th>Clinical sig.</th><th>Phase</th><th>Owner</th><th>Due</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} className="row-clickable" onClick={() => setDetailNcId(n.id)} title="Click to view / manage">
                    <td className="mono" style={{ fontWeight: 500 }}>{n.id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{n.title}</div>
                      {n.capaActions.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                          {n.capaActions.filter(a => a.done).length}/{n.capaActions.length} actions done
                        </div>
                      )}
                    </td>
                    <td className="muted">{n.source}</td>
                    <td className="mono">{n.clause}</td>
                    <td><Pill kind={SEV_KIND[n.severity]}>{n.severity}</Pill></td>
                    <td style={{ fontSize: 12, color: n.clinicalSig.startsWith("Yes") ? 'var(--bad)' : 'var(--ink-3)' }}>{n.clinicalSig}</td>
                    <td><Pill kind={PHASE_KIND[n.phase] || 'warn'} dot>{PHASE_LABEL[n.phase]}</Pill></td>
                    <td style={{ fontSize: 12 }}>{n.owner}</td>
                    <td style={{ fontSize: 12, color: n.due.includes("Overdue") ? 'var(--bad)' : 'var(--ink-3)' }}>{n.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CAPA BOARD TAB ── */}
      {tab === "capaboard" && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Outstanding CAPA actions</div>
              <div className="card-sub">All corrective and preventive actions from open NCs</div>
            </div>
          </div>
          {allCapaActions.length === 0 ? (
            <div className="empty">No CAPA actions recorded on open NCs.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>NC</th><th>Type</th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {allCapaActions.map(a => (
                  <tr key={a.id} className="row-clickable" onClick={() => setDetailNcId(a.ncId)} title="Click to open NC">
                    <td>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{a.ncId}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.ncTitle}</div>
                    </td>
                    <td><Pill kind={a.type === 'corrective' ? 'warn' : 'info'}>
                      {a.type === 'corrective' ? 'Corrective' : 'Preventive'}
                    </Pill></td>
                    <td style={{ maxWidth: 240 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.description}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{a.owner}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{a.dueDate || '—'}</td>
                    <td>
                      {a.done
                        ? <Pill kind="good"><Icon name="check" size={10} /> Done</Pill>
                        : <Pill kind="warn" dot>Pending</Pill>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TRENDS TAB ── */}
      {tab === "trends" && (
        <div className="grid-2">
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>NCs raised · last 12 months</div>
            <div className="bar-chart" style={{ height: 140 }}>
              {[6,4,5,7,3,4,8,5,6,4,3,5].map((v, i) => (
                <div key={i} className="bar-col">
                  <div className="bar" style={{ height: `${v * 16}px`, background: i === 11 ? 'var(--accent)' : 'var(--accent-soft)' }} />
                  <div className="bar-label">{["M","J","J","A","S","O","N","D","J","F","M","A"][i]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>By source</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Audit',           value: 12, pct: 32 },
                { label: 'Equipment check', value: 9,  pct: 24 },
                { label: 'KPI review',      value: 7,  pct: 19 },
                { label: 'Complaint',       value: 5,  pct: 14 },
                { label: 'EQA result',      value: 5,  pct: 14 },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 120, fontSize: 12, color: 'var(--ink-2)' }}>{row.label}</div>
                  <div className="progress" style={{ flex: 1 }}>
                    <div className="progress-bar" style={{ width: `${row.pct}%`, background: 'var(--accent)' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', width: 24, textAlign: 'right' }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>By severity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Critical', value: 3,  pct: 8,  kind: 'bad'  },
                { label: 'High',     value: 11, pct: 29, kind: 'warn' },
                { label: 'Medium',   value: 18, pct: 47, kind: 'info' },
                { label: 'Low',      value: 6,  pct: 16, kind: 'outline' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 70 }}><Pill kind={row.kind}>{row.label}</Pill></div>
                  <div className="progress" style={{ flex: 1 }}>
                    <div className="progress-bar" style={{ width: `${row.pct}%`, background: `var(--${row.kind === 'bad' ? 'bad' : row.kind === 'warn' ? 'warn' : row.kind === 'info' ? 'info' : 'surface-3'})` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', width: 24, textAlign: 'right' }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Time to close (days)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Critical', avg: 8,  target: 7  },
                { label: 'High',     avg: 18, target: 21 },
                { label: 'Medium',   avg: 24, target: 30 },
                { label: 'Low',      avg: 35, target: 45 },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 70, fontSize: 12 }}>{row.label}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>{row.avg}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        d avg · target {row.target}d
                        <span style={{ marginLeft: 4, color: row.avg <= row.target ? 'var(--good)' : 'var(--bad)' }}>
                          {row.avg <= row.target ? '✓' : '!'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Raise NC drawer ── */}
      <Drawer open={raiseOpen} onClose={() => setRaiseOpen(false)}>
        <NCRaiseDrawer
          items={items}
          onSave={handleRaise}
          onClose={() => setRaiseOpen(false)}
        />
      </Drawer>

      {/* ── NC detail / CAPA drawer ── */}
      <Drawer open={!!detailNcId} onClose={() => setDetailNcId(null)}>
        {detailNc && (
          <NCDetailDrawer
            key={detailNc.id}
            nc={detailNc}
            onUpdate={handleUpdate}
            onClose={() => setDetailNcId(null)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default NCRPage;
