// Mock data for Nexus 360 Accreditation
window.NEXUS_DATA = {
  service: {
    name: "Riverside Sleep & Respiratory Centre",
    abn: "67 412 998 003",
    sites: ["Riverside Main Lab", "Eastside Paediatric Lab", "Home Service – North"],
    nextAssessment: "12 Aug 2026",
    daysToAssessment: 98,
    accreditation: { status: "Accredited", since: "Mar 2022", certNo: "NATA-15847" },
  },

  // Compliance summary by ASA section
  complianceBySection: [
    { id: "4.1", name: "Organisation & Management", total: 18, compliant: 17, partial: 1, nc: 0 },
    { id: "4.2", name: "Quality Management System", total: 12, compliant: 12, partial: 0, nc: 0 },
    { id: "4.3", name: "Document Control", total: 9, compliant: 8, partial: 1, nc: 0 },
    { id: "4.4", name: "Referral Review & Patient Prep", total: 7, compliant: 7, partial: 0, nc: 0 },
    { id: "4.5", name: "Subcontracting", total: 5, compliant: 4, partial: 0, nc: 1 },
    { id: "4.6", name: "External Services & Supplies", total: 4, compliant: 4, partial: 0, nc: 0 },
    { id: "4.7", name: "Feedback", total: 3, compliant: 3, partial: 0, nc: 0 },
    { id: "4.8", name: "Complaints", total: 5, compliant: 5, partial: 0, nc: 0 },
    { id: "4.9", name: "Nonconformities", total: 6, compliant: 5, partial: 1, nc: 0 },
    { id: "4.10", name: "Corrective Action", total: 5, compliant: 5, partial: 0, nc: 0 },
    { id: "4.11", name: "Preventive Action", total: 4, compliant: 4, partial: 0, nc: 0 },
    { id: "4.12", name: "Continual Improvement", total: 3, compliant: 3, partial: 0, nc: 0 },
    { id: "4.13", name: "Quality & Technical Records", total: 11, compliant: 10, partial: 1, nc: 0 },
    { id: "4.14", name: "Evaluation & Audits", total: 8, compliant: 6, partial: 2, nc: 0 },
    { id: "4.15", name: "Management Review", total: 6, compliant: 6, partial: 0, nc: 0 },
    { id: "5.1", name: "Staff", total: 14, compliant: 12, partial: 1, nc: 1 },
    { id: "5.2", name: "Accommodation & Environment", total: 16, compliant: 16, partial: 0, nc: 0 },
    { id: "5.3", name: "Equipment", total: 22, compliant: 19, partial: 2, nc: 1 },
    { id: "5.4", name: "Pre-Study Procedures", total: 8, compliant: 8, partial: 0, nc: 0 },
    { id: "5.5", name: "Service Processes", total: 19, compliant: 17, partial: 2, nc: 0 },
    { id: "5.6", name: "QA & Proficiency", total: 13, compliant: 11, partial: 1, nc: 1 },
    { id: "5.7", name: "Post-Study Care", total: 9, compliant: 9, partial: 0, nc: 0 },
    { id: "5.8", name: "Reporting of Results", total: 12, compliant: 11, partial: 1, nc: 0 },
  ],

  // Featured clauses for the workspace
  clauses: [
    { id: "4.1.4", title: "Documented duties & lines of accountability", section: "4.1", status: "compliant", evidence: 4, lastReviewed: "14 Mar 2026", owner: "K. Patel" },
    { id: "4.1.5", title: "Conflict of interest declarations", section: "4.1", status: "compliant", evidence: 12, lastReviewed: "02 Apr 2026", owner: "K. Patel" },
    { id: "4.1.7", title: "Rostering ratios — adult & paediatric", section: "4.1", status: "partial", evidence: 2, lastReviewed: "08 Jan 2026", owner: "M. Chen" },
    { id: "4.3.2", title: "Master list of controlled documents", section: "4.3", status: "compliant", evidence: 1, lastReviewed: "21 Apr 2026", owner: "K. Patel" },
    { id: "4.3.5", title: "Hand-amendment procedure", section: "4.3", status: "partial", evidence: 1, lastReviewed: "—", owner: "K. Patel" },
    { id: "4.5.2", title: "Subcontractor register & evidence", section: "4.5", status: "nc", evidence: 0, lastReviewed: "—", owner: "K. Patel" },
    { id: "4.14.1", title: "12-month internal audit cycle", section: "4.14", status: "partial", evidence: 3, lastReviewed: "11 Feb 2026", owner: "K. Patel" },
    { id: "4.14.3", title: "Auditor independence", section: "4.14", status: "partial", evidence: 2, lastReviewed: "11 Feb 2026", owner: "K. Patel" },
    { id: "4.15.2", title: "Management review inputs (15 items)", section: "4.15", status: "compliant", evidence: 14, lastReviewed: "28 Mar 2026", owner: "Dr. R. Okafor" },
    { id: "5.1.3", title: "Training records & competency", section: "5.1", status: "partial", evidence: 28, lastReviewed: "12 Mar 2026", owner: "M. Chen" },
    { id: "5.1.4", title: "Annual BLS competence", section: "5.1", status: "nc", evidence: 22, lastReviewed: "—", owner: "M. Chen" },
    { id: "5.3.2", title: "Acceptance testing on installation", section: "5.3", status: "compliant", evidence: 8, lastReviewed: "30 Mar 2026", owner: "M. Chen" },
    { id: "5.3.4", title: "Verification programme & trends", section: "5.3", status: "partial", evidence: 14, lastReviewed: "02 Apr 2026", owner: "M. Chen" },
    { id: "5.3.6", title: "Adverse-incident reporting", section: "5.3", status: "nc", evidence: 1, lastReviewed: "—", owner: "M. Chen" },
    { id: "5.3.7", title: "Equipment register fields", section: "5.3", status: "compliant", evidence: 1, lastReviewed: "05 Apr 2026", owner: "M. Chen" },
    { id: "5.6.4", title: "Quality indicator catalogue", section: "5.6", status: "compliant", evidence: 9, lastReviewed: "15 Mar 2026", owner: "K. Patel" },
    { id: "5.6.8", title: "External proficiency testing 2x/yr", section: "5.6", status: "partial", evidence: 6, lastReviewed: "20 Feb 2026", owner: "Dr. R. Okafor" },
    { id: "5.8.1", title: "10 business-day reporting SLA", section: "5.8", status: "compliant", evidence: 1, lastReviewed: "today", owner: "Dr. R. Okafor" },
    { id: "5.8.7", title: "Mandatory report contents", section: "5.8", status: "compliant", evidence: 4, lastReviewed: "11 Apr 2026", owner: "Dr. R. Okafor" },
    { id: "5.8.11", title: "Amended report retention", section: "5.8", status: "partial", evidence: 2, lastReviewed: "01 Mar 2026", owner: "Dr. R. Okafor" },
  ],

  // Quality indicators
  indicators: [
    { id: "kpi-1", name: "Reports within 10 business days", value: 94.2, unit: "%", target: ">= 95%", status: "warn", trend: [88,90,91,93,92,94,95,93,94,94,93,94], phase: "post" },
    { id: "kpi-2", name: "CPAP adherence ≥4h/night @ 90d", value: 71, unit: "%", target: ">= 65%", status: "good", trend: [62,64,68,70,72,71,73,72,71,71,70,71], phase: "post" },
    { id: "kpi-3", name: "Inter-observer concordance (κ)", value: 0.82, unit: "", target: ">= 0.75", status: "good", trend: [0.74,0.76,0.78,0.79,0.80,0.81,0.82,0.83,0.82,0.82,0.81,0.82], phase: "study" },
    { id: "kpi-4", name: "Time to CPAP from diagnosis", value: 18, unit: "d", target: "<= 21d", status: "good", trend: [28,26,24,22,21,20,19,18,18,17,18,18], phase: "post" },
    { id: "kpi-5", name: "ESS reduction post-treatment", value: 5.4, unit: "pts", target: ">= 4.0", status: "good", trend: [3.8,4.1,4.4,4.7,4.9,5.0,5.2,5.3,5.4,5.4,5.3,5.4], phase: "post" },
    { id: "kpi-6", name: "Safety-critical OSA <4 weeks", value: 87, unit: "%", target: "100%", status: "warn", trend: [78,80,82,85,86,86,87,89,88,87,87,87], phase: "pre" },
    { id: "kpi-7", name: "HSAT failure rate", value: 11.2, unit: "%", target: "<= 8%", status: "bad", trend: [6,7,8,9,10,11,12,11,11,11,11,11.2], phase: "study" },
    { id: "kpi-8", name: "Complaint rate per 1000 studies", value: 2.1, unit: "", target: "<= 3.0", status: "good", trend: [3.4,3.0,2.8,2.6,2.5,2.4,2.3,2.2,2.2,2.1,2.1,2.1], phase: "post" },
    { id: "kpi-9", name: "Equipment verification on time", value: 96.8, unit: "%", target: ">= 95%", status: "good", trend: [92,93,94,95,96,97,97,96,97,97,97,97], phase: "study" },
    { id: "kpi-10", name: "BLS recert currency", value: 89, unit: "%", target: "100%", status: "warn", trend: [95,96,94,92,91,90,89,89,90,89,89,89], phase: "pre" },
    { id: "kpi-11", name: "Patient satisfaction (CSAT)", value: 4.6, unit: "/5", target: ">= 4.3", status: "good", trend: [4.2,4.3,4.4,4.4,4.5,4.5,4.6,4.6,4.6,4.5,4.6,4.6], phase: "post" },
    { id: "kpi-12", name: "Referrer NPS", value: 42, unit: "", target: ">= 30", status: "good", trend: [28,30,32,34,36,38,40,41,42,42,41,42], phase: "pre" },
  ],

  // Studies / scoring queue
  studies: [
    { id: "PSG-2026-04891", patient: "Patient #41892", patientInitials: "S.K.", type: "PSG (Adult)", physician: "Dr. R. Okafor", scorer: "M. Chen", status: "Awaiting sign-off", contact: "21 Apr 2026", due: 2, signedDays: null, sla: "warn", siteCode: "RML" },
    { id: "PSG-2026-04890", patient: "Patient #41891", patientInitials: "T.W.", type: "PSG (Paediatric)", physician: "Dr. L. Hartono", scorer: "A. Singh", status: "Awaiting sign-off", contact: "20 Apr 2026", due: 1, signedDays: null, sla: "warn", siteCode: "EPL" },
    { id: "PSG-2026-04889", patient: "Patient #41890", patientInitials: "J.M.", type: "CPAP titration", physician: "Dr. R. Okafor", scorer: "M. Chen", status: "Scoring", contact: "23 Apr 2026", due: 4, signedDays: null, sla: "good", siteCode: "RML" },
    { id: "PSG-2026-04888", patient: "Patient #41889", patientInitials: "P.D.", type: "MSLT", physician: "Dr. R. Okafor", scorer: "A. Singh", status: "Scoring", contact: "22 Apr 2026", due: 3, signedDays: null, sla: "good", siteCode: "RML" },
    { id: "PSG-2026-04887", patient: "Patient #41888", patientInitials: "C.B.", type: "HSAT (Type 3)", physician: "Dr. F. Liu", scorer: "M. Chen", status: "Final", contact: "14 Apr 2026", due: -1, signedDays: 6, sla: "good", siteCode: "HSN" },
    { id: "PSG-2026-04886", patient: "Patient #41887", patientInitials: "R.S.", type: "PSG (Adult)", physician: "Dr. R. Okafor", scorer: "A. Singh", status: "Final", contact: "13 Apr 2026", due: -2, signedDays: 7, sla: "good", siteCode: "RML" },
    { id: "PSG-2026-04885", patient: "Patient #41886", patientInitials: "H.K.", type: "Split-night", physician: "Dr. R. Okafor", scorer: "M. Chen", status: "Preliminary", contact: "19 Apr 2026", due: 0, signedDays: null, sla: "bad", siteCode: "RML" },
    { id: "PSG-2026-04884", patient: "Patient #41885", patientInitials: "G.N.", type: "PSG (Paediatric)", physician: "Dr. L. Hartono", scorer: "A. Singh", status: "Final", contact: "10 Apr 2026", due: -3, signedDays: 8, sla: "good", siteCode: "EPL" },
  ],

  // Equipment register
  equipment: [
    { id: "PSG-COMP-001", name: "Compumedics Grael 4K HD", type: "PSG amplifier", site: "Riverside Main", serial: "GR4K-19847", inService: "Jul 2021", lastVerify: "02 Apr 2026", nextVerify: "02 Jul 2026", verifyStatus: "good", artg: "215847" },
    { id: "PSG-COMP-002", name: "Compumedics Grael 4K HD", type: "PSG amplifier", site: "Riverside Main", serial: "GR4K-19848", inService: "Jul 2021", lastVerify: "02 Apr 2026", nextVerify: "02 Jul 2026", verifyStatus: "good", artg: "215847" },
    { id: "PSG-PHIL-003", name: "Philips Alice 6 LDx", type: "PSG amplifier", site: "Eastside Paed.", serial: "ALC6-77124", inService: "Mar 2022", lastVerify: "18 Mar 2026", nextVerify: "18 Jun 2026", verifyStatus: "good", artg: "184221" },
    { id: "HSAT-NOX-014", name: "Nox T3s", type: "HSAT device", site: "Home Service N.", serial: "NXT3-44829", inService: "Nov 2023", lastVerify: "—", nextVerify: "Overdue (12d)", verifyStatus: "bad", artg: "302118" },
    { id: "PAP-RES-022", name: "ResMed AirSense 11", type: "CPAP titration", site: "Riverside Main", serial: "AS11-66341", inService: "Jan 2024", lastVerify: "28 Mar 2026", nextVerify: "28 Jun 2026", verifyStatus: "good", artg: "298775" },
    { id: "PAP-RES-023", name: "ResMed AirCurve 10", type: "Bi-level", site: "Eastside Paed.", serial: "AC10-71204", inService: "Aug 2023", lastVerify: "29 Mar 2026", nextVerify: "29 Jun 2026", verifyStatus: "good", artg: "271183" },
    { id: "OXI-NEL-031", name: "Nellcor PM10N", type: "Pulse oximeter", site: "Riverside Main", serial: "PM10-89124", inService: "Apr 2022", lastVerify: "12 Apr 2026", nextVerify: "12 May 2026", verifyStatus: "warn", artg: "147883" },
    { id: "AED-PHIL-001", name: "Philips HeartStart FRx", type: "AED", site: "Eastside Paed.", serial: "FRX-22914", inService: "Jun 2020", lastVerify: "01 Apr 2026", nextVerify: "01 Oct 2026", verifyStatus: "good", artg: "098441" },
    { id: "VID-AXIS-007", name: "Axis M1135 IR", type: "A/V recording", site: "Eastside Paed.", serial: "AXM1-33218", inService: "Mar 2022", lastVerify: "19 Mar 2026", nextVerify: "19 Jun 2026", verifyStatus: "good", artg: "—" },
    { id: "OXI-NEL-032", name: "Nellcor PM10N", type: "Pulse oximeter", site: "Home Service N.", serial: "PM10-89125", inService: "Apr 2022", lastVerify: "—", nextVerify: "Overdue (3d)", verifyStatus: "bad", artg: "147883" },
  ],

  // Open tasks for QM
  tasks: [
    { id: "t1", title: "Sign off Q2 management review pack", due: "in 3 days", clause: "4.15.2", priority: "high" },
    { id: "t2", title: "Investigate NC-2026-0112 — subcontractor scoring evidence", due: "in 5 days", clause: "4.5.2", priority: "high" },
    { id: "t3", title: "Resolve overdue verification on HSAT-NOX-014", due: "Overdue 12d", clause: "5.3.4", priority: "critical" },
    { id: "t4", title: "Schedule BLS recert — 4 staff lapsed", due: "in 7 days", clause: "5.1.4", priority: "high" },
    { id: "t5", title: "Complete internal audit on Section 5.5", due: "in 14 days", clause: "4.14.1", priority: "med" },
    { id: "t6", title: "Periodic review: SOP-PSG-031 (Bio-signal verification)", due: "in 21 days", clause: "4.3.4", priority: "low" },
  ],

  // Recent activity (audit trail)
  activity: [
    { who: "Dr. R. Okafor", what: "signed Final report PSG-2026-04887", when: "12 min ago" },
    { who: "M. Chen", what: "uploaded calibration evidence to clause 5.3.4", when: "38 min ago" },
    { who: "A. Singh", what: "completed scoring on PSG-2026-04889", when: "1 h ago" },
    { who: "K. Patel", what: "approved SOP-PSG-014 v3.2", when: "2 h ago" },
    { who: "System", what: "auto-flagged HSAT-NOX-014 verification overdue", when: "3 h ago" },
    { who: "Dr. L. Hartono", what: "added paediatric BLS certificate", when: "5 h ago" },
  ],
};
