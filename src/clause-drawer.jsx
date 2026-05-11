import React from 'react';
import Icon from './icons';
import { Avatar, StatusPill } from './components';

const ClauseDrawer = ({ data, clauseId, onClose }) => {
  if (!clauseId || !data) return null;
  const clause = data.clauses.find(c => c.id === clauseId) || {
    id: clauseId, title: "Clause detail", section: clauseId.split(".").slice(0, 2).join("."),
    status: "compliant", evidence: 0, lastReviewed: "—", owner: "—"
  };

  const requirementText = {
    "5.3.4": "Each item of equipment shall be subject to a documented verification programme to ensure it consistently meets the performance and accuracy required for the test concerned. Verification shall include physical and biological signal checks at defined intervals; safeguards against tampering; and date, result and trend monitoring.",
    "5.3.6": "Adverse incidents involving equipment shall be reported to the manufacturer and to the appropriate regulatory authority (TGA in Australia) where applicable.",
    "4.5.2": "The service shall maintain a register of all subcontractors, including written evidence of their compliance with this Standard.",
    "5.1.4": "All staff providing patient care shall be trained and competent in basic life support, with annual recertification. Paediatric BLS is required for staff working in paediatric labs.",
    "4.15.2": "Management review shall consider, at minimum: review of referrals, feedback, suggestions, audits, risk management, quality indicators, external assessments, EQA results, complaints, supplier performance, NCs, CAPA status, follow-up of prior actions, scope/staff/premises changes, and improvement recommendations.",
    "5.8.1": "All correspondence (including PSG reports) shall be completed within 10 business days of patient contact.",
  }[clause.id] || "Reference clause text from ASA Standard for Sleep Disorders Services (March 2019). Click 'Open in standard' to read the full normative text and notes.";

  return (
    <div>
      <div className="drawer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>ASA Standard · Section {clause.section}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>cl. {clause.id}</span>
            <StatusPill status={clause.status} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6, letterSpacing: '-0.01em' }}>{clause.title}</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="drawer-body">
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Requirement</div>
        <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', marginBottom: 18 }}>
          {requirementText}
        </div>

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
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Self-assessment</div>
            <StatusPill status={clause.status} />
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
          Linked evidence ({clause.evidence})
        </div>

        {clause.evidence > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {Array.from({ length: Math.min(clause.evidence, 4) }).map((_, i) => {
              const samples = [
                { name: `SOP-${clause.id.replace(/\./g, '-')}-${String(i+1).padStart(3,'0')}.pdf`, type: "SOP", date: "21 Apr 2026" },
                { name: `Calibration certificate #${(i+1)*1247}`, type: "Certificate", date: "02 Apr 2026" },
                { name: `Q1 audit finding #${i+1}`, type: "Audit", date: "11 Feb 2026" },
                { name: `Training record — ${["M. Chen","A. Singh","Dr. Okafor","K. Patel"][i]}`, type: "Record", date: "12 Mar 2026" },
              ][i % 4];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="paper" size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{samples.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{samples.type} · {samples.date}</div>
                  </div>
                  <Icon name="arrow_up_right" size={14} />
                </div>
              );
            })}
            {clause.evidence > 4 && (
              <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>+ {clause.evidence - 4} more</button>
            )}
          </div>
        ) : (
          <div style={{ padding: 18, background: 'var(--bad-soft)', borderRadius: 8, color: 'var(--bad)', fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="alert" size={16} />
            <div>No current evidence on file. <strong>This clause is non-conformant.</strong></div>
          </div>
        )}

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

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }}><Icon name="upload" size={14} />Add evidence</button>
          <button className="btn"><Icon name="book" size={14} />Open in standard</button>
        </div>
      </div>
    </div>
  );
};

export default ClauseDrawer;
