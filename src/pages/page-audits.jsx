import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs, Drawer } from '../components';
import { useTaskContext } from '../TaskContext';
import AuditDetailDrawer from '../audit-detail-drawer';

// ─── seed data ────────────────────────────────────────────────────────────────

const SEED_AUDITS = [
  { id: 'AUD-2026-Q1', area: 'Section 5.3 — Equipment',              date: '11 Feb 2026', auditor: 'K. Patel',         findings: 3, status: 'Closed',      scope: 'All sites'          },
  { id: 'AUD-2026-Q2', area: 'Section 4.3 — Document control',       date: '08 May 2026', auditor: 'External · J. Roy', findings: 0, status: 'In progress', scope: 'Riverside Main'     },
  { id: 'AUD-2025-Q4', area: 'Section 5.5 — Service processes',      date: '12 Nov 2025', auditor: 'K. Patel',         findings: 5, status: 'Closed',      scope: 'All sites'          },
  { id: 'AUD-2025-Q3', area: 'Section 4.13 — Records & audit trail', date: '14 Aug 2025', auditor: 'External · J. Roy', findings: 2, status: 'Closed',      scope: 'All sites'          },
  { id: 'AUD-2025-Q2', area: 'Section 5.1 — Staff & training',       date: '10 May 2025', auditor: 'K. Patel',         findings: 1, status: 'Closed',      scope: 'All sites'          },
];

const SEED_MGMT_INPUTS = [
  { name: 'Referral review',                   status: 'complete',     count: '1,284 referrals',          clause: '4.15.2.a' },
  { name: 'Patient & referrer feedback',        status: 'complete',     count: '412 responses',            clause: '4.15.2.b' },
  { name: 'Staff suggestions',                  status: 'complete',     count: '23 ideas logged',          clause: '4.15.2.c' },
  { name: 'Internal & external audits',         status: 'complete',     count: '4 audits, 11 findings',    clause: '4.15.2.d' },
  { name: 'Risk register review',               status: 'complete',     count: '8 risks reviewed',         clause: '4.15.2.e' },
  { name: 'Quality indicators',                 status: 'complete',     count: '12 KPIs reviewed',         clause: '4.15.2.f' },
  { name: 'External assessment results',        status: 'complete',     count: '1 surveillance visit',     clause: '4.15.2.g' },
  { name: 'EQA / proficiency testing',          status: 'complete',     count: '10 EQA events',            clause: '4.15.2.h' },
  { name: 'Complaints summary',                 status: 'complete',     count: '8 complaints reviewed',    clause: '4.15.2.i' },
  { name: 'Supplier performance',               status: 'in-progress',  count: '5 of 7 suppliers',         clause: '4.15.2.j' },
  { name: 'NC / CAPA status',                  status: 'complete',     count: '7 open, 31 closed',        clause: '4.15.2.k' },
  { name: 'Prior actions follow-up',            status: 'complete',     count: '9 of 9 closed',            clause: '4.15.2.l' },
  { name: 'Scope / staff / premises changes',   status: 'complete',     count: '2 changes noted',          clause: '4.15.2.m' },
  { name: 'Improvement recommendations',        status: 'in-progress',  count: 'draft in progress',        clause: '4.15.2.n' },
  { name: 'Resource adequacy assessment',       status: 'pending',      count: '—',                        clause: '4.15.2.o' },
];

const SEED_MGMT_OUTPUTS = [
  { id: 1, heading: 'Recruit additional paediatric scoring technologist', who: 'Dr. L. Hartono', due: 'by Q3 2026'   },
  { id: 2, heading: 'Replace HSAT-NOX-014 (failed verification)',         who: 'M. Chen',       due: 'by 30 May 2026' },
  { id: 3, heading: 'Establish quarterly inter-scorer κ review cadence',  who: 'K. Patel',      due: 'ongoing'        },
  { id: 4, heading: 'Commission external audit of Section 5.6',           who: 'K. Patel',      due: 'by Sep 2026'    },
];

const PAST_REVIEWS = [
  { id: 'MR-2025-Q2', date: '13 May 2025', chair: 'Dr. R. Okafor', outputs: 5, closed: 5 },
  { id: 'MR-2024-Q2', date: '9 May 2024',  chair: 'Dr. R. Okafor', outputs: 4, closed: 4 },
  { id: 'MR-2023-Q2', date: '11 May 2023', chair: 'Dr. R. Okafor', outputs: 6, closed: 6 },
];

const SEED_RISKS = [
  { id: 1, risk: 'Single Senior Tech availability',     domain: 'Workforce',   likelihood: 3, impact: 4, treatment: 'Cross-training plan; 2 of 3 techs now cross-trained.',             owner: 'K. Patel',       reviewDate: '2026-06-30' },
  { id: 2, risk: 'HSAT calibration drift in field',    domain: 'Equipment',   likelihood: 4, impact: 3, treatment: 'Quarterly verification; HSAT-NOX-014 removed from service.',         owner: 'M. Chen',        reviewDate: '2026-07-15' },
  { id: 3, risk: 'Paediatric scorer EQA gap',          domain: 'QA',          likelihood: 3, impact: 3, treatment: 'EQA event scheduled for Q3 2026.',                                   owner: 'Dr. L. Hartono', reviewDate: '2026-09-30' },
  { id: 4, risk: 'Vendor PSG software upgrade',        domain: 'IT',          likelihood: 2, impact: 4, treatment: 'Re-validation plan drafted; testing scheduled May 2026.',            owner: 'M. Chen',        reviewDate: '2026-05-31' },
  { id: 5, risk: 'After-hours emergency response',     domain: 'Clinical',    likelihood: 1, impact: 5, treatment: 'On-call roster operational; BLS certifications maintained.',         owner: 'Dr. R. Okafor',  reviewDate: '2026-12-31' },
  { id: 6, risk: 'Data breach — patient records',      domain: 'IT',          likelihood: 2, impact: 5, treatment: 'Encryption at rest/transit; access logs reviewed quarterly.',        owner: 'K. Patel',       reviewDate: '2026-06-30' },
  { id: 7, risk: 'Loss of NATA accreditation',         domain: 'Compliance',  likelihood: 1, impact: 5, treatment: 'Proactive gap monitoring; pre-assessment scheduled Aug 2026.',       owner: 'K. Patel',       reviewDate: '2026-08-31' },
  { id: 8, risk: 'Referral volume decline (>20%)',     domain: 'Business',    likelihood: 2, impact: 3, treatment: 'Referrer relationship programme; telehealth expansion.',              owner: 'Dr. R. Okafor',  reviewDate: '2026-09-30' },
];

const SEED_IMPROVEMENTS = [
  { id: 1,  text: 'Pre-study SMS reminders',         who: 'P. Tan',         col: 0, description: 'Automated 48 h and 2 h SMS reminders before home study appointments to reduce DNA rates.',    date: '2026-02-10' },
  { id: 2,  text: 'Voice-controlled event log',      who: 'A. Singh',       col: 0, description: 'Hands-free event timestamping during studies using voice commands — reduces tech distraction.', date: '2026-03-01' },
  { id: 3,  text: 'AI-assisted scoring QC',          who: 'M. Chen',        col: 0, description: 'ML model to flag potential scoring inconsistencies before peer review stage.',                  date: '2026-04-15' },
  { id: 4,  text: 'Shared paeds parent app',         who: 'K. Patel',       col: 0, description: 'Mobile app for parents of paediatric patients with prep instructions and appointment info.',    date: '2026-01-20' },
  { id: 5,  text: 'Triage chatbot (3-mo trial)',     who: 'Dr. R. Okafor',  col: 1, description: 'AI triage chatbot for referral classification. Trial ends 30 Jun 2026; review outcome then.',  date: '2026-03-15' },
  { id: 6,  text: 'New HSAT pre-screen protocol',    who: 'M. Chen',        col: 1, description: 'Revised pre-screening questionnaire to better identify suitable HSAT candidates vs PSG.',       date: '2026-04-01' },
  { id: 7,  text: 'Concordance dashboard',           who: 'K. Patel',       col: 1, description: 'Real-time inter-scorer κ dashboard visible to all technologists; updated nightly.',            date: '2026-02-20' },
  { id: 8,  text: 'FHIR direct reporting',           who: 'Dr. L. Hartono', col: 2, description: 'Direct result reporting via HL7 FHIR to referring hospital EMRs. Pilot with St Marks.',        date: '2025-11-01' },
  { id: 9,  text: 'BLS quarterly drills',            who: 'M. Chen',        col: 2, description: 'Unannounced quarterly BLS scenario drills for all clinical staff; started Jan 2026.',           date: '2026-01-10' },
  { id: 10, text: 'Provisional CPAP workflow',       who: 'Dr. R. Okafor',  col: 3, description: 'Fast-track provisional CPAP dispensing for eligible patients pending physician sign-off.',      date: '2025-10-01' },
];

const DOMAINS = ['Workforce', 'Equipment', 'QA', 'IT', 'Clinical', 'Compliance', 'Business'];
const AUDITORS = ['K. Patel', 'M. Chen', 'Dr. R. Okafor', 'External · J. Roy'];
const SCOPES   = ['All sites', 'Riverside Main', 'Eastside Paediatric Lab', 'Home Service – North'];
const COLS     = ['Ideas', 'Trial', 'Implementing', 'Outcome'];

const CURRENT_REVIEW = { id: 'MR-2026-Q2', date: '12 May 2026', chair: 'Dr. R. Okafor' };
const REVIEWS_KEY    = 'nexus_mgmt_reviews';
const MINUTES_KEY    = `nexus_mr_${CURRENT_REVIEW.id}_minutes`;

const MR_ATTENDEES = [
  { who: 'Dr. R. Okafor',  role: 'Medical Director · Chair'       },
  { who: 'Dr. L. Hartono', role: 'Paediatric Sleep Physician'      },
  { who: 'K. Patel',       role: 'Quality Manager'                 },
  { who: 'M. Chen',        role: 'Senior Technologist'             },
  { who: 'F. Olsson',      role: 'Service Manager'                 },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function heatStyle(score) {
  if (score >= 15) return { background: '#fee2e2', color: '#dc2626' };
  if (score >= 9)  return { background: '#ffedd5', color: '#ea580c' };
  if (score >= 5)  return { background: '#fef9c3', color: '#ca8a04' };
  return { background: '#dcfce7', color: '#16a34a' };
}

function riskKind(score) {
  if (score >= 15) return 'bad';
  if (score >= 9)  return 'warn';
  if (score >= 5)  return 'outline';
  return 'good';
}

function stKind(s) {
  return { complete: 'good', 'in-progress': 'warn', pending: 'outline' }[s] || 'outline';
}

function stIcon(s) {
  return s === 'complete' ? 'check' : s === 'in-progress' ? 'clock' : null;
}

function cycleStatus(s) {
  return { pending: 'in-progress', 'in-progress': 'complete', complete: 'pending' }[s] || 'pending';
}

// ─── component ────────────────────────────────────────────────────────────────

const AuditsPage = () => {
  const [tab, setTab] = useState('audits');
  const { openCreateTask } = useTaskContext();

  // Audits
  const [audits, setAudits] = useState(SEED_AUDITS);
  const [detailAuditId, setDetailAuditId] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [newAudit, setNewAudit] = useState({ area: '', auditor: 'K. Patel', date: '', scope: 'All sites' });

  // Management review
  const [mgmtInputs, setMgmtInputs]   = useState(SEED_MGMT_INPUTS);
  const [mgmtOutputs, setMgmtOutputs] = useState(SEED_MGMT_OUTPUTS);
  const [addOutputOpen, setAddOutputOpen] = useState(false);
  const [newOutput, setNewOutput] = useState({ heading: '', who: '', due: '' });
  const [pastOpen, setPastOpen] = useState(false);
  const [selectedPastReview, setSelectedPastReview] = useState(null);
  const [minutes, setMinutes] = useState(() => localStorage.getItem(MINUTES_KEY) ?? '');
  const [minutesDirty, setMinutesDirty] = useState(false);
  const [finalisedMsg, setFinalisedMsg] = useState('');
  const [attendees, setAttendees] = useState(MR_ATTENDEES);
  const [addAttendeeOpen, setAddAttendeeOpen] = useState(false);
  const [newAttendee, setNewAttendee] = useState({ who: '', role: '' });
  const [savedReviews, setSavedReviews] = useState(() => {
    try { const s = localStorage.getItem(REVIEWS_KEY); return s ? JSON.parse(s) : PAST_REVIEWS; }
    catch { return PAST_REVIEWS; }
  });

  // Risk
  const [risks, setRisks]       = useState(SEED_RISKS);
  const [addRiskOpen, setAddRiskOpen] = useState(false);
  const [newRisk, setNewRisk]   = useState({ risk: '', domain: 'Workforce', likelihood: 3, impact: 3, treatment: '', owner: 'K. Patel', reviewDate: '' });
  const [heatFilter, setHeatFilter] = useState(null);

  // Improvement
  const [improvements, setImprovements] = useState(SEED_IMPROVEMENTS);
  const [expandedId, setExpandedId]     = useState(null);
  const [addIdeaOpen, setAddIdeaOpen]   = useState(false);
  const [newIdea, setNewIdea]           = useState({ text: '', description: '', who: '' });

  const detailAudit = audits.find(a => a.id === detailAuditId);
  const sortedRisks = useMemo(
    () => [...risks].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)),
    [risks]
  );
  const filteredRisks = heatFilter
    ? sortedRisks.filter(r => r.likelihood === heatFilter.l && r.impact === heatFilter.i)
    : sortedRisks;

  // Audit actions
  function scheduleAudit() {
    if (!newAudit.area || !newAudit.date) return;
    const id = `AUD-SCHED-${audits.length + 1}`;
    setAudits(prev => [{ id, ...newAudit, findings: 0, status: 'Scheduled' }, ...prev]);
    setNewAudit({ area: '', auditor: 'K. Patel', date: '', scope: 'All sites' });
    setScheduleOpen(false);
  }

  // Auto-save minutes to localStorage
  useEffect(() => {
    setMinutesDirty(true);
    const t = setTimeout(() => {
      localStorage.setItem(MINUTES_KEY, minutes);
      setMinutesDirty(false);
    }, 700);
    return () => clearTimeout(t);
  }, [minutes]);

  // Mgmt actions
  function toggleInput(i) {
    setMgmtInputs(prev => prev.map((inp, idx) => idx === i ? { ...inp, status: cycleStatus(inp.status) } : inp));
  }
  function addOutput() {
    if (!newOutput.heading.trim()) return;
    setMgmtOutputs(prev => [...prev, { id: Date.now(), ...newOutput }]);
    setNewOutput({ heading: '', who: '', due: '' });
    setAddOutputOpen(false);
  }
  function addAttendee() {
    if (!newAttendee.who.trim()) return;
    setAttendees(prev => [...prev, { ...newAttendee }]);
    setNewAttendee({ who: '', role: '' });
    setAddAttendeeOpen(false);
  }
  function removeAttendee(i) {
    setAttendees(prev => prev.filter((_, idx) => idx !== i));
  }

  function finalizeReview() {
    const review = {
      ...CURRENT_REVIEW,
      attendees,
      inputs: mgmtInputs,
      outputs: mgmtOutputs,
      minutes,
      savedAt: new Date().toISOString(),
    };
    const updated = [review, ...savedReviews.filter(r => r.id !== CURRENT_REVIEW.id)];
    setSavedReviews(updated);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
    setFinalisedMsg('Review saved successfully.');
    setTimeout(() => setFinalisedMsg(''), 3000);
  }

  // Risk actions
  function addRisk() {
    if (!newRisk.risk.trim()) return;
    setRisks(prev => [...prev, { ...newRisk, id: Date.now() }]);
    setNewRisk({ risk: '', domain: 'Workforce', likelihood: 3, impact: 3, treatment: '', owner: 'K. Patel', reviewDate: '' });
    setAddRiskOpen(false);
  }
  function deleteRisk(id) {
    setRisks(prev => prev.filter(r => r.id !== id));
  }

  // Improvement actions
  function moveCard(id, dir) {
    setImprovements(prev => prev.map(imp => imp.id === id ? { ...imp, col: Math.max(0, Math.min(3, imp.col + dir)) } : imp));
  }
  function addIdea() {
    if (!newIdea.text.trim()) return;
    setImprovements(prev => [...prev, { id: Date.now(), ...newIdea, col: 0, date: new Date().toISOString().slice(0, 10) }]);
    setNewIdea({ text: '', description: '', who: '' });
    setAddIdeaOpen(false);
  }

  const readyCount = mgmtInputs.filter(i => i.status === 'complete').length;
  const inProgCount = mgmtInputs.filter(i => i.status === 'in-progress').length;
  const pendCount = mgmtInputs.filter(i => i.status === 'pending').length;

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · cl. 4.14, 4.15"
        title="Audits & management review"
        subtitle="Rolling 12-month internal audit cycle and the annual management review pack"
        actions={
          <>
            <button className="btn" onClick={() => { setTab('audits'); setScheduleOpen(v => !v); }}>
              <Icon name="calendar" size={14} />Schedule audit
            </button>
            <button className="btn btn-primary" onClick={() => setTab('mgmt')}>
              <Icon name="sparkle" size={14} />Q2 2026 review pack
            </button>
          </>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'audits',  label: 'Internal audits',      count: audits.length },
        { id: 'mgmt',    label: 'Management review',    count: 4 },
        { id: 'risk',    label: 'Risk register',        count: risks.length },
        { id: 'improve', label: 'Continual improvement', count: improvements.length },
      ]} />

      {/* ── AUDITS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'audits' && (
        <>
          {/* Schedule form */}
          {scheduleOpen && (
            <div className="card" style={{ border: '1px solid var(--accent)', marginBottom: 18 }}>
              <div className="card-head">
                <div className="card-title">Schedule new audit</div>
                <div className="topbar-spacer" />
                <button className="btn-icon" onClick={() => setScheduleOpen(false)}><Icon name="x" size={14} /></button>
              </div>
              <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Area / section</label>
                    <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. Section 5.6 — Subcontracting" value={newAudit.area} onChange={e => setNewAudit(p => ({ ...p, area: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Auditor</label>
                    <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newAudit.auditor} onChange={e => setNewAudit(p => ({ ...p, auditor: e.target.value }))}>
                      {AUDITORS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Planned date</label>
                    <input className="input" type="date" style={{ width: '100%', boxSizing: 'border-box' }} value={newAudit.date} onChange={e => setNewAudit(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Scope</label>
                    <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newAudit.scope} onChange={e => setNewAudit(p => ({ ...p, scope: e.target.value }))}>
                      {SCOPES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => setScheduleOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={scheduleAudit}>Schedule audit</button>
                </div>
              </div>
            </div>
          )}

          <div className="grid-2-1" style={{ marginBottom: 18 }}>
            {/* 12-month cycle */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">12-month audit cycle</div>
                  <div className="card-sub">Coverage across pre-study · study · post-study processes</div>
                </div>
                <div className="topbar-spacer" />
                <Pill kind="good">8 of 12 areas audited</Pill>
              </div>
              <div className="card-pad">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
                  {['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'].map((m, i) => {
                    const states  = [1,0,2,1,0,2,1,1,0,1,2,0];
                    const colors  = ['var(--accent-soft)','var(--good)','var(--warn)'];
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>{m}</div>
                        <div style={{ aspectRatio: 1, background: colors[states[i]], borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 11, color: states[i] === 0 ? 'var(--ink-3)' : 'var(--ink)', fontWeight: 500 }}>
                          {states[i] === 1 ? '✓' : states[i] === 2 ? '!' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                  {[['var(--good)', 'Audited & closed'], ['var(--warn)', 'Findings open'], ['var(--accent-soft)', 'Scheduled']].map(([c, l]) => (
                    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 10, height: 10, background: c, borderRadius: 3, flexShrink: 0 }} />{l}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Auditor independence */}
            <div className="card">
              <div className="card-head"><div className="card-title">Auditor independence · cl. 4.14.3</div></div>
              <div className="card-pad">
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>Auditors may not audit their own area of work.</div>
                {[
                  { who: 'K. Patel',         role: 'QM · audits non-QMS sections',          ok: true },
                  { who: 'M. Chen',           role: 'Sr Tech · audits non-equipment areas',  ok: true },
                  { who: 'Dr. F. Liu',        role: 'Physician · audits documentation',      ok: true },
                  { who: 'External · J. Roy', role: 'Independent — unrestricted scope',       ok: true },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i === 3 ? 'none' : '1px solid var(--border)' }}>
                    <Avatar name={a.who} size={22} idx={i + 1} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{a.who}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.role}</div>
                    </div>
                    <Pill kind="good"><Icon name="check" size={10} /></Pill>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit table */}
          <div className="card">
            <table className="tbl">
              <thead>
                <tr><th>Audit ID</th><th>Area</th><th>Auditor</th><th>Date</th><th>Scope</th><th>Findings</th><th>Status</th></tr>
              </thead>
              <tbody>
                {audits.map(a => (
                  <tr key={a.id} className="row-clickable" onClick={() => setDetailAuditId(a.id)}>
                    <td className="mono" style={{ fontWeight: 500 }}>{a.id}</td>
                    <td>{a.area}</td>
                    <td>{a.auditor}</td>
                    <td className="muted">{a.date}</td>
                    <td className="muted">{a.scope}</td>
                    <td>{a.findings > 0 ? <Pill kind="warn">{a.findings} finding{a.findings !== 1 ? 's' : ''}</Pill> : <Pill kind="good">0 findings</Pill>}</td>
                    <td><Pill kind={a.status === 'Closed' ? 'good' : a.status === 'Scheduled' ? 'outline' : 'info'}>{a.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── MANAGEMENT REVIEW TAB ───────────────────────────────────────────── */}
      {tab === 'mgmt' && (
        <>
          <div className="banner info" style={{ marginBottom: 18 }}>
            <Icon name="sparkle" size={18} />
            <div style={{ flex: 1 }}>
              <strong>Q2 2026 management review · {CURRENT_REVIEW.date}.</strong>
              <div style={{ fontSize: 12, marginTop: 2 }}>{readyCount} of {mgmtInputs.length} inputs ready. Click any item to update its status.</div>
            </div>
            {finalisedMsg && <span style={{ fontSize: 12, color: 'var(--good)', fontWeight: 600 }}>{finalisedMsg}</span>}
            <button className="btn btn-primary" onClick={finalizeReview}><Icon name="download" size={14} />Finalise &amp; save</button>
            <button className="btn" onClick={() => { setPastOpen(v => !v); setSelectedPastReview(null); }}><Icon name="clock" size={14} />Past reviews</button>
          </div>

          {/* Past reviews */}
          {pastOpen && (
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="card-head">
                <div className="card-title">Saved management reviews</div>
                <div className="topbar-spacer" />
                <button className="btn-icon" onClick={() => { setPastOpen(false); setSelectedPastReview(null); }}><Icon name="x" size={14} /></button>
              </div>
              <table className="tbl">
                <thead><tr><th>Review ID</th><th>Date</th><th>Chair</th><th>Inputs</th><th>Outputs</th><th>Minutes</th><th>Status</th></tr></thead>
                <tbody>
                  {savedReviews.map(r => (
                    <tr key={r.id} className="row-clickable"
                      style={{ background: selectedPastReview?.id === r.id ? 'var(--surface-2)' : undefined }}
                      onClick={() => setSelectedPastReview(s => s?.id === r.id ? null : r)}>
                      <td className="mono" style={{ fontWeight: 500 }}>{r.id}</td>
                      <td>{r.date}</td>
                      <td>{r.chair}</td>
                      <td>{r.inputs ? `${r.inputs.filter(i => i.status === 'complete').length}/${r.inputs.length} ready` : (r.outputs != null ? '—' : '—')}</td>
                      <td>{r.outputs ? (Array.isArray(r.outputs) ? r.outputs.length : r.outputs) : '—'} {Array.isArray(r.outputs) ? 'decisions' : 'decisions'}</td>
                      <td>{r.minutes ? <Pill kind="good"><Icon name="check" size={10} /> Saved</Pill> : <Pill kind="outline">None</Pill>}</td>
                      <td><Pill kind="good">Complete</Pill></td>
                    </tr>
                  ))}
                  {savedReviews.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 12, padding: '14px 0' }}>No saved reviews yet.</td></tr>
                  )}
                </tbody>
              </table>

              {/* Selected review detail */}
              {selectedPastReview && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '18px 20px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{selectedPastReview.id} · {selectedPastReview.date}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Inputs */}
                    {selectedPastReview.inputs && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>Input checklist</div>
                        {selectedPastReview.inputs.map((inp, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            <div style={{ width: 16, height: 16, borderRadius: 8, flexShrink: 0, background: inp.status === 'complete' ? 'var(--good)' : inp.status === 'in-progress' ? 'var(--warn)' : 'var(--surface-3)', display: 'grid', placeItems: 'center' }}>
                              {inp.status === 'complete' && <Icon name="check" size={9} style={{ color: 'white' }} />}
                            </div>
                            <span style={{ flex: 1, color: 'var(--ink-2)' }}>{inp.name}</span>
                            <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>{inp.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Outputs */}
                    {selectedPastReview.outputs && Array.isArray(selectedPastReview.outputs) && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>Decisions &amp; actions</div>
                        {selectedPastReview.outputs.map((o, i) => (
                          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            <div style={{ fontWeight: 500 }}>{o.heading}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{o.who} · {o.due}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Minutes */}
                  {selectedPastReview.minutes && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>Meeting minutes</div>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 240, overflowY: 'auto' }}>
                        {selectedPastReview.minutes}
                      </div>
                    </div>
                  )}
                  {!selectedPastReview.minutes && !selectedPastReview.inputs && (
                    <div style={{ color: 'var(--ink-3)', fontSize: 12, fontStyle: 'italic', marginTop: 8 }}>This review was saved before detailed capture was available.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inputs checklist */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-head">
              <div className="card-title">cl. 4.15.2 input checklist</div>
              <div className="topbar-spacer" />
              <Pill kind="good">{readyCount} ready</Pill>
              {inProgCount > 0 && <Pill kind="warn">{inProgCount} in progress</Pill>}
              {pendCount > 0 && <Pill kind="outline">{pendCount} pending</Pill>}
            </div>
            <div>
              {mgmtInputs.map((m, i) => (
                <div
                  key={i}
                  onClick={() => toggleInput(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px', borderBottom: i === mgmtInputs.length - 1 ? 'none' : '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                    background: m.status === 'complete' ? 'var(--good)' : m.status === 'in-progress' ? 'var(--warn)' : 'var(--surface-3)',
                    color: 'white', display: 'grid', placeItems: 'center',
                  }}>
                    {stIcon(m.status) && <Icon name={stIcon(m.status)} size={12} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{m.clause}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.count}</span>
                  <Pill kind={stKind(m.status)}>{m.status}</Pill>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-2">
            {/* Outputs */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Outputs — decisions & actions</div>
                <div className="topbar-spacer" />
                <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAddOutputOpen(v => !v)}>
                  <Icon name="plus" size={11} />Add output
                </button>
              </div>
              <div className="card-pad">
                {addOutputOpen && (
                  <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Decision / action</label>
                      <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. Implement quarterly BLS drills" value={newOutput.heading} onChange={e => setNewOutput(p => ({ ...p, heading: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Owner</label>
                        <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newOutput.who} onChange={e => setNewOutput(p => ({ ...p, who: e.target.value }))}>
                          <option value="">Select…</option>
                          {['K. Patel', 'M. Chen', 'Dr. R. Okafor', 'Dr. L. Hartono'].map(n => <option key={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Due</label>
                        <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. by Q3 2026" value={newOutput.due} onChange={e => setNewOutput(p => ({ ...p, due: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn" onClick={() => setAddOutputOpen(false)}>Cancel</button>
                      <button className="btn btn-primary" onClick={addOutput}>Add</button>
                    </div>
                  </div>
                )}
                <div className="timeline">
                  {mgmtOutputs.map((o, i) => (
                    <div key={o.id} className="timeline-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{o.heading}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{o.who} · {o.due}</div>
                      </div>
                      <button className="btn" style={{ fontSize: 11, padding: '2px 7px', flexShrink: 0 }} onClick={() => openCreateTask({
                        title: o.heading,
                        assignedTo: o.who,
                        source: 'MR-2026-Q2',
                        sourceType: 'audit',
                        priority: 'medium',
                      })}>
                        <Icon name="plus" size={10} />Task
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Attendees</div>
                <div className="topbar-spacer" />
                <Pill kind="outline">{attendees.length}</Pill>
                <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAddAttendeeOpen(v => !v)}>
                  <Icon name="plus" size={11} />Add
                </button>
              </div>

              {addAttendeeOpen && (
                <div style={{ margin: '0 16px 12px', background: 'var(--surface-2)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--accent)' }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Name</label>
                    <input
                      className="input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="e.g. Dr. A. Smith"
                      value={newAttendee.who}
                      onChange={e => setNewAttendee(p => ({ ...p, who: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addAttendee()}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Role / title</label>
                    <input
                      className="input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="e.g. Sleep Physician"
                      value={newAttendee.role}
                      onChange={e => setNewAttendee(p => ({ ...p, role: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addAttendee()}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={() => setAddAttendeeOpen(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={addAttendee}>Add attendee</button>
                  </div>
                </div>
              )}

              <div className="card-pad" style={{ paddingTop: addAttendeeOpen ? 0 : undefined }}>
                {attendees.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: '12px 0' }}>No attendees recorded.</div>
                )}
                {attendees.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i === attendees.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <Avatar name={a.who} size={26} idx={i} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.who}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.role}</div>
                    </div>
                    <button
                      className="btn-icon"
                      style={{ opacity: 0.35 }}
                      title="Remove attendee"
                      onClick={() => removeAttendee(i)}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Minutes */}
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-head">
              <div>
                <div className="card-title">Meeting minutes · {CURRENT_REVIEW.id}</div>
                <div className="card-sub">Free-text record of discussions, decisions and actions — auto-saved to your browser</div>
              </div>
              <div className="topbar-spacer" />
              <span style={{ fontSize: 11, color: minutesDirty ? 'var(--warn)' : 'var(--ink-4)' }}>
                {minutesDirty ? 'Saving…' : minutes ? 'Draft saved' : ''}
              </span>
            </div>
            <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {['1. Apologies and quorum', '2. Previous minutes', '3. Input review', '4. Quality indicators', '5. Decisions and actions', '6. Close'].map(h => (
                  <button key={h} className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => setMinutes(m => m + (m && !m.endsWith('\n') ? '\n\n' : '') + h + '\n')}>
                    + {h}
                  </button>
                ))}
              </div>
              <textarea
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                placeholder="Record the meeting discussion here. Use the section headings above to structure the minutes, or write freely…"
                style={{
                  width: '100%', boxSizing: 'border-box', minHeight: 240,
                  border: '1px solid var(--border)', borderRadius: 8,
                  padding: '12px 14px', fontSize: 13, lineHeight: 1.65,
                  fontFamily: 'inherit', color: 'var(--ink)',
                  background: 'var(--surface)', resize: 'vertical', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                  {minutes.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <div style={{ flex: 1 }} />
                <button className="btn" onClick={() => setMinutes('')} disabled={!minutes}>Clear</button>
                <button className="btn btn-primary" onClick={finalizeReview}>
                  <Icon name="download" size={14} />Finalise &amp; save review
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── RISK REGISTER TAB ───────────────────────────────────────────────── */}
      {tab === 'risk' && (
        <>
          <div className="grid-2-1" style={{ marginBottom: 18 }}>
            {/* Risk table */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Risk register</div>
                {heatFilter && (
                  <Pill kind="info" style={{ cursor: 'pointer' }}>
                    L={heatFilter.l} I={heatFilter.i}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px', lineHeight: 1 }} onClick={() => setHeatFilter(null)}>×</button>
                  </Pill>
                )}
                <div className="topbar-spacer" />
                <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAddRiskOpen(v => !v)}>
                  <Icon name="plus" size={11} />Add risk
                </button>
              </div>

              {addRiskOpen && (
                <div style={{ margin: '0 18px 14px', background: 'var(--surface-2)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Risk description</label>
                      <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Describe the risk…" value={newRisk.risk} onChange={e => setNewRisk(p => ({ ...p, risk: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Domain</label>
                      <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newRisk.domain} onChange={e => setNewRisk(p => ({ ...p, domain: e.target.value }))}>
                        {DOMAINS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Owner</label>
                      <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newRisk.owner} onChange={e => setNewRisk(p => ({ ...p, owner: e.target.value }))}>
                        {['K. Patel', 'M. Chen', 'Dr. R. Okafor', 'Dr. L. Hartono'].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Likelihood (1–5): {newRisk.likelihood}</label>
                      <input type="range" min={1} max={5} value={newRisk.likelihood} onChange={e => setNewRisk(p => ({ ...p, likelihood: +e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Impact (1–5): {newRisk.impact}</label>
                      <input type="range" min={1} max={5} value={newRisk.impact} onChange={e => setNewRisk(p => ({ ...p, impact: +e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Treatment plan</label>
                      <textarea className="input" rows={2} style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Control measures in place…" value={newRisk.treatment} onChange={e => setNewRisk(p => ({ ...p, treatment: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={() => setAddRiskOpen(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={addRisk}>Add risk</button>
                  </div>
                </div>
              )}

              <table className="tbl">
                <thead>
                  <tr><th>Risk</th><th>Domain</th><th>L</th><th>I</th><th>Score</th><th>Owner</th><th>Review</th><th></th></tr>
                </thead>
                <tbody>
                  {filteredRisks.map(r => {
                    const score = r.likelihood * r.impact;
                    return (
                      <tr key={r.id}>
                        <td style={{ fontSize: 12 }}>{r.risk}</td>
                        <td className="muted">{r.domain}</td>
                        <td>{r.likelihood}</td>
                        <td>{r.impact}</td>
                        <td><Pill kind={riskKind(score)}>{score}</Pill></td>
                        <td className="muted">{r.owner}</td>
                        <td className="muted">{r.reviewDate}</td>
                        <td>
                          <button className="btn-icon" style={{ opacity: 0.4 }} title="Remove" onClick={() => deleteRisk(r.id)}>
                            <Icon name="x" size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRisks.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 12, padding: '14px 0' }}>No risks match filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Heat map */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Risk matrix</div>
                {heatFilter && <button className="btn" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => setHeatFilter(null)}>Clear filter</button>}
              </div>
              <div className="card-pad">
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>Click a cell to filter the table. Rows = Likelihood, Cols = Impact.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '20px repeat(5, 1fr)', gap: 3 }}>
                  {/* Column headers */}
                  <div />
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--ink-3)', paddingBottom: 3 }}>I={i}</div>
                  ))}
                  {/* Rows */}
                  {[5,4,3,2,1].map(l => (
                    <React.Fragment key={l}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--ink-3)' }}>L={l}</div>
                      {[1,2,3,4,5].map(impact => {
                        const score = l * impact;
                        const count = risks.filter(r => r.likelihood === l && r.impact === impact).length;
                        const active = heatFilter?.l === l && heatFilter?.i === impact;
                        const s = heatStyle(score);
                        return (
                          <div
                            key={impact}
                            onClick={() => setHeatFilter(count > 0 ? (active ? null : { l, i: impact }) : null)}
                            style={{
                              ...s,
                              borderRadius: 4,
                              display: 'grid',
                              placeItems: 'center',
                              minHeight: 36,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: count > 0 ? 'pointer' : 'default',
                              border: active ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.06)',
                              transition: 'opacity 0.12s',
                              opacity: heatFilter && !active ? 0.5 : 1,
                            }}
                            title={`L${l} × I${impact} = ${score}${count > 0 ? ` · ${count} risk${count !== 1 ? 's' : ''}` : ''}`}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  {[['#fee2e2', '#dc2626', '≥15 Critical'], ['#ffedd5', '#ea580c', '9–14 High'], ['#fef9c3', '#ca8a04', '5–8 Medium'], ['#dcfce7', '#16a34a', '1–4 Low']].map(([bg, c, l]) => (
                    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3)' }}>
                      <span style={{ width: 12, height: 12, background: bg, border: `1px solid ${c}`, borderRadius: 3, flexShrink: 0 }} />{l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── CONTINUAL IMPROVEMENT TAB ───────────────────────────────────────── */}
      {tab === 'improve' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {COLS.map((col, colIdx) => {
              const cards = improvements.filter(imp => imp.col === colIdx);
              return (
                <div key={col} className="card" style={{ background: 'var(--surface-2)' }}>
                  <div className="card-head" style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{col}</div>
                    <div className="topbar-spacer" />
                    <Pill kind="outline">{cards.length}</Pill>
                    {colIdx === 0 && (
                      <button className="btn" style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => setAddIdeaOpen(v => !v)}>
                        <Icon name="plus" size={11} />
                      </button>
                    )}
                  </div>

                  <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Add idea form in first column */}
                    {colIdx === 0 && addIdeaOpen && (
                      <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 12, border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input className="input" style={{ width: '100%', boxSizing: 'border-box', fontSize: 12 }} placeholder="Idea title…" value={newIdea.text} onChange={e => setNewIdea(p => ({ ...p, text: e.target.value }))} />
                        <textarea className="input" rows={2} style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', fontSize: 12 }} placeholder="Brief description…" value={newIdea.description} onChange={e => setNewIdea(p => ({ ...p, description: e.target.value }))} />
                        <input className="input" style={{ width: '100%', boxSizing: 'border-box', fontSize: 12 }} placeholder="Suggested by…" value={newIdea.who} onChange={e => setNewIdea(p => ({ ...p, who: e.target.value }))} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn" style={{ flex: 1, fontSize: 11 }} onClick={() => setAddIdeaOpen(false)}>Cancel</button>
                          <button className="btn btn-primary" style={{ flex: 1, fontSize: 11 }} onClick={addIdea}>Add</button>
                        </div>
                      </div>
                    )}

                    {cards.map(imp => (
                      <div
                        key={imp.id}
                        style={{ padding: 10, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => setExpandedId(id => id === imp.id ? null : imp.id)}
                      >
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{imp.text}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                          {imp.who} · {imp.date}
                        </div>

                        {expandedId === imp.id && imp.description && (
                          <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', lineHeight: 1.55 }}>
                            {imp.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                          <button
                            className="btn"
                            style={{ fontSize: 10, padding: '2px 6px' }}
                            disabled={imp.col === 0}
                            onClick={e => { e.stopPropagation(); moveCard(imp.id, -1); }}
                            title="Move left"
                          >
                            <Icon name="chev_left" size={10} />
                          </button>
                          <div style={{ flex: 1 }} />
                          <button
                            className="btn"
                            style={{ fontSize: 10, padding: '2px 6px' }}
                            disabled={imp.col === 3}
                            onClick={e => { e.stopPropagation(); moveCard(imp.id, 1); }}
                            title="Move right"
                          >
                            <Icon name="chev_right" size={10} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {cards.length === 0 && !addIdeaOpen && (
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', padding: '12px 0' }}>No items</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Audit detail drawer */}
      <Drawer open={!!detailAuditId} onClose={() => setDetailAuditId(null)}>
        {detailAudit && (
          <AuditDetailDrawer
            audit={detailAudit}
            onClose={() => setDetailAuditId(null)}
            onUpdate={updated => setAudits(prev => prev.map(a => a.id === updated.id ? updated : a))}
          />
        )}
      </Drawer>
    </div>
  );
};

export default AuditsPage;
