import { Donut } from 'nexus-360-accreditation';

export function ComplianceBreakdown() {
  return (
    <div style={{ padding: 24, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}>
        <Donut size={90} stroke={12} segments={[
          { value: 78, color: '#16a34a' },
          { value: 12, color: '#ca8a04' },
          { value: 10, color: '#dc2626' },
        ]} />
        <div style={{ fontSize: 11, color: '#96aec8', marginTop: 8 }}>Compliance</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Donut size={90} stroke={12} segments={[
          { value: 5, color: '#dc2626' },
          { value: 3, color: '#ca8a04' },
          { value: 2, color: '#3b82f6' },
        ]} />
        <div style={{ fontSize: 11, color: '#96aec8', marginTop: 8 }}>Open NCRs</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Donut size={90} stroke={12} segments={[
          { value: 42, color: '#3b82f6' },
          { value: 58, color: '#e2e8f0' },
        ]} />
        <div style={{ fontSize: 11, color: '#96aec8', marginTop: 8 }}>Equipment due</div>
      </div>
    </div>
  );
}
