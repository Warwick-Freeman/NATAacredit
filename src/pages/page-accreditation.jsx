import React, { useState, useMemo, useCallback } from 'react';
import Icon from '../icons';
import { PageHeader, Donut, Tabs, Pill, StatusPill, Drawer } from '../components';
import ClauseDrawer from '../clause-drawer';
import { useTaskContext } from '../TaskContext';
import { useAuth } from '../AuthContext';
import { useNexusData } from '../NexusDataContext';
import { getStdCfg } from '../standardConfig';
import { patchClause } from '../api';

const BASE = import.meta.env.VITE_API_URL ?? '';

const STATUS_KIND = { compliant: 'good', partial: 'warn', nc: 'bad', na: 'outline' };

// Pre-seeded evidence items per clause — gives the evidence list real content
const SEED_EVIDENCE = {
  '4.1.1': [
    { id: 'e1', name: 'Quality manual — MAN-QMS-001 v8.1', type: 'Manual',      ref: 'MAN-QMS-001',  date: '15 Jan 2026' },
    { id: 'e2', name: 'NATA accreditation certificate NATA-15847', type: 'Certificate', ref: 'NATA-15847', date: '22 Mar 2022' },
    { id: 'e3', name: 'Scope register — all sites',         type: 'Register',   ref: 'REG-SCOPE-001', date: '10 Feb 2026' },
  ],
  '4.1.5': [
    { id: 'e1', name: 'Conflict of interest declarations 2026', type: 'Form',  ref: 'COI-2026',      date: '02 Apr 2026' },
    { id: 'e2', name: 'CoI policy — MAN-QMS-001 s3.4',     type: 'Manual',     ref: 'MAN-QMS-001',   date: '15 Jan 2026' },
  ],
  '4.1.6': [
    { id: 'e1', name: 'Patient confidentiality policy',     type: 'Policy',     ref: 'POL-CONF-001',  date: '20 Nov 2025' },
    { id: 'e2', name: 'Information governance framework',   type: 'Manual',     ref: 'MAN-QMS-001',   date: '15 Jan 2026' },
    { id: 'e3', name: 'Staff confidentiality agreements',   type: 'Register',   ref: 'REG-CON-001',   date: '01 Feb 2026' },
    { id: 'e4', name: 'Privacy act compliance audit',       type: 'Audit',      ref: 'AUD-PRIV-2025', date: '14 Nov 2025' },
  ],
  '4.2.1': [
    { id: 'e1', name: 'Quality policy statement — signed Dr. Okafor', type: 'Policy', ref: 'POL-QMS-001', date: '10 Jan 2026' },
    { id: 'e2', name: 'Quality objectives register 2026',   type: 'Register',   ref: 'REG-OBJ-2026',  date: '15 Jan 2026' },
  ],
  '4.3.1': [
    { id: 'e1', name: 'SOP-DOC-001 Document control procedure', type: 'SOP',   ref: 'SOP-DOC-001',   date: '12 Feb 2026' },
    { id: 'e2', name: 'Controlled document register',       type: 'Register',   ref: 'REG-DOC-001',   date: '28 Feb 2026' },
    { id: 'e3', name: 'Document review records — Q4 2025',  type: 'Record',     ref: 'REC-DOC-Q4-25', date: '20 Nov 2025' },
    { id: 'e4', name: 'Obsolete document disposal log',     type: 'Record',     ref: 'REC-OBS-001',   date: '05 Feb 2026' },
    { id: 'e5', name: 'Document control audit — internal',  type: 'Audit',      ref: 'AUD-DOC-2026',  date: '11 Feb 2026' },
  ],
  '4.5.2': [
    { id: 'e1', name: 'Subcontractor register — INCOMPLETE', type: 'Register', ref: 'REG-SUB-001',   date: '—', missing: true },
  ],
  '4.8.1': [
    { id: 'e1', name: 'SOP-QMS-007 Complaint handling',     type: 'SOP',        ref: 'SOP-QMS-007',   date: '18 Feb 2026' },
    { id: 'e2', name: 'Complaints register 2026',           type: 'Register',   ref: 'REG-COMP-2026', date: '01 Mar 2026' },
    { id: 'e3', name: 'Complaint resolution log Q1',        type: 'Record',     ref: 'REC-COMP-Q1',   date: '31 Mar 2026' },
  ],
  '4.13.1': [
    { id: 'e1', name: 'Record retention schedule — MAN-QMS-001 s9', type: 'Manual', ref: 'MAN-QMS-001', date: '15 Jan 2026' },
    { id: 'e2', name: 'SOP-IT-001 Record management',       type: 'SOP',        ref: 'SOP-IT-001',    date: '10 Feb 2026' },
    { id: 'e3', name: 'Archive index — patient records',    type: 'Register',   ref: 'REG-ARC-2026',  date: '01 Jan 2026' },
    { id: 'e4', name: 'Record disposal log 2025',           type: 'Record',     ref: 'REC-DISP-2025', date: '30 Nov 2025' },
  ],
  '4.14.3': [
    { id: 'e1', name: 'Q1 2026 internal audit report',      type: 'Audit',      ref: 'AUD-2026-Q1',   date: '11 Feb 2026' },
    { id: 'e2', name: 'Auditor independence declaration',   type: 'Form',       ref: 'FORM-AUD-IND',  date: '10 Feb 2026' },
    { id: 'e3', name: 'Audit programme 2026',               type: 'Schedule',   ref: 'SCH-AUD-2026',  date: '10 Jan 2026' },
    { id: 'e4', name: 'Auditor qualifications register',    type: 'Register',   ref: 'REG-AUD-QUAL',  date: '10 Jan 2026' },
  ],
  '4.15.2': [
    { id: 'e1', name: 'Management review minutes — Q4 2025', type: 'Minutes',  ref: 'MR-Q4-2025',    date: '14 Jan 2026' },
    { id: 'e2', name: 'Management review agenda template',  type: 'Template',   ref: 'TPL-MR-001',    date: '14 Jan 2026' },
    { id: 'e3', name: 'Management review input pack Q4',    type: 'Report',     ref: 'MR-INP-Q4-25',  date: '10 Jan 2026' },
    { id: 'e4', name: 'Action register from MR Q4',         type: 'Register',   ref: 'REG-MR-ACT',    date: '14 Jan 2026' },
    { id: 'e5', name: 'KPI dashboard Q4 2025 — snapshot',  type: 'Report',     ref: 'KPI-Q4-2025',   date: '05 Jan 2026' },
    { id: 'e6', name: 'NPS / referrer satisfaction survey', type: 'Report',     ref: 'RPT-NPS-Q4-25', date: '08 Jan 2026' },
  ],
  '5.1.4': [
    { id: 'e1', name: 'BLS competency register 2026',       type: 'Register',   ref: 'REG-BLS-2026',  date: '01 May 2026' },
  ],
  '5.3.2': [
    { id: 'e1', name: 'SOP-EQP-001 Equipment acceptance testing', type: 'SOP', ref: 'SOP-EQP-001',   date: '20 Mar 2026' },
    { id: 'e2', name: 'Grael 4K acceptance test record',    type: 'Record',     ref: 'ATR-GRL-4K-01', date: '15 Mar 2026' },
    { id: 'e3', name: 'Nox T3 × 2 acceptance test records', type: 'Record',    ref: 'ATR-NOX-T3-01', date: '10 Mar 2026' },
    { id: 'e4', name: 'CPAP titration unit acceptance — AS11', type: 'Record', ref: 'ATR-AS11-001',  date: '05 Apr 2026' },
    { id: 'e5', name: 'Acceptance testing procedure — validation log', type: 'Record', ref: 'VAL-EQP-2026', date: '21 Mar 2026' },
  ],
  '5.3.4': [
    { id: 'e1', name: 'SOP-EQP-009 Equipment verification programme', type: 'SOP', ref: 'SOP-EQP-009', date: '15 Jan 2026' },
    { id: 'e2', name: 'Verification log Q1 2026',           type: 'Record',     ref: 'EQV-Q1-2026',   date: '01 Apr 2026' },
  ],
  '5.3.5': [
    { id: 'e1', name: 'SOP-EQP-012 Decontamination procedure', type: 'SOP',   ref: 'SOP-EQP-012',   date: '01 Feb 2026', overdue: true },
    { id: 'e2', name: 'Decontamination log — Mar 2026',     type: 'Record',     ref: 'DCL-2026-03',   date: '31 Mar 2026' },
  ],
  '5.3.6': [
    { id: 'e1', name: 'SOP-QMS-011 Adverse incident reporting', type: 'SOP', ref: 'SOP-QMS-011',    date: '15 Feb 2026' },
    { id: 'e2', name: 'Adverse incident register 2026',     type: 'Register',   ref: 'REG-INC-2026',  date: '01 May 2026' },
    { id: 'e3', name: 'TGA MedWatch submission template',   type: 'Template',   ref: 'TPL-TGA-001',   date: '01 Jan 2026' },
  ],
  '5.5.2': [
    { id: 'e1', name: 'SOP-PSG-031 Bio-signal verification', type: 'SOP',      ref: 'SOP-PSG-031',   date: '21 Apr 2026' },
    { id: 'e2', name: 'Biosignal checklist — Apr 2026',      type: 'Record',    ref: 'BSC-2026-04',   date: '30 Apr 2026' },
    { id: 'e3', name: 'Impedance compliance audit Q1',       type: 'Audit',     ref: 'AUD-IMP-Q1',    date: '31 Mar 2026' },
    { id: 'e4', name: 'Signal quality KPI dashboard',        type: 'Report',    ref: 'KPI-SQ-2026',   date: '01 Apr 2026' },
    { id: 'e5', name: 'Grael 4K bio-cal log Apr 2026',       type: 'Record',    ref: 'BCL-GRL-04-26', date: '30 Apr 2026' },
    { id: 'e6', name: 'AASM signal quality guidelines ref',  type: 'Reference', ref: 'REF-AASM-SQ',   date: '—' },
  ],
  '5.5.3': [
    { id: 'e1', name: 'SOP-PSG-001 PSG recording protocol',  type: 'SOP',      ref: 'SOP-PSG-001',   date: '15 Mar 2026' },
    { id: 'e2', name: 'SOP-PSG-002 Electrode placement guide', type: 'SOP',    ref: 'SOP-PSG-002',   date: '15 Mar 2026' },
    { id: 'e3', name: 'AASM Scoring Manual reference copy',  type: 'Reference', ref: 'REF-AASM-2024', date: '—' },
    { id: 'e4', name: 'Protocol compliance audit — Q1',      type: 'Audit',     ref: 'AUD-PROT-Q1',   date: '31 Mar 2026' },
    { id: 'e5', name: 'Recording tech training records',     type: 'Record',    ref: 'TR-REC-2026',   date: '20 Feb 2026' },
    { id: 'e6', name: 'Paediatric PSG addendum SOP-PSG-010', type: 'SOP',      ref: 'SOP-PSG-010',   date: '20 Mar 2026' },
    { id: 'e7', name: 'Night-to-night variability analysis', type: 'Report',    ref: 'RPT-NTV-2026',  date: '10 Apr 2026' },
  ],
  '5.6.6': [
    { id: 'e1', name: 'Inter-scorer concordance report Q1', type: 'Report',    ref: 'ISC-Q1-2026',   date: '20 Mar 2026' },
    { id: 'e2', name: 'Kappa statistics methodology SOP',   type: 'SOP',       ref: 'SOP-QA-003',    date: '01 Feb 2026' },
    { id: 'e3', name: 'Scorer concordance log 2026',        type: 'Register',  ref: 'REG-CONC-2026', date: '31 Mar 2026' },
    { id: 'e4', name: 'AI scoring comparison validation',   type: 'Report',    ref: 'RPT-AI-VAL-Q1', date: '25 Mar 2026' },
  ],
  '5.6.8': [
    { id: 'e1', name: 'EQA subscription — SomnoNet 2026',   type: 'Certificate', ref: 'EQA-SN-2026',  date: '01 Jan 2026' },
    { id: 'e2', name: 'EQA result — Round 1 2026',          type: 'Report',    ref: 'EQA-R1-2026',   date: '15 Feb 2026' },
    { id: 'e3', name: 'EQA corrective action plan — J.Owusu', type: 'Record',  ref: 'CAP-EQA-2026',  date: '20 Mar 2026' },
  ],
  '5.8.1': [
    { id: 'e1', name: 'SOP-RPT-001 Report turnaround procedure', type: 'SOP', ref: 'SOP-RPT-001',   date: '10 Apr 2026' },
    { id: 'e2', name: 'Turnaround time KPI dashboard Q1',   type: 'Report',    ref: 'KPI-TAT-Q1-26', date: '31 Mar 2026' },
    { id: 'e3', name: 'Reporting SLA audit — Q1 2026',      type: 'Audit',     ref: 'AUD-SLA-Q1-26', date: '31 Mar 2026' },
    { id: 'e4', name: 'Overdue report register — current',  type: 'Register',  ref: 'REG-OVR-2026',  date: '12 May 2026' },
    { id: 'e5', name: 'Physician sign-off tracking log',    type: 'Record',    ref: 'REC-SIGN-2026', date: '12 May 2026' },
  ],
};

function exportSelfAssessment(clauses, D, user) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

  const totalCompliant = clauses.filter(c => c.status === 'compliant').length;
  const totalPartial   = clauses.filter(c => c.status === 'partial').length;
  const totalNc        = clauses.filter(c => c.status === 'nc').length;
  const totalNa        = clauses.filter(c => c.status === 'na').length;
  const total          = clauses.length;
  const pct = total ? ((totalCompliant / total) * 100).toFixed(1) : '0.0';

  // Group clauses by section
  const sections = {};
  clauses.forEach(c => {
    if (!sections[c.section]) sections[c.section] = [];
    sections[c.section].push(c);
  });

  const STATUS_LABEL = { compliant: 'Compliant', partial: 'Partial', nc: 'Non-conformant', na: 'N/A' };
  const STATUS_COLOR = { compliant: '#15803d', partial: '#854d0e', nc: '#b91c1c', na: '#6b7280' };
  const STATUS_BG    = { compliant: '#dcfce7', partial: '#fef9c3', nc: '#fee2e2', na: '#f3f4f6' };

  const sectionNameMap = {};
  D.complianceBySection.forEach(s => { sectionNameMap[s.id] = s.name; });

  const sectionRows = Object.entries(sections).map(([sec, sclause]) => {
    const compPct = (sclause.filter(c => c.status === 'compliant').length / sclause.length * 100).toFixed(0);
    return `<tr>
      <td><strong>${sec}</strong></td>
      <td>${sectionNameMap[sec] ?? sec}</td>
      <td style="color:#15803d;font-weight:600">${sclause.filter(c=>c.status==='compliant').length}</td>
      <td style="color:#854d0e;font-weight:600">${sclause.filter(c=>c.status==='partial').length}</td>
      <td style="color:${sclause.filter(c=>c.status==='nc').length>0?'#b91c1c':'#6b7280'};font-weight:600">${sclause.filter(c=>c.status==='nc').length}</td>
      <td style="color:#6b7280">${sclause.filter(c=>c.status==='na').length}</td>
      <td>${sclause.length}</td>
      <td>
        <div style="font-size:11px;color:#6b7280;margin-bottom:2px">${compPct}%</div>
        <div style="height:5px;background:#f3f4f6;border-radius:3px;overflow:hidden;display:flex">
          <div style="width:${compPct}%;background:#16a34a"></div>
        </div>
      </td>
    </tr>`;
  }).join('');

  const detailSections = Object.entries(sections).map(([sec, sclause]) => {
    const clauseRows = sclause.map(c => {
      const evidence = c.linkedEvidence?.length > 0
        ? `<ul style="margin:4px 0 0 14px;padding:0;font-size:11px;color:#374151">
            ${c.linkedEvidence.map(e => `<li><span class="mono">${e.ref}</span> — ${e.name} <span style="color:#9ca3af">(${e.date})</span>${e.missing ? ' <span style="color:#b91c1c;font-weight:600">⚠ MISSING</span>' : ''}</li>`).join('')}
          </ul>`
        : `<span style="color:#b91c1c;font-size:11px">⚠ No evidence on file</span>`;
      return `<tr>
        <td style="white-space:nowrap;font-weight:600;font-family:monospace;font-size:12px">${c.id}</td>
        <td>${c.title}</td>
        <td><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${STATUS_BG[c.status]??'#f3f4f6'};color:${STATUS_COLOR[c.status]??'#6b7280'}">${STATUS_LABEL[c.status] ?? c.status}</span></td>
        <td>${evidence}</td>
        <td style="font-size:12px;color:#6b7280">${c.owner ?? '—'}</td>
        <td style="font-size:12px;color:#6b7280">${c.notes || (c.status === 'nc' ? 'No current evidence on file — action required' : c.status === 'partial' ? 'Evidence partially complete' : '')}</td>
      </tr>`;
    }).join('');
    return `<div class="sec-block">
      <div class="sec-head">
        <span style="font-family:monospace;font-weight:700;font-size:14px">${sec}</span>
        <span style="margin-left:10px;font-size:14px;font-weight:600">${sectionNameMap[sec] ?? sec}</span>
        <span style="margin-left:12px;font-size:12px;color:#6b7280">${sclause.length} clauses</span>
      </div>
      <table>
        <thead><tr><th>Clause</th><th>Requirement</th><th>Status</th><th>Evidence</th><th>Owner</th><th>Notes</th></tr></thead>
        <tbody>${clauseRows}</tbody>
      </table>
    </div>`;
  }).join('');

  const gapClauses = clauses.filter(c => c.status === 'nc' || c.status === 'partial');
  const gapRows = gapClauses.map(c => `<tr>
    <td style="font-family:monospace;font-weight:600;font-size:12px">${c.id}</td>
    <td>${c.title}</td>
    <td><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${STATUS_BG[c.status]};color:${STATUS_COLOR[c.status]}">${STATUS_LABEL[c.status]}</span></td>
    <td style="font-size:12px;color:#374151">${c.notes || (c.status === 'nc' ? 'No current evidence — corrective action required' : 'Evidence partially complete — review and update')}</td>
    <td style="font-size:12px;color:#6b7280">${c.owner ?? '—'}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Self-Assessment Report — ${D.service.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#111;background:#fff}
@media print{@page{margin:15mm 14mm;size:A4}.no-print{display:none!important}body{font-size:11px}.sec-block{page-break-inside:avoid}}
.cover{padding:56px 48px;min-height:100vh;display:flex;flex-direction:column;page-break-after:always}
.brand{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;margin-bottom:40px}
h1{font-size:32px;font-weight:800;line-height:1.1;color:#111}
.sub{font-size:16px;color:#6b7280;margin-top:6px}
.standard{margin-top:20px;display:inline-block;padding:6px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;color:#374151;background:#f9fafb}
.score-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:32px}
.score-card{border:1px solid #e5e7eb;border-radius:8px;padding:14px}
.score-card .n{font-size:26px;font-weight:800}.score-card .l{font-size:10px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:.06em}
.score-card.good{border-color:#bbf7d0;background:#f0fdf4}.score-card.good .n{color:#15803d}
.score-card.warn{border-color:#fef08a;background:#fefce8}.score-card.warn .n{color:#854d0e}
.score-card.bad{border-color:#fecaca;background:#fef2f2}.score-card.bad .n{color:#b91c1c}
.score-card.total .n{color:#111}
.meta-grid{margin-top:auto;padding-top:28px;border-top:2px solid #e5e7eb;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.meta-item label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;display:block;margin-bottom:3px}
.meta-item span{font-size:13px;font-weight:600}
.section-body{padding:32px 40px}
h2{font-size:16px;font-weight:700;margin-bottom:4px}
.sec-sub{font-size:11px;color:#6b7280;margin-bottom:16px}
table{width:100%;border-collapse:collapse;margin-bottom:0}
th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#9ca3af;padding:7px 8px;border-bottom:2px solid #e5e7eb}
td{padding:8px 8px;border-bottom:1px solid #f3f4f6;font-size:11px;vertical-align:top}
tr:last-child td{border-bottom:none}
.mono{font-family:monospace}
.sec-block{border:1px solid #e5e7eb;border-radius:8px;margin-bottom:14px;overflow:hidden}
.sec-head{padding:10px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;display:flex;align-items:center}
.declaration{margin:28px 40px;padding:24px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb}
.sig-line{border-bottom:1px solid #374151;height:28px;margin-bottom:4px}
.footer{padding:16px 40px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between}
.print-btn{position:fixed;bottom:24px;right:24px;background:#2563eb;color:#fff;border:none;padding:11px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,.3)}
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

<!-- Cover -->
<div class="cover">
  <div class="brand">${stdCfg.reportBrand}</div>
  <h1>Self-Assessment Report</h1>
  <div class="sub">${D.service.name}</div>
  <div class="standard">${stdCfg.standardName} — ${stdCfg.standardVersion}</div>
  <div class="score-row">
    <div class="score-card total"><div class="n">${total}</div><div class="l">Total clauses</div></div>
    <div class="score-card good"><div class="n">${totalCompliant}</div><div class="l">Compliant</div></div>
    <div class="score-card warn"><div class="n">${totalPartial}</div><div class="l">Partial</div></div>
    <div class="score-card bad"><div class="n">${totalNc}</div><div class="l">Non-conformant</div></div>
    <div class="score-card"><div class="n">${pct}%</div><div class="l">Readiness</div></div>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><label>Certificate No.</label><span>${D.service.accreditation?.certNo ?? '—'}</span></div>
    <div class="meta-item"><label>Accredited since</label><span>${D.service.accreditation?.since ?? '—'}</span></div>
    <div class="meta-item"><label>Next assessment</label><span>${D.service.nextAssessment} (${D.service.daysToAssessment}d)</span></div>
    <div class="meta-item"><label>ABN</label><span>${D.service.abn ?? '—'}</span></div>
    <div class="meta-item"><label>Prepared by</label><span>${user?.name ?? '—'}</span></div>
    <div class="meta-item"><label>Generated</label><span>${dateStr}, ${timeStr}</span></div>
  </div>
</div>

<!-- Section summary -->
<div class="section-body">
  <h2>Section summary</h2>
  <div class="sec-sub">Compliance status across all ${Object.keys(sections).length} sections</div>
  <table>
    <thead><tr><th>§</th><th>Section name</th><th>Compliant</th><th>Partial</th><th>NC</th><th>N/A</th><th>Total</th><th>Coverage</th></tr></thead>
    <tbody>${sectionRows}</tbody>
  </table>
</div>

<!-- Clause detail -->
<div class="section-body" style="border-top:1px solid #e5e7eb">
  <h2>Clause-by-clause assessment</h2>
  <div class="sec-sub">Self-assessed status and supporting evidence for each clause</div>
  ${detailSections}
</div>

${gapClauses.length > 0 ? `
<!-- Gap summary -->
<div class="section-body" style="border-top:1px solid #e5e7eb">
  <h2>Gaps requiring action</h2>
  <div class="sec-sub">${totalNc} non-conformant · ${totalPartial} partial — corrective action required before assessment</div>
  <table>
    <thead><tr><th>Clause</th><th>Requirement</th><th>Status</th><th>Gap / action required</th><th>Owner</th></tr></thead>
    <tbody>${gapRows}</tbody>
  </table>
</div>` : `
<div class="section-body" style="border-top:1px solid #e5e7eb;text-align:center;padding:40px">
  <div style="font-size:28px;margin-bottom:8px">✓</div>
  <div style="font-size:15px;font-weight:600;color:#15803d">All clauses assessed as compliant</div>
  <div style="font-size:12px;color:#6b7280;margin-top:4px">No gaps identified in this self-assessment.</div>
</div>`}

<!-- Declaration -->
<div class="declaration">
  <div style="font-size:13px;font-weight:700;margin-bottom:10px">Declaration</div>
  <p style="font-size:12px;color:#374151;line-height:1.6;margin-bottom:20px">
    I declare that this self-assessment report accurately reflects the current compliance status of
    <strong>${D.service.name}</strong> against the ${stdCfg.standardName} (${stdCfg.standardVersion})
    at the time of generation. All evidence referenced is current, available for assessor review, and
    has been verified by the nominated clause owners.
  </p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
    <div>
      <div class="sig-line"></div>
      <div style="font-size:11px;color:#6b7280">Signature</div>
    </div>
    <div>
      <div style="border-bottom:1px solid #374151;height:28px;margin-bottom:4px;padding-bottom:4px;font-size:12px;font-weight:600">${user?.name ?? ''}</div>
      <div style="font-size:11px;color:#6b7280">Name &amp; role</div>
    </div>
    <div>
      <div style="border-bottom:1px solid #374151;height:28px;margin-bottom:4px;padding-bottom:4px;font-size:12px;font-weight:600">${dateStr}</div>
      <div style="font-size:11px;color:#6b7280">Date</div>
    </div>
  </div>
</div>

<div class="footer">
  <span>${D.service.name} · Certificate ${D.service.accreditation?.certNo ?? '—'} · ${D.service.abn ?? ''}</span>
  <span>NATA Self-Assessment Report · Generated ${dateStr} by ${user?.name ?? 'Nexus 360'}</span>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `self-assessment-${now.toISOString().slice(0, 10)}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

const AccreditationPage = ({ data: D }) => {
  const { openCreateTask } = useTaskContext();
  const { user } = useAuth();
  const { activeStandard, refreshData } = useNexusData();
  const stdCfg = getStdCfg(activeStandard);

  const openStandard = useCallback(() => {
    // Standards endpoint is public — open directly
    window.open(`${BASE}/api/standards/${activeStandard ?? 'asa'}`, '_blank');
  }, [activeStandard]);

  // Local clause state — seed with realistic linked evidence
  const [clauses,   setClauses]   = useState(() => D.clauses.map(c => ({
    ...c,
    linkedEvidence: SEED_EVIDENCE[c.id] || [],
  })));
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState('');
  const [openSec,   setOpenSec]   = useState("5.3");
  const [tab,       setTab]       = useState("clauses");
  const [detailId,  setDetailId]  = useState(null);

  // Build section name lookup from API data
  const sectionNameMap = useMemo(() => {
    const m = {};
    D.complianceBySection.forEach(s => { m[s.id] = s.name; });
    return m;
  }, [D.complianceBySection]);

  // Recompute section stats from live clause state
  const sectionStats = useMemo(() => {
    const s = {};
    clauses.forEach(c => {
      if (!s[c.section]) s[c.section] = { compliant: 0, partial: 0, nc: 0, na: 0 };
      const key = c.status === 'compliant' ? 'compliant' : c.status === 'nc' ? 'nc' : c.status === 'na' ? 'na' : 'partial';
      s[c.section][key]++;
    });
    return s;
  }, [clauses]);

  // Recompute top-level totals from live clause state
  const totalCompliant = clauses.filter(c => c.status === 'compliant').length;
  const totalPartial   = clauses.filter(c => c.status === 'partial').length;
  const totalNc        = clauses.filter(c => c.status === 'nc').length;
  const totalClauses   = clauses.length;

  // Use API section total counts for "X shown of Y" label
  const sectionTotalMap = useMemo(() => {
    const m = {};
    D.complianceBySection.forEach(s => { m[s.id] = s.total; });
    return m;
  }, [D.complianceBySection]);

  const handleUpdateClause = async (updated) => {
    setClauses(prev => prev.map(c => c.id === updated.id ? updated : c));
    try {
      await patchClause(updated.id, {
        status: updated.status,
        evidence: typeof updated.evidence === 'number' ? updated.evidence : undefined,
        owner: updated.owner ?? undefined,
        lastReviewed: updated.lastReviewed ?? undefined,
      });
      refreshData();
    } catch {
      // optimistic update already applied; API failure is non-blocking
    }
  };

  // Derive a data object that uses the local clause state for the drawer
  const localData = useMemo(() => ({ ...D, clauses }), [D, clauses]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clauses.filter(c => {
      const matchFilter =
        filter === 'all'     ? true :
        filter === 'needs'   ? (c.status !== 'compliant' && c.status !== 'na') :
        filter === 'nc'      ? c.status === 'nc' :
        filter === 'partial' ? c.status === 'partial' :
        filter === 'compliant' ? c.status === 'compliant' : true;
      const matchSearch = !q || c.id.includes(q) || c.title.toLowerCase().includes(q) || (c.owner || '').toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [clauses, filter, search]);

  const sectionGroups = useMemo(() => {
    const g = {};
    filtered.forEach(c => {
      if (!g[c.section]) g[c.section] = [];
      g[c.section].push(c);
    });
    return g;
  }, [filtered]);

  const needsCount = totalNc + totalPartial;

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow={`Compliance · ${stdCfg.standardName} (${stdCfg.standardVersion})`}
        title="Accreditation workspace"
        subtitle="Every clause mapped to live evidence. Self-assessment status updates in real time."
        actions={
          <>
            <button className="btn" onClick={openStandard}><Icon name="book" size={14} />View standard</button>
            <button className="btn"><Icon name="eye" size={14} />Preview assessor view</button>
            <button className="btn" onClick={() => exportSelfAssessment(clauses, D, user)}><Icon name="download" size={14} />Self-assessment report</button>
            <button className="btn btn-primary"><Icon name="link" size={14} />Issue assessor access</button>
          </>
        }
      />

      {/* Readiness banner */}
      <div className="card card-pad" style={{ marginBottom: 20, background: 'linear-gradient(180deg, var(--surface), var(--surface-2))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Donut size={84} stroke={11} segments={[
            { value: totalCompliant, color: 'var(--good)' },
            { value: totalPartial,   color: 'var(--warn)' },
            { value: totalNc,        color: 'var(--bad)' },
            { value: totalClauses - totalCompliant - totalPartial - totalNc, color: 'var(--surface-3)' },
          ]} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Readiness</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: '4px 0' }}>
              {totalClauses ? ((totalCompliant / totalClauses) * 100).toFixed(1) : '0.0'}%{' '}
              <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}>compliant</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--good)' }}>● {totalCompliant} compliant</span>
              <span style={{ fontSize: 12, color: 'var(--warn)' }}>● {totalPartial} partial</span>
              <span style={{ fontSize: 12, color: 'var(--bad)' }}>● {totalNc} NC</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, paddingRight: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Next assessment</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{D.service.daysToAssessment}d</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{D.service.nextAssessment}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Cert no.</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{D.service.accreditation.certNo}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>since {D.service.accreditation.since}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Open NC</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2, color: totalNc ? 'var(--bad)' : 'var(--good)' }}>{totalNc}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{totalPartial} partial</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "clauses",  label: "Clause map",        count: totalClauses },
        { id: "evidence", label: "Evidence library" },
        { id: "gap",      label: "Gap report",        count: needsCount || undefined },
        { id: "assessor", label: "Assessor view" },
        { id: "history",  label: "Assessment history" },
      ]} />

      {/* ── Clause map ── */}
      {tab === "clauses" && (
        <>
          <div className="filter-bar">
            <button className={`chip-btn ${filter === 'all'      ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({totalClauses})</button>
            <button className={`chip-btn ${filter === 'needs'    ? 'active' : ''}`} onClick={() => setFilter('needs')}>Needs attention ({needsCount})</button>
            <button className={`chip-btn ${filter === 'compliant'? 'active' : ''}`} onClick={() => setFilter('compliant')}>Compliant</button>
            <button className={`chip-btn ${filter === 'partial'  ? 'active' : ''}`} onClick={() => setFilter('partial')}>Partial</button>
            <button className={`chip-btn ${filter === 'nc'       ? 'active' : ''}`} onClick={() => setFilter('nc')}>Non-conformant</button>
            <div style={{ flex: 1 }} />
            <div className="search" style={{ width: 200 }} onClick={e => e.currentTarget.querySelector('input')?.focus()}>
              <Icon name="search" size={12} />
              <input
                style={{ border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontSize: 12, color: 'var(--ink)', width: '100%' }}
                placeholder="Search clauses…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {Object.entries(sectionGroups).length === 0 ? (
            <div className="card"><div className="empty">No clauses match your filter.</div></div>
          ) : Object.entries(sectionGroups).map(([sec, sclause]) => {
            const stats   = sectionStats[sec] || { compliant: 0, partial: 0, nc: 0 };
            const total   = sectionTotalMap[sec] || sclause.length;
            const isOpen  = openSec === sec;
            return (
              <div key={sec} className={`clause-section ${isOpen ? 'open' : ''}`}>
                <div className="clause-section-head" onClick={() => setOpenSec(isOpen ? null : sec)}>
                  <span className="chev"><Icon name="chev_right" size={14} /></span>
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>{sec}</span>
                  <span style={{ color: 'var(--ink-2)' }}>{sectionNameMap[sec]}</span>
                  <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>· {sclause.length} shown of {total}</span>
                  <div style={{ flex: 1 }} />
                  <Pill kind="good">{stats.compliant}</Pill>
                  {stats.partial > 0 && <Pill kind="warn">{stats.partial}</Pill>}
                  {stats.nc      > 0 && <Pill kind="bad">{stats.nc}</Pill>}
                </div>
                <div className="clause-list">
                  <div className="clause-row" style={{ background: 'var(--surface-2)', cursor: 'default', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', fontWeight: 500 }}>
                    <span>Clause</span><span>Requirement</span><span>Status</span><span>Evidence</span><span>Owner</span>
                  </div>
                  {sclause.map(c => (
                    <div key={c.id} className="clause-row" onClick={() => setDetailId(c.id)}>
                      <span className="clause-id">
                        {c.id}
                        {c.category === 'I' && (
                          <span title="Category I — immediate cause for denial/revocation" style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, color: 'var(--bad)', background: 'var(--bad-soft)', border: '1px solid var(--bad)', borderRadius: 3, padding: '1px 4px', verticalAlign: 'middle' }}>CAT I</span>
                        )}
                      </span>
                      <span className="clause-title">{c.title}</span>
                      <StatusPill status={c.status} />
                      <span className="clause-meta">
                        {c.evidence > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="paper" size={12} />{c.evidence} {c.evidence === 1 ? 'item' : 'items'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--bad)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="alert" size={12} />Missing
                          </span>
                        )}
                      </span>
                      <span className="clause-meta">{c.owner}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── Evidence library ── */}
      {tab === "evidence" && (
        <div className="card card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: "SOP-PSG-031 Bio-signal verification", v: "v3.2", clauses: ["5.3.4", "5.5.2"], type: "SOP", date: "21 Apr 2026" },
              { name: "Q1 2026 Internal audit report", v: "v1.0", clauses: ["4.14.1"], type: "Audit", date: "11 Feb 2026" },
              { name: "Calibration cert — Grael 4K #19847", v: "—", clauses: ["5.3.4"], type: "Certificate", date: "02 Apr 2026" },
              { name: "Management review minutes Q4-2025", v: "v1.1", clauses: ["4.15.2"], type: "Minutes", date: "14 Jan 2026" },
              { name: "Inter-observer concordance Q1", v: "v1.0", clauses: ["5.6.6"], type: "Report", date: "20 Mar 2026" },
              { name: "BLS competency register", v: "live", clauses: ["5.1.4"], type: "Register", date: "today" },
              { name: "CoI declarations 2026", v: "v2", clauses: ["4.1.5"], type: "Form", date: "02 Apr 2026" },
              { name: "Subcontractor evidence — XYZ Scoring", v: "v1", clauses: ["4.5.2"], type: "Evidence", date: "—" },
              { name: "Quality manual", v: "v8.1", clauses: ["4.2"], type: "Manual", date: "15 Jan 2026" },
            ].map((e, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="paper" size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{e.type} · {e.v} · {e.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {e.clauses.map(cl => (
                    <span key={cl} className="mono" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 4, color: 'var(--ink-2)', cursor: 'pointer' }}
                      onClick={() => setDetailId(cl)}>
                      cl. {cl}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gap report ── */}
      {tab === "gap" && (
        <div className="card">
          {clauses.filter(c => c.status !== 'compliant' && c.status !== 'na').length === 0 ? (
            <div className="card-pad" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--good)' }}>All clauses compliant</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>No gaps to report.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Clause</th><th>Requirement</th><th>Status</th><th>Gap / notes</th><th>Owner</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clauses.filter(c => c.status !== 'compliant' && c.status !== 'na').map(c => (
                  <tr key={c.id} className="row-clickable" onClick={() => setDetailId(c.id)}>
                    <td><span className="mono">{c.id}</span></td>
                    <td>{c.title}</td>
                    <td><StatusPill status={c.status} /></td>
                    <td style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                      {c.notes || (c.status === 'nc' ? 'No current evidence on file' : 'Evidence outdated or partial')}
                    </td>
                    <td>{c.owner}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => setDetailId(c.id)}>
                          Resolve →
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => openCreateTask({
                            title: `Resolve cl. ${c.id} — ${c.title}`,
                            clause: c.id,
                            source: c.id,
                            sourceType: 'audit',
                            priority: c.status === 'nc' ? 'high' : 'medium',
                            assignedTo: c.owner,
                          })}>
                          <Icon name="plus" size={11} />Task
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Assessor view ── */}
      {tab === "assessor" && (
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center' }}>
              <Icon name="eye" size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>NATA assessor portal</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>
                Read-only, watermark-stamped, time-boxed access to a clause-mapped evidence pack. Every assessor action is logged.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Active assessor links</div>
                  <div style={{ fontSize: 22, fontWeight: 600, margin: '4px 0' }}>2</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>expire in 14 days</div>
                </div>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Pages indexed</div>
                  <div style={{ fontSize: 22, fontWeight: 600, margin: '4px 0' }}>1,284</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>across 24 clauses</div>
                </div>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Last updated</div>
                  <div style={{ fontSize: 22, fontWeight: 600, margin: '4px 0' }}>3m</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>auto-rebuild on changes</div>
                </div>
              </div>
              <button className="btn btn-primary"><Icon name="link" size={14} />Issue new assessor access</button>
              &nbsp;&nbsp;
              <button className="btn"><Icon name="download" size={14} />Download evidence pack (.zip)</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assessment history ── */}
      {tab === "history" && (
        <div className="card card-pad">
          <div className="timeline">
            {[
              { t: "Mar 2022", h: "Initial accreditation granted", d: "NATA accredited service no. 15847 — full scope adult & paediatric PSG, HSAT, MSLT/MWT, CPAP." },
              { t: "Aug 2023", h: "Surveillance assessment", d: "1 minor finding (cl. 4.3.2 — controlled doc list outdated). Closed Sep 2023." },
              { t: "Feb 2025", h: "Mid-cycle assessment", d: "0 NC, 2 observations. Continued accreditation confirmed." },
              { t: "Aug 2026", h: "Full re-assessment scheduled", d: "98 days away. Pre-assessment checklist 73% complete." },
            ].map((e, i) => (
              <div key={i} className="timeline-item">
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{e.t}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{e.h}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{e.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clause detail drawer — local, supports editing */}
      <Drawer open={!!detailId} onClose={() => setDetailId(null)}>
        {detailId && (
          <ClauseDrawer
            key={detailId}
            data={localData}
            clauseId={detailId}
            onClose={() => setDetailId(null)}
            onUpdate={handleUpdateClause}
          />
        )}
      </Drawer>
    </div>
  );
};

export default AccreditationPage;
