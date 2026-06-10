import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Tabs, Drawer } from '../components';
import EquipmentFormDrawer from '../equipment-form-drawer';
import EquipmentDetailDrawer from '../equipment-detail-drawer';
import { HstDispatchDrawer, HstReturnDrawer } from '../hst-dispatch-drawer';
import { SEED_PATIENTS } from './page-patients';
import { COURIERS } from '../courier-api';
import { ConsumableFormDrawer, StockReceiveDrawer, StockUseDrawer, PlaceOrderDrawer } from '../consumables-drawers';
import NexusGrid from '../nexus-grid';
import { useAuth, ALL_SITES } from '../AuthContext';
import { useLocation, SITES as LOC_SITES } from '../LocationContext';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
};

function verifyStatus(nextVerify) {
  const diff = (new Date(nextVerify) - new Date()) / 86400000;
  if (diff < 0)  return 'bad';
  if (diff < 30) return 'warn';
  return 'good';
}

// ─── seed data ───────────────────────────────────────────────────────────────
const SEED_EQUIPMENT = [
  {
    id: 'PSG-COMP-001', name: 'Compumedics Grael PSG Amplifier',
    manufacturer: 'Compumedics', model: 'Grael 4K', type: 'PSG Amplifier',
    site: 'Riverside Main Lab', serial: 'GRL-29847-A', artg: '234156',
    purchaseDate: '2022-03-14', status: 'In service',
    verifyInterval: 6, maintInterval: 12,
    lastVerify: '2026-01-04', nextVerify: '2026-07-04', nextMaint: '2027-01-04',
    notes: 'EEG cable replaced Apr 2026. Incident PSG-INC-001 closed.',
    verificationHistory: [
      { date: '2026-01-04', by: 'M. Chen', result: 'Pass',             notes: 'All 40 channels within spec. EEG cable inspected and replaced.' },
      { date: '2025-07-04', by: 'M. Chen', result: 'Pass',             notes: 'Routine 6-month verification.' },
      { date: '2025-01-06', by: 'M. Chen', result: 'Conditional pass', notes: 'Channel 12 minor drift — resolved by re-seating connector.' },
    ],
  },
  {
    id: 'PSG-COMP-002', name: 'Compumedics Grael PSG Amplifier',
    manufacturer: 'Compumedics', model: 'Grael 4K', type: 'PSG Amplifier',
    site: 'Riverside Main Lab', serial: 'GRL-29848-B', artg: '234156',
    purchaseDate: '2022-03-14', status: 'In service',
    verifyInterval: 6, maintInterval: 12,
    lastVerify: '2026-01-08', nextVerify: '2026-07-08', nextMaint: '2027-01-08',
    notes: '',
    verificationHistory: [
      { date: '2026-01-08', by: 'M. Chen', result: 'Pass', notes: '' },
      { date: '2025-07-08', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
  {
    id: 'PSG-PHIL-003', name: 'Philips Alice 6 LDx PSG System',
    manufacturer: 'Philips', model: 'Alice 6 LDx', type: 'PSG Amplifier',
    site: 'Eastside Paediatric Lab', serial: 'A6L-44219', artg: '189032',
    purchaseDate: '2021-06-01', status: 'In service',
    verifyInterval: 6, maintInterval: 12,
    lastVerify: '2026-02-12', nextVerify: '2026-08-12', nextMaint: '2027-02-12',
    notes: '',
    verificationHistory: [
      { date: '2026-02-12', by: 'M. Chen', result: 'Pass', notes: 'Paeds mode verification complete.' },
      { date: '2025-08-12', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
  {
    id: 'OXI-MAS-004', name: 'Masimo SET Radical-7 Oximeter',
    manufacturer: 'Masimo', model: 'Radical-7', type: 'Oximeter',
    site: 'Riverside Main Lab', serial: 'R7-201934', artg: '171234',
    purchaseDate: '2022-11-10', status: 'In service',
    verifyInterval: 12, maintInterval: 24,
    lastVerify: '2025-11-10', nextVerify: '2026-11-10', nextMaint: '2026-11-10',
    notes: '',
    verificationHistory: [
      { date: '2025-11-10', by: 'M. Chen', result: 'Pass', notes: 'SpO2 accuracy ±1% verified against reference oximeter.' },
      { date: '2024-11-10', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
  {
    id: 'OXI-MAS-005', name: 'Masimo SET Radical-7 Oximeter',
    manufacturer: 'Masimo', model: 'Radical-7', type: 'Oximeter',
    site: 'Eastside Paediatric Lab', serial: 'R7-201935', artg: '171234',
    purchaseDate: '2022-11-10', status: 'In service',
    verifyInterval: 12, maintInterval: 24,
    lastVerify: '2025-11-10', nextVerify: '2026-11-10', nextMaint: '2026-11-10',
    notes: '',
    verificationHistory: [
      { date: '2025-11-10', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
  {
    id: 'OXI-NON-006', name: 'Nonin WristOx2 3150 Oximeter',
    manufacturer: 'Nonin', model: 'WristOx2 3150', type: 'Oximeter',
    site: 'Home Service – North', serial: 'NON-38821-2', artg: '165002',
    purchaseDate: '2024-04-15', status: 'In service',
    verifyInterval: 12, maintInterval: 24,
    lastVerify: '2025-04-15', nextVerify: '2026-04-15', nextMaint: '2027-04-15',
    notes: '',
    verificationHistory: [
      { date: '2025-04-15', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
    hstEnabled: true,
    hstStatus:  'Available',
    hstHistory: [
      {
        type: 'return_processed', date: '2026-04-28', receivedDate: '2026-04-27', receivedBy: 'K. Patel',
        condition: 'Good', dataDownloaded: true, cleaned: true, studyRef: 'HST-2026-0088',
        patient: { name: 'Robert Nguyen', dob: '1968-11-30', phone: '0411 223 344', studyRef: 'HST-2026-0088' }, notes: '',
      },
      {
        type: 'dispatch', date: '2026-04-18', by: 'K. Patel',
        patient: { name: 'Robert Nguyen', dob: '1968-11-30', phone: '0411 223 344', studyRef: 'HST-2026-0088' },
        address: { line1: '22 Acacia Rd', line2: '', suburb: 'Hawthorn', state: 'VIC', postcode: '3122' },
        courier: 'auspost', service: 'Express Post',
        trackingNumber: 'AP2836401820AU', returnTrackingNumber: 'AP2836401821AU',
        returnBy: '2026-04-25', notes: '',
      },
    ],
  },
  {
    id: 'HSAT-NOX-007', name: 'NOX T3s HSAT Device',
    manufacturer: 'Nox Medical', model: 'NOX T3s', type: 'HSAT Device',
    site: 'Home Service – North', serial: 'NT3-12847', artg: '—',
    purchaseDate: '2023-01-20', status: 'In service',
    verifyInterval: 3, maintInterval: 12,
    lastVerify: '2026-03-15', nextVerify: '2026-06-15', nextMaint: '2027-01-20',
    notes: '',
    verificationHistory: [
      { date: '2026-03-15', by: 'M. Chen', result: 'Pass', notes: '' },
      { date: '2025-12-15', by: 'M. Chen', result: 'Pass', notes: '' },
      { date: '2025-09-15', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
    hstEnabled: true,
    hstStatus:  'Available',
    hstHistory: [
      {
        type: 'return_processed', date: '2026-05-05', receivedDate: '2026-05-03', receivedBy: 'K. Patel',
        condition: 'Good', dataDownloaded: true, cleaned: true, studyRef: 'HST-2026-0091',
        patient: { name: 'Gerald Morris', dob: '1955-04-22', phone: '0412 334 881', studyRef: 'HST-2026-0091' }, notes: '',
      },
      {
        type: 'dispatch', date: '2026-04-25', by: 'K. Patel',
        patient: { name: 'Gerald Morris', dob: '1955-04-22', phone: '0412 334 881', studyRef: 'HST-2026-0091' },
        address: { line1: '8 Elm Court', line2: '', suburb: 'Bundoora', state: 'VIC', postcode: '3083' },
        courier: 'auspost', service: 'Express Post',
        trackingNumber: 'AP2841029384AU', returnTrackingNumber: 'AP2841029385AU',
        returnBy: '2026-05-02', notes: '',
      },
    ],
  },
  {
    id: 'HSAT-NOX-008', name: 'NOX T3s HSAT Device',
    manufacturer: 'Nox Medical', model: 'NOX T3s', type: 'HSAT Device',
    site: 'Home Service – North', serial: 'NT3-12848', artg: '—',
    purchaseDate: '2023-01-20', status: 'Loan / out',
    verifyInterval: 3, maintInterval: 12,
    lastVerify: '2026-02-20', nextVerify: '2026-05-20', nextMaint: '2027-01-20',
    notes: '',
    verificationHistory: [
      { date: '2026-02-20', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
    hstEnabled: true,
    hstStatus:  'Dispatched',
    hstHistory: [
      {
        type: 'dispatch', date: '2026-05-08', by: 'K. Patel',
        patient: { name: 'Patricia Walton', dob: '1961-08-14', phone: '0423 891 004', studyRef: 'HST-2026-0094' },
        address: { line1: '17 Thornton Ave', line2: '', suburb: 'Doncaster', state: 'VIC', postcode: '3108' },
        courier: 'auspost', service: 'Express Post',
        trackingNumber: 'AP2847193021AU', returnTrackingNumber: 'AP2847193022AU',
        estimatedDelivery: '2026-05-10',
        returnBy: '2026-05-17', notes: '',
      },
    ],
  },
  {
    id: 'HSAT-NOX-014', name: 'NOX T3s HSAT Device',
    manufacturer: 'Nox Medical', model: 'NOX T3s', type: 'HSAT Device',
    site: 'Home Service – North', serial: 'NT3-14201', artg: '—',
    purchaseDate: '2023-10-01', status: 'Quarantined',
    verifyInterval: 3, maintInterval: 12,
    lastVerify: '2025-12-18', nextVerify: '2026-03-18', nextMaint: '2026-10-01',
    notes: 'Quarantined pending re-verification. See NC-2026-0111.',
    verificationHistory: [
      { date: '2025-12-18', by: 'M. Chen', result: 'Pass', notes: '' },
      { date: '2025-09-18', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
    hstEnabled: true,
    hstStatus:  'Quarantined',
    hstHistory: [],
  },
  {
    id: 'CPAP-RES-009', name: 'ResMed AirSense 11 AutoSet',
    manufacturer: 'ResMed', model: 'AirSense 11 AutoSet', type: 'CPAP Device',
    site: 'Riverside Main Lab', serial: 'RS11-384721', artg: '258934',
    purchaseDate: '2023-02-10', status: 'In service',
    verifyInterval: 12, maintInterval: 12,
    lastVerify: '2026-02-10', nextVerify: '2027-02-10', nextMaint: '2027-02-10',
    notes: '',
    verificationHistory: [
      { date: '2026-02-10', by: 'M. Chen', result: 'Pass', notes: 'Pressure calibration: ±0.3 cm H₂O — within spec.' },
      { date: '2025-02-10', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
  {
    id: 'CPAP-RES-010', name: 'ResMed AirSense 11 AutoSet',
    manufacturer: 'ResMed', model: 'AirSense 11 AutoSet', type: 'CPAP Device',
    site: 'Riverside Main Lab', serial: 'RS11-384722', artg: '258934',
    purchaseDate: '2023-02-10', status: 'In service',
    verifyInterval: 12, maintInterval: 12,
    lastVerify: '2026-02-10', nextVerify: '2027-02-10', nextMaint: '2027-02-10',
    notes: '',
    verificationHistory: [
      { date: '2026-02-10', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
  {
    id: 'BIPAP-PHIL-011', name: 'Philips DreamStation 2 BiPAP',
    manufacturer: 'Philips', model: 'DreamStation 2', type: 'BiPAP / NIV Device',
    site: 'Eastside Paediatric Lab', serial: 'DS2-119842', artg: '241871',
    purchaseDate: '2022-09-20', status: 'In service',
    verifyInterval: 12, maintInterval: 12,
    lastVerify: '2025-09-20', nextVerify: '2026-09-20', nextMaint: '2026-09-20',
    notes: '',
    verificationHistory: [
      { date: '2025-09-20', by: 'M. Chen', result: 'Pass', notes: 'IPAP/EPAP accuracy ±0.2 cm H₂O.' },
    ],
  },
  {
    id: 'CAL-SIG-012', name: 'Compumedics ProScope Signal Calibrator',
    manufacturer: 'Compumedics', model: 'ProScope', type: 'Calibrator',
    site: 'Riverside Main Lab', serial: 'PSC-10029', artg: '—',
    purchaseDate: '2022-03-14', status: 'In service',
    verifyInterval: 12, maintInterval: 24,
    lastVerify: '2026-03-20', nextVerify: '2027-03-20', nextMaint: '2028-03-20',
    notes: 'NATA-traceable calibration certificate #CAL-2026-381 · expires Mar 2027.',
    verificationHistory: [
      { date: '2026-03-20', by: 'M. Chen', result: 'Pass', notes: 'Calibrated against NATA reference. Cert #CAL-2026-381.' },
      { date: '2025-03-20', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
  {
    id: 'AV-SYS-013', name: 'In-room A/V Recording System',
    manufacturer: 'Sony / Hikvision', model: 'Custom (3-bed)', type: 'A/V System',
    site: 'Riverside Main Lab', serial: '— see notes', artg: '—',
    purchaseDate: '2021-07-01', status: 'In service',
    verifyInterval: 6, maintInterval: 12,
    lastVerify: '2026-01-11', nextVerify: '2026-07-11', nextMaint: '2027-01-11',
    notes: 'Includes Sony SRG cameras ×3, Hikvision DVR, Shure microphone array. See SOP-IT-003.',
    verificationHistory: [
      { date: '2026-01-11', by: 'M. Chen', result: 'Pass', notes: 'All 3 camera feeds verified. Audio sync confirmed.' },
      { date: '2025-07-11', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
  {
    id: 'AV-SYS-014', name: 'In-room A/V Recording System',
    manufacturer: 'Sony / Hikvision', model: 'Custom (2-bed paeds)', type: 'A/V System',
    site: 'Eastside Paediatric Lab', serial: '— see notes', artg: '—',
    purchaseDate: '2021-07-01', status: 'In service',
    verifyInterval: 6, maintInterval: 12,
    lastVerify: '2026-01-15', nextVerify: '2026-07-15', nextMaint: '2027-01-15',
    notes: 'Paediatric 2-bed system. A/V storage path NC-2026-0107 resolved — SOP-IT-002 updated.',
    verificationHistory: [
      { date: '2026-01-15', by: 'M. Chen', result: 'Pass', notes: '' },
    ],
  },
].map(e => ({ ...e, verifyStatus: verifyStatus(e.nextVerify) }));

const SEED_INCIDENTS = [
  {
    id: 'PSG-INC-001', date: '2026-04-04', assetId: 'PSG-COMP-001',
    assetName: 'Compumedics Grael PSG Amplifier',
    description: 'Intermittent EEG channel 32 dropout during overnight study PSG-2026-0892. Study extended; repeated electrode placement resolved fault.',
    tgaReported: true, tgaRef: 'TGA-26-1147',
    status: 'Closed',
  },
];

const SEED_CONSUMABLES = [
  {
    sku: 'CON-EEG-001', category: 'Electrodes',
    description: 'Disposable Ag/AgCl cup electrodes (25-pack)',
    site: 'Riverside Main Lab', unit: 'pack', reorder: 5,
    supplier: 'Compumedics Australia', catalogNo: 'CM-EEG-CUP-25',
    lots: [
      { lotNo: 'EEG-2026-L04', expiry: '2027-12-31', qty: 5, received: '2026-02-10', invoiceRef: 'INV-2026-0142', receivedBy: 'K. Patel' },
      { lotNo: 'EEG-2026-L05', expiry: '2028-03-31', qty: 3, received: '2026-04-15', invoiceRef: 'INV-2026-0398', receivedBy: 'K. Patel' },
    ],
    usageHistory: [
      { date: '2026-05-10', qty: 2, lotNo: 'EEG-2026-L04', studyRef: 'PSG-2026-1012', by: 'M. Chen' },
      { date: '2026-05-08', qty: 1, lotNo: 'EEG-2026-L04', studyRef: 'PSG-2026-1009', by: 'A. Nguyen' },
    ],
    pendingOrder: null,
  },
  {
    sku: 'CON-EEG-002', category: 'Electrodes',
    description: 'Disposable Ag/AgCl cup electrodes (25-pack)',
    site: 'Eastside Paediatric Lab', unit: 'pack', reorder: 4,
    supplier: 'Compumedics Australia', catalogNo: 'CM-EEG-CUP-25',
    lots: [
      { lotNo: 'EEG-2026-L03', expiry: '2027-06-30', qty: 3, received: '2026-01-20', invoiceRef: 'INV-2026-0058', receivedBy: 'L. Park' },
    ],
    usageHistory: [
      { date: '2026-05-02', qty: 1, lotNo: 'EEG-2026-L03', studyRef: 'PSG-2026-0988', by: 'L. Park' },
    ],
    pendingOrder: { qty: 8, supplier: 'Compumedics Australia', catalogNo: 'CM-EEG-CUP-25', by: 'L. Park', date: '2026-05-12', status: 'Pending', notes: '' },
  },
  {
    sku: 'CON-GEL-001', category: 'Gels & Pastes',
    description: 'Ten20 conductive electrode paste (114 g jar)',
    site: 'Riverside Main Lab', unit: 'jar', reorder: 6,
    supplier: 'Weaver and Company', catalogNo: 'WV-TEN20-114',
    lots: [
      { lotNo: 'TEN20-L08', expiry: '2027-09-30', qty: 7, received: '2026-01-10', invoiceRef: 'INV-2026-0031', receivedBy: 'K. Patel' },
      { lotNo: 'TEN20-L09', expiry: '2028-01-31', qty: 5, received: '2026-04-01', invoiceRef: 'INV-2026-0312', receivedBy: 'K. Patel' },
    ],
    usageHistory: [
      { date: '2026-05-11', qty: 1, lotNo: 'TEN20-L08', studyRef: '', by: 'M. Chen' },
      { date: '2026-05-07', qty: 1, lotNo: 'TEN20-L08', studyRef: 'PSG-2026-1003', by: 'A. Nguyen' },
    ],
    pendingOrder: null,
  },
  {
    sku: 'CON-GEL-002', category: 'Gels & Pastes',
    description: 'Ten20 conductive electrode paste (114 g jar)',
    site: 'Eastside Paediatric Lab', unit: 'jar', reorder: 4,
    supplier: 'Weaver and Company', catalogNo: 'WV-TEN20-114',
    lots: [
      { lotNo: 'TEN20-L07', expiry: '2027-09-30', qty: 4, received: '2026-02-01', invoiceRef: 'INV-2026-0091', receivedBy: 'L. Park' },
    ],
    usageHistory: [],
    pendingOrder: null,
  },
  {
    sku: 'CON-OXI-001', category: 'Sensors',
    description: 'Masimo LNOP adult adhesive SpO₂ sensors (25pk)',
    site: 'Riverside Main Lab', unit: 'pack', reorder: 4,
    supplier: 'Masimo', catalogNo: 'LNOP-ADT-25',
    lots: [
      { lotNo: 'MAS-OXI-2026-12', expiry: '2027-08-31', qty: 4, received: '2026-02-20', invoiceRef: 'INV-2026-0107', receivedBy: 'K. Patel' },
      { lotNo: 'MAS-OXI-2026-18', expiry: '2028-02-28', qty: 2, received: '2026-05-01', invoiceRef: 'INV-2026-0421', receivedBy: 'K. Patel' },
    ],
    usageHistory: [
      { date: '2026-05-09', qty: 1, lotNo: 'MAS-OXI-2026-12', studyRef: 'PSG-2026-1010', by: 'M. Chen' },
    ],
    pendingOrder: null,
  },
  {
    sku: 'CON-OXI-002', category: 'Sensors',
    description: 'Masimo LNOP paeds adhesive SpO₂ sensors (25pk)',
    site: 'Eastside Paediatric Lab', unit: 'pack', reorder: 3,
    supplier: 'Masimo', catalogNo: 'LNOP-PEDS-25',
    lots: [
      { lotNo: 'MAS-PED-2026-04', expiry: '2027-08-31', qty: 1, received: '2026-01-15', invoiceRef: 'INV-2026-0048', receivedBy: 'L. Park' },
    ],
    usageHistory: [
      { date: '2026-05-06', qty: 1, lotNo: 'MAS-PED-2026-04', studyRef: 'PSG-2026-0991', by: 'L. Park' },
    ],
    pendingOrder: { qty: 6, supplier: 'Masimo', catalogNo: 'LNOP-PEDS-25', by: 'L. Park', date: '2026-05-13', status: 'Pending', notes: 'Urgent — critically low stock' },
  },
  {
    sku: 'CON-OXI-003', category: 'Sensors',
    description: 'Masimo LNOP adult adhesive SpO₂ sensors (25pk)',
    site: 'Home Service – North', unit: 'pack', reorder: 3,
    supplier: 'Masimo', catalogNo: 'LNOP-ADT-25',
    lots: [
      { lotNo: 'MAS-OXI-2026-15', expiry: '2027-08-31', qty: 5, received: '2026-03-10', invoiceRef: 'INV-2026-0201', receivedBy: 'K. Patel' },
    ],
    usageHistory: [],
    pendingOrder: null,
  },
  {
    sku: 'CON-CAN-001', category: 'Airways',
    description: 'Disposable nasal cannula, adult (50-pack)',
    site: 'Riverside Main Lab', unit: 'pack', reorder: 4,
    supplier: 'Intersurgical', catalogNo: 'ISG-CAN-A50',
    lots: [
      { lotNo: 'ISG-CAN-2026-08', expiry: '2027-12-31', qty: 9, received: '2026-03-05', invoiceRef: 'INV-2026-0188', receivedBy: 'K. Patel' },
    ],
    usageHistory: [
      { date: '2026-05-11', qty: 1, lotNo: 'ISG-CAN-2026-08', studyRef: '', by: 'M. Chen' },
    ],
    pendingOrder: null,
  },
  {
    sku: 'CON-CAN-002', category: 'Airways',
    description: 'Disposable nasal cannula, paediatric (50-pack)',
    site: 'Eastside Paediatric Lab', unit: 'pack', reorder: 3,
    supplier: 'Intersurgical', catalogNo: 'ISG-CAN-P50',
    lots: [
      { lotNo: 'ISG-CANP-2026-04', expiry: '2027-12-31', qty: 2, received: '2026-02-28', invoiceRef: 'INV-2026-0160', receivedBy: 'L. Park' },
    ],
    usageHistory: [],
    pendingOrder: null,
  },
  {
    sku: 'CON-BELT-001', category: 'Effort belts',
    description: 'Respiratory effort belts, SOMNOtouch (4-pack)',
    site: 'Riverside Main Lab', unit: 'pack', reorder: 2,
    supplier: 'SOMNOmedics', catalogNo: 'SM-BELT-4PK',
    lots: [
      { lotNo: 'SM-BLT-2025-22', expiry: '2028-06-30', qty: 3, received: '2025-12-01', invoiceRef: 'INV-2025-1203', receivedBy: 'K. Patel' },
    ],
    usageHistory: [],
    pendingOrder: null,
  },
  {
    sku: 'CON-FLT-001', category: 'Filters',
    description: 'CPAP bacterial/viral filter (50-pack)',
    site: 'Riverside Main Lab', unit: 'pack', reorder: 5,
    supplier: 'ResMed', catalogNo: 'RM-BVF-50',
    lots: [
      { lotNo: 'RM-FLT-2026-09', expiry: '2027-10-31', qty: 4, received: '2026-02-15', invoiceRef: 'INV-2026-0099', receivedBy: 'K. Patel' },
      { lotNo: 'RM-FLT-2026-16', expiry: '2028-04-30', qty: 3, received: '2026-04-22', invoiceRef: 'INV-2026-0401', receivedBy: 'K. Patel' },
    ],
    usageHistory: [
      { date: '2026-05-11', qty: 1, lotNo: 'RM-FLT-2026-09', studyRef: '', by: 'M. Chen' },
      { date: '2026-05-08', qty: 1, lotNo: 'RM-FLT-2026-09', studyRef: '', by: 'A. Nguyen' },
    ],
    pendingOrder: null,
  },
  {
    sku: 'CON-FLT-002', category: 'Filters',
    description: 'CPAP bacterial/viral filter (50-pack)',
    site: 'Eastside Paediatric Lab', unit: 'pack', reorder: 3,
    supplier: 'ResMed', catalogNo: 'RM-BVF-50',
    lots: [],
    usageHistory: [],
    pendingOrder: { qty: 6, supplier: 'ResMed', catalogNo: 'RM-BVF-50', by: 'L. Park', date: '2026-05-13', status: 'Pending', notes: '' },
  },
].map(c => {
  const stock = c.lots.reduce((s, l) => s + l.qty, 0);
  return { ...c, stock, stockStatus: stock === 0 ? 'critical' : stock <= c.reorder ? 'low' : 'ok' };
});

const STATUS_KIND    = { 'In service': 'good', 'Quarantined': 'bad', 'Loan / out': 'warn', 'Decommissioned': 'outline' };
const HST_STATUS_KIND= { 'Available': 'good', 'Dispatched': 'warn', 'Quarantined': 'bad' };
const VSTATUS_KIND   = { good: 'good', warn: 'warn', bad: 'bad' };
const STOCK_KIND     = { ok: 'good', low: 'warn', critical: 'bad' };
const INC_KIND       = { Investigation: 'warn', Resolved: 'info', Closed: 'good' };

// Module-level column defs so AG Grid picks up sortable on first mount
// (useMemo with [] deps doesn't reliably merge defaultColDef in AG Grid 35).
const REGISTER_COL_DEFS = [
  { headerName: 'Asset ID', field: 'id', width: 150, sortable: true,
    cellRenderer: p => <span className="mono" style={{ fontWeight: 500 }}>{p.value}</span> },
  { headerName: 'Device', field: 'name', flex: 2, sortable: true,
    cellRenderer: p => (
      <div>
        <div style={{ fontWeight: 500 }}>{p.data.name}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.data.manufacturer} · {p.data.model}</div>
      </div>
    ) },
  { headerName: 'Type',   field: 'type',   width: 150, sortable: true, cellStyle: { fontSize: 12 } },
  { headerName: 'Site',   field: 'site',   flex: 1,    sortable: true, cellClass: 'muted' },
  { headerName: 'Serial', field: 'serial', width: 130, sortable: true,
    cellRenderer: p => <span className="mono" style={{ fontSize: 11 }}>{p.value}</span> },
  { headerName: 'ARTG',   field: 'artg',   width: 100, sortable: true,
    cellRenderer: p => (
      <span className="mono" style={{ fontSize: 11, color: p.value === '—' ? 'var(--ink-4)' : 'var(--ink-2)' }}>
        {p.value}
      </span>
    ) },
  { headerName: 'Status', field: 'status', width: 130, sortable: true,
    cellRenderer: p => <Pill kind={STATUS_KIND[p.value] || 'outline'} dot>{p.value}</Pill> },
  { headerName: 'Next verification', field: 'nextVerify', width: 160, sortable: true,
    cellRenderer: p => <Pill kind={VSTATUS_KIND[p.data.verifyStatus]} dot>{fmtDate(p.value)}</Pill> },
];

// ─── Component ───────────────────────────────────────────────────────────────
const EquipmentPage = () => {
  const { userSites } = useAuth();
  const { siteId } = useLocation();
  // Derive which sites this user may access (empty = unrestricted)
  const allowedSites = userSites.length > 0 ? userSites : ALL_SITES.map(s => s.name);
  const siteRestricted = userSites.length > 0; // hide dropdown / lock filter when true

  const [equipment,   setEquipment]   = useState(() =>
    SEED_EQUIPMENT
      .map(e => ({ ...e, verifyStatus: verifyStatus(e.nextVerify) }))
      .filter(e => userSites.length === 0 || userSites.includes(e.site))
  );
  const [incidents,   setIncidents]   = useState(SEED_INCIDENTS);
  const [tab,         setTab]         = useState('register');
  const [filter,      setFilter]      = useState('all');
  const [siteFilter,  setSiteFilter]  = useState('all');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [search,      setSearch]      = useState('');

  // Drawer states
  const [detailId,       setDetailId]       = useState(null);
  const [formTarget,     setFormTarget]      = useState(null);
  const [incOpen,        setIncOpen]         = useState(false);
  const [hstDispatchEq,  setHstDispatchEq]   = useState(null);
  const [hstReturnEq,    setHstReturnEq]     = useState(null);

  // Consumables state
  const [consumables,     setConsumables]     = useState(SEED_CONSUMABLES);
  const [conFilter,       setConFilter]       = useState('all');
  const [conSiteFilter,   setConSiteFilter]   = useState('all');
  const [conCatFilter,    setConCatFilter]    = useState('all');
  const [conSearch,       setConSearch]       = useState('');
  const [expandedConSku,  setExpandedConSku]  = useState(null);
  const [conFormTarget,   setConFormTarget]   = useState(null);
  const [stockReceiveCon, setStockReceiveCon] = useState(null);
  const [stockUseCon,     setStockUseCon]     = useState(null);
  const [placingOrderCon, setPlacingOrderCon] = useState(null);

  // Sync both site filters when the global sidebar location changes
  useEffect(() => {
    const name = siteId === 'all' ? 'all' : (LOC_SITES.find(s => s.id === siteId)?.name ?? 'all');
    setSiteFilter(name);
    setConSiteFilter(name);
  }, [siteId]);

  const detailEq  = equipment.find(e => e.id === detailId) || null;
  const isEdit    = !!(formTarget?.id);

  // Derived counts
  const overdueCount   = useMemo(() => equipment.filter(e => e.verifyStatus === 'bad').length,    [equipment]);
  const soonCount      = useMemo(() => equipment.filter(e => e.verifyStatus === 'warn').length,   [equipment]);
  const quarCount      = useMemo(() => equipment.filter(e => e.status === 'Quarantined').length,  [equipment]);
  const hstDevices     = useMemo(() => equipment.filter(e => e.hstEnabled),                       [equipment]);
  const hstDispatched  = useMemo(() => hstDevices.filter(e => e.hstStatus === 'Dispatched').length, [hstDevices]);
  const critStock      = consumables.filter(c => c.stockStatus !== 'ok').length;

  // Site options in the dropdown: only sites this user is permitted to access
  const allSites = useMemo(() => ['all', ...allowedSites], [allowedSites]);
  const allTypes = useMemo(() => ['all', ...new Set(equipment.map(e => e.type))], [equipment]);

  // ── Register filter ────────────────────────────────────────────────────────
  const _q = search.toLowerCase();

  // preFiltered: drives chip-count labels (site + type + search, ignores chip).
  const preFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return equipment.filter(e => {
      if (siteFilter !== 'all' && e.site !== siteFilter) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (q && !e.id.toLowerCase().includes(q) && !e.name.toLowerCase().includes(q) && !e.serial.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [equipment, siteFilter, typeFilter, search]);

  // filteredEquipment: all four filters applied.
  const filteredEquipment = useMemo(() => {
    return preFiltered.filter(e => {
      if (filter === 'overdue')    return e.verifyStatus === 'bad';
      if (filter === 'soon')       return e.verifyStatus === 'warn';
      if (filter === 'quarantine') return e.status === 'Quarantined';
      return true;
    });
  }, [preFiltered, filter]);

  // gridData is a state value (not just a memo) so AG Grid's prop-change
  // detection sees a genuine state-driven re-render, not just a memo result.
  const [gridData, setGridData] = useState(filteredEquipment);
  useEffect(() => { setGridData(filteredEquipment); }, [filteredEquipment]);

  // Verification schedule: sort all by nextVerify ISO date
  const scheduleItems = useMemo(() =>
    [...equipment]
      .filter(e => e.status !== 'Decommissioned')
      .sort((a, b) => new Date(a.nextVerify) - new Date(b.nextVerify))
      .map(e => {
        const diff = Math.round((new Date(e.nextVerify) - new Date()) / 86400000);
        return { ...e, diffDays: diff };
      }),
    [equipment]);

  // Handlers
  const handleSaveEquipment = (saved) => {
    setEquipment(prev => {
      const exists = prev.some(e => e.id === saved.id);
      // recompute verifyStatus if nextVerify set
      const enriched = { ...saved, verifyStatus: verifyStatus(saved.nextVerify) };
      return exists ? prev.map(e => e.id === saved.id ? enriched : e) : [enriched, ...prev];
    });
    setFormTarget(null);
  };

  const handleUpdateEquipment = (updated) => {
    // If the current chip filter would now hide this item, reset to 'all' so
    // the user can see the item with its updated status rather than a disappearing row.
    const wouldHide =
      (filter === 'quarantine' && updated.status !== 'Quarantined') ||
      (filter === 'overdue'    && updated.verifyStatus !== 'bad') ||
      (filter === 'soon'       && updated.verifyStatus !== 'warn');
    if (wouldHide) setFilter('all');
    setEquipment(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  // Simple incident form state
  const [incForm, setIncForm] = useState({ assetId: '', description: '', tgaReported: false });
  const setInc = (k, v) => setIncForm(f => ({ ...f, [k]: v }));
  const submitIncident = () => {
    if (!incForm.assetId || !incForm.description.trim()) return;
    const asset = equipment.find(e => e.id === incForm.assetId);
    const id = `EQP-INC-${String(incidents.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().slice(0, 10);
    setIncidents(prev => [{ id, date: today, assetId: incForm.assetId, assetName: asset?.name || '', description: incForm.description, tgaReported: incForm.tgaReported, tgaRef: '—', status: 'Investigation' }, ...prev]);
    setIncForm({ assetId: '', description: '', tgaReported: false });
    setIncOpen(false);
  };

  // Consumable handlers
  const recomputeStockStatus = (c) => {
    const s = c.stock === 0 ? 'critical' : c.stock <= c.reorder ? 'low' : 'ok';
    return { ...c, stockStatus: s };
  };

  const handleSaveConsumable = (formData) => {
    setConsumables(prev => {
      const existing = prev.find(c => c.sku === formData.sku);
      if (existing) {
        return prev.map(c => c.sku === formData.sku
          ? recomputeStockStatus({ ...c, ...formData })
          : c);
      }
      return [recomputeStockStatus({ ...formData, lots: [], usageHistory: [], pendingOrder: null, stock: 0 }), ...prev];
    });
    setConFormTarget(null);
  };

  const handleReceiveStock = (sku, data) => {
    setConsumables(prev => prev.map(c => {
      if (c.sku !== sku) return c;
      const lots = [...c.lots];
      const idx = lots.findIndex(l => l.lotNo === data.lotNo);
      if (idx >= 0) {
        lots[idx] = { ...lots[idx], qty: lots[idx].qty + data.qty };
      } else {
        lots.push({ lotNo: data.lotNo, expiry: data.expiry, qty: data.qty, received: data.date, invoiceRef: data.invoiceRef, receivedBy: data.receivedBy });
      }
      const stock = lots.reduce((s, l) => s + l.qty, 0);
      return recomputeStockStatus({ ...c, lots, stock });
    }));
    setStockReceiveCon(null);
  };

  const handleRecordUsage = (sku, data) => {
    setConsumables(prev => prev.map(c => {
      if (c.sku !== sku) return c;
      const lots = c.lots.map(l => l.lotNo === data.lotNo ? { ...l, qty: l.qty - data.qty } : l);
      const stock = lots.reduce((s, l) => s + l.qty, 0);
      const usageHistory = [{ date: data.date, qty: data.qty, lotNo: data.lotNo, studyRef: data.studyRef, by: data.by }, ...c.usageHistory];
      return recomputeStockStatus({ ...c, lots, stock, usageHistory });
    }));
    setStockUseCon(null);
  };

  const handlePlaceOrder = (sku, data) => {
    setConsumables(prev => prev.map(c => c.sku !== sku ? c : { ...c, pendingOrder: data }));
    setPlacingOrderCon(null);
  };

  // ─── Column definitions (inline in component; sortable explicit on each) ──

  const hstFleetColDefs = useMemo(() => [
    {
      headerName: 'Asset ID', field: 'id', width: 150,
      cellRenderer: p => (
        <span className="mono" style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--accent)' }}
          onClick={() => setDetailId(p.value)}>{p.value}</span>
      ),
    },
    {
      headerName: 'Device', field: 'name', flex: 2,
      cellRenderer: p => (
        <div>
          <div style={{ fontWeight: 500 }}>{p.data.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.data.manufacturer} {p.data.model} · {p.data.serial}</div>
        </div>
      ),
    },
    {
      headerName: 'HST status', field: 'hstStatus', width: 130,
      cellRenderer: p => (
        <Pill kind={HST_STATUS_KIND[p.value] ?? 'outline'} dot>{p.value}</Pill>
      ),
    },
    {
      headerName: 'Current patient', field: 'id', width: 220, sortable: false,
      cellRenderer: p => {
        const e = p.data;
        const lastDispatch = (e.hstHistory ?? []).find(h => h.type === 'dispatch');
        const activeEntry  = e.hstStatus === 'Dispatched' ? lastDispatch : null;
        return activeEntry ? (
          <div>
            <div style={{ fontWeight: 500, fontSize: 12 }}>{activeEntry.patient?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {activeEntry.patient?.studyRef} · {activeEntry.patient?.phone}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {[activeEntry.address?.suburb, activeEntry.address?.state].filter(Boolean).join(', ')}
            </div>
          </div>
        ) : <span className="muted">—</span>;
      },
    },
    {
      headerName: 'Courier · tracking', field: 'hstStatus', width: 200, sortable: false,
      cellRenderer: p => {
        const e = p.data;
        const lastDispatch = (e.hstHistory ?? []).find(h => h.type === 'dispatch');
        const activeEntry  = e.hstStatus === 'Dispatched' ? lastDispatch : null;
        const courierId    = activeEntry?.courier;
        const courierInfo  = courierId ? COURIERS.find(c => c.id === courierId) : null;
        return activeEntry ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              {courierInfo && <div style={{ width: 8, height: 8, borderRadius: 2, background: courierInfo.color, flexShrink: 0 }} />}
              <span style={{ fontSize: 11, fontWeight: 600 }}>{courierInfo?.name ?? activeEntry.courier}</span>
              <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{activeEntry.service}</span>
            </div>
            {activeEntry.trackingNumber && (
              <a href={`${courierInfo?.trackingBase ?? ''}${activeEntry.trackingNumber}`}
                target="_blank" rel="noreferrer"
                className="mono" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
                {activeEntry.trackingNumber} ↗
              </a>
            )}
          </div>
        ) : <span className="muted">—</span>;
      },
    },
    {
      headerName: 'Return by', field: 'hstStatus', width: 120, sortable: false,
      cellRenderer: p => {
        const e = p.data;
        const lastDispatch = (e.hstHistory ?? []).find(h => h.type === 'dispatch');
        const activeEntry  = e.hstStatus === 'Dispatched' ? lastDispatch : null;
        const isOverdue    = activeEntry?.returnBy && new Date(activeEntry.returnBy) < new Date();
        return activeEntry?.returnBy ? (
          <span style={{ fontSize: 12, fontWeight: 500, color: isOverdue ? 'var(--bad)' : 'inherit' }}>
            {fmtDate(activeEntry.returnBy)}
            {isOverdue && <div style={{ fontSize: 10, color: 'var(--bad)' }}>Overdue</div>}
          </span>
        ) : <span className="muted">—</span>;
      },
    },
    {
      headerName: 'Actions', field: 'id', width: 160, sortable: false,
      cellRenderer: p => {
        const e = p.data;
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            {e.hstStatus === 'Available' && e.status !== 'Quarantined' && (
              <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px', whiteSpace: 'nowrap' }}
                onClick={ev => { ev.stopPropagation(); setHstDispatchEq(e); }}>
                <Icon name="send" size={11} />Dispatch
              </button>
            )}
            {e.hstStatus === 'Dispatched' && (
              <button className="btn" style={{ fontSize: 11, padding: '3px 10px', whiteSpace: 'nowrap' }}
                onClick={ev => { ev.stopPropagation(); setHstReturnEq(e); }}>
                <Icon name="rotate_ccw" size={11} />Record return
              </button>
            )}
            {(e.hstStatus === 'Quarantined' || (e.hstStatus === 'Available' && e.status === 'Quarantined')) && (
              <Pill kind="bad" dot>Quarantined</Pill>
            )}
          </div>
        );
      },
    },
  ], []);

  const dispatchHistoryColDefs = useMemo(() => [
    { headerName: 'Date', field: 'date', width: 120, valueFormatter: p => fmtDate(p.value) },
    {
      headerName: 'Device', field: 'deviceId', width: 150,
      cellRenderer: p => (
        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.value}</span>
      ),
    },
    {
      headerName: 'Patient', field: 'patient', flex: 1,
      cellRenderer: p => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 12 }}>{p.value?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.value?.studyRef}</div>
        </div>
      ),
    },
    {
      headerName: 'Courier', field: 'courier', width: 130,
      cellRenderer: p => {
        const ci = COURIERS.find(c => c.id === p.value);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {ci && <div style={{ width: 8, height: 8, borderRadius: 2, background: ci.color }} />}
            <span style={{ fontSize: 12 }}>{ci?.name ?? p.value}</span>
          </div>
        );
      },
    },
    {
      headerName: 'Outbound tracking', field: 'trackingNumber', width: 180,
      cellRenderer: p => {
        const h = p.data;
        const ci = COURIERS.find(c => c.id === h.courier);
        return p.value ? (
          <a href={`${ci?.trackingBase ?? ''}${p.value}`} target="_blank" rel="noreferrer"
            className="mono" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
            {p.value} ↗
          </a>
        ) : <span className="muted">—</span>;
      },
    },
    {
      headerName: 'Return tracking', field: 'returnTrackingNumber', width: 170,
      cellRenderer: p => p.value
        ? <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{p.value}</span>
        : <span className="muted">—</span>,
    },
    { headerName: 'Return by', field: 'returnBy', width: 120, valueFormatter: p => fmtDate(p.value) },
  ], []);

  const scheduleColDefs = useMemo(() => [
    {
      headerName: 'Asset ID', field: 'id', width: 150,
      cellRenderer: p => (
        <span className="mono" style={{ fontWeight: 500 }}>{p.value}</span>
      ),
    },
    {
      headerName: 'Device', field: 'name', flex: 2,
      cellRenderer: p => (
        <div>
          <div style={{ fontWeight: 500 }}>{p.data.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.data.type}</div>
        </div>
      ),
    },
    { headerName: 'Site', field: 'site', flex: 1, cellClass: 'muted' },
    {
      headerName: 'Interval', field: 'verifyInterval', width: 100,
      valueFormatter: p => `${p.value} mo`,
    },
    { headerName: 'Last verified', field: 'lastVerify', width: 130, valueFormatter: p => fmtDate(p.value) },
    {
      headerName: 'Next due', field: 'nextVerify', width: 160,
      cellRenderer: p => {
        const e = p.data;
        return (
          <div>
            <div style={{ fontWeight: 500, color: e.verifyStatus === 'bad' ? 'var(--bad)' : e.verifyStatus === 'warn' ? 'var(--warn)' : 'inherit' }}>
              {fmtDate(p.value)}
            </div>
            <div style={{ fontSize: 11, color: e.verifyStatus === 'bad' ? 'var(--bad)' : 'var(--ink-3)' }}>
              {e.diffDays < 0 ? `Overdue ${Math.abs(e.diffDays)}d` : `in ${e.diffDays}d`}
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Status', field: 'verifyStatus', width: 120,
      cellRenderer: p => (
        <Pill kind={VSTATUS_KIND[p.value]} dot>
          {p.value === 'bad' ? 'Overdue' : p.value === 'warn' ? 'Due soon' : 'Current'}
        </Pill>
      ),
    },
  ], []);

  const incidentsColDefs = useMemo(() => [
    { headerName: 'Date', field: 'date', width: 120, valueFormatter: p => fmtDate(p.value) },
    {
      headerName: 'Asset', field: 'assetId', width: 180,
      cellRenderer: p => (
        <div>
          <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.value}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.data.assetName}</div>
        </div>
      ),
    },
    { headerName: 'Description', field: 'description', flex: 1 },
    {
      headerName: 'TGA ref', field: 'tgaReported', width: 140,
      cellRenderer: p => p.value
        ? <Pill kind="good">{p.data.tgaRef !== '—' ? p.data.tgaRef : 'Reported'}</Pill>
        : <span className="muted">—</span>,
    },
    {
      headerName: 'Status', field: 'status', width: 130,
      cellRenderer: p => (
        <Pill kind={INC_KIND[p.value] || 'outline'} dot>{p.value}</Pill>
      ),
    },
  ], []);

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Operations · cl. 5.3.1 – 5.3.7"
        title="Equipment register"
        subtitle="ARTG-listed devices · acceptance · verification · maintenance · retention life + 7 yrs"
        actions={
          <>
            <button className="btn btn-primary" onClick={() => setFormTarget({})}>
              <Icon name="plus" size={14} />Add equipment
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-label"><Icon name="cube" size={13} />In service</div>
          <div className="stat-value">{equipment.filter(e => e.status === 'In service').length}</div>
          <div className="stat-meta">of {equipment.length} total across 3 sites</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="alert" size={13} />Verification overdue</div>
          <div className="stat-value" style={{ color: overdueCount ? 'var(--bad)' : 'var(--good)' }}>{overdueCount}</div>
          <div className="stat-meta">{overdueCount ? 'requires immediate action' : 'all current'}</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="clock" size={13} />Due ≤ 30 days</div>
          <div className="stat-value" style={{ color: soonCount ? 'var(--warn)' : 'inherit' }}>{soonCount}</div>
          <div className="stat-meta">scheduling required</div>
        </div>
        <div className="stat">
          <div className="stat-label"><Icon name="cube" size={13} />Quarantined</div>
          <div className="stat-value" style={{ color: quarCount ? 'var(--bad)' : 'inherit' }}>{quarCount}</div>
          <div className="stat-meta">{critStock} consumables low / critical</div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'register',     label: 'Register',              count: equipment.length },
        { id: 'hst',          label: 'Home sleep testing',    count: hstDevices.length || undefined },
        { id: 'schedule',     label: 'Verification schedule', count: scheduleItems.length || undefined },
        { id: 'incidents',    label: 'Adverse incidents',     count: incidents.length || undefined },
        { id: 'consumables',  label: 'Consumables',           count: consumables.length || undefined },
      ]} />

      {/* ── REGISTER TAB ── */}
      {tab === 'register' && (
        <>
          <div className="filter-bar">
            {[
              { key: 'all',        label: `All (${preFiltered.length})` },
              { key: 'overdue',    label: `Overdue (${preFiltered.filter(e => e.verifyStatus === 'bad').length})` },
              { key: 'soon',       label: `Due soon (${preFiltered.filter(e => e.verifyStatus === 'warn').length})` },
              { key: 'quarantine', label: `Quarantined (${preFiltered.filter(e => e.status === 'Quarantined').length})` },
            ].map(f => (
              <button key={f.key} className={`chip-btn ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
            <div style={{ flex: 1 }} />
            {allowedSites.length > 1 && (
              <select className="form-input" style={{ fontSize: 12, width: 180, height: 32 }}
                value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
                <option value="all">All sites</option>
                {allSites.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {allowedSites.length === 1 && (
              <span className="pill accent" style={{ fontSize: 11 }}>{allowedSites[0]}</span>
            )}
            <select className="form-input" style={{ fontSize: 12, width: 160, height: 32 }}
              value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              {allTypes.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="search" style={{ width: 200 }}
              onClick={e => e.currentTarget.querySelector('input')?.focus()}>
              <Icon name="search" size={12} />
              <input style={{ border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontSize: 12, color: 'var(--ink)', width: '100%' }}
                placeholder="Search ID, name, serial…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
              {gridData.length} device{gridData.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="card">
            <NexusGrid
              rowData={gridData}
              columnDefs={REGISTER_COL_DEFS}
              onRowClicked={p => setDetailId(p.data.id)}
            />
          </div>
        </>
      )}

      {/* ── HOME SLEEP TESTING TAB ── */}
      {tab === 'hst' && (() => {
        const available   = hstDevices.filter(e => e.hstStatus === 'Available').length;
        const dispatched  = hstDevices.filter(e => e.hstStatus === 'Dispatched').length;
        const quarantined = hstDevices.filter(e => e.hstStatus === 'Quarantined').length;

        const recentDispatches = hstDevices
          .flatMap(e => (e.hstHistory ?? []).map(h => ({ ...h, deviceId: e.id })))
          .filter(h => h.type === 'dispatch')
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 8);

        return (
          <>
            {/* Status summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
              {[
                ['Available',   available,   'good', 'Ready to dispatch'],
                ['Dispatched',  dispatched,  'warn', 'With patients'],
                ['Quarantined', quarantined, 'bad',  'Cannot be dispatched'],
              ].map(([label, count, kind, sub]) => (
                <div key={label} className="stat" style={{ borderLeft: `3px solid var(--${kind})` }}>
                  <div className="stat-label"><Icon name="package" size={13} />{label}</div>
                  <div className="stat-value" style={{ color: count && kind !== 'good' ? `var(--${kind})` : undefined }}>{count}</div>
                  <div className="stat-meta">{sub}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">HST device fleet · cl. 5.3</div>
                  <div className="card-sub">Portable devices available for home sleep testing · dispatch and return tracking</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink-4)' }} />
                  Labels use simulated tracking — configure courier APIs in Settings
                </div>
              </div>

              {hstDevices.length === 0
                ? <div className="empty">No HST-enabled devices in register.</div>
                : (
                  <NexusGrid
                    rowData={hstDevices}
                    columnDefs={hstFleetColDefs}
                  />
                )
              }

              {/* HST dispatch history */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 10 }}>Recent dispatch history</div>
                {recentDispatches.length === 0
                  ? <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>No dispatches recorded.</div>
                  : (
                    <NexusGrid
                      rowData={recentDispatches}
                      columnDefs={dispatchHistoryColDefs}
                    />
                  )
                }
              </div>
            </div>
          </>
        );
      })()}

      {/* ── VERIFICATION SCHEDULE TAB ── */}
      {tab === 'schedule' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Verification schedule · cl. 5.3.4</div>
              <div className="card-sub">All devices sorted by next verification date · overdue first</div>
            </div>
          </div>
          <NexusGrid
            rowData={scheduleItems}
            columnDefs={scheduleColDefs}
            onRowClicked={p => setDetailId(p.data.id)}
          />
        </div>
      )}

      {/* ── INCIDENTS TAB ── */}
      {tab === 'incidents' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Adverse equipment incidents · cl. 5.3.6</div>
              <div className="card-sub">Reported to manufacturer + TGA where applicable · mandatory reporting threshold: patient harm or near-miss</div>
            </div>
            <div className="topbar-spacer" />
            <button className="btn btn-primary" onClick={() => setIncOpen(v => !v)}>
              <Icon name="plus" size={14} />Report incident
            </button>
          </div>

          {/* Inline incident form */}
          {incOpen && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>New adverse incident</div>
              <div className="form-row">
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">Asset</label>
                  <select className="form-input" value={incForm.assetId} onChange={e => setInc('assetId', e.target.value)}>
                    <option value="">— select device —</option>
                    {equipment.map(e => <option key={e.id} value={e.id}>{e.id} · {e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2}
                  value={incForm.description} onChange={e => setInc('description', e.target.value)}
                  placeholder="Describe the incident, patient impact, and immediate actions taken…"
                  style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }} />
              </div>
              <label className="form-check" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12 }}>
                <input type="checkbox" checked={incForm.tgaReported} onChange={e => setInc('tgaReported', e.target.checked)} />
                TGA reporting required (patient harm or device failure during diagnostic use)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={submitIncident}>Log incident</button>
                <button className="btn" onClick={() => setIncOpen(false)}>Cancel</button>
              </div>
            </div>
          )}

          {incidents.length === 0
            ? <div className="empty">No adverse incidents recorded.</div>
            : (
              <NexusGrid
                rowData={incidents}
                columnDefs={incidentsColDefs}
              />
            )
          }
        </div>
      )}

      {/* ── CONSUMABLES TAB ── */}
      {tab === 'consumables' && (() => {
        const conCritical  = consumables.filter(c => c.stockStatus === 'critical').length;
        const conLow       = consumables.filter(c => c.stockStatus === 'low').length;
        const conOrders    = consumables.filter(c => c.pendingOrder).length;
        const allConSites  = ['all', ...new Set(consumables.map(c => c.site))];
        const allConCats   = ['all', ...new Set(consumables.map(c => c.category).filter(Boolean))];

        const filteredCons = consumables.filter(c => {
          if (conFilter === 'low')      return c.stockStatus === 'low';
          if (conFilter === 'critical') return c.stockStatus === 'critical';
          return true;
        }).filter(c =>
          (conSiteFilter === 'all' || c.site === conSiteFilter) &&
          (conCatFilter  === 'all' || c.category === conCatFilter) &&
          (!conSearch || c.sku.toLowerCase().includes(conSearch.toLowerCase()) ||
            c.description.toLowerCase().includes(conSearch.toLowerCase()))
        );

        const nextExpiry = (con) => {
          const lots = (con.lots ?? []).filter(l => l.qty > 0).sort((a, b) => a.expiry.localeCompare(b.expiry));
          return lots[0]?.expiry ?? null;
        };

        const expiryColor = (exp) => {
          if (!exp) return undefined;
          const diff = (new Date(exp) - new Date()) / 86400000;
          if (diff < 0)   return 'var(--bad)';
          if (diff < 90)  return 'var(--warn)';
          return undefined;
        };

        const consumablesColDefs = [
          {
            headerName: 'SKU / Category', field: 'sku', width: 160,
            cellRenderer: p => (
              <div>
                <div className="mono" style={{ fontWeight: 600, fontSize: 11 }}>{p.value}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>{p.data.category}</div>
              </div>
            ),
          },
          { headerName: 'Description', field: 'description', flex: 2, cellStyle: { fontWeight: 500 } },
          { headerName: 'Site', field: 'site', flex: 1, cellClass: 'muted' },
          {
            headerName: 'In stock', field: 'stock', width: 160,
            cellRenderer: p => {
              const c = p.data;
              return (
                <div>
                  <span style={{ fontWeight: 700, color: c.stockStatus === 'critical' ? 'var(--bad)' : c.stockStatus === 'low' ? 'var(--warn)' : 'var(--good)' }}>
                    {c.stock}
                  </span>
                  <span className="muted" style={{ marginLeft: 4, fontSize: 11 }}>
                    {c.unit}{c.stock !== 1 ? 's' : ''} · reorder ≤{c.reorder}
                  </span>
                </div>
              );
            },
          },
          {
            headerName: 'Next expiry', field: 'sku', width: 130, sortable: false,
            cellRenderer: p => {
              const exp = nextExpiry(p.data);
              return exp ? (
                <span style={{ fontSize: 12, fontWeight: 500, color: expiryColor(exp) }}>
                  {fmtDate(exp)}
                  {(new Date(exp) - new Date()) / 86400000 < 0 && (
                    <div style={{ fontSize: 10, color: 'var(--bad)' }}>Expired</div>
                  )}
                </span>
              ) : <span className="muted">—</span>;
            },
          },
          {
            headerName: 'Status', field: 'stockStatus', width: 140,
            cellRenderer: p => (
              <Pill kind={STOCK_KIND[p.value]} dot>
                {p.value === 'critical' ? 'Out of stock' : p.value === 'low' ? 'Low — reorder' : 'OK'}
              </Pill>
            ),
          },
          {
            headerName: 'Order', field: 'pendingOrder', width: 160,
            cellRenderer: p => p.value
              ? <Pill kind="warn" dot>{p.value.qty} {p.data.unit}s pending</Pill>
              : <span className="muted">—</span>,
          },
          {
            headerName: 'Actions', field: 'sku', width: 220, sortable: false,
            cellRenderer: p => {
              const c = p.data;
              return (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
                  onClick={e => e.stopPropagation()}>
                  <button className="btn" style={{ fontSize: 11, padding: '2px 8px' }}
                    title="Receive stock" onClick={() => setStockReceiveCon(c)}>
                    <Icon name="download" size={11} />Receive
                  </button>
                  <button className="btn" style={{ fontSize: 11, padding: '2px 8px' }}
                    title="Record usage" onClick={() => setStockUseCon(c)}>
                    <Icon name="minus" size={11} />Use
                  </button>
                  <button className="btn" style={{ fontSize: 11, padding: '2px 8px' }}
                    title="Place order" onClick={() => setPlacingOrderCon(c)}>
                    <Icon name="package" size={11} />Order
                  </button>
                  <button className="icon-btn" title="Edit consumable"
                    onClick={() => setConFormTarget(c)}>
                    <Icon name="edit" size={13} />
                  </button>
                </div>
              );
            },
          },
        ];

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
              <div className="stat">
                <div className="stat-label"><Icon name="cube" size={13} />Total SKUs</div>
                <div className="stat-value">{consumables.length}</div>
                <div className="stat-meta">across {new Set(consumables.map(c => c.site)).size} sites</div>
              </div>
              <div className="stat">
                <div className="stat-label"><Icon name="alert" size={13} />Low stock</div>
                <div className="stat-value" style={{ color: conLow ? 'var(--warn)' : undefined }}>{conLow}</div>
                <div className="stat-meta">at or below reorder level</div>
              </div>
              <div className="stat">
                <div className="stat-label"><Icon name="alert" size={13} />Out of stock</div>
                <div className="stat-value" style={{ color: conCritical ? 'var(--bad)' : undefined }}>{conCritical}</div>
                <div className="stat-meta">reorder immediately</div>
              </div>
              <div className="stat">
                <div className="stat-label"><Icon name="package" size={13} />Pending orders</div>
                <div className="stat-value" style={{ color: conOrders ? 'var(--warn)' : undefined }}>{conOrders}</div>
                <div className="stat-meta">awaiting delivery</div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Consumables inventory · cl. 5.3.5</div>
                  <div className="card-sub">Single-use items · lot tracking · FEFO · reorder alerts</div>
                </div>
                <div className="topbar-spacer" />
                <button className="btn btn-primary" onClick={() => setConFormTarget({})}>
                  <Icon name="plus" size={14} />Add consumable
                </button>
              </div>

              <div className="filter-bar" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'all',      label: `All (${consumables.length})` },
                  { key: 'low',      label: `Low (${conLow})` },
                  { key: 'critical', label: `Out of stock (${conCritical})` },
                ].map(f => (
                  <button key={f.key} className={`chip-btn ${conFilter === f.key ? 'active' : ''}`}
                    onClick={() => setConFilter(f.key)}>{f.label}</button>
                ))}
                <div style={{ flex: 1 }} />
                <select className="form-input" style={{ fontSize: 12, width: 180, height: 32 }}
                  value={conSiteFilter} onChange={e => setConSiteFilter(e.target.value)}>
                  <option value="all">All sites</option>
                  {allConSites.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="form-input" style={{ fontSize: 12, width: 150, height: 32 }}
                  value={conCatFilter} onChange={e => setConCatFilter(e.target.value)}>
                  <option value="all">All categories</option>
                  {allConCats.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="search" style={{ width: 200 }}
                  onClick={e => e.currentTarget.querySelector('input')?.focus()}>
                  <Icon name="search" size={12} />
                  <input style={{ border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontSize: 12, color: 'var(--ink)', width: '100%' }}
                    placeholder="Search SKU, description…" value={conSearch} onChange={e => setConSearch(e.target.value)} />
                </div>
              </div>

              {filteredCons.length === 0
                ? <div className="empty">No consumables match your filter.</div>
                : (
                  <NexusGrid
                    rowData={filteredCons}
                    columnDefs={consumablesColDefs}
                    onRowClicked={p => setExpandedConSku(expandedConSku === p.data.sku ? null : p.data.sku)}
                  />
                )
              }

              {/* Expandable detail panel — rendered below the grid, controlled by expandedConSku */}
              {expandedConSku && (() => {
                const c = filteredCons.find(x => x.sku === expandedConSku);
                if (!c) return null;
                const expiryColor = (exp) => {
                  if (!exp) return undefined;
                  const diff = (new Date(exp) - new Date()) / 86400000;
                  if (diff < 0)  return 'var(--bad)';
                  if (diff < 90) return 'var(--warn)';
                  return undefined;
                };
                return (
                  <div style={{ padding: '14px 20px 16px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
                    {/* Lots */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
                      Lots on hand
                    </div>
                    {c.lots.length === 0
                      ? <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>No lots recorded — use Receive to add stock.</div>
                      : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Lot No.', 'Expiry', 'In stock', 'Received', 'Invoice ref', 'Received by'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '4px 10px 4px 0', fontWeight: 600, color: 'var(--ink-3)', fontSize: 11 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...c.lots].sort((a, b) => a.expiry.localeCompare(b.expiry)).map(l => (
                              <tr key={l.lotNo} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '5px 10px 5px 0' }}>
                                  <span className="mono" style={{ fontWeight: 600 }}>{l.lotNo}</span>
                                </td>
                                <td style={{ padding: '5px 10px 5px 0' }}>
                                  <span style={{ color: expiryColor(l.expiry) }}>{fmtDate(l.expiry)}</span>
                                </td>
                                <td style={{ padding: '5px 10px 5px 0' }}>
                                  <span style={{ fontWeight: 600, color: l.qty === 0 ? 'var(--ink-4)' : undefined }}>
                                    {l.qty} {c.unit}{l.qty !== 1 ? 's' : ''}
                                  </span>
                                  {l.qty === 0 && <span style={{ marginLeft: 4, color: 'var(--ink-4)', fontSize: 11 }}>depleted</span>}
                                </td>
                                <td className="muted" style={{ padding: '5px 10px 5px 0' }}>{fmtDate(l.received)}</td>
                                <td className="mono muted" style={{ padding: '5px 10px 5px 0', fontSize: 11 }}>{l.invoiceRef || '—'}</td>
                                <td className="muted" style={{ padding: '5px 10px 5px 0' }}>{l.receivedBy || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    }

                    {/* Usage history */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
                      Recent usage {c.usageHistory.length > 5 ? `(showing 5 of ${c.usageHistory.length})` : `(${c.usageHistory.length})`}
                    </div>
                    {c.usageHistory.length === 0
                      ? <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>No usage recorded.</div>
                      : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Date', 'Qty', 'Lot', 'Study / patient ref', 'Used by'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '4px 10px 4px 0', fontWeight: 600, color: 'var(--ink-3)', fontSize: 11 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {c.usageHistory.slice(0, 5).map((u, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td className="muted" style={{ padding: '5px 10px 5px 0' }}>{fmtDate(u.date)}</td>
                                <td style={{ padding: '5px 10px 5px 0', fontWeight: 600 }}>{u.qty} {c.unit}{u.qty !== 1 ? 's' : ''}</td>
                                <td style={{ padding: '5px 10px 5px 0' }}><span className="mono" style={{ fontSize: 11 }}>{u.lotNo}</span></td>
                                <td className="muted" style={{ padding: '5px 10px 5px 0' }}>{u.studyRef || '—'}</td>
                                <td className="muted" style={{ padding: '5px 10px 5px 0' }}>{u.by}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    }
                  </div>
                );
              })()}
            </div>
          </>
        );
      })()}

      {/* ── Equipment form drawer ── */}
      <Drawer open={formTarget !== null} onClose={() => setFormTarget(null)}>
        <EquipmentFormDrawer
          eq={isEdit ? formTarget : null}
          items={equipment}
          onSave={handleSaveEquipment}
          onClose={() => setFormTarget(null)}
        />
      </Drawer>

      {/* ── Equipment detail drawer ── */}
      <Drawer open={!!detailId} onClose={() => setDetailId(null)}>
        {detailEq && (
          <EquipmentDetailDrawer
            key={detailEq.id}
            eq={detailEq}
            onUpdate={handleUpdateEquipment}
            onClose={() => setDetailId(null)}
            onOpenHstDispatch={() => { setDetailId(null); setHstDispatchEq(detailEq); }}
            onOpenHstReturn={()   => { setDetailId(null); setHstReturnEq(detailEq);   }}
          />
        )}
      </Drawer>

      {/* ── HST dispatch drawer ── */}
      <Drawer open={!!hstDispatchEq} onClose={() => setHstDispatchEq(null)}>
        {hstDispatchEq && (
          <HstDispatchDrawer
            key={hstDispatchEq.id + '-dispatch'}
            eq={hstDispatchEq}
            onUpdate={eq => { handleUpdateEquipment(eq); setHstDispatchEq(null); }}
            onClose={() => setHstDispatchEq(null)}
            patients={SEED_PATIENTS}
          />
        )}
      </Drawer>

      {/* ── HST return drawer ── */}
      <Drawer open={!!hstReturnEq} onClose={() => setHstReturnEq(null)}>
        {hstReturnEq && (
          <HstReturnDrawer
            key={hstReturnEq.id + '-return'}
            eq={hstReturnEq}
            onUpdate={eq => { handleUpdateEquipment(eq); setHstReturnEq(null); }}
            onClose={() => setHstReturnEq(null)}
          />
        )}
      </Drawer>

      {/* ── Consumable form drawer ── */}
      <Drawer open={conFormTarget !== null} onClose={() => setConFormTarget(null)}>
        {conFormTarget !== null && (
          <ConsumableFormDrawer
            consumable={conFormTarget?.sku ? conFormTarget : null}
            onSave={handleSaveConsumable}
            onClose={() => setConFormTarget(null)}
          />
        )}
      </Drawer>

      {/* ── Receive stock drawer ── */}
      <Drawer open={!!stockReceiveCon} onClose={() => setStockReceiveCon(null)}>
        {stockReceiveCon && (
          <StockReceiveDrawer
            key={stockReceiveCon.sku + '-receive'}
            consumable={stockReceiveCon}
            onReceive={data => handleReceiveStock(stockReceiveCon.sku, data)}
            onClose={() => setStockReceiveCon(null)}
          />
        )}
      </Drawer>

      {/* ── Record usage drawer ── */}
      <Drawer open={!!stockUseCon} onClose={() => setStockUseCon(null)}>
        {stockUseCon && (
          <StockUseDrawer
            key={stockUseCon.sku + '-use'}
            consumable={stockUseCon}
            onUse={data => handleRecordUsage(stockUseCon.sku, data)}
            onClose={() => setStockUseCon(null)}
          />
        )}
      </Drawer>

      {/* ── Place order drawer ── */}
      <Drawer open={!!placingOrderCon} onClose={() => setPlacingOrderCon(null)}>
        {placingOrderCon && (
          <PlaceOrderDrawer
            key={placingOrderCon.sku + '-order'}
            consumable={placingOrderCon}
            onOrder={data => handlePlaceOrder(placingOrderCon.sku, data)}
            onClose={() => setPlacingOrderCon(null)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default EquipmentPage;
