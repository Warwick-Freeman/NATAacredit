/**
 * The sidebar modules (see src/components.jsx Sidebar `items`) and the
 * breadcrumb each renders (see crumbsFor in src/App.jsx).
 *
 * `aasmOnly` items only appear when the active standard is AASM, so tests
 * skip them gracefully if the nav entry isn't present.
 */
export const MODULES = [
  { id: 'home', label: 'Home', crumb: 'Home' },
  { id: 'tasks', label: 'My tasks', crumb: 'My tasks' },
  { id: 'accreditation', label: 'Accreditation', crumb: 'Accreditation' },
  { id: 'documents', label: 'Documents & SOPs', crumb: 'Documents & SOPs' },
  { id: 'audits', label: 'Audits & reviews', crumb: 'Audits & reviews' },
  { id: 'ncr', label: 'NC & CAPA', crumb: 'NC & CAPA' },
  { id: 'isr', label: 'Inter-Scorer Reliability', crumb: 'Inter-Scorer Reliability', aasmOnly: true },
  { id: 'scheduler', label: 'Scheduler', crumb: 'Scheduler' },
  { id: 'patients', label: 'Patients', crumb: 'Patients' },
  { id: 'studies', label: 'Studies & reports', crumb: 'Studies & reports' },
  { id: 'indicators', label: 'Quality indicators', crumb: 'Quality indicators' },
  { id: 'equipment', label: 'Equipment register', crumb: 'Equipment register' },
  { id: 'staff', label: 'Staff & training', crumb: 'Staff & training' },
  { id: 'referring-physicians', label: 'Referring Physicians', crumb: 'Referring Physicians' },
  { id: 'workbooks', label: 'Workbooks', crumb: 'Workbooks', aasmOnly: true },
  { id: 'settings', label: 'Settings', crumb: 'Settings' },
  { id: 'trail', label: 'Audit trail', crumb: 'Audit trail' },
];

/** Click a sidebar nav item by its visible label. */
export function navItem(page, label) {
  return page.locator('.nav-item', { hasText: label });
}
