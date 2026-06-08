import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { initSurveyJS } from './survey-config';
import Icon from './icons';

initSurveyJS();

const BASE = import.meta.env.VITE_API_URL ?? '';

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
            formId:      doc.id,
            formTitle:   doc.title,
            period,
            formData:    JSON.stringify(sender.data),
            snapshotHtml: null,
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
