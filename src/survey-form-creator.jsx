import React, { useEffect, useState } from 'react';
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react';
import 'survey-creator-core/survey-creator-core.min.css';
import 'survey-core/survey-core.min.css';
import { initSurveyJS } from './survey-config';
import Icon from './icons';

initSurveyJS();

const BASE = import.meta.env.VITE_API_URL ?? '';

const SurveyFormCreator = ({ docId, docTitle, onClose, onSaved }) => {
  const [creator, setCreator] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const c = new SurveyCreator({
      showLogicTab: true,
      showTranslationTab: false,
      showThemeTab: false,
      isAutoSave: false,
      showPreviewTab: true,
    });

    const token = localStorage.getItem('nexus_token');
    fetch(`${BASE}/api/documents/${encodeURIComponent(docId)}/survey`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => (r.ok && r.status !== 204) ? r.json() : null)
      .then(json => { if (json) c.JSON = json; })
      .catch(() => {})
      .finally(() => setCreator(c));

    return () => { setCreator(null); };
  }, [docId]);

  const handleSave = async () => {
    if (!creator) return;
    setSaving(true);
    setSaveError(null);
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`${BASE}/api/documents/${encodeURIComponent(docId)}/survey`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(creator.JSON),
      });
      if (res.ok) {
        onSaved?.();
        onClose();
      } else {
        setSaveError('Save failed — check document exists and you have permission.');
      }
    } catch {
      setSaveError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#f3f3f3',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', height: 48, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <button className="btn" onClick={onClose}>
          <Icon name="chev_left" size={14} />Back to documents
        </button>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Designing: {docTitle}
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 8 }}>{docId}</span>
        </div>
        {saveError && (
          <span style={{ fontSize: 12, color: 'var(--bad)', flexShrink: 0 }}>{saveError}</span>
        )}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !creator}>
          <Icon name="check" size={14} />
          {saving ? 'Saving…' : 'Save form'}
        </button>
      </div>

      {/* Creator area */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {!creator ? (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13 }}>
            Loading form definition…
          </div>
        ) : (
          <SurveyCreatorComponent creator={creator} />
        )}
      </div>
    </div>
  );
};

export default SurveyFormCreator;
