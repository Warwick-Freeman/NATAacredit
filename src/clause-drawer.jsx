import React, { useState, useEffect } from 'react';
import Icon from './icons';
import { Avatar, StatusPill, Pill } from './components';
import { useTaskContext } from './TaskContext';
import { useNexusData } from './NexusDataContext';
import { getStdCfg } from './standardConfig';

// Full requirement text for all seeded clauses
const REQUIREMENT = {
  "4.1.1": "The service shall define and document the scope of accreditation including all test types, patient populations, and sites covered. The scope shall be reviewed at each management review and updated when services change.",
  "4.1.5": "The service shall have a policy and documented procedures for identifying and managing conflicts of interest. All staff shall make written declarations of any actual, potential or perceived conflicts annually or when a conflict arises.",
  "4.1.6": "The service shall have documented procedures to protect the confidentiality of patient information in accordance with applicable legislation. Access to patient records shall be restricted to authorised personnel.",
  "4.2.1": "Top management shall establish, document and communicate a quality policy appropriate to the service's scope. The policy shall include a commitment to meeting requirements and continually improving the quality management system.",
  "4.3.1": "The service shall control documents required by the quality management system. A documented procedure shall define controls for approving, reviewing, updating, and identifying current revision status of documents.",
  "4.5.2": "The service shall maintain a register of all subcontractors used, including written evidence that each subcontractor meets the requirements of this Standard. The register shall be reviewed annually.",
  "4.8.1": "The service shall have a documented procedure for receiving, evaluating, and resolving complaints from patients, referrers, and other parties. All complaints shall be recorded, investigated, and responded to in writing.",
  "4.13.1": "The service shall establish and maintain documented procedures for identification, collection, indexing, access, storage, maintenance, and disposition of quality and technical records. Records shall be retained for a minimum of 7 years.",
  "4.14.3": "Internal audits shall be conducted by personnel who are independent of the activity being audited. Auditors shall not audit their own work. Evidence of auditor independence shall be maintained.",
  "4.15.2": "Management review shall consider, at minimum: review of referrals, feedback, suggestions, audits, risk management, quality indicators, external assessments, EQA results, complaints, supplier performance, NCs, CAPA status, follow-up of prior actions, scope/staff/premises changes, and improvement recommendations.",
  "5.1.4": "All staff providing patient care shall be trained and competent in basic life support, with annual recertification. Paediatric BLS is required for all staff working in paediatric or mixed adult/paediatric laboratories.",
  "5.3.2": "Before first use in patient care, all equipment shall be subject to acceptance testing to verify that it meets the manufacturer's specifications and the service's performance requirements. Acceptance test records shall be retained.",
  "5.3.4": "Each item of equipment shall be subject to a documented verification programme to ensure it consistently meets the performance and accuracy required. Verification shall include physical and biological signal checks at defined intervals; safeguards against tampering; and date, result and trend monitoring.",
  "5.3.5": "Equipment shall be cleaned and decontaminated after each patient use in accordance with manufacturer instructions and infection control requirements. Records of decontamination shall be maintained.",
  "5.3.6": "Adverse incidents involving equipment shall be reported to the manufacturer and to the appropriate regulatory authority (TGA in Australia) where applicable. A register of all adverse incidents and near-misses shall be maintained.",
  "5.5.2": "Prior to each study, a documented verification of all bio-signals shall be performed to confirm adequate signal quality. The verification shall be documented and retained as part of the study record.",
  "5.5.3": "PSG recordings shall be performed in accordance with documented protocols that comply with the current edition of the AASM Manual for the Scoring of Sleep and Associated Events. Deviations from protocol shall be documented.",
  "5.6.6": "The service shall have a documented programme for assessing inter-observer concordance between scorers. Concordance shall be monitored at defined intervals and corrective action taken when concordance falls below acceptable levels.",
  "5.6.8": "The service shall participate in an approved external quality assurance (EQA) programme relevant to the tests performed. EQA results shall be reviewed and corrective action taken where performance is unsatisfactory.",
  "5.8.1": "All correspondence (including PSG reports) shall be completed and dispatched within 10 business days of patient contact. The service shall monitor compliance with this requirement and report it as a quality indicator.",
};

const CROSS_REFS = {
  "5.3.4": ["5.3.2", "5.3.6"],
  "5.3.5": ["5.3.4", "5.3.6"],
  "5.3.6": ["5.3.4", "5.3.5"],
  "5.1.4": ["5.1.2"],
  "4.5.2": ["4.6"],
  "5.6.8": ["5.6.6"],
  "5.5.2": ["5.5.3"],
};

const EV_TYPES = ['SOP', 'Certificate', 'Audit', 'Record', 'Report', 'Register', 'Policy', 'Manual', 'Minutes', 'Form', 'Reference'];

const STATUS_OPTIONS = [
  { value: 'compliant', label: 'Compliant',       kind: 'good' },
  { value: 'partial',   label: 'Partial',          kind: 'warn' },
  { value: 'nc',        label: 'Non-conformant',   kind: 'bad'  },
];
const STATUS_PRIO = { nc: 'high', partial: 'medium', compliant: 'low' };

const TYPE_ICON = { SOP: 'file', Certificate: 'shield', Audit: 'audit', Record: 'clipboard', Report: 'pulse', Register: 'clipboard', Policy: 'shield', Manual: 'book', Minutes: 'paper', Form: 'paper', Reference: 'book', Schedule: 'calendar', Template: 'paper' };

const EvidenceItem = ({ item, onOpen }) => (
  <div
    onClick={() => onOpen(item)}
    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: item.missing ? 'var(--bad-soft)' : item.overdue ? 'var(--warn-soft, var(--surface-2))' : 'var(--surface)' }}
  >
    <div style={{ width: 28, height: 28, borderRadius: 6, background: item.missing ? 'var(--bad-soft)' : 'var(--accent-soft)', color: item.missing ? 'var(--bad)' : 'var(--accent-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon name={TYPE_ICON[item.type] || 'paper'} size={14} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 8 }}>
        <span>{item.type}</span>
        <span className="mono" style={{ color: 'var(--accent-ink)' }}>{item.ref}</span>
        <span>·</span>
        <span style={{ color: item.missing ? 'var(--bad)' : item.date === '—' ? 'var(--ink-4)' : 'var(--ink-3)' }}>
          {item.missing ? 'Not on file' : item.date}
        </span>
      </div>
    </div>
    <Icon name="arrow_up_right" size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
  </div>
);

const ClauseDrawer = ({ data, clauseId, onClose, onUpdate }) => {
  const { openCreateTask } = useTaskContext();
  const { activeStandard } = useNexusData();
  const stdCfg = getStdCfg(activeStandard);

  if (!clauseId || !data) return null;
  const clause = data.clauses.find(c => c.id === clauseId) || {
    id: clauseId, title: 'Clause detail', section: clauseId.split('.').slice(0, 2).join('.'),
    status: 'compliant', evidence: 0, linkedEvidence: [], lastReviewed: '—', owner: '—', notes: '',
  };

  const requirementText = REQUIREMENT[clause.id] || stdCfg.defaultReqText;

  // Panel mode: null | 'standard' | 'doc' (document viewer)
  const [panel,      setPanel]    = useState(null);
  const [activeDoc,  setActiveDoc] = useState(null);

  // Evidence form
  const [addEvOpen,  setAddEvOpen] = useState(false);
  const [newEv, setNewEv] = useState({ name: '', type: 'SOP', ref: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const setNev = (k, v) => setNewEv(n => ({ ...n, [k]: v }));

  // Status / notes editing
  const [editStatus, setEditStatus] = useState(clause.status);
  const [editNotes,  setEditNotes]  = useState(clause.notes || '');
  const [dirty,      setDirty]      = useState(false);

  useEffect(() => {
    setEditStatus(clause.status);
    setEditNotes(clause.notes || '');
    setDirty(false);
    setPanel(null);
    setAddEvOpen(false);
    setActiveDoc(null);
  }, [clause.id]);

  const handleStatusChange = (s) => { setEditStatus(s); setDirty(true); };
  const handleNotesChange  = (v) => { setEditNotes(v);  setDirty(true); };

  const handleSaveAssessment = () => {
    if (onUpdate) onUpdate({ ...clause, status: editStatus, notes: editNotes, lastReviewed: new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) });
    setDirty(false);
  };

  const handleAddEvidence = () => {
    if (!newEv.name.trim() || !newEv.ref.trim()) return;
    const item = {
      id: `ev-${Date.now()}`,
      name: newEv.name.trim(),
      type: newEv.type,
      ref:  newEv.ref.trim(),
      date: newEv.date ? new Date(newEv.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      notes: newEv.notes.trim(),
    };
    const updated = {
      ...clause,
      linkedEvidence: [...(clause.linkedEvidence || []), item],
      evidence: (clause.linkedEvidence || []).length + 1,
    };
    if (onUpdate) onUpdate(updated);
    setNewEv({ name: '', type: 'SOP', ref: '', date: new Date().toISOString().slice(0, 10), notes: '' });
    setAddEvOpen(false);
  };

  const openDoc = (item) => { setActiveDoc(item); setPanel('doc'); };

  const linkedEvidence = clause.linkedEvidence || [];
  const crossRefs = CROSS_REFS[clause.id] || [];

  // ── Standard reference panel ──────────────────────────────────────────────
  if (panel === 'standard') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="drawer-head">
          <button className="icon-btn" onClick={() => setPanel(null)} title="Back"><Icon name="chev_left" size={14} /></button>
          <div style={{ flex: 1, marginLeft: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{stdCfg.standardName} · {stdCfg.standardVersion}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>cl. {clause.id} — {clause.title}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="drawer-body">
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, padding: 12, background: 'var(--surface-2)', borderRadius: 8, alignItems: 'flex-start' }}>
            <Icon name="book" size={16} style={{ color: 'var(--accent-ink)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              {stdCfg.drawerAttrib}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Section {clause.section}</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{clause.id}</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: 'var(--ink-2)' }}>{clause.title}</div>

          <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, lineHeight: 1.8, color: 'var(--ink)', marginBottom: 20, borderLeft: '3px solid var(--accent)' }}>
            {requirementText}
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Notes for implementation</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: 20 }}>
            {clause.id === '5.3.4' && 'Verification intervals shall be defined in your equipment management plan and be consistent with manufacturer recommendations, risk assessment, and frequency of use. For HSAT devices used multiple times per week, quarterly biological verification is recommended. All verification records must be signed by a qualified technologist and retained for the life of the device plus 7 years.'}
            {clause.id === '5.1.4' && 'Annual recertification must be with a NATA-approved provider. For paediatric services, evidence of paediatric-specific BLS training is required for all staff who work in paediatric labs, including reception staff who may be present during studies. Online-only BLS is not accepted.'}
            {clause.id === '4.5.2' && 'The register must include: subcontractor name, ABN, scope of services, evidence of accreditation or competency (current), and date of last review. Written agreements must cover confidentiality, quality requirements, and reporting obligations. Review annually or when a new subcontractor is engaged.'}
            {clause.id === '5.8.1' && 'The 10 business-day window runs from patient contact (study night) to dispatch of the final report to the referring clinician. Preliminary reports do not satisfy this requirement. The service must track SLA compliance as a quality indicator and report it at management review.'}
            {!['5.3.4','5.1.4','4.5.2','5.8.1'].includes(clause.id) && stdCfg.implNote}
          </div>

          {crossRefs.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Cross-references</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {crossRefs.map(ref => (
                  <span key={ref} className="mono" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--accent-soft)', color: 'var(--accent-ink)', borderRadius: 4, cursor: 'default' }}>cl. {ref}</span>
                ))}
              </div>
            </>
          )}

          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 8, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
            {stdCfg.publisher}
          </div>
        </div>
      </div>
    );
  }

  // ── Document viewer panel ─────────────────────────────────────────────────
  if (panel === 'doc' && activeDoc) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="drawer-head">
          <button className="icon-btn" onClick={() => setPanel(null)} title="Back"><Icon name="chev_left" size={14} /></button>
          <div style={{ flex: 1, marginLeft: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{activeDoc.type} · {activeDoc.ref}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{activeDoc.name}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="drawer-body">
          {/* Document metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              ['Reference', activeDoc.ref],
              ['Type', activeDoc.type],
              ['Date', activeDoc.missing ? '—' : activeDoc.date],
              ['Clause', `cl. ${clauseId}`],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }} className={label === 'Reference' ? 'mono' : ''}>{val}</div>
              </div>
            ))}
          </div>
          {activeDoc.notes && (
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.6 }}>
              {activeDoc.notes}
            </div>
          )}

          {/* Document preview area */}
          {activeDoc.missing ? (
            <div style={{ padding: 24, background: 'var(--bad-soft)', borderRadius: 8, textAlign: 'center', color: 'var(--bad)', marginBottom: 20 }}>
              <Icon name="alert" size={28} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Document not on file</div>
              <div style={{ fontSize: 12 }}>This evidence item is required but has not yet been uploaded. This contributes to the non-conformant status of cl. {clauseId}.</div>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              {/* Mock document header */}
              <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center' }}>
                  <Icon name={TYPE_ICON[activeDoc.type] || 'paper'} size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{activeDoc.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{activeDoc.ref} · {activeDoc.type} · {activeDoc.date}</div>
                </div>
              </div>
              {/* Mock page content */}
              <div style={{ padding: 20, minHeight: 260, background: 'white', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 9, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 3 }}>CONTROLLED DOCUMENT</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 14 }}>Riverside Sleep & Respiratory Centre · {activeDoc.ref}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{activeDoc.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 20 }}>Date: {activeDoc.date} · Clause reference: cl. {clauseId}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[85, 70, 90, 55, 80, 65, 75].map((w, i) => (
                    <div key={i} style={{ height: 8, borderRadius: 3, background: 'var(--surface-3)', width: `${w}%` }} />
                  ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[60, 80, 50].map((w, i) => (
                    <div key={i} style={{ height: 8, borderRadius: 3, background: 'var(--surface-3)', width: `${w}%` }} />
                  ))}
                </div>
                <div style={{ position: 'absolute', bottom: 12, left: 20, right: 20, fontSize: 9, color: 'var(--ink-4)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span>Approved: K. Patel · Quality Manager</span>
                  <span>Page 1</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }}><Icon name="download" size={14} />Download</button>
            <button className="btn"><Icon name="upload" size={14} />Replace</button>
            <button className="btn" style={{ color: 'var(--bad)', borderColor: 'var(--bad-soft)' }}><Icon name="x" size={14} />Unlink</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main clause view ──────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{stdCfg.standardShort} · Section {clause.section}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>cl. {clause.id}</span>
            <StatusPill status={editStatus} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6, letterSpacing: '-0.01em' }}>{clause.title}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
          <button className="btn" style={{ fontSize: 11, padding: '3px 8px', whiteSpace: 'nowrap' }}
            onClick={() => openCreateTask({
              title: `Resolve cl. ${clause.id} — ${clause.title}`,
              clause: clause.id,
              source: clause.id,
              sourceType: 'audit',
              priority: STATUS_PRIO[editStatus] || 'medium',
              assignedTo: clause.owner,
            })}>
            <Icon name="plus" size={11} />Create task
          </button>
        </div>
      </div>

      <div className="drawer-body">
        {/* Requirement */}
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Requirement</div>
        <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', marginBottom: 18, borderLeft: '3px solid var(--border-strong, var(--border))' }}>
          {requirementText}
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Owner</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={clause.owner} size={22} />
              <span style={{ fontSize: 13 }}>{clause.owner}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Last reviewed</div>
            <div style={{ fontSize: 13 }}>{clause.lastReviewed}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Review cycle</div>
            <div style={{ fontSize: 13 }}>24 months · next due Mar 2027</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Evidence items</div>
            <div style={{ fontSize: 13 }}>{linkedEvidence.length} on file</div>
          </div>
        </div>

        {/* Self-assessment status */}
        <div style={{ marginBottom: 18, padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Self-assessment status</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: onUpdate ? 12 : 0 }}>
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value}
                className={`btn${editStatus === opt.value ? '' : ' btn-ghost'}`}
                style={{ flex: 1, padding: '5px 8px', fontSize: 11, justifyContent: 'center' }}
                onClick={() => onUpdate && handleStatusChange(opt.value)}
                disabled={!onUpdate}
                title={!onUpdate ? 'Open from accreditation workspace to edit' : undefined}>
                <Pill kind={opt.kind}>{opt.label}</Pill>
              </button>
            ))}
          </div>
          {onUpdate && (
            <>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Rationale / notes</div>
              <textarea
                className="form-input"
                rows={2}
                value={editNotes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="Add context for this assessment…"
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }}
              />
            </>
          )}
        </div>

        {/* Linked evidence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, flex: 1 }}>
            Linked evidence ({linkedEvidence.length})
          </div>
          {onUpdate && (
            <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setAddEvOpen(v => !v)}>
              <Icon name="plus" size={11} />{addEvOpen ? 'Cancel' : 'Add evidence'}
            </button>
          )}
        </div>

        {/* Add evidence inline form */}
        {addEvOpen && (
          <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 8, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-row" style={{ gap: 8 }}>
              <div className="form-field" style={{ flex: 2 }}>
                <label className="form-label">Document name</label>
                <input className="form-input" placeholder="e.g. SOP-EQP-009 Equipment verification" value={newEv.name} onChange={e => setNev('name', e.target.value)} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Type</label>
                <select className="form-input" value={newEv.type} onChange={e => setNev('type', e.target.value)}>
                  {EV_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row" style={{ gap: 8 }}>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Reference / version</label>
                <input className="form-input" placeholder="e.g. SOP-EQP-009 v3.1" value={newEv.ref} onChange={e => setNev('ref', e.target.value)} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={newEv.date} onChange={e => setNev('date', e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Notes <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional)</span></label>
              <input className="form-input" placeholder="Version notes, expiry, caveats…" value={newEv.notes} onChange={e => setNev('notes', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddEvidence} disabled={!newEv.name.trim() || !newEv.ref.trim()}>
                <Icon name="check" size={13} />Link evidence
              </button>
              <button className="btn" onClick={() => setAddEvOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {linkedEvidence.length === 0 ? (
          <div style={{ padding: 18, background: 'var(--bad-soft)', borderRadius: 8, color: 'var(--bad)', fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="alert" size={16} />
            <div>No evidence on file. <strong>This clause is non-conformant.</strong></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {linkedEvidence.map(item => (
              <EvidenceItem key={item.id} item={item} onOpen={openDoc} />
            ))}
          </div>
        )}

        {/* Activity */}
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Activity</div>
        <div className="timeline" style={{ marginBottom: 18 }}>
          <div className="timeline-item">
            <div><strong>K. Patel</strong> updated self-assessment to <em>{clause.status}</em></div>
            <div className="timeline-time">3 days ago</div>
          </div>
          <div className="timeline-item">
            <div><strong>M. Chen</strong> linked new evidence</div>
            <div className="timeline-time">2 weeks ago</div>
          </div>
          <div className="timeline-item">
            <div><strong>K. Patel</strong> completed periodic review</div>
            <div className="timeline-time">{clause.lastReviewed}</div>
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {onUpdate && dirty && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveAssessment}>
              <Icon name="check" size={14} />Save assessment
            </button>
          )}
          <button className="btn" style={{ flex: 1 }} onClick={() => setPanel('standard')}>
            <Icon name="book" size={14} />Open in standard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClauseDrawer;
