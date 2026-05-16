import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from './icons';

const NAV_ITEMS = [
  { icon: 'home',      label: 'Home',               page: 'home'          },
  { icon: 'shield',    label: 'Accreditation',       page: 'accreditation' },
  { icon: 'file',      label: 'Documents & SOPs',    page: 'documents'     },
  { icon: 'audit',     label: 'Audits & reviews',    page: 'audits'        },
  { icon: 'alert',     label: 'NC & CAPA',           page: 'ncr'           },
  { icon: 'heart',     label: 'Patients',             page: 'patients'      },
  { icon: 'paper',     label: 'Studies & reports',   page: 'studies'       },
  { icon: 'chart',     label: 'Quality indicators',  page: 'indicators'    },
  { icon: 'cube',      label: 'Equipment register',  page: 'equipment'     },
  { icon: 'users',     label: 'Staff & training',    page: 'staff'         },
  { icon: 'settings',  label: 'Settings',            page: 'settings'      },
  { icon: 'clipboard', label: 'Audit trail',         page: 'trail'         },
];

const KIND_LABEL = { page: 'Page', clause: 'Clause', study: 'Study' };

const GlobalSearch = ({ data, goTo, onClose }) => {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo(() => {
    const qLow = q.trim().toLowerCase();
    if (!qLow) return [];
    const items = [];

    // Pages
    NAV_ITEMS.forEach(n => {
      if (n.label.toLowerCase().includes(qLow))
        items.push({ kind: 'page', icon: n.icon, title: n.label, sub: 'Go to page', action: () => goTo(n.page) });
    });

    // ASA sections
    data?.complianceBySection?.forEach(s => {
      if (s.id.toLowerCase().includes(qLow) || s.name.toLowerCase().includes(qLow)) {
        const statusText = s.nc > 0 ? `${s.nc} non-conformant` : s.partial > 0 ? `${s.partial} partial` : 'all compliant';
        items.push({
          kind: 'clause', icon: 'shield',
          title: `§${s.id} – ${s.name}`,
          sub: `${s.compliant}/${s.total} clauses · ${statusText}`,
          action: () => goTo('accreditation'),
        });
      }
    });

    // Studies
    data?.studies?.forEach(s => {
      if (
        s.id?.toLowerCase().includes(qLow) ||
        s.physician?.toLowerCase().includes(qLow) ||
        s.type?.toLowerCase().includes(qLow)
      ) {
        items.push({
          kind: 'study', icon: 'paper',
          title: s.id,
          sub: `${s.type} · ${s.physician} · ${s.status}`,
          action: () => goTo('studies'),
        });
      }
    });

    return items;
  }, [q, data, goTo]);

  const displayed = q.trim() ? results : NAV_ITEMS.map(n => ({
    kind: 'page', icon: n.icon, title: n.label, sub: 'Go to page', action: () => goTo(n.page),
  }));

  const select = (item) => { item.action(); onClose(); };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') {
      setCursor(c => { const n = Math.min(c + 1, displayed.length - 1); scrollToItem(n); return n; });
      e.preventDefault();
    }
    if (e.key === 'ArrowUp') {
      setCursor(c => { const n = Math.max(c - 1, 0); scrollToItem(n); return n; });
      e.preventDefault();
    }
    if (e.key === 'Enter' && displayed[cursor]) { select(displayed[cursor]); }
  };

  const scrollToItem = (idx) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[idx];
    if (item) item.scrollIntoView({ block: 'nearest' });
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 70, backdropFilter: 'blur(2px)' }}
      />
      <div style={{
        position: 'fixed', top: '12vh', left: '50%', transform: 'translateX(-50%)',
        width: 580, maxWidth: 'calc(100vw - 32px)', zIndex: 71,
        background: 'var(--surface)', borderRadius: 12,
        boxShadow: '0 8px 48px rgba(0,0,0,0.24)', border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <Icon name="search" size={16} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setCursor(0); }}
            onKeyDown={handleKey}
            placeholder="Search clauses, studies, pages…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'var(--ink)', fontFamily: 'inherit' }}
          />
          {q && (
            <button onClick={() => { setQ(''); setCursor(0); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 2, display: 'flex', lineHeight: 1 }}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Results list */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
          {!q.trim() && (
            <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick navigation
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
              No results for <strong>"{q}"</strong>
            </div>
          )}
          {displayed.map((item, i) => (
            <div
              key={i}
              onClick={() => select(item)}
              onMouseEnter={() => setCursor(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', cursor: 'pointer',
                background: cursor === i ? 'var(--surface-2)' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: cursor === i ? 'var(--surface-3)' : 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-2)',
              }}>
                <Icon name={item.icon} size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {KIND_LABEL[item.kind]}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '7px 16px', display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-4)' }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key}>
              <kbd style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 3, padding: '0 4px', marginRight: 4 }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default GlobalSearch;
