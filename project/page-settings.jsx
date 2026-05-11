// Settings — tenant config, integrations, retention, SSO
const SettingsPage = () => {
  const [tab, setTab] = useState("service");

  return (
    <div className="page page-wide">
      <PageHeader eyebrow="Admin" title="Settings" subtitle="Tenant configuration · integrations · retention · SSO / MFA" />

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "service", label: "Service profile" },
        { id: "users", label: "Users & roles" },
        { id: "integrations", label: "Integrations" },
        { id: "retention", label: "Retention" },
        { id: "security", label: "Security" },
      ]} />

      {tab === "service" && (
        <div className="grid-2">
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Legal entity</div>
            {[
              ["Service name", "Riverside Sleep & Respiratory Centre"],
              ["ABN", "67 412 998 003"],
              ["HPI-O", "8003 6280 5947 1234"],
              ["NATA cert no.", "15847"],
              ["Accredited since", "March 2022"],
              ["Host institution", "Independent · arms-length from Riverside Hospital"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 140, fontSize: 12, color: 'var(--ink-3)' }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sites</div>
            {[
              { n: "Riverside Main Lab", code: "RML", t: "Adult attended PSG · CPAP · MSLT/MWT", beds: 6 },
              { n: "Eastside Paediatric Lab", code: "EPL", t: "Paediatric attended PSG · NIV", beds: 3 },
              { n: "Home Service – North", code: "HSN", t: "Type 2/3/4 HSAT · CPAP follow-up", beds: "—" },
            ].map((s, i) => (
              <div key={s.code} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: i === 2 ? 0 : 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.n}</div>
                  <Pill kind="outline">{s.code}</Pill>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.t} · {s.beds} beds</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">User access · role-based permissions</div>
            <div className="topbar-spacer" />
            <button className="btn btn-primary"><Icon name="plus" size={14} />Invite user</button>
          </div>
          <table className="tbl">
            <thead><tr><th>User</th><th>Role</th><th>MFA</th><th>SSO</th><th>Last sign-in</th></tr></thead>
            <tbody>
              {[
                ["Dr. R. Okafor", "Medical Director", true, "Okta", "1 h ago"],
                ["Dr. L. Hartono", "Paediatric Sleep Physician", true, "Okta", "3 h ago"],
                ["K. Patel", "Quality Manager", true, "Okta", "now"],
                ["M. Chen", "Senior Technologist", true, "Okta", "5 h ago"],
                ["A. Singh", "Scoring Tech", true, "Okta", "2 d ago"],
                ["J. Roy", "External Auditor", true, "Local", "16 Mar 2026"],
                ["NATA Assessor (time-boxed)", "External Assessor", true, "Magic link", "—"],
              ].map((r, i) => (
                <tr key={i}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={r[0]} idx={i} size={22} />{r[0]}</div></td>
                  <td>{r[1]}</td>
                  <td>{r[2] ? <Pill kind="good"><Icon name="check" size={10} /> TOTP</Pill> : <Pill kind="bad">Off</Pill>}</td>
                  <td className="muted">{r[3]}</td>
                  <td className="muted">{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "integrations" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { n: "Compumedics ProFusion", t: "PSG software · HL7 + file ingestion", on: true },
            { n: "Philips Sleepware G3", t: "PSG software · file ingestion", on: true },
            { n: "Natus SleepWorks", t: "PSG software · file ingestion", on: false },
            { n: "ResMed AirView", t: "CPAP cloud · adherence pull", on: true },
            { n: "Philips Care Orchestrator", t: "CPAP cloud · adherence pull", on: true },
            { n: "FHIR R4 endpoint", t: "Patient, ServiceRequest, DiagnosticReport", on: true },
            { n: "HealthLink secure messaging", t: "Encrypted referrer delivery", on: true },
            { n: "Argus secure messaging", t: "Encrypted referrer delivery", on: false },
            { n: "DocuSign", t: "Electronic signature (Australian-compliant)", on: true },
            { n: "TGA adverse event export", t: "Auto-format incident export", on: true },
            { n: "Okta SSO (OIDC)", t: "Identity provider · MFA TOTP", on: true },
            { n: "Sentry", t: "Error & performance monitoring", on: true },
          ].map((i, k) => (
            <div key={k} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: i.on ? 'var(--good-soft)' : 'var(--surface-2)', color: i.on ? 'var(--good)' : 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
                <Icon name={i.on ? "check" : "link"} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{i.n}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{i.t}</div>
              </div>
              <Pill kind={i.on ? "good" : "outline"} dot>{i.on ? "Connected" : "Off"}</Pill>
            </div>
          ))}
        </div>
      )}

      {tab === "retention" && (
        <div className="card">
          <div className="card-head"><div><div className="card-title">Retention policies · cl. 4.13</div><div className="card-sub">Configurable per record type · enforced by retention engine</div></div></div>
          <table className="tbl">
            <thead><tr><th>Record type</th><th>Default retention</th><th>Storage</th><th>Object-lock</th></tr></thead>
            <tbody>
              {[
                ["Final report (PDF/A)", "Health-record period (7 yrs adult, 25 yrs paeds)", "S3 ap-southeast-2", "Yes"],
                ["Raw PSG signal data", "Until reporting & treatment complete (min 12 mo)", "S3 ap-southeast-2", "Yes"],
                ["Video/audio recording", "Until final report; longer if diagnostic", "S3 ap-southeast-2", "Yes"],
                ["Equipment records", "Life of equipment + 7 years", "Postgres + S3", "—"],
                ["Audit trail entries", "Indefinite · append-only hash chain", "Postgres", "Yes"],
                ["Training records", "Duration of employment + 7 years", "Postgres", "—"],
                ["Quality records (NCs, audits)", "10 years", "Postgres + S3", "Yes"],
                ["Patient feedback", "5 years", "Postgres", "—"],
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r[0]}</td>
                  <td className="muted">{r[1]}</td>
                  <td className="muted">{r[2]}</td>
                  <td>{r[3] === "Yes" ? <Pill kind="good"><Icon name="check" size={10} /></Pill> : <span className="muted">{r[3]}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "security" && (
        <div className="grid-2">
          {[
            { t: "Data residency", d: "AWS Sydney (ap-southeast-2) · encrypted at rest (KMS) · TLS 1.3 in transit", k: "good" },
            { t: "Tamper-evident audit trail", d: "Append-only with SHA-256 hash chain · 1.2M entries logged", k: "good" },
            { t: "Backups", d: "Hourly snapshots · cross-region replication · 30-day point-in-time", k: "good" },
            { t: "Disaster recovery", d: "RPO 1h · RTO 4h · last DR drill 14 Mar 2026", k: "good" },
            { t: "Privacy compliance", d: "Australian Privacy Act 1988 · APP-compliant · NDB scheme", k: "good" },
            { t: "Penetration test", d: "Annual · last conducted Feb 2026 by independent firm", k: "good" },
          ].map((c, i) => (
            <div key={i} className="card card-pad">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Pill kind={c.k}><Icon name="check" size={10} /></Pill>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.t}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{c.d}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.SettingsPage = SettingsPage;
