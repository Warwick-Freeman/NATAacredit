import { setLicenseKey } from 'survey-core';

let initialised = false;

export function initSurveyJS() {
  if (initialised) return;
  initialised = true;
  const key = import.meta.env.VITE_SURVEYJS_KEY;
  if (key) setLicenseKey(key);
}
