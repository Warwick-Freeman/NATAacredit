import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Icon from './icons';

// Shared document styles — matches the embedded CSS in existing SOP HTML files
const DOC_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10.5pt; color: #1e2d3d; line-height: 1.65;
    padding: 28px 36px; max-width: 860px; margin: 0 auto;
    background: #fff;
  }
  .doc-header {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px;
    border-bottom: 3px solid #14406b; padding-bottom: 10px; margin-bottom: 20px;
  }
  .doc-header .kind {
    grid-column: 1/-1; font-size: 8.5pt; text-transform: uppercase;
    letter-spacing: 0.1em; color: #14406b; font-weight: 700;
  }
  .doc-header .title {
    grid-column: 1/-1; font-size: 15pt; font-weight: 700;
    color: #14406b; margin: 4px 0;
  }
  .doc-header .field { font-size: 9pt; color: #3d5166; padding: 3px 0; }
  h1 { font-size: 13pt; color: #14406b; margin: 16px 0 6px; }
  h2 {
    font-size: 11pt; color: #14406b; margin: 14px 0 5px;
    border-bottom: 1px solid #d1dde8; padding-bottom: 2px;
  }
  h3 { font-size: 10pt; color: #14406b; margin: 10px 0 4px; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0 6px 22px; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px solid #c5cfdb; margin: 16px 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #c5cfdb; padding: 5px 9px; text-align: left; font-size: 9.5pt; }
  th { background: #e8f0f7; font-weight: 600; }
  .signoff {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;
    margin-top: 24px; border-top: 1px solid #c5cfdb; padding-top: 12px;
  }
  .sign-cell {
    border: 1px solid #c5cfdb; padding: 8px;
    min-height: 60px; font-size: 9.5pt; color: #506478;
  }

  /* ── Editor-only chrome (stripped from saved HTML) ── */
  .editor-locked {
    pointer-events: none; user-select: none;
    background: #f8fafc; border-radius: 4px;
    border: 1.5px dashed #cbd5e1; padding: 8px;
    margin-bottom: 4px; opacity: 0.8;
  }
  .editor-lock-badge {
    grid-column: 1/-1; display: flex; align-items: center; gap: 5px;
    font-size: 8pt; padding: 3px 8px; margin-top: 6px;
    background: #e2e8f0; border: 1px dashed #94a3b8; border-radius: 8px;
    color: #64748b; width: fit-content;
  }

  /* ── Editable content area ── */
  .doc-content { min-height: 320px; outline: none; padding: 2px 0; }
  .doc-content:focus { outline: none; }
`;

// Build the iframe template HTML
function buildTemplate({ title, folder, docId }) {
  const kindMap = {
    sops:     'Standard Operating Procedure',
    policies: 'Policy',
    forms:    'Form / Record',
    manual:   'Quality Manual Section',
    records:  'Record',
  };
  const kind = kindMap[folder] || 'Document';
  const safeTitle = (title || 'Document Title').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>${DOC_CSS}</style>
</head>
<body>

<header class="doc-header editor-locked" contenteditable="false">
  <div class="kind">${kind}</div>
  <div class="title">${safeTitle}</div>
  <div class="field"><strong>Document ID:</strong> ${docId || '—'}</div>
  <div class="field"><strong>Revision:</strong> 1.0</div>
  <div class="field"><strong>Effective date:</strong> (auto-filled on approval)</div>
  <div class="field"><strong>Review date:</strong> (auto-filled)</div>
  <div class="field"><strong>Authorised by:</strong> (auto-filled on approval)</div>
  <div class="editor-lock-badge">&#128274; Header is auto-populated from the document workflow when viewed</div>
</header>

<div class="doc-content" contenteditable="true">
<h2>Purpose</h2>
<p>Describe the purpose of this document.</p>
<h2>Scope</h2>
<p>Define the scope of this document and who it applies to.</p>
<h2>Procedure</h2>
<p>Outline the steps or requirements.</p>
<h2>References</h2>
<p>List any related documents, standards, or regulations.</p>
</div>

<div class="signoff editor-locked" contenteditable="false">
  <div class="sign-cell"><strong>Prepared by</strong><br>Name: —<br>Date: —</div>
  <div class="sign-cell"><strong>Reviewed by (Quality Manager)</strong><br>Name: —<br>Date: —</div>
  <div class="sign-cell"><strong>Authorised by (Medical Director)</strong><br>Name: —<br>Date: —</div>
  <div class="editor-lock-badge" style="grid-column:1/-1">&#128274; Signoff is auto-populated from the approval workflow when viewed</div>
</div>

<script>
(function() {
  var content = document.querySelector('.doc-content');
  if (content) {
    content.focus();
    try {
      var r = document.createRange(), s = window.getSelection();
      r.selectNodeContents(content); r.collapse(false);
      s.removeAllRanges(); s.addRange(r);
    } catch(e) {}
  }

  window.addEventListener('message', function(e) {
    if (!e.data) return;

    if (e.data.type === 'exec') {
      try { document.execCommand(e.data.cmd, false, e.data.val != null ? e.data.val : null); } catch(ex) {}
      if (content) content.focus();
      return;
    }

    if (e.data.type === 'getHtml') {
      var clone = document.documentElement.cloneNode(true);
      // Strip editor-only chrome from the clone
      clone.querySelectorAll('.editor-locked').forEach(function(el) {
        el.classList.remove('editor-locked');
      });
      clone.querySelectorAll('.editor-lock-badge').forEach(function(el) { el.remove(); });
      clone.querySelectorAll('[contenteditable]').forEach(function(el) {
        el.removeAttribute('contenteditable');
      });
      parent.postMessage({ type: 'editorHtml', html: '<!DOCTYPE html>\\n' + clone.outerHTML }, '*');
    }
  });
})();
<\/script>

</body>
</html>`;
}

// ── Toolbar definition ────────────────────────────────────────────────────────

const TB = [
  [
    { cmd: 'bold',          label: 'B',      style: { fontWeight: 700 },             title: 'Bold (Ctrl+B)' },
    { cmd: 'italic',        label: 'I',      style: { fontStyle: 'italic' },         title: 'Italic (Ctrl+I)' },
    { cmd: 'underline',     label: 'U',      style: { textDecoration: 'underline' }, title: 'Underline (Ctrl+U)' },
    { cmd: 'strikeThrough', label: 'S',      style: { textDecoration: 'line-through' }, title: 'Strikethrough' },
  ],
  [
    { cmd: 'formatBlock', val: 'h1', label: 'H1', title: 'Heading 1' },
    { cmd: 'formatBlock', val: 'h2', label: 'H2', title: 'Heading 2' },
    { cmd: 'formatBlock', val: 'h3', label: 'H3', title: 'Heading 3' },
    { cmd: 'formatBlock', val: 'p',  label: 'P',  title: 'Paragraph' },
  ],
  [
    { cmd: 'insertUnorderedList', label: '•',  title: 'Bullet list' },
    { cmd: 'insertOrderedList',   label: '1.', title: 'Numbered list' },
    { cmd: 'indent',              label: '→',  title: 'Indent' },
    { cmd: 'outdent',             label: '←',  title: 'Outdent' },
  ],
  [
    { cmd: 'justifyLeft',   label: '⬛⬜⬜', title: 'Align left' },
    { cmd: 'justifyCenter', label: '⬜⬛⬜', title: 'Align centre' },
    { cmd: 'justifyRight',  label: '⬜⬜⬛', title: 'Align right' },
  ],
  [
    { cmd: 'insertHorizontalRule', icon: 'minus',  title: 'Horizontal rule' },
    { cmd: 'removeFormat',         label: '✕ Fmt', title: 'Remove formatting' },
  ],
  [
    { cmd: 'undo', label: '↩', title: 'Undo (Ctrl+Z)' },
    { cmd: 'redo', label: '↪', title: 'Redo (Ctrl+Y)' },
  ],
];

// ── WysiwygEditor component ───────────────────────────────────────────────────

const WysiwygEditor = ({ title, folder, docId, initialHtml, onSave, onCancel }) => {
  const iframeRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // For new docs use the full template; for edits pass the raw HTML directly so
  // the browser parses it natively, then we patch the live DOM in onLoad.
  const template = useMemo(
    () => initialHtml ?? buildTemplate({ title, folder, docId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // After the iframe loads, inject editor chrome into the live document.
  // Only runs in edit mode (initialHtml provided); new-doc template is self-contained.
  const handleIframeLoad = useCallback(() => {
    if (!initialHtml) return;
    const iframe  = iframeRef.current;
    const iDoc    = iframe?.contentDocument;
    const iWin    = iframe?.contentWindow;
    if (!iDoc || !iWin) return;

    // Inject editor CSS so locked sections render correctly
    const style = iDoc.createElement('style');
    style.textContent = DOC_CSS;
    (iDoc.head || iDoc.body).appendChild(style);

    // Lock header
    const header = iDoc.querySelector('.doc-header');
    if (header) {
      header.classList.add('editor-locked');
      header.setAttribute('contenteditable', 'false');
      if (!header.querySelector('.editor-lock-badge')) {
        const badge = iDoc.createElement('div');
        badge.className = 'editor-lock-badge';
        badge.style.cssText = 'grid-column:1/-1';
        badge.textContent = '\u{1F512} Header is auto-populated from the document workflow when viewed';
        header.appendChild(badge);
      }
    }

    // Lock signoff
    const signoff = iDoc.querySelector('.signoff');
    if (signoff) {
      signoff.classList.add('editor-locked');
      signoff.setAttribute('contenteditable', 'false');
      if (!signoff.querySelector('.editor-lock-badge')) {
        const badge = iDoc.createElement('div');
        badge.className = 'editor-lock-badge';
        badge.style.cssText = 'grid-column:1/-1';
        badge.textContent = '\u{1F512} Signoff is auto-populated from the approval workflow when viewed';
        signoff.appendChild(badge);
      }
    }

    // Make content area editable
    const content = iDoc.querySelector('.doc-content');
    if (content) {
      content.setAttribute('contenteditable', 'true');
      content.focus();
      try {
        const r = iDoc.createRange(); const s = iWin.getSelection();
        r.selectNodeContents(content); r.collapse(false);
        s?.removeAllRanges(); s?.addRange(r);
      } catch (_) {}
    } else {
      // Fallback for non-template HTML: make body editable, keep header/signoff locked
      iDoc.body.setAttribute('contenteditable', 'true');
      header?.setAttribute('contenteditable', 'false');
      signoff?.setAttribute('contenteditable', 'false');
    }

    // Inject exec/getHtml message handler only if the saved HTML doesn't already have one
    const hasHandler = [...iDoc.querySelectorAll('script')].some(s => s.textContent.includes('getHtml'));
    if (!hasHandler) {
      const script = iDoc.createElement('script');
      script.textContent = `(function(){
  window.addEventListener('message',function(e){
    if(!e.data)return;
    var c=document.querySelector('.doc-content')||document.body;
    if(e.data.type==='exec'){try{document.execCommand(e.data.cmd,false,e.data.val!=null?e.data.val:null);}catch(ex){}if(c)c.focus();return;}
    if(e.data.type==='getHtml'){
      var clone=document.documentElement.cloneNode(true);
      clone.querySelectorAll('.editor-locked').forEach(function(el){el.classList.remove('editor-locked');});
      clone.querySelectorAll('.editor-lock-badge').forEach(function(el){el.remove();});
      clone.querySelectorAll('[contenteditable]').forEach(function(el){el.removeAttribute('contenteditable');});
      parent.postMessage({type:'editorHtml',html:'<!DOCTYPE html>\\n'+clone.outerHTML},'*');
    }
  });
})();`;
      iDoc.body.appendChild(script);
    }
  }, [initialHtml]); // eslint-disable-line react-hooks/exhaustive-deps

  const exec = useCallback((cmd, val) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'exec', cmd, val }, '*');
  }, []);

  const handleSave = useCallback(() => {
    setSaving(true);
    iframeRef.current?.contentWindow?.postMessage({ type: 'getHtml' }, '*');
  }, []);

  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || e.data.type !== 'editorHtml') return;
      const blob = new Blob([e.data.html], { type: 'text/html' });
      const fname = `${(docId || 'document').replace(/[^a-z0-9-]/gi, '-')}.html`;
      const file = new File([blob], fname, { type: 'text/html' });
      setSaving(false);
      onSave(file);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [docId, onSave]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', flexDirection: 'column',
      background: 'var(--surface)',
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        padding: '10px 16px', background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: 'var(--accent-soft)', color: 'var(--accent-ink)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <Icon name="edit" size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title || 'New document'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {initialHtml ? 'Editing draft · ' : 'WYSIWYG editor · '}locked header &amp; footer are auto-populated from the approval workflow
          </div>
        </div>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Icon name="check" size={13} />
          {saving ? 'Saving…' : initialHtml ? 'Save changes' : 'Use this content'}
        </button>
      </div>

      {/* Formatting toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0,
        padding: '4px 10px', background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
      }}>
        {TB.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
            )}
            {group.map(btn => (
              <button
                key={btn.cmd + (btn.val || '')}
                title={btn.title}
                onMouseDown={e => { e.preventDefault(); exec(btn.cmd, btn.val); }}
                style={{
                  padding: '3px 8px', border: 'none', background: 'none',
                  cursor: 'pointer', borderRadius: 4,
                  fontSize: btn.label && btn.label.length <= 2 ? 13 : 11,
                  fontWeight: btn.style?.fontWeight ?? 500,
                  fontStyle: btn.style?.fontStyle,
                  textDecoration: btn.style?.textDecoration,
                  color: 'var(--ink-2)', minWidth: 26, textAlign: 'center',
                  lineHeight: 1.7,
                }}
              >
                {btn.label
                  ? btn.label
                  : <Icon name={btn.icon} size={13} />
                }
              </button>
            ))}
          </React.Fragment>
        ))}

        {/* Insert table button */}
        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
        <button
          title="Insert 3×3 table"
          onMouseDown={e => {
            e.preventDefault();
            exec('insertHTML',
              '<table><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead>' +
              '<tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
              '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>'
            );
          }}
          style={{ padding: '3px 8px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7 }}
        >
          ⊞ Table
        </button>
      </div>

      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
        padding: '5px 14px', background: '#f0f9ff',
        borderBottom: '1px solid #bae6fd', fontSize: 11, color: '#0369a1',
      }}>
        <Icon name="shield" size={12} style={{ color: '#38bdf8', flexShrink: 0 }} />
        The shaded header and footer are locked — click into the white body area to start editing your document content.
      </div>

      {/* Editor iframe */}
      <iframe
        ref={iframeRef}
        srcDoc={template}
        sandbox="allow-scripts allow-same-origin"
        onLoad={handleIframeLoad}
        style={{ flex: 1, border: 'none', background: '#e5e7eb' }}
        title="WYSIWYG document editor"
      />
    </div>
  );
};

export default WysiwygEditor;
