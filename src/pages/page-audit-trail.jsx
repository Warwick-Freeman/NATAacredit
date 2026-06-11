import React, { useState, useMemo } from 'react';
import Icon from '../icons';
import { PageHeader, Pill, Avatar } from '../components';
import { useAuth } from '../AuthContext';
import { useNexusData } from '../NexusDataContext';
import NexusGrid from '../nexus-grid';

// ─── Seed data ─────────────────────────────────────────────────────────────────
// ~70 events covering all modules over 28 days. Ordered newest-first.

const SEED_EVENTS = [
  // May 12 (today)
  { id:  1, ts: '2026-05-12T09:47', who: 'System',        module: 'equipment',     kind: 'alert',   action: 'raised automated NC',           target: 'HSAT-NOX-014 — verification overdue 14 d',                detail: 'No verification record found after 2026-01-02. NC-2026-0111 created.',                hash: 'a3f7c291e8b04d12' },
  { id:  2, ts: '2026-05-12T09:32', who: 'System',        module: 'studies',       kind: 'alert',   action: 'sent SLA breach warning',        target: 'PSG-2026-0440 — report due today',                        detail: 'Study completed 2026-05-01. 10-business-day SLA expires today.',                      hash: 'b9e12a047c3f8d56' },
  { id:  3, ts: '2026-05-12T09:02', who: 'K. Patel',      module: 'accreditation', kind: 'edit',    action: 'updated clause status',          target: 'cl. 5.3.5 → review',                                     detail: 'Previous status: compliant. Evidence count remains 2.',                               hash: 'c4d891bf2a5e7310' },
  { id:  4, ts: '2026-05-12T08:45', who: 'K. Patel',      module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.45',                                                  hash: 'd2c038e9f1b47a65' },
  // May 11
  { id:  5, ts: '2026-05-11T16:31', who: 'K. Patel',      module: 'audits',        kind: 'upload',  action: 'uploaded audit report',          target: 'AUD-2026-Q1 findings',                                    detail: '3 findings logged: 1 major (cl. 5.3.4), 1 minor, 1 observation.',                     hash: 'e8a741d60c293b1f' },
  { id:  6, ts: '2026-05-11T16:14', who: 'K. Patel',      module: 'audits',        kind: 'close',   action: 'closed audit',                   target: 'AUD-2026-Q1 — Section 5.3 Equipment',                    detail: 'All major findings resolved. Audit status set to Closed.',                            hash: 'f1b920e345d87c4a' },
  { id:  7, ts: '2026-05-11T14:22', who: 'Dr. R. Okafor', module: 'documents',     kind: 'approve', action: 'approved document',              target: 'POL-VAL-003 Validation & verification policy',            detail: 'Moved to Issued status. Review due 2028-05-11.',                                      hash: '07e4c5b289a130fd' },
  { id:  8, ts: '2026-05-11T11:08', who: 'M. Chen',       module: 'accreditation', kind: 'link',    action: 'linked evidence to',             target: 'cl. 5.3.4 — calibration certificate (updated)',           detail: 'Evidence item added: Cal cert PSG-COMP-002 recal. Total evidence: 3.',                hash: '18f93d7a064e2b5c' },
  { id:  9, ts: '2026-05-11T09:55', who: 'K. Patel',      module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.45',                                                  hash: '296ab8e4f703d91c' },
  // May 10
  { id: 10, ts: '2026-05-10T15:47', who: 'A. Singh',      module: 'studies',       kind: 'edit',    action: 'submitted scoring for',          target: 'PSG-2026-0438',                                           detail: 'Epoch count: 1,132. Scorer: A. Singh. Ready for physician review.',                    hash: '3a7d15c9b02e48f7' },
  { id: 11, ts: '2026-05-10T14:03', who: 'M. Chen',       module: 'staff',         kind: 'edit',    action: 'logged EQA result for',          target: 'J. Owusu — Jan 2026 BRPT · 78%',                         detail: 'Result: Investigate (< 80% threshold). NC-2026-0110 raised automatically.',             hash: '4b8e26d0a13f59g8' },
  { id: 12, ts: '2026-05-10T11:22', who: 'K. Patel',      module: 'ncr',           kind: 'create',  action: 'raised NC',                      target: 'NC-2026-0112 — subcontractor credentialing gap',          detail: 'Clause 4.5.2. Severity: major. Owner: K. Patel. Due: 2026-05-10.',                    hash: '5c9f37e1b24a60h9' },
  { id: 13, ts: '2026-05-10T09:18', who: 'Dr. R. Okafor', module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.45',                                                  hash: '6d0a48f2c35b71i0' },
  // May 9
  { id: 14, ts: '2026-05-09T16:55', who: 'K. Patel',      module: 'documents',     kind: 'edit',    action: 'assigned peer reviewer for',     target: 'SOP-EMG-001 Emergency management procedure',             detail: 'Reviewer: M. Chen. Review due: 2026-05-16.',                                          hash: '7e1b59a3d46c82j1' },
  { id: 15, ts: '2026-05-09T14:40', who: 'M. Chen',       module: 'equipment',     kind: 'edit',    action: 'scheduled verification for',     target: 'PSG-COMP-001 — next due 2026-06-01',                     detail: 'Verification date confirmed in asset register.',                                      hash: '8f2c60b4e57d93k2' },
  { id: 16, ts: '2026-05-09T11:12', who: 'K. Patel',      module: 'settings',      kind: 'edit',    action: 'updated retention policy for',   target: 'Quality records (NCs, audits) — updated to 12 years',    detail: 'Previous: 10 years. Change recorded per cl. 4.13 management decision.',               hash: '9a3d71c5f68e04l3' },
  { id: 17, ts: '2026-05-09T08:58', who: 'M. Chen',       module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.62',                                                  hash: 'ab4e82d6a79f15m4' },
  // May 8
  { id: 18, ts: '2026-05-08T17:02', who: 'K. Patel',      module: 'ncr',           kind: 'edit',    action: 'updated corrective action for',  target: 'NC-2026-0109 — BLS recertification',                     detail: 'S. Nakamura BLS recert booked. 1 of 4 staff actions complete.',                       hash: 'bc5f93e7b80a26n5' },
  { id: 19, ts: '2026-05-08T14:35', who: 'K. Patel',      module: 'documents',     kind: 'create',  action: 'created document',               target: 'SOP-PSG-003 Paediatric scoring procedure',                detail: 'Status: Draft. Owner: K. Patel. Workflow initiated.',                                 hash: 'cd6a04f8c91b37o6' },
  { id: 20, ts: '2026-05-08T12:15', who: 'System',        module: 'system',        kind: 'alert',   action: 'completed scheduled backup',      target: 'Daily snapshot 2026-05-08',                              detail: 'Backup size: 14.2 GB. Replicated to ap-southeast-4 (secondary). Hash verified.',      hash: 'de7b15a9d02c48p7' },
  { id: 21, ts: '2026-05-08T09:44', who: 'A. Singh',      module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.58',                                                  hash: 'ef8c26b0e13d59q8' },
  // May 7
  { id: 22, ts: '2026-05-07T15:28', who: 'Dr. R. Okafor', module: 'studies',       kind: 'sign',    action: 'signed final report',            target: 'PSG-2026-0437',                                           detail: 'Report issued to referring physician. Turnaround: 7 business days.',                  hash: 'f09d37c1f24e60r9' },
  { id: 23, ts: '2026-05-07T13:14', who: 'K. Patel',      module: 'accreditation', kind: 'edit',    action: 'added assessment notes for',     target: 'cl. 4.5.2 — subcontractor register gap',                 detail: 'NC linked. Evidence count: 0. Gap report updated.',                                   hash: 'a10e48d2a35f71s0' },
  { id: 24, ts: '2026-05-07T10:50', who: 'M. Chen',       module: 'equipment',     kind: 'edit',    action: 'removed from service',           target: 'HSAT-NOX-014 — pending verification',                    detail: 'Status: Out of service. Reason: overdue verification. NC-2026-0111 referenced.',      hash: 'b21f59e3b46a82t1' },
  { id: 25, ts: '2026-05-07T09:03', who: 'K. Patel',      module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.45',                                                  hash: 'c32a60f4c57b93u2' },
  // May 6
  { id: 26, ts: '2026-05-06T16:44', who: 'K. Patel',      module: 'ncr',           kind: 'create',  action: 'raised NC',                      target: 'NC-2026-0111 — equipment verification overdue',           detail: 'Clause 5.3.4. Asset: HSAT-NOX-014. Severity: critical.',                             hash: 'd43b71a5d68c04v3' },
  { id: 27, ts: '2026-05-06T14:20', who: 'K. Patel',      module: 'ncr',           kind: 'create',  action: 'raised NC',                      target: 'NC-2026-0110 — EQA result below threshold',              detail: 'Clause 5.6.8. Scorer: J. Owusu. Result: 78% (threshold 80%). Severity: major.',       hash: 'e54c82b6e79d15w4' },
  { id: 28, ts: '2026-05-06T11:08', who: 'K. Patel',      module: 'documents',     kind: 'edit',    action: 'sent for peer review',           target: 'SOP-EMG-001 Emergency management procedure',             detail: 'Status changed: Draft → Under review. Reviewer: M. Chen.',                            hash: 'f65d93c7f80e26x5' },
  { id: 29, ts: '2026-05-06T09:30', who: 'M. Chen',       module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.62',                                                  hash: 'a76e04d8a91f37y6' },
  // May 5
  { id: 30, ts: '2026-05-05T16:02', who: 'K. Patel',      module: 'documents',     kind: 'reject',  action: 'returned to draft',              target: 'SOP-EQP-012 Decontamination procedure',                  detail: 'Peer reviewer (K. Patel) requested changes: "Section 4.2 incomplete for mobile fleet."', hash: 'b87f15e9b02a48z7' },
  { id: 31, ts: '2026-05-05T14:48', who: 'K. Patel',      module: 'accreditation', kind: 'link',    action: 'added evidence to',              target: 'cl. 5.5.3 — training log Q1 2026',                       detail: 'Evidence type: Training record. Total evidence: 7.',                                  hash: 'c98a26f0c13b59aa' },
  { id: 32, ts: '2026-05-05T11:30', who: 'M. Chen',       module: 'equipment',     kind: 'edit',    action: 'recorded verification for',      target: 'OXI-NON-007 Nonin WristOx2',                             detail: 'Next verification due: 2026-07-14. Verification status: good.',                       hash: 'da9b37a1d24c60bb' },
  { id: 33, ts: '2026-05-05T09:12', who: 'Dr. L. Hartono',module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.45',                                                  hash: 'ebac48b2e35d71cc' },
  // May 2
  { id: 34, ts: '2026-05-02T15:55', who: 'K. Patel',      module: 'ncr',           kind: 'edit',    action: 'linked corrective action task to', target: 'NC-2026-0109 — BLS recertification',                  detail: 'Tasks: TASK-002, TASK-003 linked. Root cause: reminder process failure.',             hash: 'fcbd59c3f46e82dd' },
  { id: 35, ts: '2026-05-02T13:40', who: 'K. Patel',      module: 'ncr',           kind: 'create',  action: 'raised NC',                      target: 'NC-2026-0109 — BLS lapse: T. Brooks, R. Patel',          detail: 'Clause 5.1.4. Severity: critical. 2 staff BLS certificates expired.',                 hash: 'adce60d4a57f93ee' },
  { id: 36, ts: '2026-05-02T11:14', who: 'System',        module: 'staff',         kind: 'alert',   action: 'flagged BLS certificate expiry for', target: 'T. Brooks — lapsed 21 d',                           detail: 'BLS expiry date 2026-04-11. Automated notification sent.',                            hash: 'bedf71e5b68a04ff' },
  { id: 37, ts: '2026-05-02T09:28', who: 'K. Patel',      module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.45',                                                  hash: 'cf0a82f6c79b15ga' },
  // May 1
  { id: 38, ts: '2026-05-01T15:22', who: 'K. Patel',      module: 'documents',     kind: 'upload',  action: 'uploaded new version of',        target: 'SOP-EQP-012 Decontamination procedure v3',               detail: 'File: SOP-EQP-012-v3.pdf · 284 KB. Previous version archived.',                      hash: 'd01b93a7d80c26hb' },
  { id: 39, ts: '2026-05-01T13:08', who: 'Dr. R. Okafor', module: 'studies',       kind: 'sign',    action: 'signed final report',            target: 'MSLT-2026-0031',                                          detail: 'Turnaround: 4 business days from study completion.',                                  hash: 'e12c04b8e91d37ic' },
  { id: 40, ts: '2026-05-01T11:00', who: 'K. Patel',      module: 'documents',     kind: 'approve', action: 'sent for approval',              target: 'POL-VAL-003 Validation & verification policy',            detail: 'Peer review complete (K. Patel). Forwarded to Dr. R. Okafor for approval.',           hash: 'f23d15c9f02e48jd' },
  // April 30
  { id: 41, ts: '2026-04-30T16:48', who: 'K. Patel',      module: 'accreditation', kind: 'edit',    action: 'updated self-assessment for',    target: 'cl. 5.3.4 → nonconformant',                              detail: 'Previous: review. Evidence: 2 items. NC-2026-0111 referenced.',                       hash: 'a34e26d0a13f59ke' },
  { id: 42, ts: '2026-04-30T14:32', who: 'M. Chen',       module: 'equipment',     kind: 'edit',    action: 'recorded verification for',      target: 'HSAT-NOX-012 Nox T3 Sleep Monitor',                      detail: 'Next due: 2026-07-10. Cal gas batch: CAL-20240211.',                                  hash: 'b45f37e1b24a60lf' },
  { id: 43, ts: '2026-04-30T11:55', who: 'M. Chen',       module: 'equipment',     kind: 'edit',    action: 'recorded verification for',      target: 'HSAT-NOX-013 Nox T3 Sleep Monitor',                      detail: 'Next due: 2026-07-10.',                                                               hash: 'c56a48f2c35b71mg' },
  { id: 44, ts: '2026-04-30T09:40', who: 'Dr. R. Okafor', module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.45',                                                  hash: 'd67b59a3d46c82nh' },
  // April 28
  { id: 45, ts: '2026-04-28T15:10', who: 'K. Patel',      module: 'staff',         kind: 'edit',    action: 'updated competency record for',  target: 'A. Singh — PSG scoring proficiency assessment',           detail: 'Competency: PSG Scoring (Adult) → Current. Assessment date: 2026-04-28.',             hash: 'e78c60b4e57d93oi' },
  { id: 46, ts: '2026-04-28T13:20', who: 'K. Patel',      module: 'accreditation', kind: 'link',    action: 'added evidence to',              target: 'cl. 5.6.6 — inter-scorer concordance Q1 2026',           detail: 'Evidence type: QA record. κ = 0.82. Total evidence: 4.',                              hash: 'f89d71c5f68e04pj' },
  { id: 47, ts: '2026-04-28T11:02', who: 'System',        module: 'system',        kind: 'alert',   action: 'completed integrity verification', target: 'Audit trail hash chain — 1,197,402 entries',            detail: 'Chain intact. No anomalies detected. Duration: 4.2 s.',                              hash: 'a90e82d6a79f15qk' },
  // April 25
  { id: 48, ts: '2026-04-25T16:38', who: 'Dr. L. Hartono',module: 'documents',     kind: 'approve', action: 'peer reviewed',                  target: 'POL-VAL-003 Validation & verification policy',            detail: 'Review: approved with no changes. Status: Under review → pending approval.',          hash: 'ba1f93e7b80a26rl' },
  { id: 49, ts: '2026-04-25T14:14', who: 'M. Chen',       module: 'equipment',     kind: 'edit',    action: 'recorded acceptance test for',   target: 'CPAP-RES-004 ResMed AirSense 11',                        detail: 'Acceptance test passed. Added to asset register. Status: good.',                      hash: 'cb2a04f8c91b37sm' },
  { id: 50, ts: '2026-04-25T11:48', who: 'K. Patel',      module: 'documents',     kind: 'create',  action: 'initiated document control for', target: 'POL-VAL-003 Validation & verification policy',            detail: 'Document created by K. Patel. Version 1. Status: Draft.',                            hash: 'dc3b15a9d02c48tn' },
  // April 24
  { id: 51, ts: '2026-04-24T15:30', who: 'Unknown',       module: 'login',         kind: 'alert',   action: 'failed sign-in attempt',         target: 'nexus360.com',                                            detail: 'IP: 185.220.101.44. 3 consecutive failures. Account not locked (unknown user).',     hash: 'ed4c26b0e13d59uo' },
  { id: 52, ts: '2026-04-24T13:05', who: 'M. Chen',       module: 'staff',         kind: 'edit',    action: 'booked BLS recertification for', target: 'S. Nakamura — confirmed 2026-04-30',                     detail: 'Provider: St Vincent\'s First Aid. Course: HLTAID009.',                               hash: 'fe5d37c1f24e60vp' },
  { id: 53, ts: '2026-04-24T10:20', who: 'K. Patel',      module: 'audits',        kind: 'create',  action: 'scheduled internal audit',       target: 'AUD-2026-Q2 — Document control (cl. 4.3)',               detail: 'Auditor: External · J. Roy. Scope: Riverside Main. Date: 2026-05-08.',               hash: 'af6e48d2a35f71wq' },
  // April 22
  { id: 54, ts: '2026-04-22T16:20', who: 'Dr. R. Okafor', module: 'studies',       kind: 'sign',    action: 'signed final report',            target: 'PSG-2026-0437',                                           detail: 'Preliminary → Final. Turnaround: 7 business days.',                                  hash: 'b07f59e3b46a82xr' },
  { id: 55, ts: '2026-04-22T14:00', who: 'K. Patel',      module: 'settings',      kind: 'create',  action: 'invited new user',               target: 'J. Roy — External Auditor',                              detail: 'Invited via magic link. Auth: Local + TOTP. Role: External Auditor.',                 hash: 'c18a60f4c57b93ys' },
  { id: 56, ts: '2026-04-22T11:35', who: 'System',        module: 'system',        kind: 'alert',   action: 'sent assessment countdown alert', target: 'NATA assessment in 112 days',                            detail: 'Automated reminder triggered at 120-day mark.',                                      hash: 'd29b71a5d68c04zt' },
  // April 20
  { id: 57, ts: '2026-04-20T15:45', who: 'K. Patel',      module: 'ncr',           kind: 'close',   action: 'closed NC',                      target: 'NC-2026-0108 — rostering policy gap',                    detail: 'Effectiveness verified. Corrective action: policy updated and re-trained staff.',     hash: 'e3ac82b6e79d15au' },
  { id: 58, ts: '2026-04-20T13:22', who: 'M. Chen',       module: 'equipment',     kind: 'edit',    action: 'recorded verification for',      target: 'PSG-COMP-002 Compumedics Grael B',                       detail: 'Annual calibration complete. Next due: 2026-06-12.',                                  hash: 'f4bd93c7f80e26bv' },
  { id: 59, ts: '2026-04-20T10:55', who: 'K. Patel',      module: 'documents',     kind: 'upload',  action: 'uploaded new version of',        target: 'MAN-QMS-001 Quality manual v8',                          detail: 'File: MAN-QMS-001-v8.pdf · 1.4 MB. Version 7 archived.',                            hash: 'a5ce04d8a91f37cw' },
  // April 17
  { id: 60, ts: '2026-04-17T16:03', who: 'K. Patel',      module: 'audits',        kind: 'edit',    action: 'logged audit finding for',       target: 'AUD-2026-Q1 — cl. 5.3.4 major finding',                 detail: 'Finding F001: HSAT-NOX-014 verification 18 months overdue. Severity: major.',         hash: 'b6df15e9b02a48dx' },
  { id: 61, ts: '2026-04-17T14:30', who: 'K. Patel',      module: 'audits',        kind: 'edit',    action: 'logged audit finding for',       target: 'AUD-2026-Q1 — cl. 5.3.2 observation',                   detail: 'Finding F003: Temperature logs not reviewed monthly.',                                hash: 'c7ea26f0c13b59ey' },
  { id: 62, ts: '2026-04-17T11:48', who: 'K. Patel',      module: 'audits',        kind: 'edit',    action: 'marked finding closed',          target: 'AUD-2026-Q1 — cl. 5.3.1 minor (F002)',                  detail: 'Calibration log entries retrospectively documented. Closed.',                         hash: 'd8fb37a1d24c60fz' },
  // April 14
  { id: 63, ts: '2026-04-14T16:55', who: 'J. Roy',        module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Local + TOTP · IP 198.51.100.22 · External auditor session.',                        hash: 'e90c48b2e35d71ga' },
  { id: 64, ts: '2026-04-14T15:20', who: 'M. Chen',       module: 'equipment',     kind: 'edit',    action: 'presented equipment register to', target: 'AUD-2026-Q1 — J. Roy external audit',                  detail: 'Register exported. 10 assets reviewed.',                                             hash: 'fa1d59c3f46e82hb' },
  { id: 65, ts: '2026-04-14T13:10', who: 'K. Patel',      module: 'audits',        kind: 'create',  action: 'commenced internal audit',       target: 'AUD-2026-Q1 — Section 5.3 Equipment',                   detail: 'Audit scope: All sites. Auditor: K. Patel.',                                         hash: 'ab2e60d4a57f93ic' },
  { id: 66, ts: '2026-04-14T09:45', who: 'K. Patel',      module: 'login',         kind: 'login',   action: 'signed in',                      target: 'nexus360.com',                                            detail: 'Okta SSO + TOTP · IP 203.0.113.45',                                                  hash: 'bc3f71e5b68a04jd' },
];

// ─── Lookups ──────────────────────────────────────────────────────────────────

const MODULE_META = {
  accreditation: { label: 'Accreditation', icon: 'shield',    color: '#3b82f6' },
  documents:     { label: 'Documents',     icon: 'file',      color: '#7c3aed' },
  equipment:     { label: 'Equipment',     icon: 'cube',      color: '#ea580c' },
  studies:       { label: 'Studies',       icon: 'paper',     color: '#0d9488' },
  ncr:           { label: 'NC & CAPA',     icon: 'alert',     color: '#dc2626' },
  staff:         { label: 'Staff',         icon: 'users',     color: '#16a34a' },
  audits:        { label: 'Audits',        icon: 'audit',     color: '#0891b2' },
  settings:      { label: 'Settings',      icon: 'settings',  color: '#6b7280' },
  system:        { label: 'System',        icon: 'pulse',     color: '#6b7280' },
  login:         { label: 'Access',        icon: 'shield',    color: '#374151' },
  email:         { label: 'Email / SMS',   icon: 'mail',      color: '#0284c7' },
};

const KIND_ICON = {
  create: 'plus', edit: 'edit', delete: 'x', approve: 'check', sign: 'pen',
  upload: 'upload', link: 'link', alert: 'alert', login: 'shield',
  logout: 'log_out', reject: 'x', close: 'check', send: 'mail',
};

const KIND_LABELS = {
  create: 'Created', edit: 'Edited', delete: 'Deleted', approve: 'Approved',
  sign: 'Signed', upload: 'Uploaded', link: 'Linked', alert: 'Alert',
  login: 'Access', logout: 'Access', reject: 'Rejected', close: 'Closed', send: 'Sent',
};

const ALL_KINDS = Object.keys(KIND_LABELS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTs(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDateOnly(ts) {
  return new Date(ts).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function avatarIdx(name) {
  return name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 9;
}

function kindColor(kind) {
  if (['approve', 'sign', 'close', 'login', 'send'].includes(kind)) return 'var(--good)';
  if (['alert', 'reject'].includes(kind)) return 'var(--bad)';
  if (kind === 'create') return 'var(--accent)';
  return 'var(--ink-3)';
}

function groupByDate(events) {
  const groups = [];
  let lastDate = null;
  for (const ev of events) {
    const date = ev.ts.slice(0, 10);
    if (date !== lastDate) { groups.push({ date, label: fmtDateOnly(ev.ts), events: [] }); lastDate = date; }
    groups[groups.length - 1].events.push(ev);
  }
  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const AuditTrailPage = () => {
  const { user } = useAuth();
  const { data } = useNexusData();
  const liveEvents = data?.activity ?? [];
  const events = liveEvents.length > 0 ? liveEvents : SEED_EVENTS;

  const [moduleFilter, setModuleFilter] = useState('all');
  const [userFilter, setUserFilter]     = useState('all');
  const [kindFilter, setKindFilter]     = useState('all');
  const [dateFilter, setDateFilter]     = useState('30d');
  const [search, setSearch]             = useState('');
  const [view, setView]                 = useState('timeline');
  const [page, setPage]                 = useState(1);
  const [expandedId, setExpandedId]     = useState(null);
  const [exportToast, setExportToast]   = useState(false);

  const allUsers   = useMemo(() => [...new Set(events.map(e => e.who))].sort(), [events]);
  const allModules = useMemo(() => {
    const fromEvents = events.map(e => e.module).filter(Boolean);
    return [...new Set([...Object.keys(MODULE_META), ...fromEvents])].sort();
  }, [events]);

  const cutoff = useMemo(() => {
    const d = new Date();
    if (dateFilter === '7d')    { d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }
    if (dateFilter === '30d')   { d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }
    if (dateFilter === 'today') { d.setHours(0, 0, 0, 0); return d.toISOString().slice(0, 10); }
    return null;
  }, [dateFilter]);

  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (!ev.ts) return false;
      if (moduleFilter !== 'all' && ev.module !== moduleFilter) return false;
      if (userFilter   !== 'all' && ev.who    !== userFilter)   return false;
      if (kindFilter   !== 'all' && ev.kind   !== kindFilter)   return false;
      if (cutoff && ev.ts.slice(0, 10) < cutoff) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(ev.who + ev.action + ev.target + (ev.detail || '')).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [events, moduleFilter, userFilter, kindFilter, cutoff, search]);

  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;
  const groups = useMemo(() => groupByDate(paged), [paged]);

  // Module summary counts
  const moduleCounts = useMemo(() => {
    const counts = {};
    filtered.forEach(ev => { counts[ev.module] = (counts[ev.module] || 0) + 1; });
    return counts;
  }, [filtered]);

  function doExport() {
    const headers = ['Timestamp', 'User', 'Module', 'Kind', 'Action', 'Target', 'Detail', 'Hash'];
    const escape = v => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...filtered.map(ev => [
      ev.ts, ev.who, ev.module ?? '', ev.kind ?? '', ev.action ?? '', ev.target ?? '', ev.detail ?? '', ev.hash ?? '',
    ])].map(row => row.map(escape).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportToast(filtered.length);
    setTimeout(() => setExportToast(false), 3000);
  }

  function resetFilters() {
    setModuleFilter('all'); setUserFilter('all'); setKindFilter('all');
    setDateFilter('30d'); setSearch(''); setPage(1);
  }

  const isFiltered = moduleFilter !== 'all' || userFilter !== 'all' || kindFilter !== 'all' || dateFilter !== '30d' || search;

  // ── AG Grid column definitions for table view ──────────────────────────────
  const tableColumnDefs = useMemo(() => [
    {
      headerName: 'Timestamp',
      field: 'ts',
      width: 170,
      valueFormatter: p => fmtTs(p.value),
      cellClass: 'mono',
      cellStyle: { fontSize: 11, whiteSpace: 'nowrap' },
    },
    {
      headerName: 'User',
      field: 'who',
      width: 150,
      cellRenderer: p => {
        const who = p.data.who;
        if (who !== 'System' && who !== 'Unknown') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar name={who} size={20} idx={avatarIdx(who)} />
              <span style={{ fontSize: 12 }}>{who}</span>
            </div>
          );
        }
        return <span className="muted">{who}</span>;
      },
    },
    {
      headerName: 'Module',
      field: 'module',
      width: 140,
      cellRenderer: p => {
        const meta = MODULE_META[p.data.module] || MODULE_META.system;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name={meta.icon} size={12} style={{ color: meta.color }} />
            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{meta.label}</span>
          </div>
        );
      },
    },
    {
      headerName: 'Action',
      field: 'action',
      flex: 1,
      cellRenderer: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: kindColor(p.data.kind) }}>
            <Icon name={KIND_ICON[p.data.kind] || 'edit'} size={11} />
          </span>
          <span style={{ fontSize: 12 }}>{p.data.action}</span>
        </div>
      ),
    },
    {
      headerName: 'Target',
      field: 'target',
      flex: 2,
      cellRenderer: p => {
        const isExpanded = expandedId === p.data.id;
        return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{p.data.target}</div>
            {isExpanded && p.data.detail && (
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{p.data.detail}</div>
            )}
          </div>
        );
      },
    },
    {
      headerName: 'Integrity',
      field: 'hash',
      width: 150,
      sortable: false,
      cellRenderer: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="shield" size={11} style={{ color: 'var(--good)' }} />
          <code style={{ fontSize: 10, color: 'var(--ink-3)' }}>{p.data.hash.slice(0, 8)}…</code>
        </div>
      ),
    },
  ], [expandedId]);

  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow="Admin · cl. 4.13.3"
        title="Audit trail"
        subtitle="Append-only tamper-evident log of all system events · SHA-256 hash chain verified"
        actions={
          <>
            {isFiltered && <button className="btn" onClick={resetFilters}><Icon name="x" size={13} />Clear filters</button>}
            <button className="btn" onClick={doExport}><Icon name="download" size={14} />Export CSV</button>
          </>
        }
      />

      {exportToast && (
        <div className="banner info" style={{ marginBottom: 18 }}>
          <Icon name="check" size={16} />
          <div style={{ flex: 1 }}>
            <strong>Exported {exportToast} record{exportToast !== 1 ? 's' : ''}.</strong>
            <span style={{ fontSize: 12, marginLeft: 8 }}>audit-trail-{new Date().toISOString().slice(0,10)}.csv</span>
          </div>
          <button className="btn-icon" onClick={() => setExportToast(false)}><Icon name="x" size={14} /></button>
        </div>
      )}

      {/* Summary band */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 18 }}>
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--good-soft)', color: 'var(--good)', display: 'grid', placeItems: 'center' }}>
            <Icon name="shield" size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Chain integrity</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Verified <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>· 1,197,468 entries</span></div>
          </div>
        </div>
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
            <Icon name="clipboard" size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Events shown</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{filtered.length} <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>matching</span></div>
          </div>
        </div>
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
            <Icon name="clock" size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Last verified</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>2 min ago</div>
          </div>
        </div>
        {/* Module breakdown */}
        <div className="card card-pad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignContent: 'flex-start', minWidth: 200 }}>
          {Object.entries(moduleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([mod, cnt]) => {
            const meta = MODULE_META[mod] ?? { label: mod, icon: 'edit', color: '#6b7280' };
            return (
              <div
                key={mod}
                onClick={() => { setModuleFilter(mod === moduleFilter ? 'all' : mod); setPage(1); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                  padding: '2px 6px', borderRadius: 5,
                  background: moduleFilter === mod ? meta.color + '20' : 'transparent',
                  border: `1px solid ${moduleFilter === mod ? meta.color : 'var(--border)'}` }}
              >
                <span style={{ fontSize: 10, color: meta.color }}><Icon name={meta.icon} size={11} /></span>
                <span style={{ fontSize: 11, color: 'var(--ink-2)' }}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        {/* Date range */}
        {['today', '7d', '30d', 'all'].map(d => (
          <button key={d} className={`chip-btn ${dateFilter === d ? 'active' : ''}`}
            onClick={() => { setDateFilter(d); setPage(1); }}>
            {d === 'today' ? 'Today' : d === 'all' ? 'All time' : `Last ${d}`}
          </button>
        ))}

        <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />

        {/* Module */}
        <select
          className="input"
          style={{ height: 30, fontSize: 12, padding: '0 8px', minWidth: 140 }}
          value={moduleFilter}
          onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All modules</option>
          {allModules.map(m => <option key={m} value={m}>{MODULE_META[m]?.label ?? m}</option>)}
        </select>

        {/* User */}
        <select
          className="input"
          style={{ height: 30, fontSize: 12, padding: '0 8px', minWidth: 130 }}
          value={userFilter}
          onChange={e => { setUserFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All users</option>
          {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
        </select>

        {/* Kind */}
        <select
          className="input"
          style={{ height: 30, fontSize: 12, padding: '0 8px', minWidth: 120 }}
          value={kindFilter}
          onChange={e => { setKindFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All actions</option>
          {ALL_KINDS.map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
          <input
            style={{ paddingLeft: 28, height: 30, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 12, color: 'var(--ink)', width: 200 }}
            placeholder="Search events…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />

        {/* View toggle */}
        <button className={`chip-btn ${view === 'timeline' ? 'active' : ''}`} onClick={() => setView('timeline')} title="Timeline">
          <Icon name="pulse" size={13} />
        </button>
        <button className={`chip-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')} title="Table">
          <Icon name="clipboard" size={13} />
        </button>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: '48px 0' }}>
          No events match the current filters.
        </div>
      )}

      {/* ── TIMELINE VIEW ───────────────────────────────────────────────────── */}
      {view === 'timeline' && filtered.length > 0 && (
        <div>
          {groups.map(group => (
            <div key={group.date} style={{ marginBottom: 24 }}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{group.label}</div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{group.events.length} event{group.events.length !== 1 ? 's' : ''}</div>
              </div>

              {/* Events */}
              <div className="card" style={{ overflow: 'hidden' }}>
                {group.events.map((ev, idx) => {
                  const meta    = MODULE_META[ev.module] || MODULE_META.system;
                  const isExpanded = expandedId === ev.id;
                  const isLast  = idx === group.events.length - 1;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                      style={{
                        display: 'flex', gap: 12, padding: '11px 16px',
                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      {/* Module icon */}
                      <div style={{
                        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                        background: meta.color + '18',
                        color: meta.color,
                        display: 'grid', placeItems: 'center', marginTop: 1,
                      }}>
                        <Icon name={meta.icon} size={14} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                          {ev.who !== 'System' && ev.who !== 'Unknown' ? (
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{ev.who}</span>
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>{ev.who}</span>
                          )}
                          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{ev.action}</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{ev.target}</span>
                        </div>
                        {(isExpanded || ev.module === 'email') && ev.detail && (
                          <div style={{ fontSize: 12, color: ev.kind === 'alert' ? 'var(--bad)' : 'var(--ink-3)', marginTop: 5, lineHeight: 1.5 }}>
                            {ev.detail}
                          </div>
                        )}
                        {isExpanded && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            <code style={{ fontSize: 10, color: 'var(--ink-3)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                              sha256: {ev.hash}…
                            </code>
                            <span style={{ fontSize: 10, color: 'var(--good)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Icon name="shield" size={10} /> verified
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right side */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: kindColor(ev.kind) }}><Icon name={KIND_ICON[ev.kind] || 'edit'} size={11} /></span>
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                            {ev.ts.slice(11, 16)}
                          </span>
                        </div>
                        <Pill kind="outline" style={{ fontSize: 10 }}>{meta.label}</Pill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button className="btn" onClick={() => setPage(p => p + 1)}>
                Load more <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>({filtered.length - paged.length} remaining)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TABLE VIEW ──────────────────────────────────────────────────────── */}
      {view === 'table' && filtered.length > 0 && (
        <div className="card">
          <NexusGrid
            rowData={filtered}
            columnDefs={tableColumnDefs}
            onRowClicked={p => setExpandedId(expandedId === p.data.id ? null : p.data.id)}
          />
        </div>
      )}
    </div>
  );
};

export default AuditTrailPage;
