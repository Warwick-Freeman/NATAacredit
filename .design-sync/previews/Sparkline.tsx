import { Sparkline } from 'nexus-360-accreditation';

const up = [12, 15, 11, 18, 22, 19, 25, 28, 24, 30, 27, 33, 31, 36, 34];
const flat = [20, 21, 19, 22, 20, 21, 20, 22, 19, 21, 20, 22, 21, 20, 21];
const down = [40, 37, 35, 32, 30, 28, 25, 24, 22, 20, 18, 16, 15, 13, 12];

export function Trending() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#96aec8', marginBottom: 6 }}>Studies this month</div>
        <Sparkline data={up} width={180} height={36} color="#3b82f6" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#96aec8', marginBottom: 6 }}>Compliance rate</div>
        <Sparkline data={flat} width={180} height={36} color="#16a34a" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#96aec8', marginBottom: 6 }}>Open NCRs</div>
        <Sparkline data={down} width={180} height={36} color="#dc2626" />
      </div>
    </div>
  );
}
