import { Pill } from 'nexus-360-accreditation';

export function AllKinds() {
  return (
    <div style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Pill kind="good">Active</Pill>
      <Pill kind="good" dot>Compliant</Pill>
      <Pill kind="warn">Due Soon</Pill>
      <Pill kind="warn" dot>Partial</Pill>
      <Pill kind="bad">Overdue</Pill>
      <Pill kind="bad" dot>Non-conformant</Pill>
      <Pill kind="outline">N/A</Pill>
      <Pill>Neutral</Pill>
    </div>
  );
}
