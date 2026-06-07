import React, { useState } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs } from '../components';
import { studyStatusKind } from './page-patients';
import NexusGrid from '../nexus-grid';

const StudiesPage = ({ data: D, openStudy }) => {
  const [tab, setTab] = useState("queue");
  const [filter, setFilter] = useState("all");

  const baseStudies = tab === 'queue'
    ? D.studies.filter(s => s.status !== 'Final')
    : D.studies;

  const filtered = baseStudies.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'awaiting') return s.status === 'Awaiting sign-off';
    if (filter === 'scoring') return s.status === 'Scoring';
    if (filter === 'final') return s.status === 'Final';
    if (filter === 'prelim') return s.status === 'Preliminary';
    return true;
  });

  const studyColumnDefs = [
    {
      headerName: 'Study ID',
      field: 'id',
      width: 150,
      cellRenderer: p => (
        <div>
          <div className="mono" style={{ fontWeight: 500 }}>{p.data.id}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.data.patient}</div>
        </div>
      ),
    },
    {
      headerName: 'Type',
      field: 'type',
      flex: 1,
    },
    {
      headerName: 'Site',
      field: 'siteCode',
      width: 100,
      cellRenderer: p => <span className="pill outline">{p.data.siteCode}</span>,
    },
    {
      headerName: 'Scorer',
      field: 'scorer',
      flex: 1,
      cellRenderer: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={p.data.scorer} size={20} idx={p.data.scorer.charCodeAt(0) % 9} />
          {p.data.scorer}
        </div>
      ),
    },
    {
      headerName: 'Reporting physician',
      field: 'physician',
      flex: 1,
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 160,
      cellRenderer: p => (
        <Pill kind={studyStatusKind(p.data.status)}>{p.data.status}</Pill>
      ),
    },
    {
      headerName: 'SLA · 10 days',
      field: 'due',
      width: 160,
      sortable: false,
      cellRenderer: p => {
        const s = p.data;
        return (
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
        );
      },
    },
    {
      headerName: '',
      field: 'id',
      width: 48,
      sortable: false,
      cellRenderer: () => <Icon name="chev_right" size={14} />,
    },
  ];

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

      <Tabs value={tab} onChange={t => { setTab(t); setFilter('all'); }} tabs={[
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
            {tab === 'all' && <button className={`chip-btn ${filter === 'final' ? 'active' : ''}`} onClick={() => setFilter('final')}>Final</button>}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{filtered.length} studies</span>
          </div>

          <div className="card">
            <NexusGrid
              rowData={filtered}
              columnDefs={studyColumnDefs}
              onRowClicked={p => openStudy(p.data.id)}
            />
          </div>
        </>
      )}

      {tab === 'concord' && (
        <div className="card card-pad">
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Inter-observer concordance — Q1 2026</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
            Cohen's κ across 5% blind re-score sample · cl. 5.6.6 / 5.5.6.6
          </div>
          <NexusGrid
            rowData={[
              { scorerA: 'M. Chen',  scorerB: 'A. Singh', studies: 14, kappa: '0.84', kappaKind: 'good', sleepStage: '0.81', respEvents: '0.87' },
              { scorerA: 'M. Chen',  scorerB: 'J. Owusu', studies: 11, kappa: '0.79', kappaKind: 'good', sleepStage: '0.77', respEvents: '0.82' },
              { scorerA: 'A. Singh', scorerB: 'J. Owusu', studies:  9, kappa: '0.74', kappaKind: 'warn', sleepStage: '0.71', respEvents: '0.78' },
            ]}
            columnDefs={[
              { headerName: 'Scorer A',    field: 'scorerA',    flex: 1 },
              { headerName: 'Scorer B',    field: 'scorerB',    flex: 1 },
              { headerName: 'Studies',     field: 'studies',    width: 90 },
              { headerName: 'κ (overall)', field: 'kappa',      width: 120,
                cellRenderer: p => <Pill kind={p.data.kappaKind}>{p.value}</Pill> },
              { headerName: 'Sleep stage', field: 'sleepStage', width: 120 },
              { headerName: 'Resp events', field: 'respEvents', width: 120 },
            ]}
          />
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
