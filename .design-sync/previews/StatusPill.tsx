import { StatusPill } from 'nexus-360-accreditation';

export function AllStatuses() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { status: 'compliant', label: 'Clause 4.3 — Document control' },
        { status: 'partial', label: 'Clause 4.7 — Equipment verification' },
        { status: 'nc', label: 'Clause 5.2 — Staff qualifications' },
        { status: 'na', label: 'Clause 5.6 — Research activities' },
      ].map(({ status, label }) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusPill status={status} />
          <span style={{ fontSize: 13, color: '#4a5568' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
