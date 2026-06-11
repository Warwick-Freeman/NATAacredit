import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { initSurveyJS } from '../survey-config';

initSurveyJS();

const BASE = import.meta.env.VITE_API_URL ?? '';

// Same FILL_SCRIPT as form-filler.jsx — injected into the HTML form iframe
const FILL_SCRIPT = `
(function() {
  var idx = 0;
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
    'input.fi[type=checkbox]{width:16px;height:16px;cursor:pointer;accent-color:#2563eb;vertical-align:middle;}',
    'select.fi{border:2px solid #2563eb;background:#eff6ff;padding:2px 4px;font:inherit;color:#1e3a5f;cursor:pointer;}',
  ].join('');
  document.head.appendChild(style);
  function makeInput(size) {
    var el = document.createElement('input'); el.type = 'text';
    el.className = 'fi ' + (size || 'md'); el.dataset.fi = idx++; return el;
  }
  var LOCKED = ['.doc-header', '.signoff'];
  function isLocked(el) { return LOCKED.some(function(sel) { var p = document.querySelector(sel); return p && p.contains(el); }); }
  Array.from(document.querySelectorAll('.fill')).forEach(function(el) {
    if (isLocked(el)) return;
    var sz = el.classList.contains('lg') ? 'lg' : el.classList.contains('sm') ? 'sm' : 'md';
    el.parentNode.replaceChild(makeInput(sz), el);
  });
  Array.from(document.querySelectorAll('.fill-sm')).forEach(function(el) {
    if (isLocked(el)) return; el.parentNode.replaceChild(makeInput('sm'), el);
  });
  Array.from(document.querySelectorAll('.box')).forEach(function(el) {
    if (isLocked(el)) return;
    var cb = document.createElement('input'); cb.type = 'checkbox';
    cb.className = 'fi'; cb.dataset.fi = idx++; el.parentNode.replaceChild(cb, el);
  });
  function processTextNode(node) {
    var text = node.nodeValue; if (!text || !/_{4,}/.test(text)) return;
    var parts = text.split(/(_{4,})/); if (parts.length <= 1) return;
    var frag = document.createDocumentFragment();
    parts.forEach(function(part) { frag.appendChild(/^_{4,}$/.test(part) ? makeInput('md') : document.createTextNode(part)); });
    node.parentNode.replaceChild(frag, node);
  }
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), textNodes = [], _n;
  while ((_n = walker.nextNode())) { if (!isLocked(_n)) textNodes.push(_n); }
  textNodes.forEach(processTextNode);
  Array.from(document.querySelectorAll('select')).forEach(function(el) { if (isLocked(el)) return; el.classList.add('fi'); el.dataset.fi = idx++; });
  Array.from(document.querySelectorAll('input[type=date]')).forEach(function(el) { if (isLocked(el)) return; el.classList.add('fi'); el.dataset.fi = idx++; });
  Array.from(document.querySelectorAll('.sign-cell')).forEach(function(el) {
    if (isLocked(el)) return;
    var ta = document.createElement('textarea'); ta.className = 'fi';
    ta.placeholder = el.textContent.trim() || 'Signature / name…'; ta.dataset.fi = idx++;
    el.innerHTML = ''; el.appendChild(ta);
  });
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'collect') return;
    var fields = {};
    Array.from(document.querySelectorAll('[data-fi]')).forEach(function(el) {
      var key = 'fi_' + el.dataset.fi;
      if (el.type === 'checkbox') fields[key] = el.checked; else fields[key] = el.value;
    });
    Array.from(document.querySelectorAll('[data-fi]')).forEach(function(el) {
      if (el.type === 'checkbox') el.setAttribute('data-snap-checked', el.checked ? '1' : '0');
      else el.setAttribute('data-snap-value', el.value);
    });
    var snapshot = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
    parent.postMessage({ type: 'formCollected', fields: fields, snapshot: snapshot }, '*');
  });
})();
`;

function injectScript(html) {
  const tag = `<script>${FILL_SCRIPT}<\/script>`;
  if (html.includes('</body>')) return html.replace('</body>', tag + '</body>');
  return html + tag;
}

function buildSurveySnapshot(sender, title) {
  const period = new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
  const completedDate = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  const rows = sender.getAllQuestions().map(q => {
    let val = q.value;
    if (val === null || val === undefined) val = '<em style="color:#999">—</em>';
    else if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
    else if (Array.isArray(val)) val = val.map(i => typeof i === 'object' ? JSON.stringify(i) : String(i)).join(', ');
    else if (typeof val === 'object') val = JSON.stringify(val);
    else val = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const label = (q.title || q.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;width:40%;vertical-align:top">${label}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top">${val}</td></tr>`;
  }).join('');
  const t = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t}</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px}h2{margin:0 0 4px;font-size:18px}p{margin:0 0 16px;font-size:13px;color:#718096}table{border-collapse:collapse;width:100%;font-size:14px}</style></head><body><h2>${t}</h2><p>Period: ${period} · Completed: ${completedDate}</p><table><tbody>${rows}</tbody></table></body></html>`;
}

// ── Survey form for public fill ───────────────────────────────────────────────
const PublicSurveyFiller = ({ formInfo, onComplete }) => {
  const [phase, setPhase] = useState('filling');

  const model = useMemo(() => {
    if (!formInfo.surveyJson) return null;
    try { return new Model(JSON.parse(formInfo.surveyJson)); } catch { return null; }
  }, [formInfo.surveyJson]);

  const [surveyError, setSurveyError] = useState('');

  useEffect(() => {
    if (!model) return;
    const handler = async (sender) => {
      setPhase('saving');
      setSurveyError('');
      try {
        const res = await fetch(`${BASE}/api/form-fill/${formInfo.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData: JSON.stringify(sender.data),
            snapshotHtml: buildSurveySnapshot(sender, formInfo.formTitle),
          }),
        });
        if (res.ok) {
          setPhase('done');
          onComplete?.();
        } else {
          const msg = await res.text().catch(() => '');
          setSurveyError(`Submission failed (${res.status})${msg ? ': ' + msg : ''}`);
          setPhase('error');
        }
      } catch (err) {
        setSurveyError('Network error — could not reach server. Please try again.');
        setPhase('error');
      }
    };
    model.onComplete.add(handler);
    return () => model.onComplete.remove(handler);
  }, [model, formInfo, onComplete]);

  if (phase === 'saving') return <div style={{ display: 'grid', placeItems: 'center', padding: 48, color: '#64748b' }}>Submitting…</div>;
  if (phase === 'error') return (
    <div style={{ display: 'grid', placeItems: 'center', padding: 48, textAlign: 'center', gap: 12 }}>
      <div style={{ color: '#dc2626', fontWeight: 600 }}>Could not submit. Please try again.</div>
      {surveyError && <div style={{ fontSize: 12, color: '#64748b' }}>{surveyError}</div>}
    </div>
  );
  if (!model) return <div style={{ display: 'grid', placeItems: 'center', padding: 48, color: '#64748b' }}>Form unavailable.</div>;
  return <Survey model={model} />;
};

// ── HTML form for public fill ─────────────────────────────────────────────────
const PublicHtmlFiller = ({ formInfo, onComplete }) => {
  const iframeRef  = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const filledHtml = injectScript(formInfo.htmlContent || '');

  const handleSubmit = useCallback(() => {
    if (!iframeRef.current) return;
    setSubmitting(true);
    setSubmitError('');
    iframeRef.current.contentWindow.postMessage({ type: 'collect' }, '*');
  }, []);

  useEffect(() => {
    async function onMessage(e) {
      if (!e.data || e.data.type !== 'formCollected') return;
      const { fields, snapshot } = e.data;
      try {
        const res = await fetch(`${BASE}/api/form-fill/${formInfo.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData: JSON.stringify(fields), snapshotHtml: snapshot }),
        });
        if (res.ok) {
          onComplete?.();
        } else {
          const msg = await res.text().catch(() => '');
          setSubmitError(`Submission failed (${res.status})${msg ? ': ' + msg : ''}`);
          setSubmitting(false);
        }
      } catch (err) {
        setSubmitError('Network error — could not reach server. Please try again.');
        setSubmitting(false);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [formInfo.token, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <iframe
        ref={iframeRef}
        srcDoc={filledHtml}
        style={{ flex: 1, border: 'none', minHeight: 500 }}
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
        title={formInfo.formTitle}
      />
      <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
        {submitError && (
          <div style={{ fontSize: 13, color: '#dc2626', flex: 1 }}>{submitError}</div>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '10px 28px', borderRadius: 8, border: 'none', cursor: submitting ? 'default' : 'pointer',
            background: '#2563eb', color: 'white', fontWeight: 600, fontSize: 14, opacity: submitting ? 0.6 : 1, flexShrink: 0,
          }}
        >
          {submitting ? 'Submitting…' : 'Submit form'}
        </button>
      </div>
    </div>
  );
};

// ── Main public fill page ─────────────────────────────────────────────────────
const FormFillPage = ({ token }) => {
  const [status, setStatus] = useState('loading'); // loading | ready | complete | already-complete | not-found | error
  const [formInfo, setFormInfo] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/api/form-fill/${token}`)
      .then(r => r.ok ? r.json() : r.status === 404 ? { error: 'not_found' } : Promise.reject())
      .then(data => {
        if (data.error === 'not_found') { setStatus('not-found'); return; }
        if (data.status === 'complete') { setFormInfo(data); setStatus('already-complete'); return; }
        setFormInfo(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const shell = (content) => (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#1e3a5f', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#2563eb', display: 'grid', placeItems: 'center' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Nexus 360</span>
      </div>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>
        {content}
      </div>
    </div>
  );

  if (status === 'loading') return shell(
    <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading form…</div>
  );

  if (status === 'not-found') return shell(
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Link not found</div>
      <div style={{ color: '#64748b', fontSize: 14 }}>This link is invalid or has expired. Please contact the clinic for a new link.</div>
    </div>
  );

  if (status === 'error') return shell(
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Could not load form</div>
      <div style={{ color: '#64748b', fontSize: 13 }}>Please check your connection and try again.</div>
    </div>
  );

  if (status === 'already-complete') return shell(
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ width: 60, height: 60, borderRadius: 30, background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Form already submitted</div>
      <div style={{ color: '#64748b', fontSize: 14 }}>Thank you, {formInfo?.patientName}. Your response has been received.</div>
    </div>
  );

  if (status === 'complete') return shell(
    <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ width: 60, height: 60, borderRadius: 30, background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Thank you!</div>
      <div style={{ color: '#64748b', fontSize: 14 }}>Your response has been submitted successfully. You can now close this page.</div>
    </div>
  );

  // ── Ready: show form ────────────────────────────────────────────────────────
  return shell(
    <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{formInfo.formTitle}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          For: <strong>{formInfo.patientName}</strong> · Please complete all fields and submit.
        </div>
      </div>

      {formInfo.formType === 'survey' ? (
        <div style={{ padding: '0' }}>
          <PublicSurveyFiller
            formInfo={formInfo}
            onComplete={() => setStatus('complete')}
          />
        </div>
      ) : (
        <PublicHtmlFiller
          formInfo={formInfo}
          onComplete={() => setStatus('complete')}
        />
      )}
    </div>
  );
};

export default FormFillPage;
