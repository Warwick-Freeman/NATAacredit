import React, { useState } from 'react';
import NEXUS_DATA from '../data';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs } from '../components';

const StudiesPage = ({ openStudy }) => {
  const D = NEXUS_DATA;
  const [tab, setTab] = useState("queue");
  const [filter, setFilter] = useState("all");

  const filtered = D.studies.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'awaiting') return s.status === 'Awaiting sign-off';
    if (filter === 'scoring') return s.status === 'Scoring';
    if (filter === 'final') return s.status === 'Final';
    if (filter === 'prelim') return s.status === 'Preliminary';
    return true;
  });

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Operations · cl. 5.5, 5.6, 5.8"
        title="Studies & reporting"
        subtitle="Scoring queue, sign-off lifecycle, and 10 business-day SLA timer"
        actions={
          <>
            <button className="btn"><Icon name="filter" size={14} />Filter</button>
            <button className="btn btn-primary"><Icon name="plus" size={14} />Log new study</button>
          </>
        }
      />

      {/* Top metrics */}
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="clock" size={13} />Avg time to final report</div>
          <div className="stat-value">7.2<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, marginLeft: 4 }}>days</span></div>
          <div className="stat-meta up"><Icon name="arrow_up_right" size={11} />0.4d faster than Q4</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="paper" size={13} />Awaiting sign-off</div>
          <div className="stat-value">{D.studies.filter(s => s.status === 'Awaiting sign-off').length}</div>
          <div className="stat-meta">2 due in &lt; 24h</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Breached SLA (this month)</div>
          <div className="stat-value">3</div>
          <div className="stat-meta down">of 142 reports · 2.1%</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="pen" size={13} />Amended reports</div>
          <div className="stat-value">2</div>
          <div className="stat-meta">cl. 5.8.11 retention OK</div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "queue", label: "Active queue", count: D.studies.filter(s => s.status !== 'Final').length },
        { id: "all", label: "All studies", count: D.studies.length },
        { id: "concord", label: "Concordance" },
        { id: "templates", label: "Report templates" },
      ]} />

      {(tab === 'queue' || tab === 'all') && (
        <>
          <div className="filter-bar">
            <button className={`chip-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`chip-btn ${filter === 'scoring' ? 'active' : ''}`} onClick={() => setFilter('scoring')}>Scoring</button>
            <button className={`chip-btn ${filter === 'prelim' ? 'active' : ''}`} onClick={() => setFilter('prelim')}>Preliminary</button>
            <button className={`chip-btn ${filter === 'awaiting' ? 'active' : ''}`} onClick={() => setFilter('awaiting')}>Awaiting sign-off</button>
            <button className={`chip-btn ${filter === 'final' ? 'active' : ''}`} onClick={() => setFilter('final')}>Final</button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{filtered.length} studies</span>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Study ID</th>
                  <th>Type</th>
                  <th>Site</th>
                  <th>Scorer</th>
                  <th>Reporting physician</th>
                  <th>Status</th>
                  <th>SLA · 10 days</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="row-clickable" onClick={() => openStudy(s.id)}>
                    <td>
                      <div className="mono" style={{ fontWeight: 500 }}>{s.id}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.patient}</div>
                    </td>
                    <td>{s.type}</td>
                    <td><span className="pill outline">{s.siteCode}</span></td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={s.scorer} size={20} idx={s.scorer.charCodeAt(0) % 9} />{s.scorer}</div></td>
                    <td>{s.physician}</td>
                    <td>
                      <Pill kind={
                        s.status === 'Final' ? 'good'
                          : s.status === 'Awaiting sign-off' ? 'warn'
                          : s.status === 'Preliminary' ? 'info'
                          : 'outline'
                      }>{s.status}</Pill>
                    </td>
                    <td>
                      <div className="sla">
                        <div className="sla-bar" style={{ width: 80 }}>
                          <div className="sla-bar-fill" style={{
                            width: s.status === 'Final'
                              ? '100%'
                              : `${Math.min(100, ((10 - s.due) / 10) * 100)}%`,
                            background: s.sla === 'bad' ? 'var(--bad)' : s.sla === 'warn' ? 'var(--warn)' : 'var(--good)',
                          }} />
                        </div>
                        <span style={{
                          color: s.status === 'Final' ? 'var(--ink-3)' : s.sla === 'bad' ? 'var(--bad)' : s.sla === 'warn' ? 'var(--warn)' : 'var(--ink-3)',
                          fontSize: 12,
                        }}>
                          {s.status === 'Final'
                            ? `${s.signedDays}d ✓`
                            : s.due === 0 ? 'Due today'
                            : s.due > 0 ? `${s.due}d left` : `${Math.abs(s.due)}d over`}
                        </span>
                      </div>
                    </td>
                    <td><Icon name="chev_right" size={14} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'concord' && (
        <div className="card card-pad">
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Inter-observer concordance — Q1 2026</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
            Cohen's κ across 5% blind re-score sample · cl. 5.6.6 / 5.5.6.6
          </div>
          <table className="tbl">
            <thead><tr><th>Scorer A</th><th>Scorer B</th><th>Studies</th><th>κ (overall)</th><th>Sleep stage</th><th>Resp events</th></tr></thead>
            <tbody>
              <tr><td>M. Chen</td><td>A. Singh</td><td>14</td><td><Pill kind="good">0.84</Pill></td><td>0.81</td><td>0.87</td></tr>
              <tr><td>M. Chen</td><td>J. Owusu</td><td>11</td><td><Pill kind="good">0.79</Pill></td><td>0.77</td><td>0.82</td></tr>
              <tr><td>A. Singh</td><td>J. Owusu</td><td>9</td><td><Pill kind="warn">0.74</Pill></td><td>0.71</td><td>0.78</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { name: "Adult attended PSG report", clause: "5.8.7", v: "v4.1" },
            { name: "Paediatric attended PSG report", clause: "5.8.5, 5.8.7", v: "v3.0" },
            { name: "CPAP titration / efficacy report", clause: "5.5.3.4", v: "v2.4" },
            { name: "MSLT / MWT report", clause: "5.5.3.3", v: "v2.0" },
            { name: "Type 2/3/4 home study report", clause: "5.5.4", v: "v3.1" },
            { name: "Split-night protocol", clause: "5.5.3.4 N3", v: "v1.2" },
            { name: "Provisional CPAP prescription", clause: "5.7.1.4", v: "v1.0" },
            { name: "Amended report", clause: "5.8.11", v: "v2.0" },
            { name: "Diagnostic-only raw-data release", clause: "5.7.2", v: "v1.0" },
          ].map((t, i) => (
            <div key={i} className="card card-pad" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 44, borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="paper" size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{t.v} · cl. {t.clause}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudiesPage;
