import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAll } from './api';

const NexusDataContext = createContext(null);

export function NexusDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAll()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <NexusDataContext.Provider value={{ data, loading, error }}>
      {children}
    </NexusDataContext.Provider>
  );
}

export function useNexusData() {
  return useContext(NexusDataContext);
}
