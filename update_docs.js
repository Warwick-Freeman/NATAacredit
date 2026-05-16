const fs = require('fs');
const path = require('path');

const DATA_DIR = 'c:\\Users\\wef.CMPHQ\\NATAacredit\\api\\Data';

const NEXUS_CSS = `
.callout.nexus { background: #eef6ff; border: 1px solid #93c5fd; border-left: 4px solid #2563eb; padding: 8px 12px; margin: 10px 0; font-size: 10pt; }
.callout.nexus strong { color: #1d4ed8; }`;

const NEXUS_CALLOUT = `<div class="callout nexus"><strong>&#x2139;&#xFE0F; Nexus 360 Integration:</strong> Steps in this procedure that are performed or supported by the Nexus 360 quality management system are identified with [Nexus 360] throughout this document. Staff must access Nexus 360 at <code>http://localhost:5173</code> to complete these steps. The system audit trail satisfies record-keeping requirements for all digitally recorded activities.</div>`;

const REV_HISTORY = `<div class="callout" style="margin-top:16px;font-size:9.5pt;"><strong>Revision history:</strong> Rev 1.1 (May 2026) — Updated to reflect Nexus 360 quality management system integration. Steps supported by Nexus 360 are identified throughout.</div>`;

const N360 = `<span style="background:#dbeafe;color:#1d4ed8;font-size:8.5pt;padding:1px 5px;border-radius:3px;margin-left:4px;font-weight:600;">[Nexus 360]</span>`;

function addNexusCSS(content) {
  if (content.includes('.callout.nexus')) return content;

  // Single-line format (most files)
  const warnSingle = '.callout.warn { background: #fdecea; border-color: #f0a99e; border-left-color: #c0392b; }';
  if (content.includes(warnSingle)) {
    return content.replace(warnSingle, warnSingle + NEXUS_CSS);
  }

  // Multi-line format (SOP-PSG-005 and SOP-PSG-031)
  const warnMulti = '  .callout.warn {\n    background: #fdecea;\n    border-color: #f0a99e;\n    border-left-color: #c0392b;\n  }';
  if (content.includes(warnMulti)) {
    return content.replace(warnMulti, warnMulti + NEXUS_CSS);
  }

  return content;
}

function updateRevision(content, docId) {
  // Update header revision field
  content = content.replace('<strong>Revision:</strong> 1.0', '<strong>Revision:</strong> 1.1');
  // Update footer — use the docId, but SOP-PSG-031 has "SOP-PSG-005" in its footer (duplicate doc)
  if (docId === 'SOP-PSG-031') {
    content = content.replace('SOP-PSG-005 Rev 1.0 -', 'SOP-PSG-031 Rev 1.1 -');
  } else {
    content = content.replace(docId + ' Rev 1.0 -', docId + ' Rev 1.1 -');
  }
  return content;
}

function addNexusCalloutAfterPurpose(content) {
  // Insert after first h2 section (Purpose/first section)
  // Find </p> after the first <h2> and insert the callout after it
  const h2Match = content.match(/<h2>[\s\S]*?<\/h2>\s*<p>[\s\S]*?<\/p>/);
  if (h2Match) {
    const idx = content.indexOf(h2Match[0]) + h2Match[0].length;
    content = content.slice(0, idx) + '\n\n  ' + NEXUS_CALLOUT + '\n' + content.slice(idx);
  }
  return content;
}

function addRevHistoryBeforeFooter(content) {
  if (!content.includes('Revision history:')) {
    const footerIdx = content.lastIndexOf('<div class="footer">');
    if (footerIdx !== -1) {
      content = content.slice(0, footerIdx) + '\n  ' + REV_HISTORY + '\n  ' + content.slice(footerIdx);
    }
  }
  return content;
}

function tag(text) {
  return text + N360;
}

// === FILE-SPECIFIC TRANSFORMATIONS ===

function updateSOP_EQ_001(content) {
  content = content.replace(
    'the following are performed and recorded on FRM-005:',
    'the following are performed and recorded in Nexus 360 Equipment Register under the device\'s verification record ' + N360 + ':'
  );
  content = content.replace(
    '<p>Acceptance certificate; FRM-005 baseline; entry in equipment register (FRM-004); manuals filed.</p>',
    '<p>Acceptance certificate; baseline verification data recorded in Nexus 360 Equipment Register ' + N360 + ' — FRM-004 is superseded as the primary register; FRM-005 may be used for offline data capture; manuals filed.</p>'
  );
  return content;
}

function updateSOP_EQ_002(content) {
  content = content.replace(
    '<li>Technologist performs verification per manufacturer instructions; results recorded on FRM-005.</li>',
    '<li>Technologist performs verification per manufacturer instructions; results recorded in Nexus 360 Equipment Register &rarr; verification entry for that device ' + N360 + '; the system captures all FRM-005 channel checks (EEG gain, EOG gain, Chin EMG, EEG filter, SpO&#x2082;, PAP pressure, Sound level, Position sensor, Microphone, Video sync) with measured values and pass/fail per channel.</li>'
  );
  content = content.replace(
    '<li>Results compared against acceptance criteria; out-of-spec results raise NC.</li>',
    '<li>Results compared against acceptance criteria; out-of-spec results raise an NC in Nexus 360 NC &amp; CAPA module ' + N360 + '; a failed verification automatically quarantines the device in Nexus 360.</li>'
  );
  content = content.replace(
    '<li>Trend chart updated; drift triggers preventive maintenance.</li>',
    '<li>Nexus 360 stores verification history per device, enabling trend review ' + N360 + '; drift trends trigger preventive maintenance.</li>'
  );
  content = content.replace(
    '<p>FRM-005 verification logs; calibration certificates; trend charts; NC records.</p>',
    '<p>Nexus 360 verification records ' + N360 + '; calibration certificates; NC records. FRM-005 may be used for offline recording when system access is unavailable, with data subsequently entered into Nexus 360.</p>'
  );
  return content;
}

function updateSOP_EQ_003(content) {
  content = content.replace(
    '<p>A documented preventive maintenance schedule follows manufacturer instructions at minimum. Schedule maintained in equipment register; due/overdue items flagged.</p>',
    '<p>A documented preventive maintenance schedule follows manufacturer instructions at minimum. Schedule and maintenance records maintained in Nexus 360 Equipment Register ' + N360 + '; overdue items generate automatic alerts in Nexus 360.</p>'
  );
  content = content.replace(
    '<p>Reasonable measures taken to decontaminate equipment prior to service, repair or decommissioning. Personal protective equipment supplied. Decontamination logged.</p>',
    '<p>Reasonable measures taken to decontaminate equipment prior to service, repair or decommissioning. Personal protective equipment supplied. Decontamination logged; device return from HST has checklist recorded in Nexus 360 Home Sleep Testing module ' + N360 + '.</p>'
  );
  content = content.replace(
    '<p>Maintenance schedule and logs; repair records; decontamination logs; NC links.</p>',
    '<p>Maintenance schedule and logs maintained in Nexus 360 Equipment Register ' + N360 + '; repair records; decontamination logs; NC links in Nexus 360 NC &amp; CAPA module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_EQ_004(content) {
  // SOP-EQ-004 is Adverse Incident Reporting
  content = content.replace(
    '<li>Event recorded on FRM-006 within 24 hours; equipment isolated and labelled per SOP-EQ-003.</li>',
    '<li>Event logged in Nexus 360 NC &amp; CAPA module ' + N360 + ' within 24 hours (FRM-006 may supplement where required); equipment isolated, labelled "Do Not Use" and quarantined in Nexus 360 Equipment Register ' + N360 + '.</li>'
  );
  content = content.replace(
    '<p>FRM-006; manufacturer correspondence; TGA submission reference; CAPA records.</p>',
    '<p>Nexus 360 NC &amp; CAPA record ' + N360 + '; FRM-006 (supplementary where applicable); manufacturer correspondence; TGA submission reference; CAPA records maintained in Nexus 360.</p>'
  );
  return content;
}

function updateSOP_EQ_005(content) {
  // SOP-EQ-005 is Consumables Inventory Management
  content = content.replace(
    '<li>Each consumable has a minimum stock level set by the Tech Lead based on study volume.</li>',
    '<li>Each consumable has a minimum stock level set by the Tech Lead based on study volume; levels managed in Nexus 360 Equipment module ' + N360 + '.</li>'
  );
  content = content.replace(
    '<li>Monthly stock count; reorder triggered at minimum level.</li>',
    '<li>Monthly stock count; reorder alerts generated automatically by Nexus 360 at minimum level ' + N360 + '.</li>'
  );
  content = content.replace(
    '<p>Inventory register; reorder log; lot-tracking entries.</p>',
    '<p>Inventory register and reorder log maintained in Nexus 360 Equipment module ' + N360 + '; lot-tracking entries recorded in Nexus 360.</p>'
  );
  return content;
}

function updateSOP_QMS_001(content) {
  content = content.replace(
    '<li><strong>Quality Manual</strong> - this and the Quality Policy are the apex documents.</li>',
    '<li><strong>Quality Manual</strong> - this and the Quality Policy are the apex documents.</li>\n  <li><strong>Nexus 360 QMS Platform</strong> - the electronic quality management system supporting all document, records, equipment, audit, NC/CAPA, training and indicator management across the QMS. Accessible at <code>http://localhost:5173</code> ' + N360 + '.</li>'
  );
  content = content.replace(
    '<p>All staff are inducted into the QMS at orientation, receive updates at quarterly staff meetings, and acknowledge controlled-document revisions via the document register.</p>',
    '<p>All staff are inducted into the QMS at orientation, receive updates at quarterly staff meetings, and access current approved documents and acknowledge revisions via Nexus 360 Documents &amp; SOPs module ' + N360 + '.</p>'
  );
  content = content.replace(
    '<p>SOP-QMS-002 Document Control, SOP-QMS-003 Records, SOP-QMS-004 Internal Audit, SOP-QMS-005 Management Review, FRM-027 Document Change Request, MASTER Document Register.</p>',
    '<p>SOP-QMS-002 Document Control, SOP-QMS-003 Records, SOP-QMS-004 Internal Audit, SOP-QMS-005 Management Review, FRM-027 Document Change Request, MASTER Document Register, Nexus 360 QMS System ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_QMS_002(content) {
  content = content.replace(
    '<p>Document Owner drafts using the approved HTML template; raises FRM-027 Document Change Request for any new or revised document.</p>',
    '<p>Document Owner drafts using the approved HTML template; initiates a Document Change Request via the Nexus 360 document workflow ' + N360 + ' (FRM-027 is used only when Nexus 360 is unavailable).</p>'
  );
  content = content.replace(
    '<p>Reviewer checks content, ASA-clause alignment and consistency with related documents; comments returned to Owner.</p>',
    '<p>Reviewer checks content, ASA-clause alignment and consistency with related documents; reviewer actions are tracked in the Nexus 360 document workflow ' + N360 + '; comments returned to Owner.</p>'
  );
  content = content.replace(
    '<p>Authoriser signs; Quality Manager assigns the revision number, updates the master register, distributes the controlled copy and withdraws the prior version.</p>',
    '<p>Authoriser signs; Quality Manager assigns the revision number, updates the master register in Nexus 360 ' + N360 + ', distributes the controlled copy and withdraws the prior version.</p>'
  );
  content = content.replace(
    '<p>Default review cycle 24 months. The QMS calendar alerts owners 60 days before due date. Even where no change is required, the review is documented.</p>',
    '<p>Default review cycle 24 months. Nexus 360 generates review-due alerts automatically ' + N360 + ' to owners 60 days before due date. Even where no change is required, the review is documented.</p>'
  );
  content = content.replace(
    '<p>Changes to electronic templates and computerised forms follow the same workflow with version control in the QMS repository; access permissions restrict editing to Document Owners.</p>',
    '<p>Nexus 360 is the authoritative QMS repository ' + N360 + '; changes to electronic templates and computerised forms follow the same workflow with version control; access permissions restrict editing to Document Owners. Staff access only current approved versions via Nexus 360.</p>'
  );
  content = content.replace(
    '<p>Master controlled-document register; FRM-027 Document Change Requests; periodic review records; distribution log.</p>',
    '<p>Master controlled-document register maintained in Nexus 360 Documents &amp; SOPs module ' + N360 + '; Document Change Request workflow records in Nexus 360; FRM-027 used only when system unavailable; periodic review records; distribution log.</p>'
  );
  return content;
}

function updateSOP_QMS_003(content) {
  content = content.replace(
    '<p>All records are held securely and confidentially. Electronic records reside in the encrypted QMS repository with role-based access; paper records are stored in locked cabinets in access-controlled rooms. Access logs are retained.</p>',
    '<p>All records are held securely and confidentially. The master records register is maintained in Nexus 360 ' + N360 + '; equipment records and verification logs are stored in Nexus 360 Equipment module ' + N360 + '; NC and CAPA records are in Nexus 360 NC &amp; CAPA module ' + N360 + '; audit findings are in Nexus 360 Audits &amp; Reviews module ' + N360 + '; training and competency records are in Nexus 360 Staff &amp; Training module ' + N360 + '. Role-based access applies. Paper records are stored in locked cabinets in access-controlled rooms. Access logs are retained (Nexus 360 Audit Trail satisfies this requirement for all digitally recorded activities ' + N360 + ').</p>'
  );
  return content;
}

function updateSOP_QMS_004(content) {
  content = content.replace(
    '<li>Quality Manager publishes annual audit plan with scope, criteria and dates.</li>',
    '<li>Quality Manager publishes annual audit plan with scope, criteria and dates in Nexus 360 Audits &amp; Reviews module ' + N360 + '.</li>'
  );
  content = content.replace(
    '<li>Findings recorded on FRM-009 (Conformance / Observation / Minor NC / Major NC) with objective evidence.</li>',
    '<li>Findings recorded in Nexus 360 Audits &amp; Reviews module ' + N360 + ' (Conformance / Observation / Minor NC / Major NC) with objective evidence; FRM-009 may supplement where offline recording is needed.</li>'
  );
  content = content.replace(
    '<li>Audit report issued within 10 working days; nonconformities raised in the NC register.</li>',
    '<li>Audit report issued within 10 working days; nonconformities raised in Nexus 360 NC &amp; CAPA module ' + N360 + ' with automatic links created from the audit record.</li>'
  );
  content = content.replace(
    '<p>Audit plan; FRM-009 reports; NC/CAPA register; verification of corrective action.</p>',
    '<p>Audit plan and findings maintained in Nexus 360 Audits &amp; Reviews module ' + N360 + '; NC/CAPA records in Nexus 360 NC &amp; CAPA module ' + N360 + '; FRM-009 used for offline recording only; verification of corrective action tracked in Nexus 360.</p>'
  );
  return content;
}

function updateSOP_QMS_005(content) {
  content = content.replace(
    '<li>Quality indicators (cl. 5.6.3).</li>',
    '<li>Quality indicators (cl. 5.6.3) — KPI data (report turnaround time, urgent referral wait time, equipment compliance rate, proficiency testing completion, NC trends) pulled from Nexus 360 Quality Indicators dashboard ' + N360 + '.</li>'
  );
  content = content.replace(
    '<p>FRM-010 Management Review Minutes; action register; supporting input pack archived 7 years.</p>',
    '<p>FRM-010 Management Review Minutes; action register (tracked in Nexus 360 My Tasks module ' + N360 + '); quality indicator data from Nexus 360 Quality Indicators dashboard ' + N360 + '; supporting input pack archived 7 years.</p>'
  );
  return content;
}

function updateSOP_QMS_006(content) {
  content = content.replace(
    '<li>Complaint logged on FRM-011 within 1 working day of receipt; acknowledgement to complainant within 3 working days.</li>',
    '<li>Complaint logged in Nexus 360 NC &amp; CAPA module ' + N360 + ' within 1 working day of receipt (FRM-011 supplements as required); acknowledgement to complainant within 3 working days.</li>'
  );
  content = content.replace(
    '<p>FRM-011 with all correspondence; CAPA links; trend reports.</p>',
    '<p>NC/CAPA records in Nexus 360 ' + N360 + '; FRM-011 (supplementary); all correspondence; trend reports from Nexus 360 Quality Indicators module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_QMS_007(content) {
  content = content.replace(
    '<p>Quality Manager reviews feedback monthly; themes converted to CAPA, suggestions or QMS changes; positive feedback shared with staff. All material feedback reported at management review.</p>',
    '<p>Quality Manager reviews feedback monthly; themes converted to CAPA records in Nexus 360 NC &amp; CAPA module ' + N360 + ', suggestions or QMS changes; positive feedback shared with staff. All material feedback reported at management review with data from Nexus 360 Quality Indicators ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_QMS_008(content) {
  content = content.replace(
    '<li>Any staff member identifying an NC raises FRM-007 within 1 working day.</li>',
    '<li>Any staff member identifying an NC raises an NC record in Nexus 360 NC &amp; CAPA module ' + N360 + ' within 1 working day; NC references (e.g., NC-2026-014) are assigned automatically by Nexus 360; FRM-007 is used only when Nexus 360 is unavailable.</li>'
  );
  content = content.replace(
    '<p>NC register; FRM-007; trend reports; recall correspondence.</p>',
    '<p>NC register maintained in Nexus 360 NC &amp; CAPA module ' + N360 + '; root cause, corrective action, effectiveness check and closure all recorded in Nexus 360 ' + N360 + '; FRM-007 (supplementary offline use); trend reports; recall correspondence.</p>'
  );
  return content;
}

function updateSOP_QMS_009(content) {
  content = content.replace(
    '<li>NC or risk identified; FRM-008 raised.</li>',
    '<li>NC or risk identified; CAPA record raised in Nexus 360 NC &amp; CAPA module ' + N360 + '; FRM-008 used only when Nexus 360 is unavailable.</li>'
  );
  content = content.replace(
    '<p>CAPA register; FRM-008; effectiveness verification.</p>',
    '<p>CAPA register maintained in Nexus 360 NC &amp; CAPA module ' + N360 + '; root cause, corrective action, effectiveness check and closure all recorded in Nexus 360; FRM-008 supplementary only; effectiveness verification tracked in Nexus 360.</p>'
  );
  return content;
}

function updateSOP_QMS_010(content) {
  content = content.replace(
    '<li>Quality indicator dashboards (cl. 5.6.3).</li>',
    '<li>Quality indicator dashboards (cl. 5.6.3) in Nexus 360 Quality Indicators module ' + N360 + '.</li>'
  );
  content = content.replace(
    '<li>Improvement idea logged on FRM-028.</li>',
    '<li>Improvement idea logged on FRM-028 or via Nexus 360 My Tasks module ' + N360 + '.</li>'
  );
  return content;
}

function updateSOP_QMS_011(content) {
  content = content.replace(
    '<li>Subcontractor evaluated using FRM-018',
    '<li>Subcontractor evaluated using FRM-018 (qualifications, accreditation status, evidence of compliance, references, financial stability); evaluation tracked in Nexus 360 ' + N360
  );
  return content;
}

function updateSOP_QMS_012(content) {
  content = content.replace(
    '<li>Supplier added to the approved supplier register.</li>',
    '<li>Supplier added to the approved supplier register maintained in Nexus 360 Equipment module ' + N360 + '.</li>'
  );
  return content;
}

function updateSOP_HR_001(content) {
  content = content.replace(
    '<p>FRM-014 maintained for every staff member. Includes qualifications, recognition of overseas qualifications, training attended, competency assessments, hours of attendance.</p>',
    '<p>Staff competency records, training history, and proficiency assessments are maintained in Nexus 360 Staff &amp; Training module ' + N360 + '; training due dates and gaps are tracked automatically. FRM-014 may supplement for offline recording.</p>'
  );
  content = content.replace(
    '<li>Assessment recorded on FRM-014.</li>',
    '<li>Assessment recorded in Nexus 360 Staff &amp; Training module ' + N360 + ' (FRM-014 supplementary for offline use).</li>'
  );
  return content;
}

function updateSOP_HR_002(content) {
  content = content.replace(
    '<li>All staff complete FRM-015 on appointment and annually thereafter, and within 14 days of any new interest.</li>',
    '<li>All staff complete FRM-015 on appointment and annually thereafter, and within 14 days of any new interest; COI records maintained in Nexus 360 Staff &amp; Training module ' + N360 + '.</li>'
  );
  return content;
}

function updateSOP_DATA_001(content) {
  content = content.replace(
    '<p>Role-based access; audit log of access events retained; periodic access review by IT and Quality Manager.</p>',
    '<p>Role-based access; audit log of all system activity logged automatically in Nexus 360 Audit Trail module ' + N360 + ' (satisfies records-integrity requirements); periodic access review by IT and Quality Manager. Study register tracked in Nexus 360 Studies &amp; Reports module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_QC_001(content) {
  content = content.replace(
    '<p>The service maintains a catalogue of indicators covering pre-study, study and post-study processes (FRM-019). Indicators have stated objective, methodology, target, threshold, action plan and review period. Examples include:</p>',
    '<p>The service maintains a catalogue of indicators tracked and trended in Nexus 360 Quality Indicators module ' + N360 + '. Indicators have stated objective, methodology, target, threshold, action plan and review period. The Nexus 360 dashboard provides real-time visibility for management review. Examples include:</p>'
  );
  content = content.replace(
    '<li>Results imported to FRM-020; out-of-spec results raise CAPA.</li>',
    '<li>Results recorded in Nexus 360 Quality Indicators module ' + N360 + '; out-of-spec results raise CAPA in Nexus 360 NC &amp; CAPA module ' + N360 + '. FRM-020 may supplement for offline recording.</li>'
  );
  content = content.replace(
    '<p>Indicator dashboard; QC review log; PT results; concordance records; CAPA links.</p>',
    '<p>Quality indicator dashboard and QC review log in Nexus 360 Quality Indicators module ' + N360 + '; PT results and concordance records tracked in Nexus 360; CAPA links in Nexus 360 NC &amp; CAPA module ' + N360 + '.</p>'
  );
  return content;
}

function updatePSG_generic(content) {
  // Generic PSG update: study register, NC, equipment checks
  content = content.replace(
    '<p>FRM-001; triage decision log; capacity reports.</p>',
    '<p>Referrals and study register tracked in Nexus 360 Studies &amp; Reports module ' + N360 + '; triage decision log; capacity reports.</p>'
  );
  // Tag pre-study equipment checks if mentioned
  return content;
}

function updateSOP_PSG_001(content) {
  content = updatePSG_generic(content);
  content = content.replace(
    '<li>Referral received via fax, secure email, EMR or web; logged on FRM-001 within 1 working day.</li>',
    '<li>Referral received via fax, secure email, EMR or web; logged on FRM-001 within 1 working day; study register tracked in Nexus 360 Studies &amp; Reports module ' + N360 + '.</li>'
  );
  return content;
}

function updateSOP_PSG_002(content) {
  content = content.replace(
    '<p>Any discrepancy halts the activity; verified with patient and referrer; recorded as NC if necessary.</p>',
    '<p>Any discrepancy halts the activity; verified with patient and referrer; recorded as NC in Nexus 360 NC &amp; CAPA module ' + N360 + ' if necessary.</p>'
  );
  return content;
}

function updateSOP_PSG_003(content) {
  content = content.replace(
    '<li>Biocalibration per SOP-PSG-005 recorded on FRM-019/biocal sheet.</li>',
    '<li>Biocalibration per SOP-PSG-005 recorded on FRM-019/biocal sheet; pre-study equipment checks logged in Nexus 360 Equipment module ' + N360 + '.</li>'
  );
  content = content.replace(
    '<p>Random review of 10% of studies by Tech Lead; trends shared with technical team. Inter-observer concordance per SOP-QC-001.</p>',
    '<p>Random review of 10% of studies by Tech Lead; trends shared with technical team and tracked in Nexus 360 Quality Indicators ' + N360 + '. Inter-observer concordance per SOP-QC-001. Any equipment issues or NCs arising during studies are logged in Nexus 360 NC &amp; CAPA module ' + N360 + '. Study register maintained in Nexus 360 Studies &amp; Reports module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_PSG_004(content) {
  content = content.replace(
    '<p>FRM-001 referral; device tracking; analysis output; report template FRM-025.</p>',
    '<p>Study register and report status tracked in Nexus 360 Studies &amp; Reports module ' + N360 + '; FRM-001 referral; device tracking in Nexus 360 Equipment module ' + N360 + ' including HST dispatch workflow; analysis output; report template FRM-025.</p>'
  );
  return content;
}

function updateSOP_PSG_005(content) {
  // PSG-005 biocal SOP
  content = content.replace(
    '<li>Biocal worksheet (paper or electronic) attached to the patient study file, including: study ID, three patient identifiers, date, time, technologist ID, impedance values, step-by-step pass/fail or signal-quality grading, deviations, corrective actions.</li>',
    '<li>Biocal worksheet (paper or electronic) attached to the patient study file; pre-study equipment verification status confirmed in Nexus 360 Equipment module ' + N360 + '; study logged in Nexus 360 Studies &amp; Reports module ' + N360 + '.</li>'
  );
  content = content.replace(
    '<li>Biocal failures that delay or abort a study are recorded as nonconformances (ASA 4.9) and trended quarterly.</li>',
    '<li>Biocal failures that delay or abort a study are recorded as nonconformances in Nexus 360 NC &amp; CAPA module ' + N360 + ' and trended via the Nexus 360 Quality Indicators dashboard ' + N360 + '.</li>'
  );
  return content;
}

function updateSOP_PSG_006(content) {
  content = content.replace(
    'completed on FRM-023.',
    'completed on FRM-023; study register updated in Nexus 360 Studies &amp; Reports module ' + N360 + '.'
  );
  return content;
}

function updateSOP_PSG_007(content) {
  content = content.replace(
    '<p>FRM-024 with mean sleep latency, individual trial latencies, sleep stages reached, REM-onset count, interpretation by sleep physician.</p>',
    '<p>FRM-024 with mean sleep latency, individual trial latencies, sleep stages reached, REM-onset count, interpretation by sleep physician; study register updated in Nexus 360 Studies &amp; Reports module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_PSG_008(content) {
  content = content.replace(
    '<p>Audio-video recording mandatory. Scoring per AASM Manual using paediatric rules and the ASA/ASTA Addendum. Computerised analysis is not recommended for paediatric studies; manual scoring is required.</p>',
    '<p>Audio-video recording mandatory. Scoring per AASM Manual using paediatric rules and the ASA/ASTA Addendum. Computerised analysis is not recommended for paediatric studies; manual scoring is required. Study register maintained in Nexus 360 Studies &amp; Reports module ' + N360 + '; any NCs arising during studies logged in Nexus 360 NC &amp; CAPA module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_PSG_009(content) {
  content = content.replace(
    '<p>Incident reports; drill records; staff BLS recertification (FRM-014).</p>',
    '<p>Incident reports logged in Nexus 360 NC &amp; CAPA module ' + N360 + '; drill records; staff BLS recertification tracked in Nexus 360 Staff &amp; Training module ' + N360 + ' (FRM-014 supplementary).</p>'
  );
  return content;
}

function updateSOP_PSG_010(content) {
  content = content.replace(
    '<p>Validation report (lifetime + 7 years); QMS register of methods and their status.</p>',
    '<p>Validation report (lifetime + 7 years); QMS register of methods and their status maintained in Nexus 360 Documents &amp; SOPs module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_RPT_001(content) {
  content = content.replace(
    '<p>Correspondence and PSG reports completed within 10 business days following patient contact (cl. 5.8.1).</p>',
    '<p>Correspondence and PSG reports completed within 10 business days following patient contact (cl. 5.8.1); turnaround time tracked as a KPI in Nexus 360 Quality Indicators module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_RPT_003(content) {
  // Secure report transmission — audit trail in Nexus 360
  content = content.replace(
    '<p>Portal access requires authenticated login; reports downloadable only in protected (non-editable) format. Access logs retained.</p>',
    '<p>Portal access requires authenticated login; reports downloadable only in protected (non-editable) format. Access logs retained; all system access logged automatically in Nexus 360 Audit Trail module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_RPT_002(content) {
  // amendment register
  content = content.replace(
    '<p>Original report (retained); amended report (FRM-026); distribution log; amendment register.</p>',
    '<p>Original report (retained); amended report (FRM-026); distribution log; amendment register tracked in Nexus 360 Studies &amp; Reports module ' + N360 + '.</p>'
  );
  return content;
}

function updateSOP_TX_001(content) {
  content = content.replace(
    '<li>Adherence monitored at 30, 90 and 365 days; intervention triggered if average use &lt;4 h/night or &lt;70% nights.</li>',
    '<li>Adherence monitored at 30, 90 and 365 days; CPAP adherence rates tracked as a quality indicator in Nexus 360 Quality Indicators module ' + N360 + '; intervention triggered if average use &lt;4 h/night or &lt;70% nights.</li>'
  );
  return content;
}

function updateFRM_001(content) {
  content = content.replace(
    '<div class="subtitle">Linked SOP: SOP-PSG-001 (Referral Handling). Captured at first contact with the service.</div>',
    '<div class="subtitle">Linked SOP: SOP-PSG-001 (Referral Handling). Captured at first contact with the service. <em>Note: Study register and report status are tracked in Nexus 360 Studies &amp; Reports module. This form supplements the Nexus 360 record.</em></div>'
  );
  return content;
}

function updateFRM_004(content) {
  // Add prominent callout after first h2
  const callout = `<div class="callout nexus"><strong>Nexus 360 Notice:</strong> This form is superseded as the primary equipment register by the Nexus 360 Equipment Register module. FRM-004 may be used for offline recording only, with data subsequently entered into Nexus 360. The Nexus 360 register is the definitive controlled record.</div>`;
  content = content.replace(
    '<h2>1. Identification',
    callout + '\n  <h2>1. Identification'
  );
  return content;
}

function updateFRM_005(content) {
  const callout = `<div class="callout nexus"><strong>Nexus 360 Notice:</strong> Verification data is recorded directly in Nexus 360 &rarr; Equipment &rarr; [Device] &rarr; Record verification, which captures all channel checks with measured values. FRM-005 is retained for offline recording when system access is unavailable; data must be entered into Nexus 360 within 24 hours.</div>`;
  content = content.replace(
    '<h2>Header</h2>',
    callout + '\n  <h2>Header</h2>'
  );
  return content;
}

function updateFRM_027(content) {
  const callout = `<div class="callout nexus"><strong>Nexus 360 Notice:</strong> Document change requests are initiated and tracked in the Nexus 360 document workflow. FRM-027 is used only when Nexus 360 is unavailable.</div>`;
  content = content.replace(
    '<h2>Request</h2>',
    callout + '\n  <h2>Request</h2>'
  );
  return content;
}

function updateFRM_generic(content, formId, formTitle) {
  // Determine nexus integration level based on form type
  let note = '';

  // Equipment-related forms
  if (['FRM-006'].includes(formId)) {
    note = 'This form is supplemented by Nexus 360 NC &amp; CAPA module. Equipment adverse incidents are logged in Nexus 360 where possible; this form provides an offline backup record.';
  } else if (['FRM-007'].includes(formId)) {
    note = 'Nonconformance records are raised and tracked in Nexus 360 NC &amp; CAPA module. FRM-007 is used only when Nexus 360 is unavailable; data must be subsequently entered into Nexus 360.';
  } else if (['FRM-008'].includes(formId)) {
    note = 'CAPA records including root cause, corrective action, effectiveness check, and closure are managed in Nexus 360 NC &amp; CAPA module. FRM-008 is used only when Nexus 360 is unavailable.';
  } else if (['FRM-009'].includes(formId)) {
    note = 'Internal audit findings are recorded and managed in Nexus 360 Audits &amp; Reviews module. FRM-009 supplements the Nexus 360 record for offline or field use.';
  } else if (['FRM-010'].includes(formId)) {
    note = 'Management review actions are tracked in Nexus 360 My Tasks module. Quality indicator data for management review is pulled from the Nexus 360 Quality Indicators dashboard. FRM-010 provides the formal minutes record.';
  } else if (['FRM-011'].includes(formId)) {
    note = 'Complaints are logged in Nexus 360 NC &amp; CAPA module. FRM-011 supplements the Nexus 360 record.';
  } else if (['FRM-012', 'FRM-013'].includes(formId)) {
    note = 'Feedback data is analysed in Nexus 360 Quality Indicators module. This form provides source data.';
  } else if (['FRM-014'].includes(formId)) {
    note = 'Staff training and competency records are maintained in Nexus 360 Staff &amp; Training module. Training due dates and gaps are tracked automatically. FRM-014 supplements the Nexus 360 record for offline or initial recording.';
  } else if (['FRM-015'].includes(formId)) {
    note = 'Conflict of interest declarations are recorded in Nexus 360 Staff &amp; Training module. FRM-015 provides the formal signed declaration.';
  } else if (['FRM-016'].includes(formId)) {
    note = 'Staff records including job descriptions are maintained in Nexus 360 Staff &amp; Training module. This form documents the role specification.';
  } else if (['FRM-017'].includes(formId)) {
    note = 'CPAP prescription issuance is recorded in Nexus 360 Studies &amp; Reports module. FRM-017 provides the paper prescription record.';
  } else if (['FRM-018'].includes(formId)) {
    note = 'Subcontractor evaluations are tracked in Nexus 360. FRM-018 provides the formal evaluation record.';
  } else if (['FRM-019'].includes(formId)) {
    note = 'Quality indicators are tracked and trended in Nexus 360 Quality Indicators module, providing real-time dashboards for management review. This form may supplement the Nexus 360 record.';
  } else if (['FRM-020'].includes(formId)) {
    note = 'Proficiency testing results are recorded in Nexus 360 Quality Indicators module. FRM-020 provides source data for subsequent entry.';
  } else if (['FRM-021', 'FRM-022', 'FRM-023', 'FRM-024', 'FRM-025'].includes(formId)) {
    note = 'Study reports and their status are tracked in Nexus 360 Studies &amp; Reports module. Report turnaround time is monitored as a quality indicator in Nexus 360.';
  } else if (['FRM-026'].includes(formId)) {
    note = 'Amended report records are tracked in Nexus 360 Studies &amp; Reports module. FRM-026 provides the formal amendment record.';
  } else if (['FRM-028'].includes(formId)) {
    note = 'Staff suggestions and improvement ideas are tracked in Nexus 360 My Tasks module. FRM-028 provides the formal record.';
  } else {
    note = 'This form is supplemented by the Nexus 360 quality management system where applicable. Consult your team leader for guidance on whether this record requires corresponding entry in Nexus 360.';
  }

  if (note) {
    const callout = `<div class="callout nexus"><strong>&#x2139;&#xFE0F; Nexus 360 Integration:</strong> ${note}</div>`;
    // Add after first h2
    const h2Idx = content.indexOf('<h2>');
    if (h2Idx !== -1) {
      content = content.slice(0, h2Idx) + callout + '\n\n  ' + content.slice(h2Idx);
    }
  }

  return content;
}

function updateREG_001(content) {
  content = content.replace(
    '<p>The Master Document Register is the single controlled list of all current SOPs, policies and forms maintained under the QMS. It identifies for each document the owner, authoriser, mapped ASA clause(s), linked SOP/Form, current revision and next review date.</p>',
    '<p>The Master Document Register is the single controlled list of all current SOPs, policies and forms maintained under the QMS. It identifies for each document the owner, authoriser, mapped ASA clause(s), linked SOP/Form, current revision and next review date. The definitive controlled-document register is maintained in Nexus 360 Documents &amp; SOPs module ' + N360 + '; this printed register is a reference copy.</p>'
  );
  // Update all Rev 1.0 in the table to 1.1
  content = content.replace(/<td>1\.0<\/td>/g, '<td>1.1</td>');
  return content;
}

// === MAIN PROCESSING ===

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.html'));

const results = [];

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Determine doc ID for footer update
  const idMatch = file.replace('.html', '');

  // Step 1: Add nexus CSS
  content = addNexusCSS(content);

  // Step 2: Update revision number
  content = updateRevision(content, idMatch);

  // Step 3: Add nexus callout (all SOP files, not forms - forms get targeted callouts)
  const isSOP = file.startsWith('SOP-') || file.startsWith('REG-');
  if (isSOP) {
    content = addNexusCalloutAfterPurpose(content);
  }

  // Step 4: File-specific transformations
  switch(idMatch) {
    case 'SOP-EQ-001': content = updateSOP_EQ_001(content); break;
    case 'SOP-EQ-002': content = updateSOP_EQ_002(content); break;
    case 'SOP-EQ-003': content = updateSOP_EQ_003(content); break;
    case 'SOP-EQ-004': content = updateSOP_EQ_004(content); break;
    case 'SOP-EQ-005': content = updateSOP_EQ_005(content); break;
    case 'SOP-QMS-001': content = updateSOP_QMS_001(content); break;
    case 'SOP-QMS-002': content = updateSOP_QMS_002(content); break;
    case 'SOP-QMS-003': content = updateSOP_QMS_003(content); break;
    case 'SOP-QMS-004': content = updateSOP_QMS_004(content); break;
    case 'SOP-QMS-005': content = updateSOP_QMS_005(content); break;
    case 'SOP-QMS-006': content = updateSOP_QMS_006(content); break;
    case 'SOP-QMS-007': content = updateSOP_QMS_007(content); break;
    case 'SOP-QMS-008': content = updateSOP_QMS_008(content); break;
    case 'SOP-QMS-009': content = updateSOP_QMS_009(content); break;
    case 'SOP-QMS-010': content = updateSOP_QMS_010(content); break;
    case 'SOP-QMS-011': content = updateSOP_QMS_011(content); break;
    case 'SOP-QMS-012': content = updateSOP_QMS_012(content); break;
    case 'SOP-HR-001': content = updateSOP_HR_001(content); break;
    case 'SOP-HR-002': content = updateSOP_HR_002(content); break;
    case 'SOP-DATA-001': content = updateSOP_DATA_001(content); break;
    case 'SOP-QC-001': content = updateSOP_QC_001(content); break;
    case 'SOP-PSG-001': content = updateSOP_PSG_001(content); break;
    case 'SOP-PSG-002': content = updateSOP_PSG_002(content); break;
    case 'SOP-PSG-003': content = updateSOP_PSG_003(content); break;
    case 'SOP-PSG-004': content = updateSOP_PSG_004(content); break;
    case 'SOP-PSG-005': content = updateSOP_PSG_005(content); break;
    case 'SOP-PSG-006': content = updateSOP_PSG_006(content); break;
    case 'SOP-PSG-007': content = updateSOP_PSG_007(content); break;
    case 'SOP-PSG-008': content = updateSOP_PSG_008(content); break;
    case 'SOP-PSG-009': content = updateSOP_PSG_009(content); break;
    case 'SOP-PSG-010': content = updateSOP_PSG_010(content); break;
    case 'SOP-PSG-031':
      // Fix document ID in header (was mistakenly set to SOP-PSG-005)
      content = content.replace('<strong>Document ID:</strong> SOP-PSG-005', '<strong>Document ID:</strong> SOP-PSG-031');
      content = updateSOP_PSG_005(content);
      break;
    case 'SOP-RPT-001': content = updateSOP_RPT_001(content); break;
    case 'SOP-RPT-002': content = updateSOP_RPT_002(content); break;
    case 'SOP-RPT-003': content = updateSOP_RPT_003(content); break;
    case 'SOP-TX-001': content = updateSOP_TX_001(content); break;
    case 'FRM-001': content = updateFRM_001(content); break;
    case 'FRM-004': content = updateFRM_004(content); break;
    case 'FRM-005': content = updateFRM_005(content); break;
    case 'FRM-027': content = updateFRM_027(content); break;
    default:
      if (file.startsWith('FRM-')) {
        content = updateFRM_generic(content, idMatch, file);
      }
      break;
  }

  // Step 5: Add revision history before footer (for SOP/REG files)
  if (isSOP) {
    content = addRevHistoryBeforeFooter(content);
  } else {
    // For forms, add a revision note in the footer area
    content = addRevHistoryBeforeFooter(content);
  }

  // Write the file
  fs.writeFileSync(filePath, content, 'utf8');

  const changed = content !== original;
  results.push({ file, changed });
}

console.log('Processing complete:');
results.forEach(r => console.log(`  ${r.changed ? 'UPDATED' : 'UNCHANGED'}: ${r.file}`));
console.log(`\nTotal: ${results.length} files, ${results.filter(r => r.changed).length} updated`);
