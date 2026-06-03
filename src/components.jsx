import React, { useState, useRef, useEffect } from 'react';
import Icon from './icons';
import { useLocation } from './LocationContext';
import { useNexusData } from './NexusDataContext';

// === Sparkline ===
export const Sparkline = ({ data, height = 28, width = 100, color }) => {
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
export const Donut = ({ size = 90, stroke = 12, segments }) => {
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
export const Pill = ({ children, kind = "neutral", dot = false }) => (
  <span className={`pill ${kind === 'neutral' ? '' : kind}`}>
    {dot && <span className="dot" />}
    {children}
  </span>
);

// === Status pill for clauses ===
export const StatusPill = ({ status }) => {
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
const avatarPalette = ["#3b82f6", "#0ea5e9", "#0d9488", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#9333ea", "#db2777"];
export const Avatar = ({ name, size = 22, idx }) => {
  const initials = name.split(" ").filter(p => p).slice(0, 2).map(p => p[0]).join("").toUpperCase();
  const i = idx ?? (name.charCodeAt(0) % avatarPalette.length);
  return (
    <span className="av" style={{ width: size, height: size, background: avatarPalette[i] || avatarPalette[0], fontSize: size * 0.42 }}>
      {initials}
    </span>
  );
};

// === Sidebar ===
export const Sidebar = ({ current, setCurrent, badges, user, onSignOut, open, onClose }) => {
  const { siteId, setSiteId, site, SITES } = useLocation();
  const { activeStandard } = useNexusData() ?? {};
  const [siteOpen, setSiteOpen] = useState(false);

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
    { id: "scheduler", label: "Scheduler", icon: "calendar" },
    { id: "patients", label: "Patients", icon: "heart" },
    { id: "studies", label: "Studies & reports", icon: "paper", badge: badges.studies, badgeKind: "warn" },
    { id: "indicators", label: "Quality indicators", icon: "chart" },
    { id: "equipment", label: "Equipment register", icon: "cube", badge: badges.equipment },
    { id: "staff", label: "Staff & training", icon: "users" },
    ...(activeStandard === 'aasm' ? [{ id: "workbooks", label: "Workbooks", icon: "paper" }] : []),
    { section: "Admin" },
    { id: "settings", label: "Settings", icon: "settings" },
    { id: "trail", label: "Audit trail", icon: "clipboard" },
  ];

  const navigate = (id) => { setCurrent(id); onClose?.(); };

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">N</div>
        <div>
          <div className="brand-name">Nexus 360</div>
          <div className="brand-sub">Accreditation</div>
        </div>
      </div>

      {/* Site / location selector */}
      <div style={{ padding: '0 10px 6px', position: 'relative' }}>
        <button
          onClick={() => setSiteOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)',
            background: siteOpen ? 'var(--surface-2)' : 'var(--surface)',
            cursor: 'pointer', fontSize: 12, color: 'var(--ink-2)',
            transition: 'background 0.15s',
          }}>
          <Icon name="building" size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {site.short}
          </span>
          <Icon name="chev_down" size={11} style={{ color: 'var(--ink-4)', flexShrink: 0, transform: siteOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>

        {siteOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 49 }}
              onClick={() => setSiteOpen(false)}
            />
            <div style={{
              position: 'absolute', top: 'calc(100% + 2px)', left: 10, right: 10,
              zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', overflow: 'hidden',
            }}>
              {SITES.map(s => (
                <div
                  key={s.id}
                  onClick={() => { setSiteId(s.id); setSiteOpen(false); }}
                  style={{
                    padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: s.id === siteId ? 'var(--accent-soft)' : 'transparent',
                    color: s.id === siteId ? 'var(--accent-ink)' : 'var(--ink-2)',
                    fontWeight: s.id === siteId ? 600 : 400,
                  }}>
                  {s.id === siteId && (
                    <Icon name="check" size={11} style={{ flexShrink: 0 }} />
                  )}
                  {s.id !== siteId && <span style={{ width: 11, flexShrink: 0 }} />}
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="nav">
        {items.map((it, i) => {
          if (it.section) return <div key={i} className="nav-section">{it.section}</div>;
          return (
            <div key={it.id}
              className={`nav-item ${current === it.id ? 'active' : ''}`}
              onClick={() => navigate(it.id)}>
              <span className="icon"><Icon name={it.icon} size={15} /></span>
              <span>{it.label}</span>
              {it.badge ? <span className={`badge ${it.badgeKind || ''}`}>{it.badge}</span> : null}
            </div>
          );
        })}
      </div>

      <div className="user-card">
        <div className="user-avatar">{user?.initials ?? 'U'}</div>
        <div className="user-meta">
          <div className="user-name">{user?.name ?? 'User'}</div>
          <div className="user-role">{user?.role ?? ''}</div>
        </div>
      </div>
      <button className="sign-out-btn" onClick={onSignOut} title="Sign out">
        <Icon name="log_out" size={14} />
        Sign out
      </button>
    </aside>
  );
};

// === Topbar ===
export const Topbar = ({ crumbs, actions, onSearch, notifications = [], goTo, onMenuToggle }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const unread = Math.max(0, notifications.length - readCount);

  const open = () => { setNotifOpen(true); setReadCount(notifications.length); };

  return (
    <div className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Menu">
        <Icon name="menu" size={16} />
      </button>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep"><Icon name="chev_right" size={12} /></span>}
            <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-spacer" />
      <div className="search" onClick={onSearch} style={{ cursor: 'pointer' }}>
        <Icon name="search" size={13} />
        <span>Search clauses, studies, equipment…</span>
        <kbd>⌘K</kbd>
      </div>

      {/* Notification bell */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button className="icon-btn" title="Notifications" onClick={notifOpen ? () => setNotifOpen(false) : open}
          style={{ position: 'relative' }}>
          <Icon name="bell" size={15} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4, width: 7, height: 7,
              borderRadius: '50%', background: 'var(--bad)', border: '1.5px solid var(--surface)',
            }} />
          )}
        </button>

        {notifOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            width: 340, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 60, overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, fontSize: 13, flex: 1, color: 'var(--ink)' }}>Notifications</span>
              {notifications.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--ink-4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1px 7px' }}>
                  {notifications.length}
                </span>
              )}
            </div>

            {/* Notification list */}
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
                  No notifications
                </div>
              ) : notifications.map((n, i) => (
                <div key={i}
                  onClick={() => { if (n.page && goTo) { goTo(n.page); setNotifOpen(false); } }}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    cursor: n.page ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (n.page) e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: n.kind === 'bad' ? 'rgba(239,68,68,0.1)' : n.kind === 'warn' ? 'rgba(234,179,8,0.1)' : 'var(--surface-2)',
                    color: n.kind === 'bad' ? 'var(--bad)' : n.kind === 'warn' ? 'var(--warn)' : 'var(--ink-2)',
                  }}>
                    <Icon name={n.icon} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{n.title}</div>
                    {n.sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.sub}</div>}
                  </div>
                  {n.page && <Icon name="chev_right" size={12} style={{ color: 'var(--ink-4)', flexShrink: 0, alignSelf: 'center' }} />}
                </div>
              ))}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { if (goTo) { goTo('trail'); setNotifOpen(false); } }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--accent-ink)', fontFamily: 'inherit', padding: 0 }}>
                  View audit log →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button className="icon-btn" title="Help">
        <Icon name="info" size={15} />
      </button>
      {actions}
    </div>
  );
};

// === Page header ===
export const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
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
export const Drawer = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">{children}</div>
    </>
  );
};

// === Tabs ===
export const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs">
    {tabs.map(t => (
      <div key={t.id} className={`tab ${value === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
        {t.label}
        {t.count != null && <span className="count">{t.count}</span>}
      </div>
    ))}
  </div>
);
