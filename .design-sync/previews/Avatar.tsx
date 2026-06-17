import { Avatar } from 'nexus-360-accreditation';

const staff = [
  'Sarah Mitchell', 'James Chen', 'Priya Patel',
  'Tom Anderson', 'Lisa Wang', 'David Kim',
];

export function Team() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {staff.map((name, i) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={name} size={32} idx={i} />
            <span style={{ fontSize: 13, color: '#1a2740', fontWeight: 500 }}>{name}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: -8 }}>
        {staff.slice(0, 5).map((name, i) => (
          <Avatar key={name} name={name} size={28} idx={i}
            style={{ marginLeft: i > 0 ? -8 : 0, boxShadow: '0 0 0 2px white' }} />
        ))}
      </div>
    </div>
  );
}
