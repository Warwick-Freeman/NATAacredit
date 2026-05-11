import React, { useState } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs } from '../components';

const AuditsPage = () => {
  const [tab, setTab] = useState("audits");

  const audits = [
    { id: "AUD-2026-Q1", area: "Section 5.3 — Equipment", date: "11 Feb 2026", auditor: "K. Patel", findings: 3, status: "Closed", scope: "All sites" },
    { id: "AUD-2026-Q2", area: "Section 4.3 — Document control", date: "08 May 2026", auditor: "External · J. Roy", findings: 0, status: "In progress", scope: "Riverside Main" },
    { id: "AUD-2025-Q4", area: "Section 5.5 — Service processes", date: "12 Nov 2025", auditor: "K. Patel", findings: 5, status: "Closed", scope: "All sites" },
    { id: "AUD-2025-Q3", area: "Section 4.13 — Records & audit trail", date: "14 Aug 2025", auditor: "External · J. Roy", findings: 2, status: "Closed", scope: "All sites" },
    { id: "AUD-2025-Q2", area: "Section 5.1 — Staff & training", date: "10 May 2025", auditor: "K. Patel", findings: 1, status: "Closed", scope: "All sites" },
  ];

  const mgmtInputs = [
    { name: "Referral review", status: "complete", count: "1,284 referrals" },
    { name: "Patient & referrer feedback", status: "complete", count: "412 responses" },
    { name: "Staff suggestions", status: "complete", count: "23 ideas" },
    { name: "Internal & external audits", status: "complete", count: "4 audits, 11 findings" },
    { name: "Risk register review", status: "complete", count: "32 risks tracked" },
    { name: "Quality indicators", status: "complete", count: "12 KPIs" },
    { name: "External assessment results", status: "complete", count: "1 surveillance" },
    { name: "EQA / proficiency testing", status: "complete", count: "10 events" },
    { name: "Complaints summary", status: "complete", count: "8 complaints" },
    { name: "Supplier performance", status: "in-progress", count: "5 of 7 suppliers" },
    { name: "NC / CAPA status", status: "complete", count: "7 open, 31 closed" },
    { name: "Prior actions follow-up", status: "complete", count: "9 of 9 closed" },
    { name: "Scope / staff / premises changes", status: "complete", count: "2 changes" },
    { name: "Improvement recommendations", status: "in-progress", count: "draft" },
    { name: "Resource adequacy", status: "pending", count: "—" },
  ];

  const stKind = (s) => ({ complete: "good", "in-progress": "warn", pending: "outline" }[s]);

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · cl. 4.14, 4.15"
        title="Audits & management review"
        subtitle="Rolling 12-month internal audit cycle and the annual management review pack"
        actions={
          <>
            <button className="btn"><Icon name="calendar" size={14} />Audit calendar</button>
            <button className="btn btn-primary"><Icon name="sparkle" size={14} />Auto-assemble Q2 review pack</button>
          </>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "audits", label: "Internal audits", count: audits.length },
        { id: "mgmt", label: "Management review", count: 4 },
        { id: "risk", label: "Risk register", count: 32 },
        { id: "improve", label: "Continual improvement", count: 23 },
      ]} />

      {tab === "audits" && (
        <>
          {/* 12-month audit wheel */}
          <div className="grid-2-1" style={{ marginBottom: 18 }}>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">12-month audit cycle</div>
                  <div className="card-sub">Pre-study · study · post-study processes</div>
                </div>
                <div className="topbar-spacer" />
                <Pill kind="good">8 of 12 areas audited</Pill>
              </div>
              <div className="card-pad">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
                  {["May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr"].map((m, i) => {
                    const states = [1,0,2,1,0,2,1,1,0,1,2,0];
                    const colors = ['var(--accent-soft)','var(--good)','var(--warn)'];
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>{m}</div>
                        <div style={{ aspectRatio: 1, background: colors[states[i]], borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}>
                          {states[i] === 1 ? '✓' : states[i] === 2 ? '!' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, color: 'var(--ink-3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--good)', borderRadius: 3 }} />Audited & closed</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--warn)', borderRadius: 3 }} />Findings open</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--accent-soft)', borderRadius: 3 }} />Scheduled</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title">Auditor independence · cl. 4.14.3</div></div>
              <div className="card-pad">
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>Auditors cannot audit their own area of work.</div>
                {[
                  { who: "K. Patel", role: "QM · audits non-QMS areas", ok: true },
                  { who: "M. Chen", role: "Sr Tech · audits non-equipment areas", ok: true },
                  { who: "Dr. F. Liu", role: "Reporting physician · audits documentation", ok: true },
                  { who: "External · J. Roy", role: "Independent — broad scope", ok: true },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i === 3 ? 'none' : '1px solid var(--border)' }}>
                    <Avatar name={a.who} size={22} idx={i+1} />
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

          <div className="card">
            <table className="tbl">
              <thead>
                <tr><th>Audit ID</th><th>Area</th><th>Auditor</th><th>Date</th><th>Scope</th><th>Findings</th><th>Status</th></tr>
              </thead>
              <tbody>
                {audits.map(a => (
                  <tr key={a.id} className="row-clickable">
                    <td className="mono" style={{ fontWeight: 500 }}>{a.id}</td>
                    <td>{a.area}</td>
                    <td>{a.auditor}</td>
                    <td className="muted">{a.date}</td>
                    <td className="muted">{a.scope}</td>
                    <td>{a.findings > 0 ? <Pill kind="warn">{a.findings} findings</Pill> : <Pill kind="good">0 findings</Pill>}</td>
                    <td><Pill kind={a.status === "Closed" ? "good" : "info"}>{a.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "mgmt" && (
        <>
          <div className="banner info" style={{ marginBottom: 18 }}>
            <Icon name="sparkle" size={18} />
            <div style={{ flex: 1 }}>
              <strong>Q2 2026 management review · 12 May 2026 (in 1 day).</strong>
              <div style={{ fontSize: 12, marginTop: 2 }}>Pack auto-assembles every cl. 4.15.2 input. 13 of 15 inputs ready.</div>
            </div>
            <button className="btn"><Icon name="download" size={14} />Preview pack</button>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">cl. 4.15.2 input checklist</div>
              <div className="topbar-spacer" />
              <Pill kind="good">{mgmtInputs.filter(i => i.status === 'complete').length} ready</Pill>
              <Pill kind="warn">{mgmtInputs.filter(i => i.status === 'in-progress').length} in progress</Pill>
              <Pill kind="outline">{mgmtInputs.filter(i => i.status === 'pending').length} pending</Pill>
            </div>
            <div>
              {mgmtInputs.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i === mgmtInputs.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: m.status === 'complete' ? 'var(--good)' : m.status === 'in-progress' ? 'var(--warn)' : 'var(--surface-3)', color: 'white', display: 'grid', placeItems: 'center' }}>
                    {m.status === 'complete' ? <Icon name="check" size={12} /> : m.status === 'in-progress' ? <Icon name="clock" size={11} /> : null}
                  </div>
                  <div style={{ flex: 1, fontSize: 13 }}>{m.name}</div>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.count}</span>
                  <Pill kind={stKind(m.status)}>{m.status}</Pill>
                </div>
              ))}
            </div>
          </div>

          <div className="spacer-md" />

          <div className="grid-2">
            <div className="card">
              <div className="card-head"><div className="card-title">Outputs — decisions & actions</div></div>
              <div className="card-pad">
                <div className="timeline">
                  {[
                    { h: "Recruit additional paediatric scoring tech", who: "Dr. L. Hartono", due: "by Q3 2026" },
                    { h: "Replace HSAT-NOX-014 (verification failure)", who: "M. Chen", due: "by 30 May 2026" },
                    { h: "Quarterly κ review meeting cadence", who: "K. Patel", due: "ongoing" },
                    { h: "External audit of Section 5.6 by Sep 2026", who: "K. Patel", due: "by Sep 2026" },
                  ].map((o, i) => (
                    <div key={i} className="timeline-item">
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{o.h}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{o.who} · {o.due}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title">Attendees</div></div>
              <div className="card-pad">
                {[
                  { who: "Dr. R. Okafor", role: "Medical Director · Chair" },
                  { who: "Dr. L. Hartono", role: "Paediatric Sleep Physician" },
                  { who: "K. Patel", role: "Quality Manager" },
                  { who: "M. Chen", role: "Senior Technologist" },
                  { who: "F. Olsson", role: "Service Manager" },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i === 4 ? 'none' : '1px solid var(--border)' }}>
                    <Avatar name={a.who} size={26} idx={i} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.who}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "risk" && (
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Risk</th><th>Domain</th><th>Likelihood</th><th>Impact</th><th>Score</th><th>Treatment</th></tr></thead>
            <tbody>
              {[
                { r: "Single Senior Tech availability", d: "Workforce", l: 3, i: 4, t: "Cross-training plan" },
                { r: "HSAT calibration drift in field", d: "Equipment", l: 4, i: 3, t: "Quarterly verification" },
                { r: "Paediatric scorer EQA gap", d: "QA", l: 3, i: 3, t: "Schedule EQA Q3" },
                { r: "Vendor PSG software upgrade", d: "IT", l: 2, i: 4, t: "Re-validation plan" },
                { r: "After-hours emergency response", d: "Clinical", l: 1, i: 5, t: "On-call roster" },
              ].map((row, i) => {
                const score = row.l * row.i;
                const kind = score >= 12 ? "bad" : score >= 6 ? "warn" : "good";
                return (
                  <tr key={i}><td>{row.r}</td><td className="muted">{row.d}</td><td>{row.l}/5</td><td>{row.i}/5</td><td><Pill kind={kind}>{score}</Pill></td><td className="muted">{row.t}</td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "improve" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {["Ideas", "Trial", "Implementing", "Outcome"].map((col, i) => (
            <div key={col} className="card" style={{ background: 'var(--surface-2)' }}>
              <div className="card-head" style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{col}</div>
                <div className="topbar-spacer" />
                <Pill kind="outline">{[8,6,5,4][i]}</Pill>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ["Pre-study SMS reminders", "Voice-controlled event log", "AI-assisted scoring QC", "Shared paeds parent app"],
                  ["Triage chatbot (3-mo trial)", "New HSAT pre-screen", "Concordance dashboard"],
                  ["FHIR direct reporting", "BLS quarterly drills"],
                  ["Provisional CPAP workflow"],
                ][i].slice(0,3).map((t, j) => (
                  <div key={j} style={{ padding: 10, background: 'var(--surface)', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 500 }}>{t}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>Suggested by {["P. Tan", "A. Singh", "M. Chen", "K. Patel"][j]}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditsPage;
