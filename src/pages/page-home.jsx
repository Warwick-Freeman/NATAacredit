import React from 'react';
import NEXUS_DATA from '../data';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Donut } from '../components';

const HomePage = ({ goTo, openClause }) => {
  const D = NEXUS_DATA;
  const totalClauses = D.complianceBySection.reduce((s, x) => s + x.total, 0);
  const totalCompliant = D.complianceBySection.reduce((s, x) => s + x.compliant, 0);
  const totalPartial = D.complianceBySection.reduce((s, x) => s + x.partial, 0);
  const totalNc = D.complianceBySection.reduce((s, x) => s + x.nc, 0);
  const pct = ((totalCompliant / totalClauses) * 100).toFixed(1);

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Good morning, Kavya"
        title="Riverside Sleep & Respiratory Centre"
        subtitle={`NATA assessment in ${D.service.daysToAssessment} days · ${D.service.nextAssessment}`}
        actions={
          <>
            <button className="btn"><Icon name="download" size={14} />Export evidence pack</button>
            <button className="btn btn-primary" onClick={() => goTo('accreditation')}>
              <Icon name="shield" size={14} />Open accreditation workspace
            </button>
          </>
        }
      />

      {/* Top stats */}
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">
            <Icon name="shield" size={13} />
            Overall compliance
          </div>
          <div className="stat-value">{pct}%</div>
          <div className="stat-meta up"><Icon name="arrow_up_right" size={11} />+1.4% vs last month</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="audit" size={13} />Clauses tracked</div>
          <div className="stat-value">{totalClauses}</div>
          <div className="stat-meta">
            <span style={{ color: 'var(--good)' }}>● {totalCompliant} OK</span>
            &nbsp;&nbsp;
            <span style={{ color: 'var(--warn)' }}>● {totalPartial} partial</span>
            &nbsp;&nbsp;
            <span style={{ color: 'var(--bad)' }}>● {totalNc} NC</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="clock" size={13} />Reports within 10 days</div>
          <div className="stat-value">94.2%</div>
          <div className="stat-meta down"><Icon name="alert" size={11} />Below 95% target</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Open NC / CAPA</div>
          <div className="stat-value">7</div>
          <div className="stat-meta">3 critical · 4 standard</div>
        </div>
      </div>

      <div className="spacer-md" />

      {/* Banner */}
      <div className="banner warn">
        <Icon name="alert" size={18} />
        <div style={{ flex: 1 }}>
          <strong>3 items need attention before NATA assessment.</strong> &nbsp;
          HSAT-NOX-014 verification overdue · 4 staff BLS lapsed · 1 subcontractor evidence missing.
        </div>
        <button className="btn btn-ghost" onClick={() => goTo('tasks')}>Review &nbsp;<Icon name="arrow_right" size={13} /></button>
      </div>

      <div className="spacer-md" />

      {/* Two-column main */}
      <div className="grid-2-1">
        <div className="col">
          {/* Compliance heatmap */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Section coverage</div>
                <div className="card-sub">ASA Standard March 2019 · click any section to drill in</div>
              </div>
              <div className="topbar-spacer" />
              <Pill kind="good" dot>{totalCompliant} compliant</Pill>
              <Pill kind="warn" dot>{totalPartial} partial</Pill>
              <Pill kind="bad" dot>{totalNc} NC</Pill>
            </div>
            <div className="card-pad">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {D.complianceBySection.map(s => {
                  const compPct = s.compliant / s.total;
                  const partPct = s.partial / s.total;
                  const ncPct = s.nc / s.total;
                  return (
                    <div key={s.id}
                      onClick={() => goTo('accreditation')}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: 'var(--surface)',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span className="mono" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{s.id}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{s.compliant}/{s.total}</span>
                      </div>
                      <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', background: 'var(--surface-3)' }}>
                        <div style={{ width: `${compPct * 100}%`, background: 'var(--good)' }} />
                        <div style={{ width: `${partPct * 100}%`, background: 'var(--warn)' }} />
                        <div style={{ width: `${ncPct * 100}%`, background: 'var(--bad)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Studies queue snapshot */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Reporting SLA · 10 business-day window</div>
                <div className="card-sub">Studies awaiting sign-off — clause 5.8.1</div>
              </div>
              <div className="topbar-spacer" />
              <button className="btn btn-ghost" onClick={() => goTo('studies')}>Open queue<Icon name="arrow_right" size={13} /></button>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Study</th>
                  <th>Type</th>
                  <th>Reporting physician</th>
                  <th>Status</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {D.studies.filter(s => s.status !== "Final").slice(0, 5).map(s => (
                  <tr key={s.id} className="row-clickable" onClick={() => goTo('studies')}>
                    <td><span className="mono">{s.id}</span></td>
                    <td>{s.type}</td>
                    <td>{s.physician}</td>
                    <td><Pill kind={s.status === "Awaiting sign-off" ? "warn" : s.status === "Preliminary" ? "info" : "outline"}>{s.status}</Pill></td>
                    <td>
                      <div className="sla">
                        <div className="sla-bar">
                          <div className="sla-bar-fill" style={{
                            width: `${Math.min(100, ((10 - s.due) / 10) * 100)}%`,
                            background: s.sla === 'bad' ? 'var(--bad)' : s.sla === 'warn' ? 'var(--warn)' : 'var(--good)',
                          }} />
                        </div>
                        <span style={{ color: s.sla === 'bad' ? 'var(--bad)' : s.sla === 'warn' ? 'var(--warn)' : 'var(--ink-3)' }}>
                          {s.due === 0 ? "Due today" : s.due > 0 ? `${s.due}d left` : `${Math.abs(s.due)}d over`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="col">
          <div className="card">
            <div className="card-head">
              <div className="card-title">My tasks</div>
              <div className="topbar-spacer" />
              <Pill kind="bad">{D.tasks.filter(t => t.priority === 'critical').length} critical</Pill>
            </div>
            <div>
              {D.tasks.map(t => (
                <div key={t.id} style={{ padding: '11px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input type="checkbox" style={{ marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, display: 'flex', gap: 8 }}>
                      <span style={{ color: t.due.includes('Overdue') ? 'var(--bad)' : 'var(--ink-3)' }}>{t.due}</span>
                      <span>·</span>
                      <span className="mono" style={{ cursor: 'pointer', color: 'var(--accent-ink)' }} onClick={() => openClause(t.clause)}>cl. {t.clause}</span>
                    </div>
                  </div>
                  <span className={`pill ${t.priority === 'critical' ? 'bad' : t.priority === 'high' ? 'warn' : 'outline'}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Recent activity</div>
              <div className="topbar-spacer" />
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}>Audit log</button>
            </div>
            <div className="card-pad">
              <div className="timeline">
                {D.activity.map((a, i) => (
                  <div key={i} className="timeline-item">
                    <div><strong>{a.who}</strong> {a.what}</div>
                    <div className="timeline-time">{a.when}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
