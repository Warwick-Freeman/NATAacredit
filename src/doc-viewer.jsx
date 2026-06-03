import React, { useEffect, useState } from 'react';
import Icon from './icons';
import { Pill } from './components';

const STATUS_KIND = { Issued: 'good', Draft: 'outline', 'Under review': 'warn', 'Live form': 'info', Obsolete: 'bad' };

const DocViewer = ({ doc, onClose, onAttach }) => {
  const [htmlContent, setHtmlContent] = useState(null);
  const [htmlLoading, setHtmlLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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
            {hasFile && isPdf && (
              <a href={doc.fileUrl} download={doc.fileName || `${doc.id}.pdf`}
                className="btn" style={{ textDecoration: 'none' }}>
                <Icon name="download" size={14} />Download
              </a>
            )}
            {hasFile && (
              <button className="btn" onClick={() => window.open(doc.fileUrl)}>
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
              <iframe
                src={doc.fileUrl}
                className="doc-frame"
                title={doc.title}
              />
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

      </div>
    </div>
  );
};

export default DocViewer;
