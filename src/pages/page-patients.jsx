import React, { useState, useMemo } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar, Tabs, Drawer } from '../components';
import NexusGrid from '../nexus-grid';
import { useLocation } from '../LocationContext';
import { useTaskContext } from '../TaskContext';
import { useAuth } from '../AuthContext';
import { useNexusData } from '../NexusDataContext';
import { DME_PROVIDERS, DX_LIST, initDxFromDiagnoses, generateOrderHtml } from '../dme-order';
import PatientFormSendModal from '../patient-form-send-modal';
import { RecordViewer } from '../form-filler';
import { fetchPatientFormLinks, fetchPatients, createPatient, updatePatient, sendPortalInvite, fetchPortalAccount } from '../api';

// ─── helpers ──────────────────────────────────────────────────────────────────

export const ageFromDob = (dob) => {
  const today = new Date();
  const b = new Date(dob);
  let age = today.getFullYear() - b.getFullYear();
  if (today < new Date(today.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
};

export const studyStatusKind = (status) =>
  status === 'Final' ? 'good'
  : status === 'Awaiting sign-off' ? 'warn'
  : status === 'Preliminary' ? 'info'
  : 'outline';

// ─── seed data ────────────────────────────────────────────────────────────────

const BLANK_CONTACT = { phone: '', email: '', address: { line1: '', line2: '', suburb: '', state: 'VIC', postcode: '' }, emergencyContact: { name: '', relationship: '', phone: '' } };

export const SEED_PATIENTS = [
  // Matches study PSG-2026-0441 (Awaiting sign-off, Dr. R. Okafor)
  {
    id: 'PAT-001', initials: 'RK', name: 'R. Kingston', dob: '1974-06-12', age: ageFromDob('1974-06-12'), sex: 'M',
    mrn: 'MRN-4412', site: 'Riverside Main Lab',
    referrer: 'Dr. H. Williams (GP)', physician: 'Dr. R. Okafor',
    diagnoses: ['Severe OSA (AHI 42.3/h)', 'Hypertension', 'Type 2 DM'],
    status: 'active',
    treatment: {
      type: 'CPAP', provider: 'resmed', device: 'ResMed AirSense 11 AutoSet',
      serial: 'RS-24-7734821', startDate: '2024-09-12',
      prescription: { mode: 'APAP', pMin: 8, pMax: 12, mask: 'ResMed AirFit F20 (Full face)', humidifier: 'Auto' },
    },
    nextReview: '2026-07-20',
    studies: ['PSG-2024-018', 'PSG-2026-0441'],
    alerts: ['Compliance 61% — below 70% Medicare threshold'],
    compliance: { rate: 61, meanUsage: 4.1, meanAhi: 3.2, p90Pressure: 10.4, meanLeak: 12, lastSync: '2026-05-15' },
    contact: { phone: '0412 345 678', email: 'r.kingston@email.com.au', address: { line1: '42 Riverside Drive', line2: '', suburb: 'Richmond', state: 'VIC', postcode: '3121' }, emergencyContact: { name: 'Jane Kingston', relationship: 'Spouse', phone: '0409 876 543' } },
  },
  // Matches study PSG-2026-0440 (Awaiting sign-off, SLA critical, Dr. R. Okafor)
  {
    id: 'PAT-002', initials: 'TN', name: 'T. Nguyen', dob: '1989-09-03', age: ageFromDob('1989-09-03'), sex: 'M',
    mrn: 'MRN-4387', site: 'Riverside Main Lab',
    referrer: 'Dr. K. Cheng (Cardiologist)', physician: 'Dr. R. Okafor',
    diagnoses: ['Moderate OSA (AHI 18.7/h)', 'Obesity BMI 33.2'],
    status: 'active',
    treatment: {
      type: 'CPAP', provider: 'resmed', device: 'ResMed AirSense 11 AutoSet',
      serial: 'RS-24-8821034', startDate: '2025-02-03',
      prescription: { mode: 'APAP', pMin: 6, pMax: 10, mask: 'ResMed AirFit N30i (Nasal cradle)', humidifier: 'Auto' },
    },
    nextReview: '2026-08-03',
    studies: ['PSG-2025-003', 'PSG-2026-0440'],
    alerts: [],
    compliance: { rate: 89, meanUsage: 6.8, meanAhi: 1.4, p90Pressure: 8.8, meanLeak: 6, lastSync: '2026-05-15' },
    contact: { phone: '0421 987 654', email: 't.nguyen@gmail.com', address: { line1: '8 St Kilda Road', line2: 'Apt 14', suburb: 'St Kilda', state: 'VIC', postcode: '3182' }, emergencyContact: { name: 'Linh Nguyen', relationship: 'Spouse', phone: '0418 234 567' } },
  },
  // Matches study PSG-2026-0438 (Preliminary, Split-night PSG/CPAP, Dr. R. Okafor)
  {
    id: 'PAT-003', initials: 'DM', name: 'D. Mitchell', dob: '1955-04-08', age: ageFromDob('1955-04-08'), sex: 'M',
    mrn: 'MRN-4301', site: 'Riverside Main Lab',
    referrer: 'Dr. P. Nguyen (Cardiologist)', physician: 'Dr. R. Okafor',
    diagnoses: ['Severe OSA (AHI 58.1/h)', 'Atrial fibrillation', 'CHF (EF 45%)'],
    status: 'active',
    treatment: {
      type: 'BiPAP', provider: 'philips', device: 'Philips DreamStation 2 Auto BiPAP',
      serial: 'PH-23-5512789', startDate: '2023-05-18',
      prescription: { mode: 'Auto BiPAP', ipap: 14, epap: 8, mask: 'Philips DreamWear Full Face', humidifier: 'Heated tube' },
    },
    nextReview: '2026-06-18',
    studies: ['PSG-2023-041', 'PSG-2023-055', 'PSG-2026-0438'],
    alerts: ['Review date approaching — 33 days'],
    compliance: { rate: 94, meanUsage: 7.2, meanAhi: 2.8, p90Pressure: null, meanLeak: 9, lastSync: '2026-05-14' },
    contact: { phone: '0435 111 222', email: 'd.mitchell@outlook.com', address: { line1: '17 Hawthorn Street', line2: '', suburb: 'Hawthorn', state: 'VIC', postcode: '3122' }, emergencyContact: { name: 'Carol Mitchell', relationship: 'Spouse', phone: '0407 333 444' } },
  },
  // Matches study PSG-2026-0439 (Scoring, Paediatric PSG, Dr. L. Hartono)
  {
    id: 'PAT-004', initials: 'LW', name: 'L. Walsh', dob: '2012-02-14', age: ageFromDob('2012-02-14'), sex: 'F',
    mrn: 'MRN-4455', site: 'Eastside Paediatric Lab',
    referrer: 'Dr. M. Fisher (Paediatric ENT)', physician: 'Dr. L. Hartono',
    diagnoses: ['Paediatric OSA — post-adenotonsillectomy monitoring'],
    status: 'monitoring',
    treatment: null,
    nextReview: '2026-09-10',
    studies: ['PSG-2026-0439'],
    alerts: [],
    compliance: null,
    contact: { phone: '0398 654 321', email: 'walsh.family@iinet.net.au', address: { line1: '5 Doncaster Road', line2: '', suburb: 'Doncaster', state: 'VIC', postcode: '3108' }, emergencyContact: { name: 'Mark Walsh', relationship: 'Parent', phone: '0412 654 321' } },
  },
  // Matches study MSLT-2026-0031 (Awaiting sign-off, MSLT, Dr. R. Okafor)
  {
    id: 'PAT-005', initials: 'SC', name: 'S. Carter', dob: '1998-07-17', age: ageFromDob('1998-07-17'), sex: 'F',
    mrn: 'MRN-4398', site: 'Riverside Main Lab',
    referrer: 'Dr. J. Park (Neurologist)', physician: 'Dr. R. Okafor',
    diagnoses: ['Narcolepsy Type 1 (CSF hypocretin <110 pg/mL)', 'Cataplexy confirmed'],
    status: 'active',
    treatment: {
      type: 'Medication', provider: null, device: null, serial: null, startDate: '2025-06-01',
      prescription: { mode: 'Modafinil 200mg mane + Sodium oxybate 4.5g nocte', mask: null },
    },
    nextReview: '2026-07-01',
    studies: ['PSG-2025-008', 'MSLT-2026-0031'],
    alerts: [],
    compliance: null,
    contact: { phone: '0447 222 333', email: 's.carter@student.unimelb.edu.au', address: { line1: '33 Johnston Street', line2: 'Unit 7', suburb: 'Fitzroy', state: 'VIC', postcode: '3065' }, emergencyContact: { name: 'Helen Carter', relationship: 'Mother', phone: '0388 445 566' } },
  },
  // Matches study HSAT-2026-0218 (Scoring, Type 3 HSAT, Dr. F. Liu, Home Service)
  {
    id: 'PAT-006', initials: 'PB', name: 'P. Brown', dob: '1968-11-22', age: ageFromDob('1968-11-22'), sex: 'F',
    mrn: 'MRN-4471', site: 'Home Service – North',
    referrer: 'Dr. S. Adams (GP)', physician: 'Dr. F. Liu',
    diagnoses: ['Suspected OSA (Epworth 16/24)', 'Hypothyroidism', 'Obesity BMI 31.4'],
    status: 'awaiting-study',
    treatment: null,
    nextReview: null,
    studies: ['HSAT-2026-0218'],
    alerts: ['HSAT-2026-0218 in scoring — report pending'],
    compliance: null,
    contact: { phone: '0393 887 766', email: 'patricia.brown@bigpond.com', address: { line1: '102 Brunswick Road', line2: '', suburb: 'Brunswick', state: 'VIC', postcode: '3056' }, emergencyContact: { name: 'Gary Brown', relationship: 'Spouse', phone: '0414 556 677' } },
  },
  // Matches study PSG-2026-0437 (Final, signed Dr. F. Liu, 7 days)
  {
    id: 'PAT-007', initials: 'AP', name: 'A. Park', dob: '1971-01-29', age: ageFromDob('1971-01-29'), sex: 'M',
    mrn: 'MRN-4329', site: 'Eastside Paediatric Lab',
    referrer: 'Dr. K. Cheng (Cardiologist)', physician: 'Dr. F. Liu',
    diagnoses: ['Severe OSA (AHI 37.8/h)', 'Hypertension', 'Obesity BMI 34.1'],
    status: 'active',
    treatment: {
      type: 'CPAP', provider: 'fp', device: 'Fisher & Paykel SleepStyle 650',
      serial: 'FP-26-3301122', startDate: '2026-04-28',
      prescription: { mode: 'APAP', pMin: 7, pMax: 14, mask: 'F&P Evora Full Face', humidifier: 'Integrated' },
    },
    nextReview: '2026-10-28',
    studies: ['PSG-2026-0437'],
    alerts: [],
    compliance: { rate: 72, meanUsage: 5.1, meanAhi: 4.8, p90Pressure: 11.2, meanLeak: 18, lastSync: '2026-05-13' },
    contact: { phone: '0398 123 456', email: 'a.park@kew.net.au', address: { line1: '29 Cotham Road', line2: '', suburb: 'Kew', state: 'VIC', postcode: '3101' }, emergencyContact: { name: 'Susan Park', relationship: 'Spouse', phone: '0402 789 012' } },
  },
  // Matches study HSAT-2026-0217 (Final, Type 2 HSAT, signed Dr. F. Liu, Home Service)
  {
    id: 'PAT-008', initials: 'MT', name: 'M. Torres', dob: '1983-05-15', age: ageFromDob('1983-05-15'), sex: 'F',
    mrn: 'MRN-4489', site: 'Home Service – North',
    referrer: 'Dr. T. Brown (GP)', physician: 'Dr. F. Liu',
    diagnoses: ['Moderate OSA (AHI 22.4/h) — confirmed HSAT-2026-0217', 'Excessive daytime sleepiness (ESS 14/24)'],
    status: 'active',
    treatment: null,
    nextReview: '2026-08-20',
    studies: ['HSAT-2026-0217'],
    alerts: ['CPAP prescription pending — report signed 09 May 2026'],
    compliance: null,
    contact: { phone: '0411 765 432', email: 'maria.torres@hotmail.com', address: { line1: '14 Murray Road', line2: 'Unit 3', suburb: 'Preston', state: 'VIC', postcode: '3072' }, emergencyContact: { name: 'Carlos Torres', relationship: 'Spouse', phone: '0423 876 543' } },
  },
];

const CPAP_PROVIDERS = {
  resmed:  { label: 'ResMed AirView',              color: '#2563eb', connected: true,  lastSync: '2026-05-15 07:12', patients: 3 },
  philips: { label: 'Philips EncoreAnywhere',       color: '#7c3aed', connected: true,  lastSync: '2026-05-14 06:44', patients: 1 },
  fp:      { label: 'Fisher & Paykel myAir',        color: '#0891b2', connected: false, lastSync: null,               patients: 1 },
  lowenstein: { label: 'Löwenstein prismaLAB',      color: '#065f46', connected: false, lastSync: null,               patients: 0 },
};


// ─── DME order modal ──────────────────────────────────────────────────────────

function DmeOrderModal({ patient, site, user, onClose }) {
  const initForm = () => {
    const t = patient.treatment;
    const rx = t?.prescription ?? {};
    return {
      stat: false,
      includeLogo: true,
      dmeProvider: DME_PROVIDERS[0].name,
      dmeProviderFax: DME_PROVIDERS[0].fax,
      dmeProviderEmail: DME_PROVIDERS[0].email,
      orderType: 'New',
      lengthOfNeed: 'Indefinite',
      numMonths: '',
      orderingPhysician: patient.physician,
      followUpPhysician: '',
      orderingDate: new Date().toLocaleDateString('en-AU'),
      physicianNpi: 'MED-24891',
      physicianPhone: '02 9555 0100',
      equipmentType: t?.type === 'BiPAP' ? 'BiPAP' : t?.type === 'ASV' ? 'ASV' : 'CPAP',
      pressureMode: rx.mode ?? 'APAP',
      pMin: rx.pMin ?? '',
      pMax: rx.pMax ?? '',
      ipap: rx.ipap ?? '',
      epap: rx.epap ?? '',
      ipapMax: rx.ipapMax ?? '',
      humidifier: rx.humidifier != null,
      mask: rx.mask ?? '',
      studyType: patient.studies[0]?.startsWith('HSAT') ? 'HSAT' : patient.studies[0]?.startsWith('MSLT') ? 'MSLT' : patient.studies[0] ? 'PSG' : 'PSG',
      studyDate: '',
      ahi: '',
      o2Nadir: '',
      ess: '',
      comments: '',
      ...initDxFromDiagnoses(patient.diagnoses),
    };
  };

  const [form, setForm] = useState(initForm);
  const [step, setStep] = useState('form');
  const [txEmail, setTxEmail] = useState(DME_PROVIDERS[0].email);
  const [txFax, setTxFax] = useState(DME_PROVIDERS[0].fax);
  const [txNote, setTxNote] = useState('');

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === 'dmeProvider') {
      const prov = DME_PROVIDERS.find(p => p.name === v) ?? {};
      next.dmeProviderFax = prov.fax ?? '';
      next.dmeProviderEmail = prov.email ?? '';
      setTxFax(prov.fax ?? '');
      setTxEmail(prov.email ?? '');
    }
    return next;
  });

  const openPreview = () => {
    const html = generateOrderHtml(form, patient, site, user);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `DME-Order-${patient.mrn}-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const iL = { display: 'flex', flexDirection: 'column', gap: 4 };
  const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const inp = { fontSize: 13, padding: '7px 10px' };
  const sHead = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-3)', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 80, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '4vh', left: '50%', transform: 'translateX(-50%)',
        width: 780, maxWidth: 'calc(100vw - 32px)', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface)', borderRadius: 14,
        boxShadow: '0 16px 64px rgba(0,0,0,0.28)', border: '1px solid var(--border)',
        zIndex: 81, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="paper" size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>DME Treatment Order</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
              {patient.name} &middot; {patient.mrn} &middot; {patient.age}y {patient.sex === 'M' ? 'Male' : 'Female'}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: form.stat ? '#dc2626' : 'var(--ink-3)' }}>
            <input type="checkbox" checked={form.stat} onChange={e => set('stat', e.target.checked)} />
            ⚡ STAT urgent
          </label>
          <button className="btn-icon" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {[['form', '1. Order details'], ['transmit', '2. Transmit to DME']].map(([s, label]) => (
            <div key={s} style={{
              flex: 1, padding: '9px 0', textAlign: 'center', fontSize: 12, fontWeight: 500,
              color: step === s ? 'var(--accent-ink)' : 'var(--ink-3)',
              borderBottom: step === s ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: step === 'transmit' && s === 'form' ? 'pointer' : 'default',
            }} onClick={() => { if (step === 'transmit' && s === 'form') setStep('form'); }}>
              {label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

          {/* ══ STEP 1: Form ══ */}
          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Order information */}
              <section>
                <div style={sHead}>Order information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={iL}>
                    <span style={lbl}>DME provider</span>
                    <select className="input" style={inp} value={form.dmeProvider} onChange={e => set('dmeProvider', e.target.value)}>
                      {DME_PROVIDERS.map(p => <option key={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Provider fax</span>
                    <input className="input" style={inp} value={form.dmeProviderFax} onChange={e => set('dmeProviderFax', e.target.value)} placeholder="02 xxxx xxxx" />
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Provider email</span>
                    <input className="input" style={inp} value={form.dmeProviderEmail} onChange={e => set('dmeProviderEmail', e.target.value)} placeholder="orders@…" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={iL}>
                    <span style={lbl}>Order type</span>
                    <select className="input" style={inp} value={form.orderType} onChange={e => set('orderType', e.target.value)}>
                      {['New', 'Renewal', 'Replacement', 'Upgrade'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Length of need</span>
                    <select className="input" style={inp} value={form.lengthOfNeed} onChange={e => set('lengthOfNeed', e.target.value)}>
                      {['Indefinite', '12 months', '24 months', 'Other'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Ordering physician</span>
                    <input className="input" style={inp} value={form.orderingPhysician} onChange={e => set('orderingPhysician', e.target.value)} />
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Order date</span>
                    <input className="input" style={inp} value={form.orderingDate} onChange={e => set('orderingDate', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={iL}>
                    <span style={lbl}>Provider No. (Medicare)</span>
                    <input className="input" style={inp} value={form.physicianNpi} onChange={e => set('physicianNpi', e.target.value)} placeholder="MED-XXXXX" />
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Practice phone</span>
                    <input className="input" style={inp} value={form.physicianPhone} onChange={e => set('physicianPhone', e.target.value)} />
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Follow-up physician</span>
                    <input className="input" style={inp} value={form.followUpPhysician} onChange={e => set('followUpPhysician', e.target.value)} placeholder="If different from ordering" />
                  </div>
                </div>
              </section>

              {/* Equipment prescription */}
              <section>
                <div style={sHead}>Equipment prescription</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={iL}>
                    <span style={lbl}>Equipment type</span>
                    <select className="input" style={inp} value={form.equipmentType} onChange={e => set('equipmentType', e.target.value)}>
                      {['CPAP', 'BiPAP', 'ASV', 'Oxygen concentrator', 'Nebuliser', 'Other'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  {form.equipmentType === 'CPAP' && (
                    <>
                      <div style={iL}>
                        <span style={lbl}>Pressure mode</span>
                        <select className="input" style={inp} value={form.pressureMode} onChange={e => set('pressureMode', e.target.value)}>
                          {['APAP', 'Fixed CPAP', 'Auto CPAP'].map(v => <option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={iL}>
                          <span style={lbl}>Min (cmH₂O)</span>
                          <input className="input" style={inp} type="number" min={4} max={20} step={0.5} value={form.pMin} onChange={e => set('pMin', e.target.value)} />
                        </div>
                        <div style={iL}>
                          <span style={lbl}>Max (cmH₂O)</span>
                          <input className="input" style={inp} type="number" min={4} max={20} step={0.5} value={form.pMax} onChange={e => set('pMax', e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}
                  {form.equipmentType === 'BiPAP' && (
                    <>
                      <div style={iL}>
                        <span style={lbl}>Pressure mode</span>
                        <select className="input" style={inp} value={form.pressureMode} onChange={e => set('pressureMode', e.target.value)}>
                          {['Auto BiPAP', 'Fixed BiPAP', 'BiPAP-ST'].map(v => <option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={iL}>
                          <span style={lbl}>IPAP (cmH₂O)</span>
                          <input className="input" style={inp} type="number" min={4} max={30} step={0.5} value={form.ipap} onChange={e => set('ipap', e.target.value)} />
                        </div>
                        <div style={iL}>
                          <span style={lbl}>EPAP (cmH₂O)</span>
                          <input className="input" style={inp} type="number" min={4} max={20} step={0.5} value={form.epap} onChange={e => set('epap', e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}
                  {form.equipmentType === 'ASV' && (
                    <>
                      <div style={iL}>
                        <span style={lbl}>EPAP (cmH₂O)</span>
                        <input className="input" style={inp} type="number" min={4} max={20} step={0.5} value={form.epap} onChange={e => set('epap', e.target.value)} />
                      </div>
                      <div style={iL}>
                        <span style={lbl}>IPAP max (cmH₂O)</span>
                        <input className="input" style={inp} type="number" min={8} max={30} step={0.5} value={form.ipapMax} onChange={e => set('ipapMax', e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div style={iL}>
                    <span style={lbl}>Mask / interface</span>
                    <input className="input" style={inp} value={form.mask} onChange={e => set('mask', e.target.value)} placeholder="e.g. ResMed AirFit F20 Full Face" />
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Humidifier</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={form.humidifier} onChange={e => set('humidifier', e.target.checked)} />
                      Heated humidifier required
                    </label>
                  </div>
                </div>
              </section>

              {/* Clinical evidence */}
              <section>
                <div style={sHead}>Clinical evidence</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  <div style={iL}>
                    <span style={lbl}>Study type</span>
                    <select className="input" style={inp} value={form.studyType} onChange={e => set('studyType', e.target.value)}>
                      {['PSG', 'HSAT', 'MSLT', 'Titration PSG', 'CPAP trial', 'Other'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Study date</span>
                    <input className="input" style={inp} type="date" value={form.studyDate} onChange={e => set('studyDate', e.target.value)} />
                  </div>
                  <div style={iL}>
                    <span style={lbl}>AHI (events/h)</span>
                    <input className="input" style={inp} type="number" min={0} step={0.1} value={form.ahi} onChange={e => set('ahi', e.target.value)} />
                  </div>
                  <div style={iL}>
                    <span style={lbl}>O₂ nadir (%)</span>
                    <input className="input" style={inp} type="number" min={50} max={100} value={form.o2Nadir} onChange={e => set('o2Nadir', e.target.value)} />
                  </div>
                  <div style={iL}>
                    <span style={lbl}>Epworth (ESS)</span>
                    <input className="input" style={inp} type="number" min={0} max={24} value={form.ess} onChange={e => set('ess', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Diagnosis */}
              <section>
                <div style={sHead}>Diagnosis (ICD-10)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  {DX_LIST.map(d => (
                    <label key={d.key} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                      cursor: 'pointer', fontSize: 12,
                      background: form[d.key] ? 'var(--accent-soft)' : 'transparent',
                      color: form[d.key] ? 'var(--accent-ink)' : 'var(--ink-2)',
                    }}>
                      <input type="checkbox" checked={!!form[d.key]} onChange={e => set(d.key, e.target.checked)} />
                      <span style={{ flex: 1 }}>{d.label}</span>
                      {d.code !== '—' && <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'monospace' }}>{d.code}</span>}
                    </label>
                  ))}
                </div>
              </section>

              {/* Comments */}
              <section>
                <div style={sHead}>Recommendation / comments</div>
                <textarea className="input" style={{ ...inp, resize: 'vertical', minHeight: 68, fontFamily: 'inherit', lineHeight: 1.5, width: '100%' }}
                  value={form.comments} onChange={e => set('comments', e.target.value)}
                  placeholder="Additional clinical notes or instructions for the DME provider…" />
              </section>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.includeLogo} onChange={e => set('includeLogo', e.target.checked)} />
                Include practice name and NATA accreditation number on printed form
              </label>
            </div>
          )}

          {/* ══ STEP 2: Transmit ══ */}
          {step === 'transmit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Order summary */}
              <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Order summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px', fontSize: 12 }}>
                  {[
                    ['Patient', `${patient.name} (${patient.mrn})`],
                    ['DME provider', form.dmeProvider],
                    ['Order type', `${form.orderType} — ${form.lengthOfNeed}`],
                    ['Equipment', `${form.equipmentType}${form.pressureMode ? ' · ' + form.pressureMode : ''}`],
                    ['Ordering physician', form.orderingPhysician],
                    ['Order date', form.orderingDate],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ color: 'var(--ink-3)', minWidth: 120, flexShrink: 0 }}>{l}</span>
                      <span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {txNote && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                  <Icon name="check" size={15} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#15803d' }}>{txNote}</span>
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginTop: 2 }}>Transmission options</div>

              {/* Print / Download */}
              <div style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="download" size={16} style={{ color: 'var(--ink-2)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Print or download PDF</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Opens the completed order form in a new tab — print or save as PDF from your browser</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => { openPreview(); setTxNote('Order opened in browser — print or save as PDF.'); }}>
                    <Icon name="download" size={13} />Open &amp; print
                  </button>
                </div>
              </div>

              {/* Email */}
              <div style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="send" size={15} style={{ color: 'var(--ink-2)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Send via email</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" style={{ fontSize: 13, padding: '6px 10px', flex: 1 }}
                        type="email" value={txEmail} onChange={e => setTxEmail(e.target.value)}
                        placeholder="orders@dme-provider.com.au" />
                      <button className="btn btn-primary" disabled={!txEmail}
                        onClick={() => setTxNote(`Order queued to ${txEmail}. Email integration required — configure in Settings → Integrations.`)}>
                        <Icon name="send" size={13} />Send
                      </button>
                    </div>
                    {form.dmeProviderEmail && (
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>Suggested: {form.dmeProviderEmail}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fax */}
              <div style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="paper" size={15} style={{ color: 'var(--ink-2)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Send via fax</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" style={{ fontSize: 13, padding: '6px 10px', flex: 1 }}
                        type="tel" value={txFax} onChange={e => setTxFax(e.target.value)}
                        placeholder={form.dmeProviderFax || 'Fax number'} />
                      <button className="btn" disabled={!txFax}
                        onClick={() => setTxNote(`Fax transmission queued to ${txFax}. Fax server integration required — configure in Settings → Integrations.`)}>
                        Send fax
                      </button>
                    </div>
                    {form.dmeProviderFax && (
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>Provider fax: {form.dmeProviderFax}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Electronic — future */}
              <div style={{ padding: '14px 16px', border: '1px dashed var(--border)', borderRadius: 10, opacity: 0.65 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="wifi" size={15} style={{ color: 'var(--ink-3)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Electronic submission</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      Direct API submission to DME provider portal — requires provider integration setup in Settings &rarr; Integrations.
                    </div>
                  </div>
                  <Pill kind="outline">Coming soon</Pill>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0, background: 'var(--surface)' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          {step === 'form' ? (
            <>
              <button className="btn" onClick={openPreview}>
                <Icon name="eye" size={13} />Preview order
              </button>
              <button className="btn btn-primary" onClick={() => setStep('transmit')}>
                Next: Transmit &rarr;
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── deterministic daily compliance data ──────────────────────────────────────

function dailyData(patientId, rate, meanUsage) {
  const seed = patientId.split('').reduce((s, c, i) => s + c.charCodeAt(0) * (i + 1), 0);
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (29 - i));
    const r1 = ((seed * (i * 6364136223846793005n + 1442695040888963407n)) & 0xffffffffn) / 0xffffffffn;
    const r = Number(r1 < 0n ? -r1 : r1) / 0xffffffff;
    const used = r < rate / 100;
    const usage = used ? Math.max(0.3, meanUsage + (r * 4 - 2)) : 0;
    const ahi = used ? Math.max(0.3, 2.5 + (r * 4 - 2)) : null;
    return { date: d.toISOString().slice(0, 10), usage: used ? +usage.toFixed(1) : 0, ahi: ahi ? +ahi.toFixed(1) : null };
  });
}

// Fall back to simple deterministic approach if BigInt has issues
function makeDailyData(patientId, rate, meanUsage) {
  const seed = patientId.split('').reduce((s, c, i) => s + c.charCodeAt(0) * (i + 1), 0);
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (29 - i));
    const r = Math.abs(Math.sin(seed * (i + 1) * 0.31 + i * 0.77));
    const used = r < rate / 100;
    const usage = used ? Math.max(0.3, meanUsage + (r * 3 - 1.5)) : 0;
    const ahi = used ? Math.max(0.3, 2 + (r * 4 - 2)) : null;
    return { date: d.toISOString().slice(0, 10), usage: used ? +usage.toFixed(1) : 0, ahi: ahi ? +ahi.toFixed(1) : null };
  });
}

// ─── sub-components ────────────────────────────────────────────────────────────

function ComplianceBar({ patientId, rate, meanUsage }) {
  const data = useMemo(() => makeDailyData(patientId, rate, meanUsage), [patientId, rate, meanUsage]);
  const maxH = 36, thresholdPct = 4 / 8;
  return (
    <div style={{ position: 'relative', height: maxH + 4, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      {/* 4h threshold line */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: thresholdPct * maxH, borderTop: '1px dashed rgba(0,0,0,0.15)', zIndex: 1, pointerEvents: 'none' }} />
      {data.map((d, i) => {
        const h = d.usage > 0 ? Math.max(3, (Math.min(d.usage, 8) / 8) * maxH) : 2;
        const color = d.usage === 0 ? 'var(--surface-3)' : d.usage >= 4 ? '#16a34a' : d.usage >= 2 ? '#ca8a04' : '#dc2626';
        return (
          <div key={i} title={`${d.date}: ${d.usage > 0 ? d.usage + 'h' : 'No use'}${d.ahi ? ', AHI ' + d.ahi : ''}`}
            style={{ width: 4, height: h, background: color, borderRadius: 1, flexShrink: 0, cursor: 'default' }} />
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: ['good', 'Active'], monitoring: ['info', 'Monitoring'],
    'awaiting-study': ['outline', 'Awaiting study'], inactive: ['outline', 'Inactive'],
  };
  const [kind, label] = map[status] ?? ['outline', status];
  return <Pill kind={kind}>{label}</Pill>;
}

function TreatmentBadge({ treatment }) {
  if (!treatment) return <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>—</span>;
  const colors = { CPAP: 'info', BiPAP: 'info', ASV: 'info', Medication: 'outline' };
  return <Pill kind={colors[treatment.type] ?? 'outline'}>{treatment.type}</Pill>;
}

function CompliancePill({ rate }) {
  if (rate == null) return <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>—</span>;
  const kind = rate >= 70 ? 'good' : rate >= 50 ? 'warn' : 'bad';
  return <Pill kind={kind}>{rate}%</Pill>;
}

// ─── add patient modal ────────────────────────────────────────────────────────

const BLANK_PATIENT = {
  name: '', initials: '', dob: '', sex: 'M', mrn: '', site: '',
  referrer: '', physician: '', status: 'active',
};

function AddPatientModal({ onClose, onAdd, sites = [] }) {
  const [form, setForm] = useState(BLANK_PATIENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.name.trim() && form.dob && form.mrn.trim();

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const saved = await createPatient({
        name: form.name.trim(),
        initials: form.initials.trim(),
        dob: form.dob,
        sex: form.sex,
        mrn: form.mrn.trim(),
        site: form.site,
        referrer: form.referrer.trim(),
        physician: form.physician.trim(),
        status: form.status,
        nextReview: '',
        contact: { ...BLANK_CONTACT },
        diagnoses: [], studies: [], alerts: [],
        treatment: null, compliance: null,
      });
      saved.age = ageFromDob(saved.dob);
      onAdd(saved);
      onClose();
    } catch (e) {
      setError(e.message ?? 'Failed to save patient');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="doc-viewer-overlay" onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="drawer-head" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Patients</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Add patient</div>
          </div>
          <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        <div className="drawer-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-row">
            <div className="form-field" style={{ flex: 2 }}>
              <label className="form-label">Full name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. J. Smith" autoFocus />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Initials</label>
              <input className="form-input" value={form.initials} onChange={e => set('initials', e.target.value)} placeholder="Auto" maxLength={4} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Date of birth *</label>
              <input className="form-input" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Sex</label>
              <select className="form-input" value={form.sex} onChange={e => set('sex', e.target.value)}>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">MRN *</label>
              <input className="form-input" value={form.mrn} onChange={e => set('mrn', e.target.value)} placeholder="MRN-0000" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Site</label>
              <select className="form-input" value={form.site} onChange={e => set('site', e.target.value)}>
                <option value="">— select —</option>
                {sites.map(s => <option key={s.code ?? s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Referring clinician</label>
            <input className="form-input" value={form.referrer} onChange={e => set('referrer', e.target.value)} placeholder="e.g. Dr. A. Brown (GP)" />
          </div>

          <div className="form-field">
            <label className="form-label">Physician</label>
            <input className="form-input" value={form.physician} onChange={e => set('physician', e.target.value)} placeholder="e.g. Dr. R. Okafor" />
          </div>

          {error && <div style={{ fontSize: 12, color: 'var(--bad)', padding: '6px 0' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave || saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Add patient'}
            </button>
            <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── patient detail drawer ─────────────────────────────────────────────────────

function PatientDrawer({ patient, onClose, onCreateTask, onOrderDme, onUpdate, studies = [], openStudy }) {
  const [dtab, setDtab] = useState('overview');
  const [contactEdit, setContactEdit] = useState(false);
  const [contactDraft, setContactDraft] = useState(null);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState('');
  const [formLinks, setFormLinks] = useState(null);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [portalAccount, setPortalAccount] = useState(null);  // null=loading, {exists,status,email}
  const [showPortalInvite, setShowPortalInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteResult, setInviteResult] = useState(null); // null | 'sent' | 'error'
  const [inviteError, setInviteError] = useState('');

  function refreshLinks() {
    setLoadingLinks(true);
    fetchPatientFormLinks(patient.id)
      .then(list => setFormLinks(list ?? []))
      .catch(() => setFormLinks([]))
      .finally(() => setLoadingLinks(false));
  }

  React.useEffect(() => {
    if (dtab !== 'forms' || formLinks !== null) return;
    refreshLinks();
  }, [dtab, patient.id, formLinks]);
  const complianceDays = patient.compliance ? makeDailyData(patient.id, patient.compliance.rate, patient.compliance.meanUsage) : [];
  const provider = patient.treatment?.provider ? CPAP_PROVIDERS[patient.treatment.provider] : null;
  const contact = patient.contact ?? { phone: '', email: '', address: { line1: '', line2: '', suburb: '', state: '', postcode: '' }, emergencyContact: { name: '', relationship: '', phone: '' } };

  function startContactEdit() {
    setContactDraft(JSON.parse(JSON.stringify(contact)));
    setContactEdit(true);
  }
  async function saveContact() {
    setContactSaving(true);
    setContactError('');
    try {
      const updated = await updatePatient(patient.id, { ...patient, contact: contactDraft });
      updated.age = ageFromDob(updated.dob);
      onUpdate?.(updated);
      setContactEdit(false);
    } catch (e) {
      setContactError(e.message ?? 'Failed to save');
    } finally {
      setContactSaving(false);
    }
  }
  function setC(field, val) { setContactDraft(p => ({ ...p, [field]: val })); }
  function setA(field, val) { setContactDraft(p => ({ ...p, address: { ...p.address, [field]: val } })); }
  function setE(field, val) { setContactDraft(p => ({ ...p, emergencyContact: { ...p.emergencyContact, [field]: val } })); }

  React.useEffect(() => {
    fetchPortalAccount(patient.id).then(setPortalAccount).catch(() => setPortalAccount({ exists: false }));
  }, [patient.id]);

  function openPortalInvite() {
    setInviteEmail(patient.contact?.email ?? '');
    setInviteResult(null);
    setInviteError('');
    setShowPortalInvite(true);
  }

  async function handleSendInvite(e) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteSaving(true);
    setInviteError('');
    try {
      const res = await sendPortalInvite(patient.id, inviteEmail);
      if (res?.emailError) {
        setInviteError(`Invite created but email failed: ${res.emailError}`);
        setInviteResult('error');
      } else {
        setInviteResult('sent');
      }
      fetchPortalAccount(patient.id).then(setPortalAccount).catch(() => {});
    } catch (err) {
      setInviteError(err.message ?? 'Failed to send invite');
      setInviteResult('error');
    } finally {
      setInviteSaving(false);
    }
  }

  return (
    <>
      <div className="drawer-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={patient.initials} size={36} idx={parseInt(patient.id.slice(-1))} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{patient.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              MRN {patient.mrn} · {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex} · Age {patient.age}
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <StatusBadge status={patient.status} />
        <button className="btn-icon" onClick={onClose}><Icon name="x" size={16} /></button>
      </div>

      {patient.alerts.length > 0 && (
        <div style={{ margin: '0 0 0 0', padding: '8px 20px', background: '#fef9c3', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Icon name="alert" size={14} style={{ color: '#ca8a04', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: '#854d0e' }}>{patient.alerts.join(' · ')}</div>
        </div>
      )}

      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
        <Tabs value={dtab} onChange={setDtab} tabs={[
          { id: 'overview', label: 'Overview' },
          ...(patient.compliance ? [{ id: 'compliance', label: 'CPAP compliance' }] : []),
          { id: 'studies', label: 'Studies' },
          { id: 'forms', label: 'Forms' },
          { id: 'prescription', label: 'Prescription' },
          { id: 'contact', label: 'Contact' },
        ]} />
      </div>

      <div className="drawer-body">
        {/* ── Overview ── */}
        {dtab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                ['Site', patient.site],
                ['Referring physician', patient.referrer],
                ['Treating physician', patient.physician],
                ['Next review', patient.nextReview ?? '—'],
                ['Date of birth', patient.dob],
                ['Treatment', patient.treatment?.type ?? 'None prescribed'],
              ].map(([l, v]) => (
                <div key={l} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>Diagnoses</div>
              {patient.diagnoses.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <Icon name="activity" size={13} style={{ color: 'var(--accent-ink)', flexShrink: 0 }} />{d}
                </div>
              ))}
            </div>

            <button className="btn" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onCreateTask({ title: `Follow-up: ${patient.name} — ${patient.mrn}`, assignedTo: patient.physician, priority: 'medium' })}>
              <Icon name="plus" size={13} />Create follow-up task
            </button>

            {/* ── Portal access ── */}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPortalInvite ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Patient portal</div>
                  {portalAccount === null
                    ? <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Loading…</div>
                    : portalAccount.exists
                      ? <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: portalAccount.status === 'active' ? '#22c55e' : '#f59e0b', marginRight: 5, verticalAlign: 'middle' }} />
                          {portalAccount.status === 'active' ? 'Active' : 'Invite sent'} · {portalAccount.email}
                        </div>
                      : <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>No portal account</div>
                  }
                </div>
                {!showPortalInvite && (
                  <button className="btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={openPortalInvite}>
                    {portalAccount?.exists ? 'Resend invite' : 'Send invite'}
                  </button>
                )}
              </div>

              {showPortalInvite && (
                inviteResult === 'sent'
                  ? <div style={{ fontSize: 13, color: '#16a34a' }}>
                      Invite sent to <strong>{inviteEmail}</strong>.
                      <button className="btn" style={{ fontSize: 11, marginLeft: 10, padding: '2px 8px' }} onClick={() => setShowPortalInvite(false)}>Done</button>
                    </div>
                  : <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        className="input"
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="patient@email.com"
                        style={{ fontSize: 13 }}
                        required
                        autoFocus
                      />
                      {inviteError && <div style={{ fontSize: 12, color: '#dc2626' }}>{inviteError}</div>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="btn btn-primary" style={{ fontSize: 12, flex: 1 }} disabled={inviteSaving}>
                          {inviteSaving ? 'Sending…' : 'Send invite'}
                        </button>
                        <button type="button" className="btn" style={{ fontSize: 12 }} onClick={() => setShowPortalInvite(false)}>
                          Cancel
                        </button>
                      </div>
                    </form>
              )}
            </div>
          </>
        )}

        {/* ── CPAP Compliance ── */}
        {dtab === 'compliance' && patient.compliance && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { l: 'Compliance rate', v: `${patient.compliance.rate}%`, ok: patient.compliance.rate >= 70, note: '≥70% threshold' },
                { l: 'Mean nightly use', v: `${patient.compliance.meanUsage}h`, ok: patient.compliance.meanUsage >= 4, note: '≥4h target' },
                { l: 'Mean AHI on Rx', v: `${patient.compliance.meanAhi}/h`, ok: patient.compliance.meanAhi < 5, note: '<5 target' },
                { l: 'Mean leak', v: `${patient.compliance.meanLeak} L/min`, ok: patient.compliance.meanLeak < 24, note: '<24 L/min' },
              ].map(({ l, v, ok, note }) => (
                <div key={l} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`, background: ok ? '#f0fdf4' : '#fef2f2' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: ok ? '#15803d' : '#b91c1c', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{v}</div>
                  <div style={{ fontSize: 10, color: ok ? '#16a34a' : '#dc2626', marginTop: 2 }}>{note}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>30-day usage (last 30 nights)</div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--ink-4)' }}>
                  {[['#16a34a', '≥4h'], ['#ca8a04', '2–4h'], ['#dc2626', '<2h'], ['var(--surface-3)', 'No use']].map(([c, l]) => (
                    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 8, height: 8, background: c, borderRadius: 1, flexShrink: 0 }} />{l}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px' }}>
                <ComplianceBar patientId={patient.id} rate={patient.compliance.rate} meanUsage={patient.compliance.meanUsage} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--ink-4)' }}>
                  <span>{complianceDays[0]?.date}</span><span>today</span>
                </div>
              </div>
            </div>

            {provider && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 14 }}>
                <Icon name="wifi" size={14} style={{ color: provider.connected ? 'var(--good)' : 'var(--ink-3)' }} />
                <div style={{ flex: 1, fontSize: 12 }}>
                  <span style={{ fontWeight: 500 }}>{provider.label}</span>
                  <span style={{ color: 'var(--ink-3)', marginLeft: 8 }}>Last sync: {patient.compliance.lastSync}</span>
                </div>
                <Pill kind={provider.connected ? 'good' : 'outline'}>{provider.connected ? 'Connected' : 'Not connected'}</Pill>
              </div>
            )}

            {patient.compliance.rate < 70 && (
              <div className="banner warn" style={{ marginBottom: 14 }}>
                <Icon name="alert" size={16} />
                <div style={{ flex: 1 }}>
                  <strong>Below Medicare compliance threshold.</strong>
                  <div style={{ fontSize: 12, marginTop: 2 }}>Patient requires intervention — consider mask review, pressure adjustment, or education.</div>
                </div>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onCreateTask({ title: `CPAP compliance review — ${patient.name}`, assignedTo: patient.physician, priority: patient.compliance.rate < 70 ? 'high' : 'medium' })}>
              <Icon name="plus" size={13} />Create compliance review task
            </button>
          </>
        )}

        {/* ── Studies ── */}
        {dtab === 'studies' && (
          <div>
            {patient.studies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-3)', fontSize: 13 }}>No studies on file.</div>
            ) : patient.studies.map((sid) => {
              const study = studies.find(x => x.id === sid);
              const isClickable = !!study && !!openStudy;
              return (
                <div key={sid}
                  onClick={isClickable ? () => openStudy(sid) : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: isClickable ? 'pointer' : 'default' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="paper" size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{sid}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{study ? study.type : 'Sleep study'} · {patient.site}</div>
                  </div>
                  {study
                    ? <><Pill kind={studyStatusKind(study.status)}>{study.status}</Pill>{isClickable && <Icon name="chev_right" size={14} />}</>
                    : <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Historical</span>
                  }
                </div>
              );
            })}
            <div style={{ paddingTop: 12 }}>
              <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                <Icon name="plus" size={13} />Request new study
              </button>
            </div>
          </div>
        )}

        {/* ── Contact ── */}
        {dtab === 'contact' && (
          <div>
            {contactEdit ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Contact details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {[['Phone', 'phone', contactDraft.phone], ['Email', 'email', contactDraft.email]].map(([label, field, val]) => (
                    <div key={field} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{label}</span>
                      <input className="input" style={{ fontSize: 13 }} value={val} onChange={e => setC(field, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Address</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {[['Street', 'line1', contactDraft.address.line1], ['Line 2', 'line2', contactDraft.address.line2], ['Suburb', 'suburb', contactDraft.address.suburb]].map(([label, field, val]) => (
                    <div key={field} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{label}</span>
                      <input className="input" style={{ fontSize: 13 }} value={val} onChange={e => setA(field, e.target.value)} />
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>State / PC</span>
                    <input className="input" style={{ fontSize: 13 }} value={contactDraft.address.state} onChange={e => setA('state', e.target.value)} placeholder="State" />
                    <input className="input" style={{ fontSize: 13 }} value={contactDraft.address.postcode} onChange={e => setA('postcode', e.target.value)} placeholder="Postcode" />
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Emergency contact</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {[['Name', 'name', contactDraft.emergencyContact.name], ['Relationship', 'relationship', contactDraft.emergencyContact.relationship], ['Phone', 'phone', contactDraft.emergencyContact.phone]].map(([label, field, val]) => (
                    <div key={field} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{label}</span>
                      <input className="input" style={{ fontSize: 13 }} value={val} onChange={e => setE(field, e.target.value)} />
                    </div>
                  ))}
                </div>

                {contactError && <div style={{ fontSize: 12, color: 'var(--bad)', marginBottom: 6 }}>{contactError}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => setContactEdit(false)} disabled={contactSaving}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveContact} disabled={contactSaving}>
                    <Icon name="check" size={13} />{contactSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                  {[
                    ['Phone', contact.phone || '—'],
                    ['Email', contact.email || '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-3)', minWidth: 100, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>Address</div>
                <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, lineHeight: 1.7, marginBottom: 18 }}>
                  {contact.address?.line1 ? (
                    <>
                      <div>{contact.address.line1}</div>
                      {contact.address.line2 && <div>{contact.address.line2}</div>}
                      <div>{[contact.address.suburb, contact.address.state, contact.address.postcode].filter(Boolean).join(' ')}</div>
                    </>
                  ) : <span style={{ color: 'var(--ink-3)' }}>No address on file</span>}
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>Emergency contact</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                  {[
                    ['Name', contact.emergencyContact?.name || '—'],
                    ['Relationship', contact.emergencyContact?.relationship || '—'],
                    ['Phone', contact.emergencyContact?.phone || '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-3)', minWidth: 100, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>

                <button className="btn" onClick={startContactEdit}><Icon name="edit" size={13} />Edit contact details</button>
              </>
            )}
          </div>
        )}

        {/* ── Forms ── */}
        {dtab === 'forms' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sent forms</div>
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setShowSendModal(true)}>
                <Icon name="plus" size={12} />Send form
              </button>
            </div>
            {loadingLinks && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
            )}
            {!loadingLinks && (!formLinks || formLinks.length === 0) && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-3)', fontSize: 13 }}>No forms sent to this patient yet.</div>
            )}
            {!loadingLinks && formLinks && formLinks.map(link => (
              <div key={link.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.formTitle}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>
                    Sent {link.sentAt ? new Date(link.sentAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    {' · '}{link.method === 'email' ? 'Email' : link.method === 'sms' ? 'SMS' : 'Link'}
                    {' · '}to {link.recipientName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: link.status === 'complete' ? 'var(--good-soft)' : 'var(--warn-soft)',
                      color: link.status === 'complete' ? 'var(--good)' : 'var(--warn)',
                    }}>
                      {link.status === 'complete' ? '✓ Complete' : '○ Pending'}
                    </span>
                    {link.status === 'complete' && link.formRecordId && (
                      <button className="btn" style={{ fontSize: 11 }} onClick={() => setViewRecord({
                        id: link.formRecordId,
                        recordRef: 'REC-' + (link.token ?? '').slice(0, 8).toUpperCase(),
                        period: link.completedAt ? new Date(link.completedAt).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : '',
                        completedBy: link.patientName,
                        completedAt: link.completedAt,
                      })}>
                        <Icon name="eye" size={11} />View results
                      </button>
                    )}
                    {link.status === 'pending' && link.token && (
                      <button className="btn" style={{ fontSize: 11 }} onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}?fill=${link.token}`;
                        const el = document.createElement('input');
                        el.value = url; el.style.cssText = 'position:absolute;opacity:0;top:0;left:0';
                        document.body.appendChild(el); el.focus(); el.select(); el.setSelectionRange(0, 99999);
                        try { document.execCommand('copy'); } catch {}
                        document.body.removeChild(el);
                        navigator.clipboard?.writeText(url).catch(() => {});
                        setCopiedLinkId(link.id);
                        setTimeout(() => setCopiedLinkId(null), 2000);
                      }}>
                        <Icon name={copiedLinkId === link.id ? 'check' : 'copy'} size={11} />
                        {copiedLinkId === link.id ? 'Copied!' : 'Copy link'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Prescription ── */}
        {dtab === 'prescription' && (
          <div>
            {!patient.treatment ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-3)', fontSize: 13 }}>No active treatment prescribed.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={patient.treatment.type === 'Medication' ? 'heart' : 'activity'} size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{patient.treatment.device ?? patient.treatment.type}</div>
                    {patient.treatment.serial && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>S/N: {patient.treatment.serial}</div>}
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Started: {patient.treatment.startDate}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Prescription details</div>
                  {Object.entries(patient.treatment.prescription).filter(([, v]) => v != null).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-3)', minWidth: 120, flexShrink: 0, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').replace('p Min', 'Min pressure').replace('p Max', 'Max pressure')}</span>
                      <span style={{ fontWeight: 500 }}>{typeof v === 'number' ? `${v} cmH₂O` : v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                  <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                    <Icon name="edit" size={13} />Request prescription update
                  </button>
                  {patient.treatment.type !== 'Medication' && onOrderDme && (
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                      onClick={onOrderDme}>
                      <Icon name="paper" size={13} />Create DME order
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── PatientFormSendModal overlay ── */}
      {showSendModal && (
        <div className="doc-viewer-overlay" onClick={() => setShowSendModal(false)}>
          <div className="doc-viewer" style={{ maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
            <PatientFormSendModal
              patient={patient}
              onClose={() => setShowSendModal(false)}
              onSent={(link) => {
                setFormLinks(prev => [link, ...(prev ?? [])]);
                setShowSendModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ── RecordViewer overlay ── */}
      {viewRecord && (
        <div className="doc-viewer-overlay" onClick={() => setViewRecord(null)}>
          <div className="doc-viewer" onClick={e => e.stopPropagation()}>
            <RecordViewer record={viewRecord} onClose={() => setViewRecord(null)} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

const PatientsPage = ({ openStudy }) => {
  const [tab, setTab] = useState('patients');
  const { site } = useLocation();
  const { openCreateTask } = useTaskContext();
  const { userSites, allSites, user } = useAuth();
  const { data } = useNexusData();

  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  React.useEffect(() => {
    fetchPatients()
      .then(list => setPatients(list.map(p => ({ ...p, age: ageFromDob(p.dob) }))))
      .catch(() => setPatients([]))
      .finally(() => setPatientsLoading(false));
  }, []);
  const [selectedId, setSelectedId] = useState(null);
  const [dmePatient, setDmePatient] = useState(null);
  const [filter, setFilter] = useState('all');
  const [txFilter, setTxFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter(p => {
      const siteOk = site.id === 'all' || p.site === site.name;
      const statusOk = filter === 'all' ? true : p.status === filter;
      const txOk = txFilter === 'all' ? true : (p.treatment?.type ?? 'None') === txFilter;
      const searchOk = !q || p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q) ||
        p.diagnoses.some(d => d.toLowerCase().includes(q)) || p.physician.toLowerCase().includes(q);
      return siteOk && statusOk && txOk && searchOk;
    });
  }, [patients, site, filter, txFilter, search]);

  const cpapPatients = patients.filter(p => p.compliance && (site.id === 'all' || p.site === site.name));
  const meanCompRate = cpapPatients.length
    ? Math.round(cpapPatients.reduce((s, p) => s + p.compliance.rate, 0) / cpapPatients.length)
    : 0;
  const aboveThreshold = cpapPatients.filter(p => p.compliance.rate >= 70).length;
  const belowThreshold = cpapPatients.filter(p => p.compliance.rate < 70).length;

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Clinical · patient management"
        title="Patients"
        subtitle="Patient records, treatment prescriptions, and CPAP therapy compliance monitoring"
        actions={
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={14} />Add patient
          </button>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'patients',      label: 'Patient list',          count: filtered.length },
        { id: 'compliance',    label: 'CPAP compliance',       count: cpapPatients.length },
        { id: 'prescriptions', label: 'Active prescriptions'  },
      ]} />

      {/* ── PATIENT LIST ──────────────────────────────────────────────────────── */}
      {tab === 'patients' && patientsLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-3)', fontSize: 13 }}>Loading patients…</div>
      )}
      {tab === 'patients' && !patientsLoading && (
        <>
          <div className="filter-bar">
            {[['all', 'All'], ['active', 'Active'], ['monitoring', 'Monitoring'], ['awaiting-study', 'Awaiting study']].map(([v, l]) => (
              <button key={v} className={`chip-btn ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
            <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
            <select className="input" style={{ fontSize: 12, padding: '3px 8px', height: 28 }}
              value={txFilter} onChange={e => setTxFilter(e.target.value)}>
              <option value="all">All treatments</option>
              {['CPAP', 'BiPAP', 'ASV', 'Medication', 'None'].map(t => <option key={t}>{t}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <div className="search" style={{ width: 220 }} onClick={e => e.currentTarget.querySelector('input')?.focus()}>
              <Icon name="search" size={12} />
              <input style={{ border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontSize: 12, width: '100%' }}
                placeholder="Name, MRN, diagnosis…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="card">
            <NexusGrid
              rowData={filtered}
              onRowClicked={p => setSelectedId(p.data.id)}
              columnDefs={[
                { headerName: 'Patient', field: 'name', flex: 2,
                  cellRenderer: p => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={p.data.initials} size={24} idx={parseInt(p.data.id.slice(-1))} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.data.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.data.age}y {p.data.sex}</div>
                      </div>
                    </div>
                  )},
                { headerName: 'MRN', field: 'mrn', width: 110,
                  cellRenderer: p => <span className="mono" style={{ fontSize: 12 }}>{p.value}</span> },
                { headerName: 'Site', field: 'site', width: 160,
                  cellStyle: { color: 'var(--ink-3)', fontSize: 12 } },
                { headerName: 'Diagnosis (primary)', field: 'diagnoses', flex: 2,
                  cellStyle: { fontSize: 12 },
                  valueFormatter: p => p.value?.[0] ?? '—' },
                { headerName: 'Treatment', field: 'treatment', width: 140,
                  cellRenderer: p => <TreatmentBadge treatment={p.value} /> },
                { headerName: 'Compliance', field: 'compliance', width: 160,
                  sortable: false,
                  cellRenderer: p => p.value ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CompliancePill rate={p.value.rate} />
                      <div style={{ width: 60, overflow: 'hidden' }}>
                        <ComplianceBar patientId={p.data.id} rate={p.value.rate} meanUsage={p.value.meanUsage} />
                      </div>
                    </div>
                  ) : <span className="muted">—</span> },
                { headerName: 'Physician', field: 'physician', width: 140,
                  cellStyle: { color: 'var(--ink-3)', fontSize: 12 } },
                { headerName: 'Next review', field: 'nextReview', width: 120,
                  cellRenderer: p => (
                    <span style={{ fontSize: 12, color: p.value && new Date(p.value) < new Date() ? 'var(--bad)' : 'var(--ink-2)' }}>
                      {p.value ?? '—'}
                    </span>
                  )},
                { headerName: 'Status', field: 'status', width: 130,
                  cellRenderer: p => <StatusBadge status={p.value} /> },
              ]}
            />
          </div>
        </>
      )}

      {/* ── CPAP COMPLIANCE ───────────────────────────────────────────────────── */}
      {tab === 'compliance' && (
        <>
          <div className="stat-grid" style={{ marginBottom: 18 }}>
            <div className="stat">
              <div className="stat-label"><Icon name="activity" size={13} />On CPAP / BiPAP / ASV therapy</div>
              <div className="stat-value">{cpapPatients.length}</div>
              <div className="stat-meta">with connected device data</div>
            </div>
            <div className="stat">
              <div className="stat-label"><Icon name="chart" size={13} />Mean compliance rate</div>
              <div className="stat-value">{meanCompRate}%</div>
              <div className="stat-meta" style={{ color: meanCompRate >= 70 ? 'var(--good)' : 'var(--bad)' }}>
                {meanCompRate >= 70 ? '● Above threshold' : '● Below 70% target'}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label"><Icon name="check" size={13} />Meeting ≥70% threshold</div>
              <div className="stat-value" style={{ color: 'var(--good)' }}>{aboveThreshold}</div>
              <div className="stat-meta">{cpapPatients.length > 0 ? Math.round(aboveThreshold / cpapPatients.length * 100) : 0}% of CPAP patients</div>
            </div>
            <div className="stat">
              <div className="stat-label"><Icon name="alert" size={13} />Below threshold — needs review</div>
              <div className="stat-value" style={{ color: belowThreshold > 0 ? 'var(--bad)' : 'var(--good)' }}>{belowThreshold}</div>
              <div className="stat-meta">{belowThreshold > 0 ? 'Intervention required' : 'All patients compliant'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {cpapPatients.map(p => {
              const prov = p.treatment?.provider ? CPAP_PROVIDERS[p.treatment.provider] : null;
              const compliant = p.compliance.rate >= 70;
              return (
                <div key={p.id} className="card" style={{ cursor: 'pointer', border: !compliant ? '1px solid var(--bad)' : undefined }}
                  onClick={() => { setSelectedId(p.id); }}>
                  <div className="card-head">
                    <Avatar name={p.initials} size={28} idx={parseInt(p.id.slice(-1))} />
                    <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name} <span style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 12 }}>· {p.mrn}</span></div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.treatment?.device ?? p.treatment?.type}</div>
                    </div>
                    <CompliancePill rate={p.compliance.rate} />
                    {prov && (
                      <div title={`${prov.label} · Last sync ${p.compliance.lastSync}`}
                        style={{ width: 20, height: 20, borderRadius: '50%', background: prov.connected ? '#dcfce7' : 'var(--surface-3)', display: 'grid', placeItems: 'center' }}>
                        <Icon name="wifi" size={10} style={{ color: prov.connected ? '#16a34a' : 'var(--ink-4)' }} />
                      </div>
                    )}
                  </div>
                  <div className="card-pad" style={{ paddingTop: 8, paddingBottom: 8 }}>
                    <ComplianceBar patientId={p.id} rate={p.compliance.rate} meanUsage={p.compliance.meanUsage} />
                    <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
                      <span style={{ color: 'var(--ink-3)' }}>Avg use <strong style={{ color: 'var(--ink)' }}>{p.compliance.meanUsage}h</strong></span>
                      <span style={{ color: 'var(--ink-3)' }}>AHI <strong style={{ color: p.compliance.meanAhi < 5 ? 'var(--good)' : 'var(--bad)' }}>{p.compliance.meanAhi}/h</strong></span>
                      <span style={{ color: 'var(--ink-3)' }}>Leak <strong style={{ color: p.compliance.meanLeak < 24 ? 'var(--good)' : 'var(--warn)' }}>{p.compliance.meanLeak} L/min</strong></span>
                      <span style={{ color: 'var(--ink-4)', marginLeft: 'auto', fontSize: 11 }}>Sync: {p.compliance.lastSync}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── PRESCRIPTIONS ─────────────────────────────────────────────────────── */}
      {tab === 'prescriptions' && (
        <div className="card">
          <NexusGrid
            rowData={patients.filter(p => p.treatment)}
            onRowClicked={p => setSelectedId(p.data.id)}
            columnDefs={[
              { headerName: 'Patient', field: 'name', flex: 2,
                cellRenderer: p => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={p.data.initials} size={22} idx={parseInt(p.data.id.slice(-1))} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{p.data.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.data.mrn}</div>
                    </div>
                  </div>
                )},
              { headerName: 'Treatment type', field: 'treatment', width: 150,
                cellRenderer: p => <TreatmentBadge treatment={p.value} /> },
              { headerName: 'Device', field: 'treatment', colId: 'device', width: 140,
                cellStyle: { fontSize: 12 },
                valueFormatter: p => p.value?.device ?? '—' },
              { headerName: 'Mode / settings', field: 'treatment', colId: 'mode', flex: 2,
                cellStyle: { fontSize: 12, color: 'var(--ink-2)' },
                valueFormatter: p => {
                  const rx = p.value?.prescription;
                  if (!rx) return '—';
                  return rx.mode + (rx.pMin != null ? ` · ${rx.pMin}–${rx.pMax} cmH₂O` : '');
                }},
              { headerName: 'Mask', field: 'treatment', colId: 'mask', width: 160,
                cellStyle: { fontSize: 12, color: 'var(--ink-2)' },
                valueFormatter: p => p.value?.prescription?.mask ?? '—' },
              { headerName: 'Start date', field: 'treatment', colId: 'startDate', width: 120,
                cellStyle: { color: 'var(--ink-3)', fontSize: 12 },
                valueFormatter: p => p.value?.startDate ?? '—' },
              { headerName: 'Physician', field: 'physician', width: 130,
                cellStyle: { color: 'var(--ink-3)', fontSize: 12 } },
            ]}
          />
        </div>
      )}


      {/* Patient detail drawer */}
      <Drawer open={!!selectedId} onClose={() => setSelectedId(null)}>
        {selectedPatient && (
          <PatientDrawer
            key={selectedId}
            patient={selectedPatient}
            onClose={() => setSelectedId(null)}
            onCreateTask={openCreateTask}
            onOrderDme={() => { setDmePatient(selectedPatient); setSelectedId(null); }}
            onUpdate={pat => setPatients(prev => prev.map(p => p.id === pat.id ? pat : p))}
            studies={data?.studies ?? []}
            openStudy={(sid) => { setSelectedId(null); openStudy?.(sid); }}
          />
        )}
      </Drawer>

      {/* DME order modal */}
      {dmePatient && (
        <DmeOrderModal
          key={dmePatient.id}
          patient={dmePatient}
          site={site}
          user={user}
          onClose={() => setDmePatient(null)}
        />
      )}

      {/* Add patient modal */}
      {addOpen && (
        <AddPatientModal
          sites={allSites}
          onClose={() => setAddOpen(false)}
          onAdd={p => setPatients(prev => [...prev, p])}
        />
      )}
    </div>
  );
};

export default PatientsPage;
