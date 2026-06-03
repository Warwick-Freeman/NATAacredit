import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAll, fetchConfig, switchStandard } from './api';

const DEFAULT_DATE = '2026-08-12';
const STORAGE_KEY  = 'nexus_assessment_date';

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

function daysUntil(iso) {
  if (!iso) return 0;
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

const NexusDataContext = createContext(null);

export function NexusDataProvider({ children }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [activeStandard, setActiveStandard] = useState('asa');
  const [assessmentDate, setAssessmentDateState] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DATE
  );

  const setAssessmentDate = (iso) => {
    setAssessmentDateState(iso);
    localStorage.setItem(STORAGE_KEY, iso);
  };

  const loadAll = () =>
    Promise.all([fetchAll(), fetchConfig()])
      .then(([d, cfg]) => { setData(d); setActiveStandard(cfg?.standard ?? 'asa'); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!localStorage.getItem('nexus_token')) { setLoading(false); return; }
    loadAll();
  }, []);

  useEffect(() => {
    function handleSignIn() { setLoading(true); loadAll(); }
    window.addEventListener('nexus:signIn', handleSignIn);
    return () => window.removeEventListener('nexus:signIn', handleSignIn);
  }, []);

  const refreshData = () => { loadAll(); };

  const changeStandard = async (value) => {
    await switchStandard(value);
    setLoading(true);
    loadAll();
  };

  const patchedData = data ? {
    ...data,
    service: {
      ...data.service,
      nextAssessment:   fmtDate(assessmentDate),
      daysToAssessment: daysUntil(assessmentDate),
    },
  } : null;

  return (
    <NexusDataContext.Provider value={{ data: patchedData, loading, error, assessmentDate, setAssessmentDate, refreshData, activeStandard, changeStandard }}>
      {children}
    </NexusDataContext.Provider>
  );
}

export function useNexusData() {
  return useContext(NexusDataContext);
}
