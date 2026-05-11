// Staff & Training — roles, competency, BLS, rostering ratios
const StaffPage = () => {
  const [tab, setTab] = useState("staff");

  const staff = [
    { name: "Dr. R. Okafor", role: "Medical Director", site: "All", bls: { ok: true, expires: "Aug 2026" }, eqa: "Current", training: 100 },
    { name: "Dr. L. Hartono", role: "Paediatric Sleep Phys.", site: "Eastside Paed.", bls: { ok: true, expires: "Sep 2026" }, eqa: "Current", training: 100, paedsBLS: true },
    { name: "Dr. F. Liu", role: "Reporting Physician", site: "All", bls: { ok: true, expires: "Nov 2026" }, eqa: "Current", training: 95 },
    { name: "K. Patel", role: "Quality Manager", site: "All", bls: { ok: true, expires: "Jul 2026" }, eqa: "—", training: 100 },
    { name: "M. Chen", role: "Senior Technologist", site: "Riverside Main", bls: { ok: true, expires: "Mar 2027" }, eqa: "Current · 96%", training: 100, rpsgt: true },
    { name: "A. Singh", role: "Scoring Technologist", site: "Riverside Main", bls: { ok: true, expires: "Jun 2026" }, eqa: "Current · 91%", training: 92, rpsgt: true },
    { name: "J. Owusu", role: "Scoring Technologist", site: "Eastside Paed.", bls: { ok: false, expires: "Lapsed 14d" }, eqa: "Investigate · 78%", training: 88 },
    { name: "P. Tan", role: "Recording Tech", site: "Riverside Main", bls: { ok: true, expires: "May 2026" }, eqa: "—", training: 90 },
    { name: "S. Nakamura", role: "Recording Tech", site: "Eastside Paed.", bls: { ok: false, expires: "Lapsed 3d" }, eqa: "—", training: 85, paedsBLS: true },
    { name: "L. Diaz", role: "Reception / Bookings", site: "All", bls: { ok: true, expires: "Aug 2026" }, eqa: "—", training: 100 },
    { name: "T. Brooks", role: "Recording Tech", site: "Home Service N.", bls: { ok: false, expires: "Lapsed 21d" }, eqa: "—", training: 76 },
    { name: "R. Patel", role: "Recording Tech", site: "Riverside Main", bls: { ok: false, expires: "Lapsed 7d" }, eqa: "—", training: 82 },
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
            <button className="btn btn-primary"><Icon name="plus" size={14} />Add staff member</button>
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
          <div className="stat-value" style={{ color: 'var(--bad)' }}>{staff.filter(s => !s.bls.ok).length}</div>
          <div className="stat-meta">target 100% currency</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="check" size={13} />RPSGT credentialed</div>
          <div className="stat-value">{staff.filter(s => s.rpsgt).length}</div>
          <div className="stat-meta">of 5 scorers</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="chart" size={13} />Avg training completion</div>
          <div className="stat-value">{Math.round(staff.reduce((s, x) => s + x.training, 0) / staff.length)}%</div>
          <div className="stat-meta up">+4% vs Q4</div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "staff", label: "Staff register", count: staff.length },
        { id: "ratios", label: "Rostering ratios" },
        { id: "bls", label: "BLS / competency" },
        { id: "appraisal", label: "Appraisals" },
      ]} />

      {tab === "staff" && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr><th>Staff</th><th>Role</th><th>Site</th><th>Credentials</th><th>BLS</th><th>EQA / κ</th><th>Training</th></tr>
            </thead>
            <tbody>
              {staff.map((s, i) => (
                <tr key={s.name} className="row-clickable">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={s.name} size={28} idx={i} />
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{s.role}</td>
                  <td className="muted">{s.site}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {s.rpsgt && <Pill kind="info">RPSGT</Pill>}
                      {s.paedsBLS && <Pill kind="accent">Paeds BLS</Pill>}
                    </div>
                  </td>
                  <td><Pill kind={s.bls.ok ? "good" : "bad"} dot>{s.bls.expires}</Pill></td>
                  <td style={{ fontSize: 12, color: s.eqa.includes("Investigate") ? 'var(--bad)' : 'var(--ink-2)' }}>{s.eqa}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 80 }}>
                        <div className={`progress-bar ${s.training >= 95 ? 'good' : s.training >= 85 ? 'warn' : 'bad'}`} style={{ width: `${s.training}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.training}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <table className="tbl">
            <thead><tr><th>Staff</th><th>BLS expires</th><th>Paeds BLS</th><th>Last training</th><th>Action</th></tr></thead>
            <tbody>
              {staff.filter(s => !s.bls.ok || s.bls.expires.includes("2026")).map((s, i) => (
                <tr key={s.name}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={s.name} idx={i+2} size={22} />{s.name}</div></td>
                  <td><Pill kind={s.bls.ok ? "warn" : "bad"} dot>{s.bls.expires}</Pill></td>
                  <td>{s.paedsBLS ? <Pill kind="good"><Icon name="check" size={10} /></Pill> : <span className="muted">—</span>}</td>
                  <td className="muted">{s.bls.ok ? "Apr 2025" : "Apr 2024"}</td>
                  <td><button className="btn" style={{ fontSize: 11, padding: '3px 8px' }}>Book recert</button></td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
};

window.StaffPage = StaffPage;
