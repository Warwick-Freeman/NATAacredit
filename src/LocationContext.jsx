import React, { createContext, useContext, useState } from 'react';

export const SITES = [
  { id: 'all', name: 'All sites',               short: 'All sites',       code: null  },
  { id: 'RML', name: 'Riverside Main Lab',       short: 'Riverside Main',  code: 'RML' },
  { id: 'EPL', name: 'Eastside Paediatric Lab',  short: 'Eastside Paed.',  code: 'EPL' },
  { id: 'HSN', name: 'Home Service – North',     short: 'Home Service N.', code: 'HSN' },
];

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [siteId, setSiteId] = useState('all');
  const site = SITES.find(s => s.id === siteId) ?? SITES[0];
  return (
    <LocationContext.Provider value={{ siteId, setSiteId, site, SITES }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
