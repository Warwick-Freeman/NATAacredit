import React, { useEffect, useState, useCallback } from 'react';
import Icon from './icons';
import { Pill } from './components';
import FormFiller, { RecordViewer } from './form-filler';

const STATUS_KIND = { Issued: 'good', Draft: 'outline', 'Under review': 'warn', 'Live form': 'info', Obsolete: 'bad' };

const BASE = import.meta.env.VITE_API_URL ?? '';

const DocViewer = ({ doc, onClose, onAttach, onFormSaved }) => {
  const [htmlContent, setHtmlContent]   = useState(null);
  const [htmlLoading, setHtmlLoading]   = useState(false);
  const [pdfBlobUrl,  setPdfBlobUrl]    = useState(null);
  const [pdfLoading,  setPdfLoading]    = useState(false);
  const [fillMode,    setFillMode]      = useState(false);
  const [records,     setRecords]       = useState(null);
  const [showRecords, setShowRecords]   = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  const isForm = doc?.folder === 'forms' && doc?.fileType === 'html';

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Reset state when document changes
  useEffect(() => {
    setFillMode(false);
    setRecords(null);
    setShowRecords(false);
    setViewingRecord(null);
    setPdfBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
  }, [doc?.id]);

  // Fetch PDF as blob so the iframe can display it without auth headers
  useEffect(() => {
    if (!doc?.fileUrl || doc.fileType !== 'pdf') return;
    setPdfBlobUrl(null);
    setPdfLoading(true);
    const tok = localStorage.getItem('nexus_token');
    let blobUrl = null;
    fetch(doc.fileUrl, { headers: tok ? { Authorization: `Bearer ${tok}` } : {} })
      .then(r => r.ok ? r.blob() : Promise.reject(r.status))
      .then(blob => { blobUrl = URL.createObjectURL(blob); setPdfBlobUrl(blobUrl); })
      .catch(() => {})
      .finally(() => setPdfLoading(false));
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [doc?.fileUrl, doc?.fileType]);

  const loadRecords = useCallback(() => {
    if (!doc?.id) return;
    const tok = localStorage.getItem('nexus_token');
    fetch(`${BASE}/api/form-records?formId=${encodeURIComponent(doc.id)}`, {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(list => setRecords(list))
      .catch(() => setRecords([]));
  }, [doc?.id]);

  // Fetch HTML content with auth so it renders in the iframe via srcdoc
  useEffect(() => {
    if (!doc?.fileUrl || doc.fileType === 'pdf') return;
    setHtmlContent(null);
    setHtmlLoading(true);
    const tok = localStorage.getItem('nexus_token');
    fetch(doc.fileUrl, { headers: tok ? { Authorization: `Bearer ${tok}` } : {} })
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(html => setHtmlContent(html))
      .catch(() => setHtmlContent('<p style="padding:24px;color:#666">Could not load document.</p>'))
      .finally(() => setHtmlLoading(false));
  }, [doc?.fileUrl, doc?.fileType]);

  if (!doc) return null;
  const hasFile = !!doc.fileUrl;
  const isPdf   = doc.fileType === 'pdf';

  // Render: record viewer mode
  if (viewingRecord) {
    return (
      <div className="doc-viewer-overlay" onClick={onClose}>
        <div className="doc-viewer" onClick={e => e.stopPropagation()}>
          <RecordViewer record={viewingRecord} onClose={() => setViewingRecord(null)} />
        </div>
      </div>
    );
  }

  // Render: fill mode
  if (fillMode && htmlContent) {
    return (
      <div className="doc-viewer-overlay" onClick={onClose}>
        <div className="doc-viewer" onClick={e => e.stopPropagation()}>
          <FormFiller
            doc={doc}
            htmlContent={htmlContent}
            onCancel={() => setFillMode(false)}
            onSaved={() => { setFillMode(false); loadRecords(); setShowRecords(true); onFormSaved?.(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="doc-viewer-overlay" onClick={onClose}>
      <div className="doc-viewer" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="doc-viewer-head">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name={isPdf ? 'paper' : 'file'} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{doc.id}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>v{doc.v}</span>
              <Pill kind={STATUS_KIND[doc.status] || 'outline'} dot>{doc.status}</Pill>
              {doc.fileName && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{doc.fileName}</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.title}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {isForm && htmlContent && (
              <button className="btn btn-primary" onClick={() => setFillMode(true)}>
                <Icon name="edit" size={14} />Fill form
              </button>
            )}
            {isForm && (
              <button className="btn" onClick={() => { if (!records) loadRecords(); setShowRecords(v => !v); }}>
                <Icon name="paper" size={14} />Records
                {records?.length > 0 && (
                  <span style={{ marginLeft: 4, background: 'var(--accent)', color: '#fff', borderRadius: 8, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>
                    {records.length}
                  </span>
                )}
              </button>
            )}
            {hasFile && isPdf && (
              <a href={doc.fileUrl} download={doc.fileName || `${doc.id}.pdf`}
                className="btn" style={{ textDecoration: 'none' }}>
                <Icon name="download" size={14} />Download
              </a>
            )}
            {hasFile && (
              <button className="btn" onClick={() => {
                if (isPdf && pdfBlobUrl) {
                  window.open(pdfBlobUrl);
                } else if (!isPdf && htmlContent) {
                  const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
                  window.open(URL.createObjectURL(blob));
                }
              }} disabled={isPdf ? !pdfBlobUrl : !htmlContent}>
                <Icon name="arrow_up_right" size={14} />Open in tab
              </button>
            )}
            {!hasFile && (
              <button className="btn btn-primary" onClick={() => onAttach(doc)}>
                <Icon name="upload" size={14} />Attach file
              </button>
            )}
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
          </div>
        </div>

        {/* Metadata bar */}
        <div className="doc-viewer-meta">
          <div><span style={{ color: 'var(--ink-3)' }}>Owner</span><strong style={{ marginLeft: 5 }}>{doc.owner}</strong></div>
          <div>
            <span style={{ color: 'var(--ink-3)' }}>Review due</span>
            <strong style={{ marginLeft: 5, color: doc.reviewDue?.includes('Overdue') ? 'var(--bad)' : 'inherit' }}>
              {doc.reviewDue || '—'}
            </strong>
          </div>
          {doc.clauses?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--ink-3)' }}>Clauses</span>
              {doc.clauses.map(c => (
                <span key={c} className="mono" style={{ fontSize: 10, padding: '1px 5px', background: 'var(--accent-soft)', borderRadius: 3, color: 'var(--accent-ink)', marginLeft: 2 }}>
                  {c}
                </span>
              ))}
            </div>
          )}
          {doc.updated && (
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ color: 'var(--ink-3)' }}>Updated</span>
              <span style={{ marginLeft: 5 }}>{doc.updated}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="doc-viewer-body">
          {hasFile ? (
            isPdf ? (
              pdfLoading ? (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13 }}>
                  Loading PDF…
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  className="doc-frame"
                  title={doc.title}
                />
              ) : (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13 }}>
                  Could not load PDF
                </div>
              )
            ) : htmlLoading ? (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13 }}>
                Loading…
              </div>
            ) : htmlContent ? (
              <iframe
                srcDoc={htmlContent}
                className="doc-frame"
                title={doc.title}
                sandbox="allow-scripts allow-forms allow-popups allow-downloads"
              />
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13 }}>
                No content
              </div>
            )
          ) : (
            <div className="doc-no-file">
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                <Icon name="file" size={28} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 4 }}>No file attached</div>
                <div style={{ fontSize: 13 }}>Attach a PDF or HTML file to view it here</div>
              </div>
              <button className="btn btn-primary" onClick={() => onAttach(doc)}>
                <Icon name="upload" size={14} />Attach PDF or HTML file
              </button>
            </div>
          )}
        </div>

        {/* Records panel — shown when Records button is toggled */}
        {showRecords && isForm && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)', maxHeight: 280, overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Completed records</div>
              {records === null && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Loading…</span>}
              {records?.length === 0 && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>No records yet — click Fill form to create one.</span>}
            </div>
            {records?.map(r => (
              <div
                key={r.id}
                onClick={() => setViewingRecord(r)}
                style={{ padding: '8px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                className="row-clickable"
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{r.recordRef}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {r.period} · {r.completedBy} · {r.completedAt?.slice(0, 10)}
                    {r.notes && <span> · {r.notes}</span>}
                  </div>
                </div>
                <Icon name="chev_right" size={13} style={{ color: 'var(--ink-3)' }} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default DocViewer;
