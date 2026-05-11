import React, { useState } from 'react';
import Icon from '../icons';
import { PageHeader, Donut, Tabs, Pill, StatusPill } from '../components';

const AccreditationPage = ({ data: D, openClause }) => {
  const [filter, setFilter] = useState("all");
  const [openSection, setOpenSection] = useState("5.3");
  const [tab, setTab] = useState("clauses");

  const filtered = D.clauses.filter(c => {
    if (filter === "all") return true;
    if (filter === "needs") return c.status !== "compliant";
    return c.status === filter;
  });

  const sectionGroups = {};
  filtered.forEach(c => {
    if (!sectionGroups[c.section]) sectionGroups[c.section] = [];
    sectionGroups[c.section].push(c);
  });

  const totalClauses = D.complianceBySection.reduce((s, x) => s + x.total, 0);
  const totalCompliant = D.complianceBySection.reduce((s, x) => s + x.compliant, 0);
  const totalPartial = D.complianceBySection.reduce((s, x) => s + x.partial, 0);
  const totalNc = D.complianceBySection.reduce((s, x) => s + x.nc, 0);

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · ASA Standard for Sleep Disorders Services (Mar 2019)"
        title="Accreditation workspace"
        subtitle="Every clause mapped to live evidence in the system. Assessor-ready."
        actions={
          <>
            <button className="btn"><Icon name="eye" size={14} />Preview assessor view</button>
            <button className="btn"><Icon name="download" size={14} />Self-assessment report</button>
            <button className="btn btn-primary"><Icon name="link" size={14} />Issue assessor access</button>
          </>
        }
      />

      {/* Readiness banner */}
      <div className="card card-pad" style={{ marginBottom: 20, background: 'linear-gradient(180deg, var(--surface), var(--surface-2))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Donut size={84} stroke={11} segments={[
            { value: totalCompliant, color: 'var(--good)' },
            { value: totalPartial, color: 'var(--warn)' },
            { value: totalNc, color: 'var(--bad)' },
            { value: totalClauses - totalCompliant - totalPartial - totalNc, color: 'var(--surface-3)' },
          ]} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Readiness</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: '4px 0' }}>
              {((totalCompliant/totalClauses)*100).toFixed(1)}% <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}>compliant</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {totalCompliant} of {totalClauses} clauses have current, signed evidence
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, paddingRight: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Next assessment</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{D.service.daysToAssessment}d</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{D.service.nextAssessment}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Cert no.</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{D.service.accreditation.certNo}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>since {D.service.accreditation.since}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Open NC</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2, color: 'var(--bad)' }}>{totalNc}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{totalPartial} partial</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "clauses", label: "Clause map", count: totalClauses },
        { id: "evidence", label: "Evidence library" },
        { id: "gap", label: "Gap report", count: totalNc + totalPartial },
        { id: "assessor", label: "Assessor view" },
        { id: "history", label: "Assessment history" },
      ]} />

      {tab === "clauses" && (
        <>
          <div className="filter-bar">
            <button className={`chip-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({totalClauses})</button>
            <button className={`chip-btn ${filter === 'needs' ? 'active' : ''}`} onClick={() => setFilter('needs')}>Needs attention ({totalPartial + totalNc})</button>
            <button className={`chip-btn ${filter === 'compliant' ? 'active' : ''}`} onClick={() => setFilter('compliant')}>Compliant</button>
            <button className={`chip-btn ${filter === 'partial' ? 'active' : ''}`} onClick={() => setFilter('partial')}>Partial</button>
            <button className={`chip-btn ${filter === 'nc' ? 'active' : ''}`} onClick={() => setFilter('nc')}>Non-conformant</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-ghost"><Icon name="filter" size={13} />By owner</button>
            <button className="btn btn-ghost"><Icon name="calendar" size={13} />Last reviewed</button>
          </div>

          {Object.entries(sectionGroups).map(([sec, clauses]) => {
            const meta = D.complianceBySection.find(s => s.id === sec);
            const isOpen = openSection === sec;
            return (
              <div key={sec} className={`clause-section ${isOpen ? 'open' : ''}`}>
                <div className="clause-section-head" onClick={() => setOpenSection(isOpen ? null : sec)}>
                  <span className="chev"><Icon name="chev_right" size={14} /></span>
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>{sec}</span>
                  <span style={{ color: 'var(--ink-2)' }}>{meta?.name}</span>
                  <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>· {clauses.length} shown of {meta?.total}</span>
                  <div style={{ flex: 1 }} />
                  <Pill kind="good">{meta?.compliant}</Pill>
                  {meta?.partial > 0 && <Pill kind="warn">{meta?.partial}</Pill>}
                  {meta?.nc > 0 && <Pill kind="bad">{meta?.nc}</Pill>}
                </div>
                <div className="clause-list">
                  <div className="clause-row" style={{ background: 'var(--surface-2)', cursor: 'default', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', fontWeight: 500 }}>
                    <span>Clause</span>
                    <span>Requirement</span>
                    <span>Status</span>
                    <span>Evidence</span>
                    <span>Owner</span>
                  </div>
                  {clauses.map(c => (
                    <div key={c.id} className="clause-row" onClick={() => openClause(c.id)}>
                      <span className="clause-id">{c.id}</span>
                      <span className="clause-title">{c.title}</span>
                      <StatusPill status={c.status} />
                      <span className="clause-meta">
                        {c.evidence > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="paper" size={12} />
                            {c.evidence} {c.evidence === 1 ? 'item' : 'items'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--bad)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="alert" size={12} />Missing
                          </span>
                        )}
                      </span>
                      <span className="clause-meta">{c.owner}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === "evidence" && (
        <div className="card card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: "SOP-PSG-031 Bio-signal verification", v: "v3.2", clauses: ["5.3.4", "5.5.2"], type: "SOP", date: "21 Apr 2026" },
              { name: "Q1 2026 Internal audit report", v: "v1.0", clauses: ["4.14.1"], type: "Audit", date: "11 Feb 2026" },
              { name: "Calibration cert — Grael 4K #19847", v: "—", clauses: ["5.3.4"], type: "Certificate", date: "02 Apr 2026" },
              { name: "Management review minutes Q4-2025", v: "v1.1", clauses: ["4.15.2"], type: "Minutes", date: "14 Jan 2026" },
              { name: "Inter-observer concordance Q1", v: "v1.0", clauses: ["5.6.6"], type: "Report", date: "20 Mar 2026" },
              { name: "BLS competency register", v: "live", clauses: ["5.1.4"], type: "Register", date: "today" },
              { name: "CoI declarations 2026", v: "v2", clauses: ["4.1.5"], type: "Form", date: "02 Apr 2026" },
              { name: "Subcontractor evidence — XYZ Scoring", v: "v1", clauses: ["4.5.2"], type: "Evidence", date: "—" },
              { name: "Quality manual", v: "v8.1", clauses: ["4.2"], type: "Manual", date: "15 Jan 2026" },
            ].map((e, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="paper" size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{e.type} · {e.v} · {e.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {e.clauses.map(cl => (
                    <span key={cl} className="mono" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 4, color: 'var(--ink-2)' }}>cl. {cl}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "gap" && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Clause</th>
                <th>Requirement</th>
                <th>Status</th>
                <th>Gap</th>
                <th>Owner</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {D.clauses.filter(c => c.status !== 'compliant').map(c => (
                <tr key={c.id} className="row-clickable" onClick={() => openClause(c.id)}>
                  <td><span className="mono">{c.id}</span></td>
                  <td>{c.title}</td>
                  <td><StatusPill status={c.status} /></td>
                  <td style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                    {c.status === 'nc' ? 'No current evidence on file' : 'Evidence outdated or partial'}
                  </td>
                  <td>{c.owner}</td>
                  <td><button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Resolve →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "assessor" && (
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center' }}>
              <Icon name="eye" size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>NATA assessor portal</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>
                Read-only, watermark-stamped, time-boxed access to a clause-mapped evidence pack. Every assessor action is logged.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Active assessor links</div>
                  <div style={{ fontSize: 22, fontWeight: 600, margin: '4px 0' }}>2</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>expire in 14 days</div>
                </div>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Pages indexed</div>
                  <div style={{ fontSize: 22, fontWeight: 600, margin: '4px 0' }}>1,284</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>across 24 clauses</div>
                </div>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Last updated</div>
                  <div style={{ fontSize: 22, fontWeight: 600, margin: '4px 0' }}>3m</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>auto-rebuild on changes</div>
                </div>
              </div>
              <button className="btn btn-primary"><Icon name="link" size={14} />Issue new assessor access</button>
              &nbsp;&nbsp;
              <button className="btn"><Icon name="download" size={14} />Download evidence pack (.zip)</button>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card card-pad">
          <div className="timeline">
            {[
              { t: "Mar 2022", h: "Initial accreditation granted", d: "NATA accredited service no. 15847 — full scope adult & paediatric PSG, HSAT, MSLT/MWT, CPAP." },
              { t: "Aug 2023", h: "Surveillance assessment", d: "1 minor finding (cl. 4.3.2 — controlled doc list outdated). Closed Sep 2023." },
              { t: "Feb 2025", h: "Mid-cycle assessment", d: "0 NC, 2 observations. Continued accreditation confirmed." },
              { t: "Aug 2026", h: "Full re-assessment scheduled", d: "98 days away. Pre-assessment checklist 73% complete." },
            ].map((e, i) => (
              <div key={i} className="timeline-item">
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{e.t}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{e.h}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{e.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccreditationPage;
