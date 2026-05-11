// Shared components — sidebar, topbar, common UI bits
const { useState, useEffect, useMemo, useRef } = React;

// === Sparkline ===
const Sparkline = ({ data, height = 28, width = 100, color }) => {
  if (!data || !data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  const area = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={area} className="spark-area" style={color ? { fill: color, opacity: 0.15 } : undefined} />
      <polyline points={points} className="spark-line" style={color ? { stroke: color } : undefined} />
    </svg>
  );
};

// === Donut ===
const Donut = ({ size = 90, stroke = 12, segments }) => {
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / total) * C;
        const dasharray = `${len} ${C - len}`;
        const el = (
          <circle key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={dasharray}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
};

// === Pill ===
const Pill = ({ children, kind = "neutral", dot = false }) => (
  <span className={`pill ${kind === 'neutral' ? '' : kind}`}>
    {dot && <span className="dot" />}
    {children}
  </span>
);

// === Status pill for clauses ===
const StatusPill = ({ status }) => {
  const map = {
    compliant: ["good", "Compliant"],
    partial: ["warn", "Partial"],
    nc: ["bad", "Non-conformant"],
    na: ["outline", "N/A"],
  };
  const [kind, label] = map[status] || ["outline", status];
  return <span className={`pill ${kind}`}><span className="dot" />{label}</span>;
};

// === Avatar ===
const palette = ["#3b82f6", "#0ea5e9", "#0d9488", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#9333ea", "#db2777"];
const Avatar = ({ name, size = 22, idx }) => {
  const initials = name.split(" ").filter(p => p).slice(0, 2).map(p => p[0]).join("").toUpperCase();
  const i = idx ?? (name.charCodeAt(0) % palette.length);
  return (
    <span className="av" style={{ width: size, height: size, background: palette[i] || palette[0], fontSize: size * 0.42 }}>
      {initials}
    </span>
  );
};

// === Sidebar ===
const Sidebar = ({ current, setCurrent, badges }) => {
  const items = [
    { section: "Workspace" },
    { id: "home", label: "Home", icon: "home" },
    { id: "tasks", label: "My tasks", icon: "clipboard", badge: badges.tasks },
    { section: "Compliance" },
    { id: "accreditation", label: "Accreditation", icon: "shield", badge: badges.acc, badgeKind: "warn" },
    { id: "documents", label: "Documents & SOPs", icon: "file" },
    { id: "audits", label: "Audits & reviews", icon: "audit" },
    { id: "ncr", label: "NC & CAPA", icon: "alert", badge: badges.ncr },
    { section: "Operations" },
    { id: "studies", label: "Studies & reports", icon: "paper", badge: badges.studies, badgeKind: "warn" },
    { id: "indicators", label: "Quality indicators", icon: "chart" },
    { id: "equipment", label: "Equipment register", icon: "cube", badge: badges.equipment },
    { id: "staff", label: "Staff & training", icon: "users" },
    { section: "Admin" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">N</div>
        <div>
          <div className="brand-name">Nexus 360</div>
          <div className="brand-sub">Accreditation</div>
        </div>
      </div>

      <div className="org-switcher" title="Switch service">
        <div className="org-avatar">RS</div>
        <div className="org-name">Riverside Sleep & Resp.</div>
        <Icon name="chev_down" size={14} />
      </div>

      <div className="nav">
        {items.map((it, i) => {
          if (it.section) return <div key={i} className="nav-section">{it.section}</div>;
          return (
            <div key={it.id}
              className={`nav-item ${current === it.id ? 'active' : ''}`}
              onClick={() => setCurrent(it.id)}>
              <span className="icon"><Icon name={it.icon} size={15} /></span>
              <span>{it.label}</span>
              {it.badge ? <span className={`badge ${it.badgeKind || ''}`}>{it.badge}</span> : null}
            </div>
          );
        })}
      </div>

      <div className="user-card">
        <div className="user-avatar">KP</div>
        <div className="user-meta">
          <div className="user-name">Kavya Patel</div>
          <div className="user-role">Quality Manager</div>
        </div>
        <Icon name="chev_down" size={14} />
      </div>
    </aside>
  );
};

// === Topbar ===
const Topbar = ({ crumbs, actions }) => (
  <div className="topbar">
    <div className="crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep"><Icon name="chev_right" size={12} /></span>}
          <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="topbar-spacer" />
    <div className="search">
      <Icon name="search" size={13} />
      <span>Search clauses, studies, equipment…</span>
      <kbd>⌘K</kbd>
    </div>
    <button className="icon-btn" title="Notifications">
      <Icon name="bell" size={15} />
      <span className="dot" />
    </button>
    <button className="icon-btn" title="Help">
      <Icon name="info" size={15} />
    </button>
    {actions}
  </div>
);

// === Page header ===
const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <div className="page-header">
    <div className="page-header-row">
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  </div>
);

// === Drawer ===
const Drawer = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">{children}</div>
    </>
  );
};

// === Tabs ===
const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs">
    {tabs.map(t => (
      <div key={t.id} className={`tab ${value === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
        {t.label}
        {t.count != null && <span className="count">{t.count}</span>}
      </div>
    ))}
  </div>
);

window.Sparkline = Sparkline;
window.Donut = Donut;
window.Pill = Pill;
window.StatusPill = StatusPill;
window.Avatar = Avatar;
window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.PageHeader = PageHeader;
window.Drawer = Drawer;
window.Tabs = Tabs;
