// Shared DME order utilities — used by page-patients.jsx and study-drawer.jsx

export const DME_PROVIDERS = [
  { name: 'ResMed Healthcare Australia',      fax: '02 9491 0099', email: 'orders@resmed.com.au'         },
  { name: 'Philips Healthcare Australia',      fax: '1300 738 099', email: 'orders@philips.com.au'        },
  { name: 'Fisher & Paykel Healthcare',        fax: '09 574 0499',  email: 'orders@fphealthcare.com'      },
  { name: 'CPAP Australia',                    fax: '1300 799 788', email: 'orders@cpap.com.au'           },
  { name: 'Independent Living Centres Aust.',  fax: '02 9371 9999', email: 'orders@ilca.org.au'           },
  { name: 'Other (manual entry)',              fax: '',             email: ''                             },
];

export const DX_LIST = [
  { key: 'dx_osa',      label: 'Obstructive Sleep Apnea',        code: 'G47.33', match: ['obstructive', 'osa']            },
  { key: 'dx_csa',      label: 'Central Sleep Apnea',            code: 'G47.37', match: ['central sleep']                 },
  { key: 'dx_uas',      label: 'Upper Airway Resistance Synd.',  code: 'G47.8',  match: ['airway resist', 'uars']          },
  { key: 'dx_plms',     label: 'Periodic Limb Movement Synd.',   code: 'G47.61', match: ['limb movement', 'plms']          },
  { key: 'dx_snoring',  label: 'Primary Snoring',                code: 'R06.83', match: ['snoring']                       },
  { key: 'dx_rem',      label: 'REM Behaviour Disorder',         code: 'G47.52', match: ['rem behavior', 'rbd']            },
  { key: 'dx_bruxism',  label: 'Bruxism',                        code: 'G47.63', match: ['bruxism']                       },
  { key: 'dx_hypox',    label: 'Nocturnal Hypoxaemia',           code: 'G47.36', match: ['hypoxemia', 'hypoxaemia']        },
  { key: 'dx_narc',     label: 'Narcolepsy / Hypersomnia',       code: 'G47.41', match: ['narcolepsy', 'hypersomnia']      },
  { key: 'dx_csb',      label: 'Cheyne-Stokes Respiration',      code: 'R06.3',  match: ['cheyne-stokes', 'cheyne stokes'] },
  { key: 'dx_normal',   label: 'Normal study',                   code: '—',      match: []                                },
];

export function initDxFromDiagnoses(diagnoses) {
  const dx = {};
  DX_LIST.forEach(d => {
    dx[d.key] = d.match.length > 0 && diagnoses.some(diag =>
      d.match.some(m => diag.toLowerCase().includes(m))
    );
  });
  return dx;
}

export function generateOrderHtml(form, patient, site, user) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const selectedDx = DX_LIST.filter(d => form[d.key]);
  const provInfo = DME_PROVIDERS.find(p => p.name === form.dmeProvider) ?? {};

  const pressureDetail = (() => {
    if (form.equipmentType === 'CPAP' && !form.pressureMode?.includes('APAP'))
      return `Fixed CPAP ${form.pMin || '—'} cmH₂O`;
    if (form.equipmentType === 'CPAP')
      return `APAP ${form.pMin || '—'}–${form.pMax || '—'} cmH₂O`;
    if (form.equipmentType === 'BiPAP') return `BiPAP IPAP ${form.ipap || '—'} / EPAP ${form.epap || '—'} cmH₂O`;
    if (form.equipmentType === 'ASV') return `ASV EPAP ${form.epap || '—'} / IPAP max ${form.ipapMax || '—'} cmH₂O`;
    return form.pressureMode || '—';
  })();

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>DME Order — ${patient.name} ${patient.mrn}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;background:#fff;padding:20px}
@media print{@page{margin:12mm 14mm;size:A4}.no-print{display:none!important}}
.stat-banner{background:#dc2626;color:#fff;font-weight:700;font-size:14px;text-align:center;padding:8px;margin-bottom:14px;border-radius:4px;letter-spacing:.1em}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:14px}
.practice-name{font-size:16px;font-weight:700;color:#1e3a5f}
.practice-sub{font-size:11px;color:#374151;margin-top:3px}
.doc-title{font-size:18px;font-weight:800;color:#1e3a5f;text-align:right}
.patient-box{border:2px solid #1e3a5f;border-radius:6px;padding:10px 14px;margin-bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.patient-field label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;display:block;margin-bottom:2px}
.patient-field span{font-size:12px;font-weight:600;color:#111}
.section-head{font-size:12px;font-weight:700;color:#1e3a5f;background:#eff6ff;border-left:4px solid #1e3a5f;padding:5px 10px;margin:14px 0 8px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.field label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;display:block;margin-bottom:3px}
.field .val{border-bottom:1px solid #374151;padding-bottom:3px;font-size:11px;min-height:18px;font-weight:500}
.dx-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.dx-item{display:flex;align-items:center;gap:7px;font-size:11px;padding:3px 0}
.dx-item .box{width:12px;height:12px;border:1.5px solid #374151;border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.dx-item.checked .box{background:#1e3a5f;border-color:#1e3a5f;color:#fff;font-size:9px;font-weight:700}
.comments-box{border:1px solid #d1d5db;border-radius:4px;padding:8px;min-height:60px;font-size:11px;margin-top:4px}
.attestation{border:1px solid #d1d5db;border-radius:6px;padding:12px;margin-top:14px;background:#f9fafb}
.att-text{font-size:10px;color:#374151;line-height:1.6;margin-bottom:12px}
.sig-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:20px;margin-top:8px}
.sig-line{border-bottom:1px solid #374151;height:24px;margin-bottom:3px}
.sig-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
.sig-value{font-size:11px;font-weight:500;padding-top:2px}
.transmit-box{border:1px dashed #9ca3af;border-radius:6px;padding:10px 14px;margin-top:14px;font-size:10px;color:#6b7280}
.footer{margin-top:20px;border-top:1px solid #e5e7eb;padding-top:8px;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af}
.print-btn{position:fixed;bottom:20px;right:20px;background:#1e3a5f;color:#fff;border:none;padding:10px 18px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer}
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
${form.stat ? '<div class="stat-banner">⚡ STAT — URGENT ORDER</div>' : ''}
<div class="header">
  <div>
    ${form.includeLogo ? `<div class="practice-name">${site?.name ?? 'Sleep Disorders Service'}</div>
    <div class="practice-sub">NATA Accredited · Certificate NATA-15847</div>` : ''}
  </div>
  <div>
    <div class="doc-title">DME ORDER FORM</div>
    <div style="font-size:10px;color:#6b7280;text-align:right;margin-top:4px">Order date: ${form.orderingDate} &nbsp;|&nbsp; Ref: DME-${patient.mrn}-${now.toISOString().slice(0,10).replace(/-/g,'')}</div>
  </div>
</div>

<div class="patient-box">
  <div class="patient-field"><label>Patient name</label><span>${patient.name}</span></div>
  <div class="patient-field"><label>MRN</label><span>${patient.mrn}</span></div>
  <div class="patient-field"><label>Date of birth</label><span>${patient.dob || '—'}</span></div>
  <div class="patient-field"><label>Age / Sex</label><span>${patient.age ? patient.age + 'y ' : ''}${patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex || '—'}</span></div>
</div>

<div class="section-head">Order Information</div>
<div class="grid-3" style="margin-bottom:10px">
  <div class="field"><label>DME provider</label><div class="val">${form.dmeProvider || '—'}</div></div>
  <div class="field"><label>Fax</label><div class="val">${form.dmeProviderFax || provInfo.fax || '—'}</div></div>
  <div class="field"><label>Order type</label><div class="val">${form.orderType}</div></div>
  <div class="field"><label>Length of need</label><div class="val">${form.lengthOfNeed}${form.numMonths && form.lengthOfNeed === 'Other' ? ` (${form.numMonths} months)` : ''}</div></div>
  <div class="field"><label>Ordering physician</label><div class="val">${form.orderingPhysician}</div></div>
  <div class="field"><label>Follow-up physician</label><div class="val">${form.followUpPhysician || '—'}</div></div>
</div>

<div class="section-head">Equipment Prescription</div>
<div class="grid-3" style="margin-bottom:10px">
  <div class="field"><label>Equipment type</label><div class="val">${form.equipmentType}</div></div>
  <div class="field"><label>Pressure / mode</label><div class="val">${pressureDetail}</div></div>
  <div class="field"><label>Humidifier</label><div class="val">${form.humidifier ? 'Yes — heated humidifier' : 'No'}</div></div>
  <div class="field" style="grid-column:1/-1"><label>Mask / interface</label><div class="val">${form.mask || '—'}</div></div>
</div>

<div class="section-head">Clinical Evidence</div>
<div class="grid-3" style="margin-bottom:10px">
  <div class="field"><label>Study type</label><div class="val">${form.studyType || '—'}</div></div>
  <div class="field"><label>Study date</label><div class="val">${form.studyDate || '—'}</div></div>
  <div class="field"><label>AHI (events/h)</label><div class="val">${form.ahi || '—'}</div></div>
  <div class="field"><label>O₂ saturation nadir</label><div class="val">${form.o2Nadir ? form.o2Nadir + '%' : '—'}</div></div>
  <div class="field"><label>Epworth score</label><div class="val">${form.ess ? form.ess + '/24' : '—'}</div></div>
</div>

<div class="section-head">Diagnosis</div>
<div class="dx-grid" style="margin-bottom:12px">
${DX_LIST.map(d => `  <div class="dx-item ${form[d.key] ? 'checked' : ''}">
    <div class="box">${form[d.key] ? '✓' : ''}</div>
    <span>${d.label}${d.code !== '—' ? ` <span style="color:#6b7280">[${d.code} ICD-10]</span>` : ''}</span>
  </div>`).join('\n')}
</div>

${form.comments ? `<div class="section-head">Recommendation / Comments</div>
<div class="comments-box">${form.comments}</div>` : ''}

<div class="attestation">
  <div class="att-text">
    I, the undersigned medical practitioner, certify that the equipment ordered above is medically necessary for the treatment of the above-named patient.
    The clinical information provided is accurate and complete. This order is consistent with current clinical guidelines and the patient's documented clinical need.
    I accept responsibility for ongoing monitoring and review of this therapy.
  </div>
  <div class="sig-grid">
    <div>
      <div class="sig-line"></div>
      <div class="sig-label">Physician signature</div>
    </div>
    <div>
      <div class="sig-value">${form.orderingPhysician}</div>
      <div class="sig-line" style="margin-top:2px"></div>
      <div class="sig-label">Name &amp; qualifications</div>
    </div>
    <div>
      <div class="sig-value">${form.orderingDate}</div>
      <div class="sig-line" style="margin-top:2px"></div>
      <div class="sig-label">Date</div>
    </div>
  </div>
  ${form.physicianNpi || form.physicianPhone ? `<div style="display:flex;gap:28px;margin-top:10px;font-size:10px;color:#374151">
    ${form.physicianNpi ? `<span><b>Provider No.:</b> ${form.physicianNpi}</span>` : ''}
    ${form.physicianPhone ? `<span><b>Phone:</b> ${form.physicianPhone}</span>` : ''}
  </div>` : ''}
</div>

<div class="transmit-box">
  <b>Transmission record</b><br/>
  ${form.dmeProvider ? `To: ${form.dmeProvider}` : 'DME provider not specified'}
  ${provInfo.fax || form.dmeProviderFax ? ` · Fax: ${form.dmeProviderFax || provInfo.fax}` : ''}
  ${provInfo.email || form.dmeProviderEmail ? ` · Email: ${form.dmeProviderEmail || provInfo.email}` : ''}
  &nbsp;· Generated ${dateStr} by ${user?.name ?? 'Nexus 360'}
</div>

<div class="footer">
  <span>${site?.name ?? 'Sleep Disorders Service'} · NATA-15847 · ${patient.mrn}</span>
  <span>DME Order · Generated ${dateStr} · Page 1 of 1</span>
</div>
</body></html>`;
}
