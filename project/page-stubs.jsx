// Stub pages for nav items not built in depth
const StubPage = ({ title, eyebrow, subtitle, icon, items }) => (
  <div className="page page-wide">
    <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
    <div className="card card-pad" style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>
        <Icon name={icon} size={26} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 480, margin: '0 auto' }}>
        Module specified in the design brief — full screens to be expanded next iteration.
      </div>
      {items && (
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 600, margin: '24px auto 0', textAlign: 'left' }}>
          {items.map((it, i) => (
            <div key={i} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12 }}>
              <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{it.t}</div>
              <div style={{ color: 'var(--ink-3)', marginTop: 2 }}>{it.d}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const TasksPage = () => {
  const D = window.NEXUS_DATA;
  return (
    <div className="page page-wide">
      <PageHeader eyebrow="Workspace" title="My tasks" subtitle="All compliance work assigned to you" />
      <div className="card">
        {D.tasks.map(t => (
          <div key={t.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                <span className="mono">cl. {t.clause}</span> · {t.due}
              </div>
            </div>
            <Pill kind={t.priority === 'critical' ? 'bad' : t.priority === 'high' ? 'warn' : 'outline'}>{t.priority}</Pill>
          </div>
        ))}
      </div>
    </div>
  );
};

window.StubPage = StubPage;
window.TasksPage = TasksPage;
