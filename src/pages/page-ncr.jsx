import React, { useState } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Tabs, Donut } from '../components';

const NCRPage = () => {
  const [tab, setTab] = useState("register");
  const [filter, setFilter] = useState("open");

  const items = [
    { id: "NC-2026-0112", title: "Subcontractor scoring evidence missing", source: "Audit", clause: "4.5.2", severity: "High", clinicalSig: "Possible", status: "Open · RCA", owner: "K. Patel", raised: "08 Apr 2026", due: "in 7d" },
    { id: "NC-2026-0111", title: "HSAT-NOX-014 verification overdue 12d", source: "Equipment", clause: "5.3.4", severity: "Critical", clinicalSig: "Yes — recall", status: "Open · CAPA", owner: "M. Chen", raised: "01 Apr 2026", due: "Overdue 2d" },
    { id: "NC-2026-0110", title: "EQA result <80% for scorer J. Owusu", source: "EQA", clause: "5.6.8", severity: "Medium", clinicalSig: "Possible", status: "Open · Investigation", owner: "Dr. R. Okafor", raised: "20 Mar 2026", due: "in 14d" },
    { id: "NC-2026-0109", title: "BLS recert lapsed — 4 staff", source: "Audit", clause: "5.1.4", severity: "High", clinicalSig: "No", status: "Open · CAPA", owner: "M. Chen", raised: "15 Mar 2026", due: "in 7d" },
    { id: "NC-2026-0108", title: "Report delivered after 10 business days × 3", source: "KPI", clause: "5.8.1", severity: "Low", clinicalSig: "No", status: "Effectiveness review", owner: "K. Patel", raised: "05 Mar 2026", due: "in 21d" },
    { id: "NC-2026-0107", title: "Paeds A/V recording retention gap", source: "Audit", clause: "5.3", severity: "Medium", clinicalSig: "No", status: "Open · CAPA", owner: "M. Chen", raised: "02 Mar 2026", due: "in 4d" },
    { id: "NC-2026-0106", title: "Complaint — late results disclosure", source: "Complaint", clause: "4.8", severity: "Medium", clinicalSig: "No", status: "Closed", owner: "K. Patel", raised: "12 Feb 2026", due: "—" },
    { id: "NC-2026-0105", title: "EEG cable fault during overnight study", source: "Equipment", clause: "5.3.6", severity: "Medium", clinicalSig: "No — study repeated", status: "Closed", owner: "M. Chen", raised: "08 Feb 2026", due: "—" },
  ];

  const sevKind = { Critical: "bad", High: "warn", Medium: "info", Low: "outline" };
  const filtered = items.filter(i => filter === 'all' ? true : filter === 'closed' ? i.status === 'Closed' : i.status !== 'Closed');

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · cl. 4.9, 4.10, 4.11"
        title="Nonconformance & CAPA"
        subtitle="NC register · root-cause analysis · corrective & preventive actions with effectiveness review"
        actions={
          <>
            <button className="btn"><Icon name="chart" size={14} />Trend report</button>
            <button className="btn btn-primary"><Icon name="plus" size={14} />Raise NC</button>
          </>
        }
      />

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Open NCs</div>
          <div className="stat-value">{items.filter(i => i.status !== 'Closed').length}</div>
          <div className="stat-meta" style={{ color: 'var(--bad)' }}>1 critical</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="clock" size={13} />Avg time to close</div>
          <div className="stat-value">14<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, marginLeft: 4 }}>days</span></div>
          <div className="stat-meta up">3d faster than Q4</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="check" size={13} />Effectiveness verified</div>
          <div className="stat-value">94%</div>
          <div className="stat-meta">31 of 33 closed CAPAs</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="pulse" size={13} />Sources (12 mo)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Donut size={50} stroke={9} segments={[
              { value: 12, color: 'var(--accent)' },
              { value: 9, color: 'var(--warn)' },
              { value: 7, color: 'var(--good)' },
              { value: 5, color: 'var(--bad)' },
              { value: 5, color: 'var(--info)' },
            ]} />
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              Audit · Eqp · KPI<br />Cmplnt · EQA
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "register", label: "Register", count: items.length },
        { id: "rca", label: "Root cause" },
        { id: "trends", label: "Trends" },
      ]} />

      {tab === "register" && (
        <>
          <div className="filter-bar">
            <button className={`chip-btn ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')}>Open</button>
            <button className={`chip-btn ${filter === 'closed' ? 'active' : ''}`} onClick={() => setFilter('closed')}>Closed</button>
            <button className={`chip-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{filtered.length} items</span>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr><th>NC ID</th><th>Title</th><th>Source</th><th>Clause</th><th>Severity</th><th>Clinical sig.</th><th>Status</th><th>Owner</th><th>Due</th></tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} className="row-clickable">
                    <td className="mono" style={{ fontWeight: 500 }}>{n.id}</td>
                    <td>{n.title}</td>
                    <td className="muted">{n.source}</td>
                    <td className="mono">{n.clause}</td>
                    <td><Pill kind={sevKind[n.severity]}>{n.severity}</Pill></td>
                    <td style={{ fontSize: 12, color: n.clinicalSig.includes("Yes") ? 'var(--bad)' : 'var(--ink-3)' }}>{n.clinicalSig}</td>
                    <td><Pill kind={n.status === 'Closed' ? 'good' : 'warn'}>{n.status}</Pill></td>
                    <td style={{ fontSize: 12 }}>{n.owner}</td>
                    <td style={{ fontSize: 12, color: n.due.includes("Overdue") ? 'var(--bad)' : 'var(--ink-3)' }}>{n.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "rca" && (
        <div className="card card-pad">
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>NC-2026-0111 · HSAT-NOX-014 verification overdue 12d</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 18 }}>5-Whys root cause analysis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { q: "Why was the verification missed?", a: "Calendar reminder did not trigger for the device" },
              { q: "Why didn't the reminder trigger?", a: "Device was assigned to retired location 'Eastside-temp'" },
              { q: "Why was it still assigned to that location?", a: "Site move in Feb 2026 didn't reassign mobile HSAT devices" },
              { q: "Why didn't the site move include mobile devices?", a: "SOP-EQP-009 (Site change) doesn't cover loaned/mobile equipment" },
              { q: "Why doesn't the SOP cover them?", a: "Mobile HSAT fleet introduced after SOP last reviewed (2023)" },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i+1}</div>
                <div style={{ flex: 1, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>{step.q}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{step.a}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 14, background: 'var(--good-soft)', color: 'var(--good)', borderRadius: 8, fontSize: 13 }}>
              <strong>Root cause:</strong> SOP-EQP-009 doesn't cover mobile equipment, and inventory location ontology lacks a "mobile fleet" concept.
            </div>
            <div className="grid-2" style={{ marginTop: 8 }}>
              <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Corrective action · cl. 4.10</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Re-verify HSAT-NOX-014 and recall affected studies</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Owner: M. Chen · Due: 14 May</div>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Preventive action · cl. 4.11</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Update SOP-EQP-009 to cover mobile fleet</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Owner: K. Patel · Due: 28 May</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "trends" && (
        <div className="card card-pad">
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>NCs raised, last 12 months</div>
          <div className="bar-chart" style={{ height: 160 }}>
            {[6,4,5,7,3,4,8,5,6,4,3,5].map((v, i) => (
              <div key={i} className="bar-col">
                <div className="bar" style={{ height: `${v * 18}px`, background: i === 11 ? 'var(--accent)' : 'var(--accent-soft)' }} />
                <div className="bar-label">{["M","J","J","A","S","O","N","D","J","F","M","A"][i]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NCRPage;
