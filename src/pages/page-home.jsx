import React, { useState } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Donut } from '../components';
import { useTaskContext } from '../TaskContext';
import { useAuth } from '../AuthContext';
import { useLocation } from '../LocationContext';
import { useNexusData } from '../NexusDataContext';
import { getStdCfg } from '../standardConfig';
import NexusGrid from '../nexus-grid';

function exportEvidencePack(D, site, user) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

  const totalClauses   = D.complianceBySection.reduce((s, x) => s + x.total, 0);
  const totalCompliant = D.complianceBySection.reduce((s, x) => s + x.compliant, 0);
  const totalPartial   = D.complianceBySection.reduce((s, x) => s + x.partial, 0);
  const totalNc        = D.complianceBySection.reduce((s, x) => s + x.nc, 0);
  const pct = ((totalCompliant / totalClauses) * 100).toFixed(1);

  const ncClauses      = (D.clauses ?? []).filter(c => c.status === 'nc');
  const partialClauses = (D.clauses ?? []).filter(c => c.status === 'partial');
  const overdueEquip   = (D.equipment ?? []).filter(e => e.verifyStatus === 'bad');
  const pendingStudies = (D.studies ?? []).filter(s => s.status !== 'Final');

  const complianceColor = pct >= 90 ? '#16a34a' : pct >= 75 ? '#ca8a04' : '#dc2626';

  const sectionRows = D.complianceBySection.map(s => {
    const cPct = (s.compliant / s.total * 100).toFixed(0);
    const pPct = (s.partial  / s.total * 100).toFixed(0);
    const nPct = (s.nc       / s.total * 100).toFixed(0);
    return `<tr>
      <td><strong>${s.id}</strong></td><td>${s.name}</td>
      <td style="color:#16a34a;font-weight:600">${s.compliant}</td>
      <td style="color:#ca8a04;font-weight:600">${s.partial}</td>
      <td style="color:${s.nc > 0 ? '#dc2626' : '#6b7280'};font-weight:600">${s.nc}</td>
      <td>${s.total}</td>
      <td style="min-width:90px">
        <div style="font-size:11px;color:#6b7280;margin-bottom:3px">${cPct}%</div>
        <div style="height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;display:flex">
          <div style="width:${cPct}%;background:#16a34a"></div>
          <div style="width:${pPct}%;background:#ca8a04"></div>
          <div style="width:${nPct}%;background:#dc2626"></div>
        </div>
      </td>
    </tr>`;
  }).join('');

  const issueRows = [...ncClauses, ...partialClauses].map(c => `<tr>
    <td><strong>${c.id}</strong></td><td>${c.title}</td>
    <td><span class="pill ${c.status === 'nc' ? 'bad' : 'warn'}">${c.status === 'nc' ? 'Non-conformant' : 'Partial'}</span></td>
    <td>${c.owner ?? '—'}</td><td>${c.lastReviewed ?? '—'}</td>
    <td style="color:#6b7280;max-width:200px">${c.evidence ?? '—'}</td>
  </tr>`).join('');

  const equipRows = overdueEquip.map(e => `<tr>
    <td><strong>${e.id}</strong></td><td>${e.name}</td><td>${e.type ?? '—'}</td>
    <td>${e.site ?? '—'}</td><td>${e.lastVerify ?? '—'}</td>
    <td><span class="pill bad">${e.nextVerify ?? 'Overdue'}</span></td>
  </tr>`).join('');

  const studyRows = pendingStudies.map(s => `<tr>
    <td><strong>${s.id}</strong></td><td>${s.type ?? '—'}</td><td>${s.physician ?? '—'}</td>
    <td><span class="pill ${s.status === 'Awaiting sign-off' ? 'warn' : 'neutral'}">${s.status}</span></td>
    <td><span class="pill ${s.sla === 'bad' ? 'bad' : s.sla === 'warn' ? 'warn' : 'good'}">${s.due === 0 ? 'Due today' : s.due > 0 ? `${s.due}d remaining` : `${Math.abs(s.due)}d overdue`}</span></td>
  </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Evidence Pack — ${site.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#111;background:#fff}
@media print{@page{margin:18mm 16mm}.no-print{display:none!important}}
.cover{padding:60px 48px;min-height:100vh;display:flex;flex-direction:column;page-break-after:always}
.brand{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;margin-bottom:48px}
h1{font-size:36px;font-weight:800;line-height:1.1}
.sub{font-size:18px;color:#6b7280;margin-top:6px}
.score-box{margin-top:40px;padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;display:inline-block}
.score-num{font-size:52px;font-weight:800;line-height:1;color:${complianceColor}}
.score-pills{display:flex;gap:16px;margin-top:8px;font-size:12px}
.meta-grid{margin-top:auto;padding-top:32px;border-top:2px solid #e5e7eb;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.meta-item label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;display:block;margin-bottom:3px}
.meta-item span{font-size:14px;font-weight:600}
.section{padding:36px 48px;border-top:1px solid #e5e7eb}
h2{font-size:17px;font-weight:700;margin-bottom:3px}
.sec-sub{font-size:12px;color:#6b7280;margin-bottom:18px}
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.stat-card{border:1px solid #e5e7eb;border-radius:8px;padding:14px}
.stat-card .n{font-size:28px;font-weight:700}.stat-card .l{font-size:11px;color:#6b7280;margin-top:2px}
.stat-card.good{border-color:#bbf7d0;background:#f0fdf4}.stat-card.good .n{color:#16a34a}
.stat-card.warn{border-color:#fef08a;background:#fefce8}.stat-card.warn .n{color:#ca8a04}
.stat-card.bad{border-color:#fecaca;background:#fef2f2}.stat-card.bad .n{color:#dc2626}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#9ca3af;padding:8px 10px;border-bottom:2px solid #e5e7eb}
td{padding:9px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;vertical-align:top}
tr:last-child td{border-bottom:none}
.pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600}
.pill.good{background:#dcfce7;color:#15803d}.pill.warn{background:#fef9c3;color:#854d0e}
.pill.bad{background:#fee2e2;color:#b91c1c}.pill.neutral{background:#f3f4f6;color:#6b7280}
.footer{padding:18px 48px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
.print-btn{position:fixed;bottom:24px;right:24px;background:#2563eb;color:#fff;border:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,.3)}
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

<div class="cover">
  <div class="brand">Nexus 360 · Accreditation</div>
  <h1>${stdCfg.reportTitle}</h1>
  <div class="sub">${site.name}</div>
  <div class="score-box">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px">Overall compliance</div>
    <div class="score-num">${pct}%</div>
    <div class="score-pills">
      <span style="color:#16a34a">● ${totalCompliant} compliant</span>
      <span style="color:#ca8a04">● ${totalPartial} partial</span>
      <span style="color:#dc2626">● ${totalNc} NC</span>
    </div>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><label>Certificate No.</label><span>${D.service.accreditation?.certNo ?? '—'}</span></div>
    <div class="meta-item"><label>Next assessment</label><span>${D.service.nextAssessment}</span></div>
    <div class="meta-item"><label>Generated</label><span>${dateStr}, ${timeStr}</span></div>
    <div class="meta-item"><label>Prepared by</label><span>${user?.name ?? '—'}</span></div>
    <div class="meta-item"><label>ABN</label><span>${D.service.abn ?? '—'}</span></div>
    <div class="meta-item"><label>Accredited since</label><span>${D.service.accreditation?.since ?? '—'}</span></div>
  </div>
</div>

<div class="section">
  <h2>Compliance summary</h2>
  <div class="sec-sub">ASA Standard March 2019 · ${totalClauses} clauses across ${D.complianceBySection.length} sections</div>
  <div class="stat-row">
    <div class="stat-card"><div class="n">${totalClauses}</div><div class="l">Total clauses</div></div>
    <div class="stat-card good"><div class="n">${totalCompliant}</div><div class="l">Compliant</div></div>
    <div class="stat-card warn"><div class="n">${totalPartial}</div><div class="l">Partial</div></div>
    <div class="stat-card bad"><div class="n">${totalNc}</div><div class="l">Non-conformant</div></div>
  </div>
  <table>
    <thead><tr><th>§</th><th>Section</th><th>Compliant</th><th>Partial</th><th>NC</th><th>Total</th><th>Coverage</th></tr></thead>
    <tbody>${sectionRows}</tbody>
  </table>
</div>

${issueRows ? `<div class="section">
  <h2>Non-conformances &amp; partial compliance</h2>
  <div class="sec-sub">${ncClauses.length} non-conformant · ${partialClauses.length} partial · requires corrective action</div>
  <table>
    <thead><tr><th>Clause</th><th>Title</th><th>Status</th><th>Owner</th><th>Last reviewed</th><th>Evidence</th></tr></thead>
    <tbody>${issueRows}</tbody>
  </table>
</div>` : ''}

${equipRows ? `<div class="section">
  <h2>Equipment — verification overdue</h2>
  <div class="sec-sub">${overdueEquip.length} item${overdueEquip.length > 1 ? 's' : ''} past scheduled verification date</div>
  <table>
    <thead><tr><th>Asset ID</th><th>Name</th><th>Type</th><th>Site</th><th>Last verified</th><th>Due</th></tr></thead>
    <tbody>${equipRows}</tbody>
  </table>
</div>` : ''}

${studyRows ? `<div class="section">
  <h2>Studies pending finalisation</h2>
  <div class="sec-sub">${pendingStudies.length} stud${pendingStudies.length > 1 ? 'ies' : 'y'} not yet finalised · clause 5.8.1</div>
  <table>
    <thead><tr><th>Study ID</th><th>Type</th><th>Physician</th><th>Status</th><th>SLA</th></tr></thead>
    <tbody>${studyRows}</tbody>
  </table>
</div>` : ''}

<div class="footer">
  <span>${D.service.name} · ABN ${D.service.abn ?? '—'}</span>
  <span>Generated by Nexus 360 · ${dateStr}</span>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Fallback if popup blocked: trigger download instead
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-pack-${now.toISOString().slice(0, 10)}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

const WIDGETS = [
  { id: 'stats',            label: 'Key metrics',       desc: 'Compliance %, clauses, SLA, open NCs' },
  { id: 'banner',           label: 'Attention banner',  desc: 'Items requiring immediate action' },
  { id: 'section_coverage', label: 'Section coverage',  desc: 'Compliance heatmap by ASA section' },
  { id: 'reporting_sla',    label: 'Reporting SLA',     desc: 'Studies queue and 10-day SLA status' },
  { id: 'my_tasks',         label: 'My tasks',          desc: 'Tasks currently assigned to you' },
  { id: 'recent_activity',  label: 'Recent activity',   desc: 'Latest audit trail entries' },
];

function useDashboardPrefs(userEmail) {
  const key = `nexus_dash_${userEmail ?? 'default'}`;
  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? []; } catch { return []; }
  });
  const toggle = (id) => setHidden(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  });
  return { hidden, toggle };
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomePage = ({ data: D, goTo, openClause }) => {
  const { user } = useAuth();
  const { activeStandard } = useNexusData();
  const stdCfg = getStdCfg(activeStandard);
  const { site } = useLocation();
  const { tasks, openCreateTask } = useTaskContext();
  const { hidden, toggle } = useDashboardPrefs(user?.email);
  const [customizing, setCustomizing] = useState(false);
  const firstName = user?.name?.split(' ')[0] ?? user?.name ?? '';
  const myTasks = tasks.filter(t => t.assignedTo === user?.name && t.status !== 'done').slice(0, 6);
  const criticalCount = tasks.filter(t => t.status !== 'done' && t.priority === 'critical').length;

  const totalClauses = D.complianceBySection.reduce((s, x) => s + x.total, 0);
  const totalCompliant = D.complianceBySection.reduce((s, x) => s + x.compliant, 0);
  const totalPartial = D.complianceBySection.reduce((s, x) => s + x.partial, 0);
  const totalNc = D.complianceBySection.reduce((s, x) => s + x.nc, 0);
  const pct = ((totalCompliant / totalClauses) * 100).toFixed(1);

  const show = (id) => !hidden.includes(id);

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        title={site.name}
        subtitle={`${stdCfg.assessmentLabel} in ${D.service.daysToAssessment} days · ${D.service.nextAssessment}`}
        actions={
          <>
            <div style={{ position: 'relative' }}>
              <button className="btn" onClick={() => setCustomizing(o => !o)}>
                <Icon name="settings" size={14} />Customise
              </button>
              {customizing && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setCustomizing(false)} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    width: 290, background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 60, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>Customise dashboard</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Choose which widgets to display</div>
                    </div>
                    {WIDGETS.map(w => (
                      <div key={w.id} onClick={() => toggle(w.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
                        cursor: 'pointer', borderBottom: '1px solid var(--border)',
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{w.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{w.desc}</div>
                        </div>
                        <div style={{
                          width: 32, height: 18, borderRadius: 9, flexShrink: 0,
                          background: show(w.id) ? 'var(--accent)' : 'var(--surface-3)',
                          position: 'relative', transition: 'background 0.2s',
                        }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, transition: 'left 0.15s',
                            left: show(w.id) ? 16 : 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        }
      />

      {/* Top stats */}
      {show('stats') && <div className="stat-grid">
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
      </div>}

      {show('stats') && <div className="spacer-md" />}

      {/* Banner */}
      {show('banner') && <div className="banner warn">
        <Icon name="alert" size={18} />
        <div style={{ flex: 1 }}>
          <strong>3 items need attention before {stdCfg.bodyName} assessment.</strong> &nbsp;
          HSAT-NOX-014 verification overdue · 4 staff BLS lapsed · 1 subcontractor evidence missing.
        </div>
        <button className="btn btn-ghost" onClick={() => goTo('tasks')}>Review &nbsp;<Icon name="arrow_right" size={13} /></button>
      </div>}

      {(show('banner') || show('stats')) && <div className="spacer-md" />}

      {/* Two-column main */}
      <div className="grid-2-1">
        <div className="col">
          {/* Compliance heatmap */}
          {show('section_coverage') && <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Section coverage</div>
                <div className="card-sub">{stdCfg.standardShort} {stdCfg.standardVersion} · click any section to drill in</div>
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
          </div>}

          {/* Studies queue snapshot */}
          {show('reporting_sla') && <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Reporting SLA · 10 business-day window</div>
                <div className="card-sub">Studies awaiting sign-off — clause 5.8.1</div>
              </div>
              <div className="topbar-spacer" />
              <button className="btn btn-ghost" onClick={() => goTo('studies')}>Open queue<Icon name="arrow_right" size={13} /></button>
            </div>
            <NexusGrid
              pageSize={0}
              rowData={D.studies.filter(s => s.status !== "Final").slice(0, 5)}
              columnDefs={[
                {
                  headerName: 'Study', field: 'id', width: 120,
                  cellRenderer: p => <span className="mono">{p.value}</span>,
                },
                { headerName: 'Type', field: 'type', flex: 1 },
                { headerName: 'Reporting physician', field: 'physician', flex: 2 },
                {
                  headerName: 'Status', field: 'status', width: 160,
                  cellRenderer: p => (
                    <Pill kind={p.value === 'Awaiting sign-off' ? 'warn' : p.value === 'Preliminary' ? 'info' : 'outline'}>
                      {p.value}
                    </Pill>
                  ),
                },
                {
                  headerName: 'SLA', field: 'due', width: 160, sortable: false,
                  cellRenderer: p => (
                    <div className="sla">
                      <div className="sla-bar">
                        <div className="sla-bar-fill" style={{
                          width: `${Math.min(100, ((10 - p.value) / 10) * 100)}%`,
                          background: p.data.sla === 'bad' ? 'var(--bad)' : p.data.sla === 'warn' ? 'var(--warn)' : 'var(--good)',
                        }} />
                      </div>
                      <span style={{ color: p.data.sla === 'bad' ? 'var(--bad)' : p.data.sla === 'warn' ? 'var(--warn)' : 'var(--ink-3)' }}>
                        {p.value === 0 ? 'Due today' : p.value > 0 ? `${p.value}d left` : `${Math.abs(p.value)}d over`}
                      </span>
                    </div>
                  ),
                },
              ]}
              onRowClicked={() => goTo('studies')}
            />
          </div>}
        </div>

        {/* Right column */}
        <div className="col">
          {show('my_tasks') && <div className="card">
            <div className="card-head">
              <div className="card-title">My tasks</div>
              <div className="topbar-spacer" />
              {criticalCount > 0 && <Pill kind="bad">{criticalCount} critical</Pill>}
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => goTo('tasks')}>All tasks</button>
            </div>
            <div>
              {myTasks.length === 0 ? (
                <div style={{ padding: '20px 18px', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>No open tasks assigned to you.</div>
              ) : myTasks.map(t => {
                const diff = Math.round((new Date(t.dueDate) - new Date()) / 86400000);
                const dueText = diff < 0 ? `Overdue ${Math.abs(diff)}d` : diff === 0 ? 'Due today' : `Due in ${diff}d`;
                const dueColor = diff <= 0 ? 'var(--bad)' : diff <= 3 ? 'var(--warn)' : 'var(--ink-3)';
                return (
                  <div key={t.id} style={{ padding: '11px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span style={{ color: dueColor }}>{dueText}</span>
                        {t.clause && <><span>·</span><span className="mono" style={{ cursor: 'pointer', color: 'var(--accent-ink)' }} onClick={() => openClause(t.clause)}>cl. {t.clause}</span></>}
                      </div>
                    </div>
                    <span className={`pill ${t.priority === 'critical' ? 'bad' : t.priority === 'high' ? 'warn' : 'outline'}`}>
                      {t.priority}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)' }}>
              <button className="btn" style={{ fontSize: 11, width: '100%' }} onClick={() => openCreateTask({ assignedTo: user?.name, sourceType: 'manual' })}>
                <Icon name="plus" size={12} />New task
              </button>
            </div>
          </div>}

          {show('recent_activity') && <div className="card">
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
          </div>}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
