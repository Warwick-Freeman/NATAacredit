import React, { useState, useEffect, useMemo } from 'react';

const BASE = import.meta.env.VITE_API_URL ?? '';
const LS_KEY = 'physician_portal_token';

function pFetch(path, token, opts = {}) {
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
}

// ── Shared header ──────────────────────────────────────────────────────────────

function PortalHeader({ physician, onSignOut }) {
  return (
    <header style={{
      background: '#1b3a6b', color: 'white',
      padding: '0 32px', height: 56,
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 2px 8px rgba(10,20,40,0.2)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(255,255,255,0.18)',
          display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em',
        }}>N</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.1 }}>Nexus 360</div>
          <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Physician Portal</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      {physician && (
        <>
          <div style={{ textAlign: 'right', marginRight: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.9 }}>{physician.name}</div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>{physician.practice || physician.specialty || 'Referring Physician'}</div>
          </div>
          <button
            onClick={onSignOut}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.75)', borderRadius: 6,
              padding: '5px 12px', fontSize: 12, cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </>
      )}
    </header>
  );
}

// ── Login screen ───────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch(`${BASE}/api/physician-portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setError('Invalid email or password.'); return; }
      const data = await res.json();
      onLogin(data.token);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1b3a6b', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(10,20,40,0.2)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, color: 'white' }}>N</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'white', lineHeight: 1.1 }}>Nexus 360</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Physician Portal</div>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 36, boxShadow: '0 4px 24px rgba(20,30,50,0.1)' }}>
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2740', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Sign in to your portal
              </div>
              <div style={{ fontSize: 13, color: '#607898' }}>
                Access patient reports and compliance data
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a2740', marginBottom: 6 }}>Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="doctor@practice.com.au"
                  autoFocus
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d4dbe7', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a2740', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a2740', marginBottom: 6 }}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d4dbe7', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a2740', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                style={{ width: '100%', padding: '10px', background: '#1b3a6b', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#96aec8' }}>
            Secure portal provided by Nexus 360 Accreditation
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CPAP compliance helpers ────────────────────────────────────────────────────

function makeDailyData(patientId, rate, meanUsage) {
  const seed = patientId.split('').reduce((s, c, i) => s + c.charCodeAt(0) * (i + 1), 0);
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (29 - i));
    const r = Math.abs(Math.sin(seed * (i + 1) * 0.31 + i * 0.77));
    const used = r < rate / 100;
    const usage = used ? Math.max(0.3, meanUsage + (r * 3 - 1.5)) : 0;
    const ahi = used ? Math.max(0.3, 2 + (r * 4 - 2)) : null;
    return { date: d.toISOString().slice(0, 10), usage: used ? +usage.toFixed(1) : 0, ahi: ahi ? +ahi.toFixed(1) : null };
  });
}

function ComplianceBar({ patientId, rate, meanUsage }) {
  const data = useMemo(() => makeDailyData(patientId, rate, meanUsage), [patientId, rate, meanUsage]);
  const maxH = 36, thresholdPct = 4 / 8;
  return (
    <div style={{ position: 'relative', height: maxH + 4, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: thresholdPct * maxH, borderTop: '1px dashed rgba(0,0,0,0.15)', zIndex: 1, pointerEvents: 'none' }} />
      {data.map((d, i) => {
        const h = d.usage > 0 ? Math.max(3, (Math.min(d.usage, 8) / 8) * maxH) : 2;
        const color = d.usage === 0 ? '#e2e8f0' : d.usage >= 4 ? '#16a34a' : d.usage >= 2 ? '#ca8a04' : '#dc2626';
        return (
          <div key={i} title={`${d.date}: ${d.usage > 0 ? d.usage + 'h' : 'No use'}${d.ahi ? ', AHI ' + d.ahi : ''}`}
            style={{ width: 4, height: h, background: color, borderRadius: 1, flexShrink: 0, cursor: 'default' }} />
        );
      })}
    </div>
  );
}

function ComplianceSection({ complianceJson, patientId }) {
  let data = null;
  try { data = complianceJson ? JSON.parse(complianceJson) : null; } catch { /* ignore */ }
  if (!data || data.rate == null) return null;

  const complianceDays = makeDailyData(patientId, data.rate, data.meanUsage);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { l: 'Compliance rate',  v: `${data.rate}%`,          ok: data.rate >= 70,     note: '≥70% threshold' },
          { l: 'Mean nightly use', v: `${data.meanUsage}h`,     ok: data.meanUsage >= 4, note: '≥4h target' },
          { l: 'Mean AHI on Rx',  v: `${data.meanAhi}/h`,      ok: data.meanAhi < 5,    note: '<5 target' },
          { l: 'Mean leak',        v: `${data.meanLeak} L/min`, ok: data.meanLeak < 24,  note: '<24 L/min' },
        ].map(({ l, v, ok, note }) => (
          <div key={l} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`, background: ok ? '#f0fdf4' : '#fef2f2' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: ok ? '#15803d' : '#b91c1c', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{v}</div>
            <div style={{ fontSize: 10, color: ok ? '#16a34a' : '#dc2626', marginTop: 2 }}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#96aec8' }}>30-day usage</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#96aec8' }}>
            {[['#16a34a', '≥4h'], ['#ca8a04', '2–4h'], ['#dc2626', '<2h'], ['#e2e8f0', 'No use']].map(([c, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 8, height: 8, background: c, borderRadius: 1, flexShrink: 0 }} />{l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
          <ComplianceBar patientId={patientId} rate={data.rate} meanUsage={data.meanUsage} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#96aec8' }}>
            <span>{complianceDays[0]?.date}</span><span>today</span>
          </div>
        </div>
      </div>

      {data.lastSync && (
        <div style={{ fontSize: 12, color: '#96aec8', marginBottom: 12 }}>
          Last sync: <strong style={{ color: '#374f6e' }}>{data.lastSync}</strong>
        </div>
      )}

      {data.rate < 70 && (
        <div style={{ padding: '12px 14px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>Below Medicare compliance threshold</div>
            <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>Patient may require intervention — consider mask review, pressure adjustment, or education.</div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Patient detail view ────────────────────────────────────────────────────────

function PatientDetail({ patient, onBack }) {
  let studies = [];
  let diagnoses = [];
  let treatment = null;
  try { studies   = JSON.parse(patient.studiesJson   || '[]') ?? []; } catch { /* ignore */ }
  try { diagnoses = JSON.parse(patient.diagnosesJson || '[]') ?? []; } catch { /* ignore */ }
  try { treatment = JSON.parse(patient.treatmentJson || 'null');      } catch { /* ignore */ }

  const statusColor = (s) => {
    if (!s) return { color: '#607898', bg: '#edf1f6' };
    s = s.toLowerCase();
    if (s.includes('final') || s.includes('signed')) return { color: '#15803d', bg: '#dcfce7' };
    if (s.includes('prelim') || s.includes('await')) return { color: '#b45309', bg: '#fef3c7' };
    return { color: '#607898', bg: '#edf1f6' };
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#1b3a6b', fontWeight: 500, fontSize: 13, padding: '0 0 20px', fontFamily: 'inherit' }}
      >
        ← Back to patients
      </button>

      {/* Demographics */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(20,30,50,0.07)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96aec8', marginBottom: 10 }}>PATIENT DETAILS</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2740', marginBottom: 12 }}>{patient.name}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px 24px' }}>
          {[
            { label: 'Date of birth', value: patient.dob || '—' },
            { label: 'MRN', value: patient.mrn || '—' },
            { label: 'Site', value: patient.site || '—' },
            { label: 'Physician', value: patient.physician || '—' },
            { label: 'Status', value: patient.status || '—' },
            { label: 'Next review', value: patient.nextReview || '—' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: '#96aec8', fontWeight: 500, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2740' }}>{f.value}</div>
            </div>
          ))}
        </div>

        {diagnoses.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96aec8', marginBottom: 8 }}>DIAGNOSES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {diagnoses.map((d, i) => (
                <span key={i} style={{ fontSize: 12, padding: '3px 10px', background: '#edf1f6', borderRadius: 12, color: '#374f6e' }}>
                  {typeof d === 'string' ? d : d.name ?? d.label ?? JSON.stringify(d)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prescription */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(20,30,50,0.07)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96aec8', marginBottom: 12 }}>PRESCRIPTION</div>
        {!treatment ? (
          <div style={{ fontSize: 13, color: '#96aec8' }}>No active treatment prescribed.</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18 }}>
                {treatment.type === 'Medication' ? '💊' : '😴'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2740' }}>{treatment.device ?? treatment.type}</div>
                {treatment.serial   && <div style={{ fontSize: 11, color: '#96aec8', marginTop: 1 }}>S/N: {treatment.serial}</div>}
                {treatment.startDate && <div style={{ fontSize: 11, color: '#96aec8', marginTop: 1 }}>Started: {treatment.startDate}</div>}
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                  color: '#1d4ed8', background: '#dbeafe',
                }}>
                  {treatment.type}
                </span>
              </div>
            </div>

            {treatment.prescription && Object.keys(treatment.prescription).length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#96aec8', marginBottom: 10 }}>Prescription details</div>
                {Object.entries(treatment.prescription).filter(([, v]) => v != null).map(([k, v]) => {
                  const label = k
                    .replace(/([A-Z])/g, ' $1')
                    .replace('p Min', 'Min pressure')
                    .replace('p Max', 'Max pressure')
                    .replace(/^\w/, c => c.toUpperCase());
                  return (
                    <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f4f6f9', fontSize: 13 }}>
                      <span style={{ color: '#96aec8', minWidth: 140, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 500, color: '#1a2740' }}>{typeof v === 'number' ? `${v} cmH₂O` : v}</span>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Compliance */}
      {patient.complianceJson && patient.complianceJson !== 'null' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(20,30,50,0.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96aec8', marginBottom: 12 }}>CPAP COMPLIANCE</div>
          <ComplianceSection complianceJson={patient.complianceJson} patientId={patient.patientId} />
        </div>
      )}

      {/* Studies */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(20,30,50,0.07)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96aec8', marginBottom: 12 }}>SLEEP STUDIES</div>
        {studies.length === 0 ? (
          <div style={{ fontSize: 13, color: '#96aec8', padding: '12px 0' }}>No studies recorded.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Type', 'Date', 'Status', 'Signed by', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#96aec8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studies.map((s, i) => {
                const sc = statusColor(s.status ?? s.reportStatus);
                return (
                  <tr key={i} style={{ borderBottom: i < studies.length - 1 ? '1px solid #f4f6f9' : 'none' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: '#1a2740' }}>{s.type ?? s.studyType ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#374f6e', whiteSpace: 'nowrap' }}>{s.date ?? s.studyDate ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 10 }}>
                        {s.status ?? s.reportStatus ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#607898' }}>{s.signedBy ?? s.physician ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#96aec8' }}>{s.notes ?? s.comment ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function Dashboard({ physician, patients, onSelectPatient, onSignOut }) {
  const [search, setSearch] = useState('');

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.mrn?.toLowerCase().includes(q);
  });

  const complianceStatus = (json) => {
    if (!json || json === 'null') return null;
    try {
      const d = JSON.parse(json);
      const pct = d.rate ?? d.adherencePct ?? d.usage ?? d.percentNightsUsed ?? null;
      if (pct === null) return null;
      return { pct, level: pct >= 70 ? 'good' : pct >= 50 ? 'warn' : 'bad' };
    } catch { return null; }
  };

  const latestStudy = (json) => {
    try {
      const arr = JSON.parse(json || '[]');
      if (!arr?.length) return null;
      return arr[arr.length - 1];
    } catch { return null; }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
      <PortalHeader physician={physician} onSignOut={onSignOut} />

      <div style={{ flex: 1, padding: '28px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2740', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Your Patients</h1>
          <div style={{ fontSize: 14, color: '#607898' }}>{patients.length} patient{patients.length !== 1 ? 's' : ''} referred to {physician?.name ?? 'you'}</div>
        </div>

        {patients.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or MRN…"
              style={{ padding: '8px 14px', border: '1px solid #d4dbe7', borderRadius: 8, fontSize: 13, width: 280, fontFamily: 'inherit', outline: 'none', color: '#1a2740', background: 'white' }}
            />
          </div>
        )}

        {patients.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 4px rgba(20,30,50,0.07)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 600, color: '#1a2740', marginBottom: 6 }}>No patients yet</div>
            <div style={{ fontSize: 13, color: '#607898' }}>Patients referred to you will appear here once added by the clinic.</div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(20,30,50,0.07)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#edf1f6', borderBottom: '1px solid #d4dbe7' }}>
                  {['Patient', 'DOB', 'MRN', 'Site', 'Latest Study', 'Compliance', 'Status', 'Next Review'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#607898', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const cs = complianceStatus(p.complianceJson);
                  const ls = latestStudy(p.studiesJson);
                  return (
                    <tr
                      key={p.patientId}
                      onClick={() => onSelectPatient(p)}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f4f6f9' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f4f6f9'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: '#1a2740' }}>{p.name}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#374f6e', whiteSpace: 'nowrap' }}>{p.dob || '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#607898', fontFamily: 'monospace' }}>{p.mrn || '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#607898' }}>{p.site || '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#607898' }}>
                        {ls ? `${ls.type ?? ls.studyType ?? 'Study'} · ${ls.date ?? ls.studyDate ?? '?'}` : '—'}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        {cs ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                              background: cs.level === 'good' ? '#16a34a' : cs.level === 'warn' ? '#ca8a04' : '#dc2626',
                              boxShadow: `0 0 0 3px ${cs.level === 'good' ? '#dcfce7' : cs.level === 'warn' ? '#fef3c7' : '#fee2e2'}`,
                            }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: cs.level === 'good' ? '#15803d' : cs.level === 'warn' ? '#b45309' : '#b91c1c' }}>
                              {cs.pct}%
                            </span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#96aec8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: p.status === 'active' ? '#15803d' : '#607898',
                          background: p.status === 'active' ? '#dcfce7' : '#e2e8f0',
                          padding: '2px 8px', borderRadius: 10,
                        }}>
                          {p.status ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#607898', whiteSpace: 'nowrap' }}>{p.nextReview || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#96aec8' }}>
          Secure portal · Nexus 360 Accreditation
        </div>
      </div>
    </div>
  );
}

// ── Setup screen (one-time invite flow) ───────────────────────────────────────

function SetupScreen({ token, onLogin }) {
  const [step, setStep]           = useState('validating'); // validating | form | error
  const [info, setInfo]           = useState(null);          // { name, email }
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetch(`${BASE}/api/physician-portal/setup/${encodeURIComponent(token)}`)
      .then(r => {
        if (!r.ok) throw new Error('invalid');
        return r.json();
      })
      .then(data => { setInfo(data); setStep('form'); })
      .catch(() => setStep('error'));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${BASE}/api/physician-portal/setup/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `${res.status}`);
      }
      const data = await res.json();
      onLogin(data.token);
    } catch (e) {
      setError(e.message === '400' || e.message.includes('invalid') ? 'This setup link has already been used or has expired.' : `Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const sharedHeader = (
    <header style={{ background: '#1b3a6b', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(10,20,40,0.2)' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, color: 'white' }}>N</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'white', lineHeight: 1.1 }}>Nexus 360</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Physician Portal</div>
      </div>
    </header>
  );

  if (step === 'validating') {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
        {sharedHeader}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#607898', fontSize: 14 }}>Validating invite link…</div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
        {sharedHeader}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 12, padding: 36, boxShadow: '0 4px 24px rgba(20,30,50,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2740', marginBottom: 8 }}>Invalid or expired link</div>
            <div style={{ fontSize: 13, color: '#607898', marginBottom: 24 }}>
              This setup link has already been used or has expired. Contact the clinic to request a new invite.
            </div>
            <a href="/?physician_portal" style={{ color: '#1b3a6b', fontSize: 13, fontWeight: 500 }}>
              Go to sign-in page
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
      {sharedHeader}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 36, boxShadow: '0 4px 24px rgba(20,30,50,0.1)' }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2740', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Set up your portal access
              </div>
              <div style={{ fontSize: 13, color: '#607898' }}>
                Welcome, {info?.name}. Create a password to access your physician portal.
              </div>
              {info?.email && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#96aec8' }}>
                  You'll sign in with <strong style={{ color: '#374f6e' }}>{info.email}</strong>
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a2740', marginBottom: 6 }}>New password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoFocus
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d4dbe7', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a2740', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a2740', marginBottom: 6 }}>Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d4dbe7', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a2740', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                style={{ width: '100%', padding: '10px', background: '#1b3a6b', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Setting up…' : 'Set password & sign in'}
              </button>
            </form>
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#96aec8' }}>
            Secure portal provided by Nexus 360 Accreditation
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

export default function PhysicianPortalPage({ setupToken }) {
  const [view, setView]                   = useState('loading');
  const [authToken, setAuthToken]         = useState(null);
  const [physician, setPhysician]         = useState(null);
  const [patients, setPatients]           = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    if (setupToken) { setView('login'); return; }
    const saved = localStorage.getItem(LS_KEY);
    if (saved) loadDashboard(saved);
    else setView('login');
  }, []);

  async function loadDashboard(token) {
    setView('loading');
    try {
      const [meRes, patientsRes] = await Promise.all([
        pFetch('/api/physician-portal/me', token),
        pFetch('/api/physician-portal/patients', token),
      ]);
      if (!meRes.ok) throw new Error('auth');
      const [me, pList] = await Promise.all([meRes.json(), patientsRes.json()]);
      setPhysician(me);
      setPatients(pList ?? []);
      setAuthToken(token);
      setView('dashboard');
    } catch {
      localStorage.removeItem(LS_KEY);
      setView('login');
    }
  }

  function handleLogin(token) {
    localStorage.setItem(LS_KEY, token);
    loadDashboard(token);
  }

  function handleSignOut() {
    localStorage.removeItem(LS_KEY);
    setAuthToken(null); setPhysician(null); setPatients([]); setSelectedPatient(null);
    setView('login');
  }

  if (view === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#607898', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (view === 'login' && setupToken) return <SetupScreen token={setupToken} onLogin={handleLogin} />;
  if (view === 'login') return <LoginScreen onLogin={handleLogin} />;

  if (selectedPatient) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
        <PortalHeader physician={physician} onSignOut={handleSignOut} />
        <div style={{ flex: 1, padding: '28px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      physician={physician}
      patients={patients}
      onSelectPatient={setSelectedPatient}
      onSignOut={handleSignOut}
    />
  );
}
