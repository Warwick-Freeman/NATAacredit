import { Drawer, Avatar, StatusPill, Pill } from 'nexus-360-accreditation';
import { useState } from 'react';

export function Open() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ height: 400, position: 'relative', overflow: 'hidden', background: '#f4f6f9', borderRadius: 8 }}>
      <div style={{ padding: 24 }}>
        <button className="btn btn-primary" style={{ fontSize: 13, padding: '6px 16px' }}
          onClick={() => setOpen(true)}>
          Open drawer
        </button>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Avatar name="Sarah Mitchell" size={40} idx={0} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a2740' }}>Sarah Mitchell</div>
              <div style={{ fontSize: 13, color: '#96aec8' }}>Lead Technologist · Site A</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Pill kind="good" dot>Active</Pill>
            <Pill kind="outline">Sleep Technologist</Pill>
          </div>
          <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 8 }}><strong>Qualifications:</strong> RPSGT, Cert IV Sleep</div>
            <div style={{ marginBottom: 8 }}><strong>Next competency:</strong> 15 Aug 2026</div>
            <div><strong>Scorings this month:</strong> 42</div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
