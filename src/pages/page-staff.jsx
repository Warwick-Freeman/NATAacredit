import React, { useState } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs, Drawer } from '../components';
import StaffFormDrawer from '../staff-form-drawer';
import { useTaskContext } from '../TaskContext';
import NexusGrid from '../nexus-grid';
import { useAuth, ALL_SITES } from '../AuthContext';

const INITIAL_STAFF = [
  { name: "Dr. R. Okafor",  role: "Medical Director",           site: "All",              bls: { ok: true,  expires: "Aug 2026"   }, eqa: "—",                training: 100 },
  { name: "Dr. L. Hartono", role: "Paediatric Sleep Physician", site: "Eastside Paed.",   bls: { ok: true,  expires: "Sep 2026"   }, eqa: "—",                training: 100, paedsBLS: true },
  { name: "Dr. F. Liu",     role: "Reporting Physician",        site: "All",              bls: { ok: true,  expires: "Nov 2026"   }, eqa: "—",                training: 95  },
  { name: "K. Patel",       role: "Quality Manager",            site: "All",              bls: { ok: true,  expires: "Jul 2026"   }, eqa: "—",                training: 100 },
  { name: "M. Chen",        role: "Senior Technologist",        site: "Riverside Main",   bls: { ok: true,  expires: "Mar 2027"   }, eqa: "Current · 96%",   training: 100, rpsgt: true },
  { name: "A. Singh",       role: "Scoring Technologist",       site: "Riverside Main",   bls: { ok: true,  expires: "Jun 2026"   }, eqa: "Current · 91%",   training: 92,  rpsgt: true },
  { name: "J. Owusu",       role: "Scoring Technologist",       site: "Eastside Paed.",   bls: { ok: false, expires: "Lapsed 14d" }, eqa: "Investigate · 78%", training: 88 },
  { name: "P. Tan",         role: "Recording Tech",             site: "Riverside Main",   bls: { ok: true,  expires: "May 2026"   }, eqa: "—",                training: 90  },
  { name: "S. Nakamura",    role: "Recording Tech",             site: "Eastside Paed.",   bls: { ok: false, expires: "Lapsed 3d"  }, eqa: "—",                training: 85, paedsBLS: true },
  { name: "L. Diaz",        role: "Reception / Bookings",       site: "All",              bls: { ok: true,  expires: "Aug 2026"   }, eqa: "—",                training: 100 },
  { name: "T. Brooks",      role: "Recording Tech",             site: "Home Service N.",  bls: { ok: false, expires: "Lapsed 21d" }, eqa: "—",                training: 76  },
  { name: "R. Patel",       role: "Recording Tech",             site: "Riverside Main",   bls: { ok: false, expires: "Lapsed 7d"  }, eqa: "—",                training: 82  },
];

const StaffPage = () => {
  const { openCreateTask } = useTaskContext();
  const { userSites } = useAuth();
  const [tab, setTab]         = useState("staff");
  const [staff, setStaff]     = useState(() => {
    if (userSites.length === 0) return INITIAL_STAFF;
    const allowedAbbrs = new Set(ALL_SITES.filter(s => userSites.includes(s.name)).map(s => s.abbr));
    return INITIAL_STAFF.filter(p => p.site === 'All' || allowedAbbrs.has(p.site));
  });
  // null = closed, {} = add new, {...} = edit existing
  const [formTarget, setFormTarget] = useState(null);

  const openAdd  = () => setFormTarget({});
  const openEdit = (member) => setFormTarget(member);
  const closeForm = () => setFormTarget(null);

  const handleSave = (saved) => {
    setStaff(prev => {
      const isEdit = formTarget && formTarget.name;
      if (isEdit) {
        return prev.map(s => s.name === formTarget.name ? saved : s);
      }
      return [...prev, saved];
    });
    closeForm();
  };

  const blsLapsed  = staff.filter(s => !s.bls.ok);
  const avgTraining = Math.round(staff.reduce((s, x) => s + x.training, 0) / staff.length);

  const staffColumnDefs = [
    {
      headerName: 'Staff',
      field: 'name',
      flex: 2,
      cellRenderer: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={p.data.name} size={28} idx={staff.indexOf(p.data)} />
          <div style={{ fontWeight: 500 }}>{p.data.name}</div>
        </div>
      ),
    },
    {
      headerName: 'Role',
      field: 'role',
      flex: 2,
      cellRenderer: p => <span style={{ fontSize: 12 }}>{p.value}</span>,
    },
    {
      headerName: 'Site',
      field: 'site',
      flex: 1,
      cellRenderer: p => <span className="muted">{p.value}</span>,
    },
    {
      headerName: 'Credentials',
      field: 'name',
      width: 160,
      sortable: false,
      cellRenderer: p => (
        <div style={{ display: 'flex', gap: 4 }}>
          {p.data.rpsgt    && <Pill kind="info">RPSGT</Pill>}
          {p.data.paedsBLS && <Pill kind="accent">Paeds BLS</Pill>}
        </div>
      ),
    },
    {
      headerName: 'BLS',
      field: 'bls',
      width: 160,
      cellRenderer: p => (
        <Pill kind={p.value.ok ? "good" : "bad"} dot>{p.value.expires}</Pill>
      ),
    },
    {
      headerName: 'EQA / κ',
      field: 'eqa',
      width: 160,
      cellRenderer: p => (
        <span style={{ fontSize: 12, color: p.value.includes("Investigate") ? 'var(--bad)' : 'var(--ink-2)' }}>
          {p.value}
        </span>
      ),
    },
    {
      headerName: 'Training',
      field: 'training',
      width: 150,
      cellRenderer: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="progress" style={{ width: 80 }}>
            <div
              className={`progress-bar ${p.value >= 95 ? 'good' : p.value >= 85 ? 'warn' : 'bad'}`}
              style={{ width: `${p.value}%` }}
            />
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.value}%</span>
        </div>
      ),
    },
  ];

  const blsRowData = staff.filter(s => !s.bls.ok || s.bls.expires.includes("2026"));

  const blsColumnDefs = [
    {
      headerName: 'Staff',
      field: 'name',
      flex: 2,
      cellRenderer: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={p.data.name} idx={blsRowData.indexOf(p.data) + 2} size={22} />
          {p.data.name}
        </div>
      ),
    },
    {
      headerName: 'BLS expires',
      field: 'bls',
      width: 160,
      cellRenderer: p => (
        <Pill kind={p.value.ok ? "warn" : "bad"} dot>{p.value.expires}</Pill>
      ),
    },
    {
      headerName: 'Paeds BLS',
      field: 'paedsBLS',
      width: 120,
      cellRenderer: p => (
        p.value
          ? <Pill kind="good"><Icon name="check" size={10} /></Pill>
          : <span className="muted">—</span>
      ),
    },
    {
      headerName: 'Last training',
      field: 'bls',
      width: 140,
      cellRenderer: p => (
        <span className="muted">{p.value.ok ? "Apr 2025" : "Apr 2024"}</span>
      ),
    },
    {
      headerName: 'Action',
      field: 'name',
      width: 120,
      sortable: false,
      cellRenderer: p => (
        <button
          className="btn"
          style={{ fontSize: 11, padding: '3px 8px' }}
          onClick={e => {
            e.stopPropagation();
            openCreateTask({
              title: `Book BLS recertification — ${p.data.name}`,
              clause: '5.1.4',
              source: 'BLS',
              sourceType: 'staff',
              priority: p.data.bls.ok ? 'medium' : 'high',
              assignedTo: 'K. Patel',
            });
          }}
        >Book recert</button>
      ),
    },
  ];

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Operations · cl. 5.1, 4.1.7"
        title="Staff & training"
        subtitle="Roles · qualifications · competency · BLS · rostering ratios"
        actions={
          <>
            <button className="btn"><Icon name="download" size={14} />Training register</button>
            <button className="btn btn-primary" onClick={openAdd}>
              <Icon name="user_plus" size={14} />Add staff member
            </button>
          </>
        }
      />

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="users" size={13} />Staff on register</div>
          <div className="stat-value">{staff.length}</div>
          <div className="stat-meta">3 sites · 8 roles</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />BLS lapsed</div>
          <div className="stat-value" style={{ color: blsLapsed.length ? 'var(--bad)' : 'var(--good)' }}>{blsLapsed.length}</div>
          <div className="stat-meta">target 100% currency</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="check" size={13} />RPSGT credentialed</div>
          <div className="stat-value">{staff.filter(s => s.rpsgt).length}</div>
          <div className="stat-meta">of {staff.filter(s => ['Senior Technologist', 'Scoring Technologist'].includes(s.role)).length} scorers</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="chart" size={13} />Avg training completion</div>
          <div className="stat-value">{avgTraining}%</div>
          <div className="stat-meta up">+4% vs Q4</div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "staff",    label: "Staff register", count: staff.length },
        { id: "ratios",   label: "Rostering ratios" },
        { id: "bls",      label: "BLS / competency" },
        { id: "appraisal",label: "Appraisals" },
      ]} />

      {tab === "staff" && (
        <div className="card">
          <NexusGrid
            rowData={staff}
            columnDefs={staffColumnDefs}
            onRowClicked={p => openEdit(p.data)}
            domLayout="autoHeight"
          />
        </div>
      )}

      {tab === "ratios" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-head"><div><div className="card-title">Adult lab · cl. 4.1.7</div><div className="card-sub">1 tech : 3 patients overnight · ≥45 min prep · ≥2 h analysis</div></div></div>
            <div className="card-pad">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--good-soft)', borderRadius: 8, marginBottom: 10 }}>
                <Icon name="check" size={20} style={{ color: 'var(--good)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--good)' }}>Currently meeting ratio</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Tonight: 2 techs on shift · 5 patients · ratio 1:2.5</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>This month: 28 of 28 overnight shifts compliant.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><div className="card-title">Paediatric lab</div><div className="card-sub">1 tech : 2 patients · 1-2 h prep · ≥4 h analysis</div></div></div>
            <div className="card-pad">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--good-soft)', borderRadius: 8, marginBottom: 10 }}>
                <Icon name="check" size={20} style={{ color: 'var(--good)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--good)' }}>Currently meeting ratio</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Tonight: 1 tech · 1 patient · ratio 1:1</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>This month: 12 of 12 overnight shifts compliant.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><div className="card-title">Medical Director presence</div><div className="card-sub">On-site ≥12 h / month</div></div></div>
            <div className="card-pad">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 600 }}>18.5<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, marginLeft: 4 }}>h this month</span></div>
              </div>
              <div className="progress"><div className="progress-bar good" style={{ width: '100%' }} /></div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>Target 12 h · 154% met</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><div className="card-title">Senior Tech presence</div><div className="card-sub">On-site ≥20 h / week</div></div></div>
            <div className="card-pad">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 600 }}>32<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, marginLeft: 4 }}>h this week</span></div>
              </div>
              <div className="progress"><div className="progress-bar good" style={{ width: '100%' }} /></div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>Target 20 h · 160% met</div>
            </div>
          </div>
        </div>
      )}

      {tab === "bls" && (
        <div className="card">
          <div className="card-head"><div><div className="card-title">BLS recertification · cl. 5.1.4</div><div className="card-sub">Annual recert mandatory · paediatric BLS for paeds lab staff</div></div></div>
          <NexusGrid
            rowData={blsRowData}
            columnDefs={blsColumnDefs}
            domLayout="autoHeight"
          />
        </div>
      )}

      {tab === "appraisal" && (
        <div className="card card-pad">
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Staff appraisal system · cl. 5.1.2</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>Annual written appraisal + development plan per staff member</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {staff.slice(0, 6).map((s, i) => (
              <div key={s.name} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Avatar name={s.name} idx={i} size={32} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.role}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Last appraisal</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{["Mar 2026","Feb 2026","Apr 2026","Jan 2026","Mar 2026","Feb 2026"][i]}</div>
                <Pill kind={i < 5 ? "good" : "warn"}>{i < 5 ? "Up to date" : "Due in 30d"}</Pill>
              </div>
            ))}
          </div>
        </div>
      )}

      <Drawer open={formTarget !== null} onClose={closeForm}>
        <StaffFormDrawer staff={formTarget} onSave={handleSave} onClose={closeForm} />
      </Drawer>
    </div>
  );
};

export default StaffPage;
