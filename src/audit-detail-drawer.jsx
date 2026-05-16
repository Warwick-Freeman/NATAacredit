import React, { useState } from 'react';
import Icon from './icons';
import { Pill } from './components';
import { useTaskContext } from './TaskContext';

const AUDIT_FINDINGS = {
  'AUD-2026-Q1': [
    { id: 'F001', severity: 'major',       clause: '5.3.4', description: 'HSAT-NOX-014 last verification recorded 18 months ago; no re-verification scheduled in asset register.', corrective: 'Add to asset register calendar; schedule quarterly verification runs.', status: 'open' },
    { id: 'F002', severity: 'minor',       clause: '5.3.1', description: 'Calibration log for PSG amplifier missing 2 entries (Aug–Sep 2025).', corrective: 'Entries retrospectively documented; updated log template deployed.', status: 'closed' },
    { id: 'F003', severity: 'observation', clause: '5.3.2', description: 'Equipment storage area temperature logs not reviewed monthly as required by SOP-ENV-001.', corrective: 'Monthly review responsibility assigned to M. Chen with calendar reminder.', status: 'open' },
  ],
  'AUD-2026-Q2': [],
  'AUD-2025-Q4': [
    { id: 'F004', severity: 'major',       clause: '5.5.2', description: 'Pre-study patient questionnaire not consistently offered for home studies (3 of 11 reviewed).', corrective: 'Updated booking checklist now includes mandatory questionnaire step.', status: 'closed' },
    { id: 'F005', severity: 'minor',       clause: '5.5.3', description: 'Three study reports lacked scorer signature before dispatch to referring physician.', corrective: 'Additional verification step added to dispatch SOP-REP-003.', status: 'closed' },
    { id: 'F006', severity: 'major',       clause: '5.5.5', description: 'Referral response time exceeded 5-day target for 14% of Q3 referrals (n=180).', corrective: 'Triage protocol revised; admin bandwidth increased with part-time booking officer.', status: 'closed' },
    { id: 'F007', severity: 'minor',       clause: '5.5.6', description: 'Patient feedback form not updated to include telehealth appointment type.', corrective: 'Form updated and uploaded to controlled documents (DOC-PAT-002 v4).', status: 'closed' },
    { id: 'F008', severity: 'observation', clause: '5.5.1', description: 'Service descriptions on public website do not fully match current scope on accreditation certificate.', corrective: 'Website update scheduled with marketing team by end of Q2 2026.', status: 'open' },
  ],
  'AUD-2025-Q3': [
    { id: 'F009', severity: 'minor',       clause: '4.13.2', description: 'Archive index for 2022 records incomplete; 3 patient records not immediately traceable in system.', corrective: 'Records located in off-site storage; index rebuilt and verified.', status: 'closed' },
    { id: 'F010', severity: 'observation', clause: '4.13.3', description: 'Audit trail for document changes in QMS not enabled by default for new document categories.', corrective: 'Admin setting updated; audit trail confirmed active for all document types.', status: 'closed' },
  ],
  'AUD-2025-Q2': [
    { id: 'F011', severity: 'minor', clause: '5.1.5', description: 'CPD record for one technologist (A. Singh) missing from personnel file for 2024.', corrective: 'Record located and filed; annual CPD check added to HR calendar.', status: 'closed' },
  ],
};

const AUDIT_CHECKLIST = {
  'AUD-2026-Q1': ['cl. 5.3.1 — Equipment use & maintenance SOPs', 'cl. 5.3.2 — Environmental conditions monitoring', 'cl. 5.3.3 — Equipment handling & storage', 'cl. 5.3.4 — Identification, calibration & verification'],
  'AUD-2026-Q2': ['cl. 4.3.1 — Document creation & identification', 'cl. 4.3.2 — Document review & approval', 'cl. 4.3.3 — Document distribution & access', 'cl. 4.3.4 — Obsolescence & withdrawal'],
  'AUD-2025-Q4': ['cl. 5.5.1 — Pre-study processes', 'cl. 5.5.2 — Study preparation', 'cl. 5.5.3 — Study conduct', 'cl. 5.5.4 — Post-study processes', 'cl. 5.5.5 — Result reporting', 'cl. 5.5.6 — Patient & referrer feedback'],
  'AUD-2025-Q3': ['cl. 4.13.1 — Records management system', 'cl. 4.13.2 — Archive & retrieval procedures', 'cl. 4.13.3 — Audit trail & traceability'],
  'AUD-2025-Q2': ['cl. 5.1.1 — Qualifications & competency', 'cl. 5.1.2 — Authorisation to conduct tests', 'cl. 5.1.3 — Supervision arrangements', 'cl. 5.1.4 — Training records', 'cl. 5.1.5 — Continuing professional development'],
};

const SEVER_KIND = { major: 'bad', minor: 'warn', observation: 'outline' };

const AuditDetailDrawer = ({ audit, onClose, onUpdate }) => {
  const { openCreateTask } = useTaskContext();
  const [findings, setFindings] = useState(() => AUDIT_FINDINGS[audit.id] || []);
  const [addOpen, setAddOpen] = useState(false);
  const [newF, setNewF] = useState({ severity: 'minor', clause: '', description: '', corrective: '' });
  const [localStatus, setLocalStatus] = useState(audit.status);

  const openCount = findings.filter(f => f.status === 'open').length;
  const majorOpen = findings.filter(f => f.severity === 'major' && f.status === 'open').length;
  const checklist = AUDIT_CHECKLIST[audit.id] || [];

  function toggleFinding(id) {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status: f.status === 'closed' ? 'open' : 'closed' } : f));
  }

  function logFinding() {
    if (!newF.description.trim()) return;
    setFindings(prev => [...prev, { id: `F${Date.now()}`, ...newF, status: 'open' }]);
    setNewF({ severity: 'minor', clause: '', description: '', corrective: '' });
    setAddOpen(false);
  }

  function closeAudit() {
    setLocalStatus('Closed');
    onUpdate?.({ ...audit, status: 'Closed', findings: findings.length });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '22px 22px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Internal audit · {audit.id}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>{audit.area}</div>
          </div>
          <button className="btn-icon" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <Pill kind={localStatus === 'Closed' ? 'good' : localStatus === 'Scheduled' ? 'outline' : 'info'}>{localStatus}</Pill>
          {openCount > 0 && <Pill kind="warn">{openCount} open finding{openCount !== 1 ? 's' : ''}</Pill>}
          {openCount === 0 && findings.length > 0 && localStatus === 'Closed' && <Pill kind="good">All findings resolved</Pill>}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
          {[
            ['Auditor', audit.auditor],
            ['Date', audit.date],
            ['Scope', audit.scope],
            ['Findings', `${findings.length} total · ${openCount} open`],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Clauses covered */}
        {checklist.length > 0 ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Clauses audited</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {checklist.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)', padding: '4px 0' }}>
                  <span style={{ color: 'var(--good)', flexShrink: 0 }}><Icon name="check" size={13} /></span>
                  <span className="mono">{c}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px' }}>
            Audit in progress — clause checklist will populate as review proceeds.
          </div>
        )}

        {/* Findings */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>Findings</div>
            <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setAddOpen(v => !v)}>
              <Icon name="plus" size={11} />Log finding
            </button>
          </div>

          {addOpen && (
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 14, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Severity</label>
                  <select className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={newF.severity} onChange={e => setNewF(p => ({ ...p, severity: e.target.value }))}>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="observation">Observation</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Clause</label>
                  <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. 5.3.4" value={newF.clause} onChange={e => setNewF(p => ({ ...p, clause: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Description</label>
                <textarea className="input" rows={2} style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Describe the finding observed…" value={newF.description} onChange={e => setNewF(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>Corrective action</label>
                <textarea className="input" rows={2} style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Proposed corrective action…" value={newF.corrective} onChange={e => setNewF(p => ({ ...p, corrective: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setAddOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={logFinding}>Add finding</button>
              </div>
            </div>
          )}

          {findings.length === 0 && !addOpen && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '8px 0' }}>
              {localStatus === 'In progress' ? 'No findings logged yet.' : 'Zero findings — this audit area passed with no issues.'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {findings.map(f => (
              <div key={f.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', opacity: f.status === 'closed' ? 0.6 : 1 }}>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <Pill kind={SEVER_KIND[f.severity]}>{f.severity}</Pill>
                    {f.clause && <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>cl. {f.clause}</span>}
                    {f.status === 'closed' && <Pill kind="good">closed</Pill>}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.55 }}>{f.description}</div>
                  {f.corrective && (
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', lineHeight: 1.5 }}>
                      <strong>Corrective action:</strong> {f.corrective}
                    </div>
                  )}
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '7px 12px', display: 'flex', gap: 6 }}>
                  <button className="btn" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => toggleFinding(f.id)}>
                    <Icon name={f.status === 'closed' ? 'x' : 'check'} size={10} />
                    {f.status === 'closed' ? 'Reopen' : 'Mark closed'}
                  </button>
                  {f.status === 'open' && (
                    <button className="btn" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => openCreateTask({
                      title: `Audit finding: ${f.description.slice(0, 55)}${f.description.length > 55 ? '…' : ''}`,
                      clause: f.clause,
                      source: audit.id,
                      sourceType: 'audit',
                      priority: f.severity === 'major' ? 'high' : 'medium',
                    })}>
                      <Icon name="plus" size={10} />Create task
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close audit */}
        {localStatus !== 'Closed' && localStatus !== 'Scheduled' && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 14 }}>
            {majorOpen > 0 ? (
              <div style={{ fontSize: 12, color: 'var(--bad)', marginBottom: 8, fontWeight: 500 }}>
                {majorOpen} major finding{majorOpen !== 1 ? 's' : ''} still open — resolve before closing.
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
                All major findings resolved. Ready to close this audit.
              </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={majorOpen > 0} onClick={closeAudit}>
              <Icon name="check" size={13} />Close audit
            </button>
          </div>
        )}

        {localStatus === 'Closed' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#dcfce7', borderRadius: 8 }}>
            <Icon name="check" size={14} style={{ color: '#16a34a' }} />
            <div style={{ fontSize: 12, color: '#15803d', fontWeight: 500 }}>Audit closed · {findings.length} finding{findings.length !== 1 ? 's' : ''} on record</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditDetailDrawer;
