// Quality Indicators dashboard — KPI tiles, traffic-light, proficiency testing
const IndicatorsPage = () => {
  const D = window.NEXUS_DATA;
  const [phase, setPhase] = useState("all");
  const [period, setPeriod] = useState("12m");

  const filtered = D.indicators.filter(k => phase === 'all' || k.phase === phase);
  const counts = {
    good: D.indicators.filter(k => k.status === 'good').length,
    warn: D.indicators.filter(k => k.status === 'warn').length,
    bad: D.indicators.filter(k => k.status === 'bad').length,
  };

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Compliance · cl. 5.6.3 – 5.6.5"
        title="Quality indicators"
        subtitle="Pre-study, study, and post-study indicators with traffic-light targets. Auto-fed into management review."
        actions={
          <>
            <button className="btn"><Icon name="plus" size={14} />New indicator</button>
            <button className="btn"><Icon name="download" size={14} />Export dashboard</button>
            <button className="btn btn-primary"><Icon name="flag" size={14} />Send to management review</button>
          </>
        }
      />

      {/* Summary band */}
      <div className="grid-3" style={{ marginBottom: 18 }}>
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="traffic-dot good" style={{ width: 14, height: 14 }} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>On target</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{counts.good} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-3)' }}>/ {D.indicators.length} indicators</span></div>
          </div>
        </div>
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="traffic-dot warn" style={{ width: 14, height: 14 }} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Watch</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{counts.warn}</div>
          </div>
        </div>
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="traffic-dot bad" style={{ width: 14, height: 14 }} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Off target</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{counts.bad}</div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <button className={`chip-btn ${phase === 'all' ? 'active' : ''}`} onClick={() => setPhase('all')}>All phases</button>
        <button className={`chip-btn ${phase === 'pre' ? 'active' : ''}`} onClick={() => setPhase('pre')}>Pre-study</button>
        <button className={`chip-btn ${phase === 'study' ? 'active' : ''}`} onClick={() => setPhase('study')}>Study</button>
        <button className={`chip-btn ${phase === 'post' ? 'active' : ''}`} onClick={() => setPhase('post')}>Post-study</button>
        <div style={{ flex: 1 }} />
        <button className={`chip-btn ${period === '3m' ? 'active' : ''}`} onClick={() => setPeriod('3m')}>3M</button>
        <button className={`chip-btn ${period === '12m' ? 'active' : ''}`} onClick={() => setPeriod('12m')}>12M</button>
        <button className={`chip-btn ${period === 'ytd' ? 'active' : ''}`} onClick={() => setPeriod('ytd')}>YTD</button>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {filtered.map(k => (
          <div key={k.id} className="kpi-tile">
            <div className="traffic">
              <div className={`traffic-dot ${k.status}`} />
            </div>
            <div className="kpi-name">{k.name}</div>
            <div className="kpi-value">
              {k.value}{k.unit && <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, marginLeft: 2 }}>{k.unit}</span>}
            </div>
            <div className="kpi-target">target {k.target}</div>
            <div className="kpi-spark">
              <Sparkline data={k.trend} width={180} height={32}
                color={k.status === 'good' ? 'var(--good)' : k.status === 'warn' ? 'var(--warn)' : 'var(--bad)'} />
            </div>
          </div>
        ))}
      </div>

      <div className="spacer-md" />

      {/* Proficiency testing */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">External proficiency testing · cl. 5.6.8</div>
              <div className="card-sub">≥ 2 events / year per analysing staff member</div>
            </div>
            <div className="topbar-spacer" />
            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }}>Schedule →</button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Scorer</th>
                <th>Last event</th>
                <th>Result</th>
                <th>Next due</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "M. Chen", last: "Mar 2026", result: "Pass · 96%", status: "good", next: "Sep 2026" },
                { name: "A. Singh", last: "Feb 2026", result: "Pass · 91%", status: "good", next: "Aug 2026" },
                { name: "J. Owusu", last: "Jan 2026", result: "Investigate · 78%", status: "warn", next: "Jul 2026" },
                { name: "Dr. R. Okafor", last: "Dec 2025", result: "Peer concord. κ=0.84", status: "good", next: "Jun 2026" },
                { name: "Dr. L. Hartono", last: "Nov 2025", result: "Peer concord. κ=0.79", status: "good", next: "May 2026" },
              ].map((r, i) => (
                <tr key={i}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={r.name} idx={i} />{r.name}</div></td>
                  <td className="muted">{r.last}</td>
                  <td><Pill kind={r.status}>{r.result}</Pill></td>
                  <td className="muted">{r.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Inter-observer concordance · cl. 5.6.6</div>
              <div className="card-sub">Blind re-score sample · Cohen's κ per scorer per quarter</div>
            </div>
          </div>
          <div className="card-pad">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {[
                { q: "Q1 24", v: 0.74 }, { q: "Q2 24", v: 0.76 }, { q: "Q3 24", v: 0.78 },
                { q: "Q4 24", v: 0.79 }, { q: "Q1 25", v: 0.81 }, { q: "Q2 25", v: 0.80 },
                { q: "Q3 25", v: 0.82 }, { q: "Q4 25", v: 0.83 }, { q: "Q1 26", v: 0.82 },
              ].map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{b.v.toFixed(2)}</div>
                  <div style={{ width: '70%', height: `${b.v * 130}px`, background: 'var(--accent)', borderRadius: '3px 3px 0 0', opacity: 0.7 + i * 0.03 }} />
                  <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{b.q}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: 10, background: 'var(--good-soft)', color: 'var(--good)', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={14} />
              Trending up · current κ = 0.82, well above 0.75 threshold
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.IndicatorsPage = IndicatorsPage;
