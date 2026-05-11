import React, { useState } from 'react';
import NEXUS_DATA from '../data';
import Icon from '../icons';
import { PageHeader, Pill, Tabs } from '../components';

const EquipmentPage = () => {
  const D = NEXUS_DATA;
  const [tab, setTab] = useState("register");
  const [filter, setFilter] = useState("all");

  const filtered = D.equipment.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return e.verifyStatus === 'bad';
    if (filter === 'soon') return e.verifyStatus === 'warn';
    return true;
  });

  const overdueCount = D.equipment.filter(e => e.verifyStatus === 'bad').length;
  const soonCount = D.equipment.filter(e => e.verifyStatus === 'warn').length;

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Operations · cl. 5.3.1 – 5.3.7"
        title="Equipment register"
        subtitle="ARTG-listed devices · acceptance, verification, maintenance, retention life + 7 yrs"
        actions={
          <>
            <button className="btn"><Icon name="download" size={14} />Export register</button>
            <button className="btn btn-primary"><Icon name="plus" size={14} />Add equipment</button>
          </>
        }
      />

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="cube" size={13} />Items in service</div>
          <div className="stat-value">{D.equipment.length}</div>
          <div className="stat-meta">across 3 sites</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="check" size={13} />Verification on time</div>
          <div className="stat-value">96.8%</div>
          <div className="stat-meta up">target ≥ 95%</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Overdue</div>
          <div className="stat-value" style={{ color: overdueCount ? 'var(--bad)' : undefined }}>{overdueCount}</div>
          <div className="stat-meta">requires immediate action</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="clock" size={13} />Due ≤ 30 days</div>
          <div className="stat-value">{soonCount}</div>
          <div className="stat-meta">scheduling required</div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "register", label: "Register", count: D.equipment.length },
        { id: "verify", label: "Verification schedule" },
        { id: "incidents", label: "Adverse incidents", count: 1 },
        { id: "consumables", label: "Consumables" },
      ]} />

      {tab === 'register' && (
        <>
          <div className="filter-bar">
            <button className={`chip-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({D.equipment.length})</button>
            <button className={`chip-btn ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')}>Overdue ({overdueCount})</button>
            <button className={`chip-btn ${filter === 'soon' ? 'active' : ''}`} onClick={() => setFilter('soon')}>Due soon ({soonCount})</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-ghost" style={{ fontSize: 12 }}><Icon name="filter" size={13} />Site</button>
            <button className="btn btn-ghost" style={{ fontSize: 12 }}><Icon name="filter" size={13} />Type</button>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Device</th>
                  <th>Site</th>
                  <th>Serial</th>
                  <th>ARTG</th>
                  <th>Last verified</th>
                  <th>Next verification</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="row-clickable">
                    <td><span className="mono" style={{ fontWeight: 500 }}>{e.id}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{e.type}</div>
                    </td>
                    <td className="muted">{e.site}</td>
                    <td className="mono">{e.serial}</td>
                    <td className="mono" style={{ color: e.artg === '—' ? 'var(--ink-4)' : 'var(--ink-2)' }}>{e.artg}</td>
                    <td className="muted">{e.lastVerify}</td>
                    <td>
                      <Pill kind={e.verifyStatus === 'bad' ? 'bad' : e.verifyStatus === 'warn' ? 'warn' : 'good'} dot>
                        {e.nextVerify}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'verify' && (
        <div className="card card-pad">
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Verification calendar — next 90 days</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 4, marginBottom: 12 }}>
            {Array.from({ length: 13 * 5 }).map((_, i) => {
              const r = (i * 17) % 100;
              let bg = 'var(--surface-3)';
              if (r > 92) bg = 'var(--bad)';
              else if (r > 80) bg = 'var(--warn)';
              else if (r > 60) bg = 'var(--accent)';
              else if (r > 40) bg = 'var(--accent-soft)';
              return <div key={i} style={{ aspectRatio: 1, background: bg, borderRadius: 3, opacity: 0.85 }} />;
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--accent-soft)', borderRadius: 2 }} />1 verification</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2 }} />2-3</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--warn)', borderRadius: 2 }} />Due</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--bad)', borderRadius: 2 }} />Overdue</span>
          </div>
        </div>
      )}

      {tab === 'incidents' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Adverse incidents · cl. 5.3.6</div>
              <div className="card-sub">Reported to manufacturer + TGA where applicable</div>
            </div>
          </div>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Asset</th><th>Description</th><th>TGA reported</th><th>Status</th></tr></thead>
            <tbody>
              <tr>
                <td className="muted">04 Apr 2026</td>
                <td className="mono">PSG-COMP-001</td>
                <td>Intermittent EEG channel dropout during overnight study</td>
                <td><Pill kind="good">Yes · TGA-26-1147</Pill></td>
                <td><Pill kind="warn">Investigation</Pill></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'consumables' && (
        <div className="card card-pad">
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Consumables inventory — electrodes, paste, filters, single-use sensors. Reorder thresholds and lot tracking. Currently 47 SKUs across 3 sites; 4 below reorder threshold.
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
