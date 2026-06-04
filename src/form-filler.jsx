import React, { useRef, useEffect, useState, useCallback } from 'react';
import Icon from './icons';

const BASE = import.meta.env.VITE_API_URL ?? '';

// Script injected into the form iframe to activate all interactive fields
const FILL_SCRIPT = `
(function() {
  var idx = 0;

  // Styles for activated inputs
  var style = document.createElement('style');
  style.textContent = [
    'input.fi{border:none;border-bottom:2px solid #2563eb;background:#eff6ff;',
    'padding:2px 4px;font:inherit;color:#1e3a5f;outline:none;vertical-align:middle;}',
    'input.fi:focus{background:#dbeafe;border-bottom-color:#1d4ed8;}',
    'input.fi.sm{min-width:80px;width:80px;}',
    'input.fi.md{min-width:180px;width:180px;}',
    'input.fi.lg{min-width:340px;width:340px;}',
    'textarea.fi{border:2px solid #2563eb;background:#eff6ff;padding:4px;',
    'font:inherit;color:#1e3a5f;resize:vertical;width:100%;box-sizing:border-box;',
    'min-height:60px;display:block;margin-top:4px;}',
    'textarea.fi:focus{background:#dbeafe;border-color:#1d4ed8;}',
    'input.fi[type=checkbox]{width:16px;height:16px;cursor:pointer;',
    'accent-color:#2563eb;vertical-align:middle;}',
    'select.fi{border:2px solid #2563eb;background:#eff6ff;padding:2px 4px;',
    'font:inherit;color:#1e3a5f;cursor:pointer;}',
    'input[type=date].fi,input[type=text].fi{height:auto;}'
  ].join('');
  document.head.appendChild(style);

  function makeInput(size) {
    var el = document.createElement('input');
    el.type = 'text';
    el.className = 'fi ' + (size || 'md');
    el.dataset.fi = idx++;
    return el;
  }

  // Replace .fill spans
  Array.from(document.querySelectorAll('.fill')).forEach(function(el) {
    var sz = el.classList.contains('lg') ? 'lg' : el.classList.contains('sm') ? 'sm' : 'md';
    var inp = makeInput(sz);
    el.parentNode.replaceChild(inp, el);
  });

  // Replace .fill-sm spans (AASM form style)
  Array.from(document.querySelectorAll('.fill-sm')).forEach(function(el) {
    var inp = makeInput('sm');
    el.parentNode.replaceChild(inp, el);
  });

  // Replace .box spans with checkboxes
  Array.from(document.querySelectorAll('.box')).forEach(function(el) {
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'fi';
    cb.dataset.fi = idx++;
    el.parentNode.replaceChild(cb, el);
  });

  // Replace text "___" patterns (5+ underscores in text nodes) with inputs
  function processTextNode(node) {
    var text = node.nodeValue;
    if (!text || !/_{4,}/.test(text)) return;
    var parts = text.split(/(_{4,})/);
    if (parts.length <= 1) return;
    var frag = document.createDocumentFragment();
    parts.forEach(function(part) {
      if (/^_{4,}$/.test(part)) {
        var inp = makeInput('md');
        frag.appendChild(inp);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    });
    node.parentNode.replaceChild(frag, node);
  }
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(processTextNode);

  // Activate existing <select> elements
  Array.from(document.querySelectorAll('select')).forEach(function(el) {
    el.classList.add('fi');
    el.dataset.fi = idx++;
  });

  // Activate existing date inputs
  Array.from(document.querySelectorAll('input[type=date]')).forEach(function(el) {
    el.classList.add('fi');
    el.dataset.fi = idx++;
  });

  // Make sign-cell divs editable
  Array.from(document.querySelectorAll('.sign-cell')).forEach(function(el) {
    var ta = document.createElement('textarea');
    ta.className = 'fi';
    ta.placeholder = el.textContent.trim() || 'Signature / name…';
    ta.dataset.fi = idx++;
    el.innerHTML = '';
    el.appendChild(ta);
  });

  // Collect all field values and snapshot HTML, then send to parent
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'collect') return;
    var fields = {};
    Array.from(document.querySelectorAll('[data-fi]')).forEach(function(el) {
      var key = 'fi_' + el.dataset.fi;
      if (el.type === 'checkbox') fields[key] = el.checked;
      else fields[key] = el.value;
    });
    // Snapshot: embed filled values as data-attributes so the snapshot is readable
    Array.from(document.querySelectorAll('[data-fi]')).forEach(function(el) {
      if (el.type === 'checkbox') el.setAttribute('data-snap-checked', el.checked ? '1' : '0');
      else el.setAttribute('data-snap-value', el.value);
    });
    var snapshot = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
    parent.postMessage({ type: 'formCollected', fields: fields, snapshot: snapshot }, '*');
  });
})();
`;

// Inject the filler script into raw HTML
function injectScript(html) {
  const scriptTag = `<script>${FILL_SCRIPT}<\/script>`;
  // Insert before </body>
  if (html.includes('</body>')) return html.replace('</body>', scriptTag + '</body>');
  return html + scriptTag;
}

// Build a read-only snapshot viewer (just restore input values from data-snap-* attrs)
const RESTORE_SCRIPT = `
(function(){
  document.querySelectorAll('[data-snap-value]').forEach(function(el){el.value=el.getAttribute('data-snap-value');});
  document.querySelectorAll('[data-snap-checked]').forEach(function(el){el.checked=el.getAttribute('data-snap-checked')==='1';});
})();
`;

// ── FormFiller component ───────────────────────────────────────────────────────

const FormFiller = ({ doc, htmlContent, onSaved, onCancel }) => {
  const iframeRef  = useRef(null);
  const [period, setPeriod]   = useState('');
  const [notes,  setNotes]    = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(null);  // { recordRef }

  const filledHtml = injectScript(htmlContent || '');

  const handleSave = useCallback(() => {
    if (!iframeRef.current) return;
    setSaving(true);
    // Ask the iframe to collect its data
    iframeRef.current.contentWindow.postMessage({ type: 'collect' }, '*');
  }, []);

  useEffect(() => {
    function onMessage(e) {
      if (!e.data || e.data.type !== 'formCollected') return;
      const { fields, snapshot } = e.data;
      const tok = localStorage.getItem('nexus_token');
      fetch(`${BASE}/api/form-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
        body: JSON.stringify({
          formId:      doc.id,
          formTitle:   doc.title,
          period:      period || new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
          notes,
          formData:    JSON.stringify(fields),
          snapshotHtml: snapshot,
        }),
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(result => {
          setSaved(result);
          setSaving(false);
          onSaved?.(result);
        })
        .catch(() => setSaving(false));
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [doc.id, doc.title, period, notes, onSaved]);

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--good-soft)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={28} style={{ color: 'var(--good)' }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Record saved</div>
        <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>Reference: <strong>{saved.recordRef}</strong></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={onCancel}>Close</button>
          <button className="btn btn-primary" onClick={() => setSaved(null)}>Fill another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#2563eb', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-ink)' }}>Fill mode active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>Period</label>
            <input
              className="input" style={{ fontSize: 12, padding: '3px 8px', width: 110 }}
              placeholder="e.g. Jun 2026"
              value={period} onChange={e => setPeriod(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>Notes</label>
            <input
              className="input" style={{ fontSize: 12, padding: '3px 8px', width: 200 }}
              placeholder="Optional notes…"
              value={notes} onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Icon name="check" size={13} />{saving ? 'Saving…' : 'Save record'}
        </button>
      </div>

      {/* Interactive form iframe */}
      <iframe
        ref={iframeRef}
        srcDoc={filledHtml}
        className="doc-frame"
        title={`Fill: ${doc.title}`}
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
        style={{ flex: 1, border: 'none' }}
      />
    </div>
  );
};

// ── RecordViewer component — read-only snapshot ───────────────────────────────

export const RecordViewer = ({ record, onClose }) => {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    if (!record) return;
    const tok = localStorage.getItem('nexus_token');
    fetch(`${BASE}/api/form-records/${record.id}/html`, {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(h => setHtml(h + `<script>${RESTORE_SCRIPT}<\/script>`))
      .catch(() => setHtml('<p style="padding:24px">Could not load record.</p>'));
  }, [record?.id]);

  if (!record) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button className="btn-icon" onClick={onClose}><Icon name="chev_left" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{record.recordRef}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{record.period} · {record.completedBy} · {record.completedAt?.slice(0, 10)}</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>
      <iframe
        srcDoc={html || '<p style="padding:24px;color:#666">Loading…</p>'}
        className="doc-frame"
        title={record.recordRef}
        sandbox="allow-scripts"
        style={{ flex: 1, border: 'none' }}
      />
    </div>
  );
};

export default FormFiller;
