import React, { useState } from 'react';
import Icon from '../icons';
import { PageHeader, Pill } from '../components';

const DocumentsPage = () => {
  const [tab, setTab] = useState("all");
  const [folder, setFolder] = useState("sops");

  const folders = [
    { id: "manual", name: "Quality manual", count: 1, icon: "book" },
    { id: "policies", name: "Policies", count: 14, icon: "shield" },
    { id: "sops", name: "SOPs", count: 86, icon: "file" },
    { id: "forms", name: "Forms", count: 42, icon: "clipboard" },
    { id: "records", name: "Records", count: 1284, icon: "paper" },
    { id: "obsolete", name: "Archived", count: 38, icon: "x" },
  ];

  const docs = [
    { id: "SOP-PSG-031", title: "Pre-study bio-signal verification", v: "3.2", status: "Issued", reviewDue: "12 Mar 2027", owner: "M. Chen", clauses: ["5.3.4", "5.5.2"], updated: "21 Apr 2026" },
    { id: "SOP-PSG-014", title: "Adult attended PSG protocol", v: "3.2", status: "Issued", reviewDue: "08 Jul 2026", owner: "Dr. R. Okafor", clauses: ["5.5.3"], updated: "14 Apr 2026" },
    { id: "SOP-PED-007", title: "Paediatric attended PSG protocol", v: "2.1", status: "Issued", reviewDue: "22 Sep 2026", owner: "Dr. L. Hartono", clauses: ["5.5.3.2", "5.8.5"], updated: "18 Mar 2026" },
    { id: "SOP-EQP-004", title: "Equipment acceptance testing", v: "1.4", status: "Issued", reviewDue: "01 Jun 2026", owner: "M. Chen", clauses: ["5.3.2"], updated: "30 Mar 2026" },
    { id: "SOP-EQP-012", title: "Decontamination of removed equipment", v: "2.0", status: "Under review", reviewDue: "Overdue 8d", owner: "M. Chen", clauses: ["5.3.5"], updated: "08 Apr 2026" },
    { id: "SOP-CPAP-002", title: "Split-night titration protocol", v: "1.2", status: "Issued", reviewDue: "15 Jan 2027", owner: "Dr. R. Okafor", clauses: ["5.5.3.4"], updated: "20 Feb 2026" },
    { id: "SOP-EMG-001", title: "Emergency & escalation protocol", v: "4.0", status: "Draft", reviewDue: "—", owner: "K. Patel", clauses: ["5.5.1"], updated: "today" },
    { id: "POL-QMS-001", title: "Quality policy", v: "2.3", status: "Issued", reviewDue: "31 Dec 2026", owner: "Dr. R. Okafor", clauses: ["4.2.1"], updated: "15 Jan 2026" },
    { id: "POL-CONF-002", title: "Confidentiality & data handling", v: "1.5", status: "Issued", reviewDue: "20 Nov 2026", owner: "K. Patel", clauses: ["4.1.6", "4.13"], updated: "20 Nov 2025" },
    { id: "FRM-CoI-2026", title: "Conflict of interest declaration 2026", v: "—", status: "Live form", reviewDue: "annual", owner: "K. Patel", clauses: ["4.1.5"], updated: "01 Jan 2026" },
  ];

  const statusKind = (s) => ({ "Issued": "good", "Draft": "outline", "Under review": "warn", "Live form": "info", "Obsolete": "bad" }[s] || "outline");

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · cl. 4.2, 4.3"
        title="Documents & SOPs"
        subtitle="Quality manual → policies → SOPs → forms → records · controlled, versioned, audited"
        actions={
          <>
            <button className="btn"><Icon name="upload" size={14} />Upload</button>
            <button className="btn btn-primary"><Icon name="plus" size={14} />New document</button>
          </>
        }
      />

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="file" size={13} />Controlled documents</div>
          <div className="stat-value">147</div>
          <div className="stat-meta">85% reviewed in cycle</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="clock" size={13} />Due for review &lt; 30d</div>
          <div className="stat-value">9</div>
          <div className="stat-meta">target 24-month cycle</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Overdue review</div>
          <div className="stat-value" style={{ color: 'var(--bad)' }}>2</div>
          <div className="stat-meta">SOP-EQP-012 · POL-VAL-003</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="edit" size={13} />Drafts in progress</div>
          <div className="stat-value">5</div>
          <div className="stat-meta">3 awaiting approval</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18 }}>
        {/* Folder tree */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-pad" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 10 }}>QMS hierarchy</div>
            {folders.map(f => (
              <div key={f.id}
                onClick={() => setFolder(f.id)}
                className={`nav-item ${folder === f.id ? 'active' : ''}`}
                style={{ fontSize: 13, marginBottom: 2 }}>
                <span className="icon"><Icon name={f.icon} size={14} /></span>
                <span style={{ flex: 1 }}>{f.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{f.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document table */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">{folders.find(f => f.id === folder)?.name}</div>
            <div className="topbar-spacer" />
            <div className="search" style={{ width: 200 }}>
              <Icon name="search" size={12} />
              <span>Filter documents</span>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Doc ID</th>
                <th>Title</th>
                <th>Version</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Clauses</th>
                <th>Review due</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} className="row-clickable">
                  <td className="mono" style={{ fontWeight: 500 }}>{d.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Updated {d.updated}</div>
                  </td>
                  <td className="mono">v{d.v}</td>
                  <td><Pill kind={statusKind(d.status)} dot>{d.status}</Pill></td>
                  <td style={{ fontSize: 12 }}>{d.owner}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {d.clauses.map(c => <span key={c} className="mono" style={{ fontSize: 10, padding: '1px 5px', background: 'var(--surface-2)', borderRadius: 3, color: 'var(--ink-2)' }}>{c}</span>)}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: d.reviewDue.includes("Overdue") ? 'var(--bad)' : 'var(--ink-3)' }}>
                      {d.reviewDue}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval workflow visualisation */}
      <div className="spacer-md" />
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Approval workflow · SOP-EMG-001 v4.0</div>
            <div className="card-sub">Draft → Review → Approval → Issue → Periodic review → Archive</div>
          </div>
        </div>
        <div className="card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {[
              { name: "Draft", who: "K. Patel", date: "today", done: true, active: true },
              { name: "Peer review", who: "M. Chen", date: "—", done: false },
              { name: "Approval", who: "Dr. R. Okafor", date: "—", done: false },
              { name: "Issue", who: "Auto", date: "—", done: false },
              { name: "Periodic review", who: "+24 mo", date: "—", done: false },
            ].map((s, i, arr) => (
              <React.Fragment key={i}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14, margin: '0 auto',
                    background: s.done ? 'var(--good)' : s.active ? 'var(--accent)' : 'var(--surface-3)',
                    color: 'white', display: 'grid', placeItems: 'center'
                  }}>
                    {s.done ? <Icon name="check" size={14} /> : <span style={{ fontSize: 12 }}>{i+1}</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginTop: 6 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.who}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{s.date}</div>
                </div>
                {i < arr.length - 1 && <div style={{ width: 40, height: 1, background: arr[i+1].done ? 'var(--good)' : 'var(--border)', marginBottom: 28 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
