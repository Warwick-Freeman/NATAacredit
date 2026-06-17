import { Tabs } from 'nexus-360-accreditation';
import { useState } from 'react';

const studyTabs = [
  { id: 'all', label: 'All studies', count: 24 },
  { id: 'pending', label: 'Pending', count: 7 },
  { id: 'scored', label: 'Scored', count: 15 },
  { id: 'reported', label: 'Reported', count: 2 },
];

const docTabs = [
  { id: 'sops', label: 'SOPs', count: 8 },
  { id: 'forms', label: 'Forms', count: 12 },
  { id: 'policies', label: 'Policies', count: 4 },
];

export function StudyQueue() {
  const [tab, setTab] = useState('pending');
  return (
    <div style={{ padding: 24 }}>
      <Tabs tabs={studyTabs} value={tab} onChange={setTab} />
    </div>
  );
}

export function DocumentLibrary() {
  const [tab, setTab] = useState('sops');
  return (
    <div style={{ padding: 24 }}>
      <Tabs tabs={docTabs} value={tab} onChange={setTab} />
    </div>
  );
}
