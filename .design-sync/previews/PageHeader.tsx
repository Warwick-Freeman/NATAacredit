import { PageHeader, Pill } from 'nexus-360-accreditation';
import { useState } from 'react';

export function WithActions() {
  return (
    <PageHeader
      eyebrow="NATA / ASA Standard"
      title="Accreditation"
      subtitle="Clause-by-clause evidence map — 24 of 34 clauses compliant"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Pill kind="good" dot>Audit ready</Pill>
          <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>
            Export report
          </button>
        </div>
      }
    />
  );
}

export function TitleOnly() {
  return (
    <PageHeader title="Staff Register" />
  );
}

export function WithSubtitle() {
  return (
    <PageHeader
      eyebrow="Equipment"
      title="Asset Register"
      subtitle="12 items — 3 due for calibration in the next 30 days"
    />
  );
}
