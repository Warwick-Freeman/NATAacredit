import React, { useMemo } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { initSurveyJS } from './survey-config';

initSurveyJS();

const SurveyFormPreview = ({ surveyJson }) => {
  const model = useMemo(() => {
    if (!surveyJson) return null;
    const m = new Model(surveyJson);
    m.mode = 'display';
    m.showNavigationButtons = 'none';
    return m;
  }, [surveyJson]);

  if (!model) return null;
  return (
    <div className="sjs-preview-wrap">
      {/* Hide SurveyJS navigation/complete buttons regardless of theme version */}
      <style>{`
        .sjs-preview-wrap .sd-navigation,
        .sjs-preview-wrap .sd-action-bar,
        .sjs-preview-wrap .sv-footer,
        .sjs-preview-wrap .sv-btn--navigation,
        .sjs-preview-wrap [class*="navigation__"],
        .sjs-preview-wrap [class*="complete-btn"] { display: none !important; }
      `}</style>
      <Survey model={model} />
    </div>
  );
};

export default SurveyFormPreview;
