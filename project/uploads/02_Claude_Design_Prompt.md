# Claude Design Prompt - "SleepAccredit" - Sleep Disorders Service Accreditation Web Application

> Paste the section below into Claude (or Claude Code) as a single design brief.
> It is written as a self-contained prompt so the receiving model has all context it needs.

---

## ROLE

You are a senior product designer and full-stack architect. Produce a complete design specification for a web application called **SleepAccredit** that helps Australian and New Zealand sleep disorders services achieve and maintain **ASA / NATA accreditation** under the *ASA Standard for Sleep Disorders Services (March 2019)*, which itself derives from **ISO 15189:2012**. The Standard's clauses (Section 4 - Management Requirements, Section 5 - Technical Requirements) are the source of every functional requirement below; your output must keep that traceability visible.

Deliver the design as a structured document with the sections in the OUTPUT FORMAT block at the bottom of this prompt. Do not produce code yet - only the design (information architecture, page-by-page UX, data model, report templates, compliance matrix, and a recommended Python-based implementation stack).

## PROBLEM STATEMENT

Sleep disorders services in Australia and New Zealand undergo periodic NATA assessments against the ASA Standard. Today, services maintain compliance evidence in a sprawl of Word documents, PDFs, paper logbooks, lab information system exports and shared drives. Assessment preparation is painful: assemble equipment registers, training records, internal audits, management reviews, complaint logs, proficiency-testing results, sample reports and SOPs, and demonstrate that every clause has objective evidence behind it.

**SleepAccredit** is the single source of truth for that evidence. It also automates the recurring artefacts (reports, audits, management reviews, indicator dashboards) that the Standard mandates.

## TARGET SCOPE OF SERVICE

The application must support a service of any size that performs any combination of:
- Attended (in-laboratory) Polysomnography - adult and paediatric (Type 1).
- Unattended / home / ambulatory studies (Type 2, 3, 4 devices).
- CPAP / PAP titration & efficacy studies (including bi-level, split-night, auto-titration).
- MSLT and MWT.
- Ongoing therapy management (PAP, oral appliance, surgery referral, behavioural, paediatric NIV/IV).

A single tenant (a "Service") may operate from multiple physical sites, run home-based services, and operate both adult and paediatric labs.

## USERS & PERMISSIONS

Design role-based access for the following personas. Show a permissions matrix.

| Role | Description |
|------|-------------|
| Medical Director (Sleep Physician) | Owns clinical standards, reports, sign-off, peer concordance, management review chair. |
| Paediatric Sleep Physician | Mandatory if paediatric studies performed; same as MD scoped to paediatric workflows. |
| Senior Scientist / Technologist (Tech Lead) | QA, calibration, equipment safety, rostering, training oversight. |
| Quality Manager | Owns QMS, document control, audits, CAPA, management review packs. Direct line to top management. |
| Reporting Physician | Reviews raw data epoch-by-epoch, signs preliminary and final reports. |
| Scoring Technologist | Performs analysis, records observations, participates in proficiency testing. |
| Recording Technologist | Conducts overnight study, biological signal verification, attends to patient. |
| Reception / Bookings | Referral intake, scheduling, patient identification, demand prioritisation. |
| External Provider (CPAP, dental, lab subcontractor) | Limited portal for outcome reporting and evidence upload. |
| Internal Auditor | Read-everything role for audit cycles. |
| External Assessor (NATA) | Time-boxed read-only access to a clause-mapped evidence pack. |
| System Administrator | Tenant config, integrations, retention policies. |

Authentication: SSO (OIDC) plus local accounts; MFA mandatory for clinical roles. All actions tagged with user identity for the immutable audit trail (clauses 4.13.1.3, 4.13.2.6/7).

## CORE MODULES (with clause traceability)

For each module describe: purpose, primary screens, key fields, automated artefacts, and the ASA clauses it satisfies.

### 1. Service & Organisation Profile (cl. 4.1, 4.2, 5.1)
- Legal entity, ABN/HPI-O, sites, host institution relationship statement.
- Organisational chart builder (drag-and-drop) with endorsement history.
- Role registry binding people -> roles -> deputies -> qualifications.
- Job description library (versioned, controlled documents).
- Rostering rules engine that enforces minimum ratios:
  - Adult: 1 tech : 3 patients overnight, >=45 min prep, >=2 h analysis per study.
  - Paediatric: 1 tech : 2 patients overnight, 1-2 h prep, >=4 h analysis.
  - Medical Director on-site >=12 h/month; Senior Tech on-site >=20 h/week.
- Conflict-of-interest register (per cl. 4.1.5).

### 2. Quality Management System & Document Control (cl. 4.2, 4.3)
- Hierarchical document store: Quality Manual -> Policies -> SOPs -> Forms -> Records.
- Each document carries: title, edition, effective date, page x of y stamper, authorised issuer.
- Workflow: draft -> review -> approval -> issue -> periodic review -> archive (with "obsolete" watermarking).
- Master controlled-documents list auto-generated.
- Reminder engine for periodic review (configurable, default 24 months).
- Hand-amendment journal capturing initial + date for in-line annotations pending re-issue.

### 3. Referral & Pre-Study Workflow (cl. 4.4, 5.4)
- Referral intake (fax/PDF/HL7 FHIR ServiceRequest, EMR integration, manual entry).
- Three-identifier patient confirmation (name, DOB, MRN/service number) enforced at every state transition.
- Triage queue with auto-prioritisation rules (suspected significant OSA in safety-critical occupations -> 4-week SLA timer; high-risk comorbidity flags).
- Suitability checklist completed by physician prior to study; deviations documented and pushed into the report.
- Paediatric referrals routed only to a paediatric sleep physician for triage.
- Booking module respecting roster constraints from Module 1.

### 4. Study Conduct & Recording (cl. 5.3, 5.5)
- Study record: unique study ID, study type (PSG / HSAT / CPAP titration / MSLT / MWT / split-night / paediatric NIV), device used, sensors applied, biological signal verification checklist, technologist observations, patient call/event log.
- Live device integration (vendor PSG software via HL7 / file ingestion) - architecturally optional, structurally mandatory.
- Mandatory pre-study biological signal verification capture (or alternative paediatric procedure with reason).
- Audio/video recording metadata link with retention timer (mandatory paediatric, recommended adult).
- Escalation / emergency protocol launcher (BLS, paediatric BLS, AED).

### 5. Equipment Register & Verification (cl. 5.3.1-5.3.7)
- Equipment register with all 5.3.7 fields (identity, manufacturer, serial, supplier, in-service date, location, condition, manuals, acceptance records, maintenance schedule and history, performance records, faults/repairs).
- Calibration & verification scheduler with trend charts; safeguard for tamper-evident logs.
- Acceptance-test wizard for new or loaned equipment (cl. 5.3.2).
- Adverse-incident reporting workflow (notifies manufacturer + TGA where applicable).
- Decontamination logbook for equipment removed from service (cl. 5.3.5).
- Retention: life of equipment + 7 years, enforced by retention engine.
- Consumables inventory with reorder thresholds.

### 6. Scoring, Analysis & Reporting (cl. 5.5, 5.6, 5.8)
- Scoring queue assigned by Tech Lead; analysis-time tracking validates rostering minima.
- Inter-observer concordance module: blind re-score sample of N% per scorer per period; computes kappa, retains evidence.
- Reporting workspace for physicians: side-by-side raw data viewer placeholder + technologist observations + scoring output + interpretive narrative editor + normal-values lookup with uncertainty estimates.
- Report templates (configurable per study type) with mandatory cl. 5.8.7 fields, auto page-x-of-y, electronic signature.
- Preliminary -> Final lifecycle with cross-reference and audit-trail; amendment workflow that retains the original (cl. 5.8.11).
- 10-business-day SLA timer from patient contact to final report (cl. 5.8.1) with dashboard.
- Secure delivery: encrypted email, e-fax, FHIR DiagnosticReport push, or secure portal download (PDF watermarked, non-editable).

### 7. Therapy & Post-Study Care (cl. 5.7)
- Treatment plan workspace: PAP titration outcomes, oral-appliance referral, surgery referral, behavioural / insomnia plan, paediatric NIV plan.
- PAP supply & adherence tracking (in-house or via External Provider portal); adherence performance indicators (e.g., 30/90/365-day usage).
- Provisional CPAP prescription workflow with reconciliation step against final report (cl. 5.7.1.4).
- Patient explanation log (face-to-face, telehealth, phone) with mandatory offer of face-to-face.
- Diagnostic-only services pathway: report tailoring, referrer-advice templates, urgent clinical review trigger when severe SDB / arrhythmia detected; raw-data sharing request workflow.

### 8. Quality Indicators & Proficiency Testing (cl. 5.6)
- Configurable indicator catalogue (pre-study, study, post-study) with target / threshold / measurement window. Pre-loaded examples: time-to-CPAP, CPAP adherence, ESS pre/post, scoring concordance kappa, percentage of reports within 10 days, complaint rate.
- External proficiency testing register: scheduling (>=2/year per scorer), import results, CAPA on out-of-spec.
- Physician peer concordance scheduler.
- Real-time KPI dashboard with traffic-light colour coding.

### 9. Feedback & Complaints (cl. 4.7, 4.8)
- Patient and referrer survey campaigns (link, QR, embedded in portal); free-text and Likert results.
- Complaints intake, triage, investigation, CAPA linkage, response letter templating, closure record.

### 10. Nonconformance, Corrective & Preventive Action (cl. 4.9, 4.10, 4.11)
- NC register (source: complaint, audit, equipment fault, EQA failure, staff suggestion).
- Workflow: identify -> assess clinical significance -> halt/recall if needed -> root-cause analysis (5-Whys / fishbone templates) -> CAPA -> effectiveness review.
- Trend dashboards with monthly/quarterly summaries fed into management review.

### 11. Audits & Management Review (cl. 4.14, 4.15)
- Internal audit programme: planner across a rolling 12-month cycle, auditor independence checker (auditor != owner of audited area).
- Audit findings linked back to NCs / CAPA module.
- Management review pack auto-assembler: one-click compilation of every cl. 4.15.2 input - referral review, feedback summaries, suggestions, audits, risk register, indicators, external assessments, EQA results, complaints, supplier KPIs, NCs, CAPA status, prior actions follow-up, scope/staff/premises changes, improvement recommendations.
- Management review meeting scaffold with attendance, decisions, actions with owners and due dates; outputs distributed automatically; 12-month cadence enforced.

### 12. Subcontractors & External Services (cl. 4.5, 4.6)
- Subcontractor register with scope, ASA-compliance evidence upload, expiry tracking.
- External CPAP provider portal (limited login) for adherence reports, complaints, supplier-KPI feed.
- Supplier evaluation workflow.

### 13. Records, Retention & Audit Trail (cl. 4.13)
- Universal append-only audit log on every entity (who, what, before, after, when, why).
- Retention policy engine per record type (final report = health-record period; equipment = life + 7 yrs; raw PSG = at least until reporting + treatment complete; video/audio = at least until final report; longer if clinically diagnostic).
- Configurable legal-hold flag.

### 14. Continual Improvement Hub (cl. 4.12, 4.14.5)
- Suggestion box, idea triage, kanban from idea -> trial -> implementation -> outcome.
- Improvement metric history.

### 15. Accreditation Workspace (NATA assessment readiness)
- Clause-by-clause evidence map: every Section 4 and Section 5 clause linked to live evidence in the system (documents, records, indicators).
- "Assessor view" - read-only, watermark-stamped, time-boxed login for NATA assessors.
- Self-assessment scoring (Compliant / Partially Compliant / Non-compliant / Not Applicable) with gap report.
- Pre-assessment checklist generator.

## DATA MODEL (high level)

Provide an entity-relationship diagram covering at minimum: Service, Site, Person, Role, Qualification, TrainingRecord, Document, DocumentVersion, Patient, Referral, Booking, Study, StudyType, Device, DeviceVerification, Sensor, Consumable, AnalysisJob, Report, ReportVersion, TherapyPlan, AdherenceObservation, Complaint, Suggestion, Nonconformance, CorrectiveAction, PreventiveAction, Audit, AuditFinding, ManagementReview, Indicator, IndicatorMeasurement, ProficiencyTest, ProficiencyResult, Subcontractor, ExternalProvider, Supplier, EvidenceLink, RetentionPolicy, AuditTrailEntry, AccessGrant.

Show key relationships and the audit-trail / retention strategy as cross-cutting concerns. Use FHIR R4 resource alignment where natural (Patient, Practitioner, Organization, ServiceRequest, DiagnosticReport, DocumentReference, Observation).

## REPORT & DOCUMENT TEMPLATES TO SHIP

For each, specify required fields and which ASA clause it satisfies:
1. **Adult attended PSG report** (cl. 5.8.7).
2. **Paediatric attended PSG report** (cl. 5.8.5, 5.8.7).
3. **CPAP titration / efficacy report** (cl. 5.5.3.4, 5.8.7).
4. **MSLT / MWT report** (cl. 5.5.3.3, 5.8.7).
5. **Type 2/3/4 home study report** (cl. 5.5.4, 5.8.7).
6. **Split-night protocol** (cl. 5.5.3.4 Note 3).
7. **Method validation report** (cl. 5.5.6).
8. **Internal audit report** (cl. 4.14).
9. **Management review minutes & actions** (cl. 4.15).
10. **Equipment verification certificate** (cl. 5.3.4).
11. **Calibration / acceptance test report** (cl. 5.3.2, 5.3.4).
12. **Adverse-incident report** (cl. 5.3.6).
13. **Complaint resolution report** (cl. 4.8).
14. **Nonconformance / CAPA report** (cl. 4.9-4.11).
15. **Proficiency-testing summary & corrective action** (cl. 5.6.8).
16. **Inter-observer concordance report** (cl. 5.6.6).
17. **Quality indicator dashboard export** (cl. 5.6.3-5.6.5).
18. **Subcontractor evaluation record** (cl. 4.5).
19. **Training & competency record** (cl. 5.1.3).
20. **Patient feedback / referrer survey summary** (cl. 4.7).
21. **Provisional CPAP prescription form** (cl. 5.7.1.4).
22. **Diagnostic-only service raw-data release request** (cl. 5.7.2 Note).
23. **Amended report** (cl. 5.8.11).
24. **NATA self-assessment evidence pack** (whole standard).

Each template should support: configurable letterhead, mandatory page x of y, electronic signature blocks, version stamp, and clear "Preliminary / Final / Amended" status banner.

## INTEGRATIONS

- HL7 FHIR R4 read/write (Patient, ServiceRequest, DiagnosticReport, DocumentReference).
- Vendor PSG systems (Compumedics, Philips Alice, Natus, Resmed, Nox) - file ingestion + study metadata.
- CPAP cloud platforms (ResMed AirView, Philips Care Orchestrator) for adherence pull.
- E-signature (Australian-compliant, eg DocuSign).
- Secure messaging (Argus / HealthLink / FHIR direct).
- TGA adverse event reporting export.
- SSO (OIDC, SAML); MFA via TOTP/Passkey.
- Australian Privacy Act / NZ HIPC compliant data handling, IRAP-aligned hosting.

## RECOMMENDED TECH STACK

- Backend: Python 3.12 + FastAPI, SQLAlchemy 2, Alembic, Pydantic v2.
- Worker / scheduler: Celery + Redis (SLA timers, retention sweeps, indicator recomputation).
- Database: PostgreSQL 16 (with row-level audit triggers for the immutable audit trail).
- Object storage for raw PSG / video: S3-compatible (encryption at rest, versioning, object-lock for retention).
- Frontend: React + TypeScript + Vite, TanStack Query, shadcn/ui, Tailwind.
- Reporting: WeasyPrint or ReportLab for PDF assembly; HTML templates with strict schema validation; PDF/A archival format.
- Search: PostgreSQL full-text or OpenSearch for the evidence pack.
- Observability: OpenTelemetry, Sentry.
- Hosting: AWS Sydney (ap-southeast-2) or Azure Australia East; encrypted backups; documented BCP/DR.

## NON-FUNCTIONAL REQUIREMENTS

- Australian healthcare data residency.
- Tamper-evident audit trail (append-only with hash chain).
- Configurable retention - default healthcare-record period for clinical records, life + 7 years for equipment.
- Accessibility: WCAG 2.2 AA.
- Mobile-friendly screens for overnight tech workflow (event log, BSV checklist).
- Offline-tolerant capture for home-study set-up rooms.

## UX PRINCIPLES

- Every record screen has a "What standard does this satisfy?" side panel showing live clause links.
- Defaults that drive compliance: SLA timers visible on each work item; missing-evidence badges; one-click "send to management review pack".
- Strong colour-coded status (Draft / Awaiting Review / Approved / Issued / Obsolete).
- Friendly empty states that explain the clause and offer a starter template.

## DELIVERABLE / OUTPUT FORMAT

Produce the design document with the following sections, in order, using clear headings and concise prose plus tables and bullet lists where they aid clarity:

1. Executive summary (1 page).
2. Personas & permissions matrix.
3. Information architecture (sitemap of every screen).
4. Module-by-module specifications (use the 15 modules above; for each: purpose, primary screens with annotated wireframe descriptions, key data fields, automated outputs, ASA clause map).
5. Entity-relationship model (text + a Mermaid `erDiagram`).
6. Workflow diagrams for the seven core flows (referral -> booking, study conduct, scoring & reporting, therapy follow-up, complaint to closure, audit cycle, management review). Use Mermaid `flowchart` blocks.
7. Report and document template catalogue (the 24 above) with required fields and clause map.
8. Integration architecture diagram (Mermaid `graph` block).
9. Recommended technology stack with rationale and risk notes.
10. Compliance traceability matrix - one row per ASA clause (4.1 to 5.8.12), columns: Clause, Requirement summary, Module(s), Screens, Records/Reports produced, Automated reminder.
11. Non-functional requirements & security/privacy posture.
12. Roadmap: MVP (Sections 4.1-4.3, 4.13, 5.1-5.3, 5.4, 5.8 reporting), Release 2 (audits, management review, indicators, proficiency), Release 3 (therapy, paediatric NIV, FHIR push, assessor portal).
13. Open questions and assumptions.

Use clear, professional language. Prefer tables where structure helps. Use Mermaid for any diagrams. Do not write code.

---

## CONSTRAINTS & GUARDRAILS

- Every functional requirement must cite at least one ASA clause.
- Where the Standard says "must" the system must enforce or at least block-with-override-and-reason; where it says "should" the system may warn.
- The system must not invent clinical guidance; it surfaces ASA / AASM references where decisions are made.
- Do not collapse the paediatric workflow into the adult one - paediatric clauses (4.1.5(f)(i), 4.4.1(c), 5.1.1(a), 5.2.1(a)(v) & (xiii), 5.3.1(e), 5.5.3.2 paediatric scoring, 5.5.6.3 paediatric, 5.7.1.5, 5.7.1.8, 5.8.5) require distinct fields, roles and protocols.
- Treat the entire ASA Standard for Sleep Disorders Services (March 2019) as the authoritative source; if any decision in the design conflicts with the Standard, default to the Standard.

Begin the design document now.
