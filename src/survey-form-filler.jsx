import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { initSurveyJS } from './survey-config';
import Icon from './icons';

initSurveyJS();

const BASE = import.meta.env.VITE_API_URL ?? '';

function buildSnapshotHtml(sender, docTitle, period) {
  const completedDate = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  const rows = sender.getAllQuestions().map(q => {
    let val = q.value;
    if (val === null || val === undefined) {
      val = '<em style="color:#999">—</em>';
    } else if (typeof val === 'boolean') {
      val = val ? 'Yes' : 'No';
    } else if (Array.isArray(val)) {
      val = val.map(item => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
    } else if (typeof val === 'object') {
      val = JSON.stringify(val);
    } else {
      val = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    const label = (q.title || q.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;vertical-align:top;width:40%">${label}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top">${val}</td></tr>`;
  }).join('');
  const title = docTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;color:#1a202c}h2{margin:0 0 4px;font-size:18px;color:#2d3748}p{margin:0 0 16px;color:#718096;font-size:13px}table{border-collapse:collapse;width:100%;font-size:14px}</style></head><body><h2>${title}</h2><p>Period: ${period} · Completed: ${completedDate}</p><table><tbody>${rows}</tbody></table></body></html>`;
}

const SurveyFormFiller = ({ doc, surveyJson, onCancel, onSaved }) => {
  const [phase, setPhase] = useState('filling'); // filling | saving | done | error
  const savedDataRef = useRef(null);

  const model = useMemo(() => {
    if (!surveyJson) return null;
    return new Model(surveyJson);
  }, [surveyJson]);

  useEffect(() => {
    if (!model) return;

    const handleComplete = async (sender) => {
      savedDataRef.current = sender.data;
      setPhase('saving');

      const token = localStorage.getItem('nexus_token');
      const period = new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });

      try {
        const res = await fetch(`${BASE}/api/form-records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            formId:       doc.id,
            formTitle:    doc.title,
            period,
            formData:     JSON.stringify(sender.data),
            snapshotHtml: buildSnapshotHtml(sender, doc.title, period),
          }),
        });
        setPhase(res.ok ? 'done' : 'error');
        if (res.ok) onSaved?.();
      } catch {
        setPhase('error');
      }
    };

    model.onComplete.add(handleComplete);
    return () => model.onComplete.remove(handleComplete);
  }, [model, doc.id, doc.title, onSaved]);

  if (phase === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="doc-viewer-head">
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Declaration submitted</div>
          <button className="btn btn-primary" onClick={onCancel}>Close</button>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', flex: 1, flexDirection: 'column', gap: 8, color: 'var(--ink-3)', fontSize: 14 }}>
          <Icon name="check" size={32} />
          Response saved successfully.
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="doc-viewer-head">
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--bad)' }}>Save failed</div>
          <button className="btn" onClick={onCancel}>Close</button>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', flex: 1, color: 'var(--bad)', fontSize: 13 }}>
          Could not save your response. Please try again or contact support.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="doc-viewer-head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Complete all required fields and click Submit</div>
        </div>
        <button className="icon-btn" onClick={onCancel}><Icon name="x" size={14} /></button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {phase === 'saving' ? (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13 }}>
            Saving response…
          </div>
        ) : model ? (
          <Survey model={model} />
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13 }}>
            Loading form…
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyFormFiller;
