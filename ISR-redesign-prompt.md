# Design Prompt — Inter-Scorer Reliability (ISR) User & Admin Pages

> Paste this into Claude (or Claude Code, working in the Nexus 360 repo) to redesign the **user scoring page** and the **administrator page** of the Inter-Scorer Reliability module. It is a *redesign* of the existing `src/pages/page-isr.jsx` — keep the data model, ProDigi/WebPSG integration, and API surface; improve the workflow, layout, and compliance reporting.

---

## 1. Context for you (the model doing the work)

You are working in the **Nexus 360 Accreditation** repo — a healthcare accreditation management system for sleep disorders services pursuing **NATA / ASA Standard for Sleep Disorders Services** compliance.

**Stack & conventions you must follow (do not deviate):**

- React 18 + Vite frontend. ASP.NET Core 10 minimal-API backend. SQLite via EF Core.
- **No UI framework.** All UI is hand-rolled in `src/components.jsx` (`PageHeader`, `Pill`, `Tabs`, `Avatar`, cards, form inputs) and `src/icons.jsx` (`Icon`). Do **not** introduce a component library.
- Use existing primitives: `PageHeader`, `Tabs`, `Pill` (kinds: `good` / `warn` / `bad` / `outline`), `NexusGrid` for tables, `.card` / `.card-head` / `.card-title` / `.card-sub` / `.card-pad`, `.stat-grid` / `.stat`, `.btn` / `.btn-primary` / `.btn-ghost`, `.form-input` / `.form-label`, `.callout`.
- Colours come from **CSS variables only** (`--ink-1/2/3`, `--accent`, `--accent-soft`, `--accent-ink`, `--good`, `--warn`, `--bad`, `--good-soft`, `--bad-soft`, `--border`, `--surface-2`). Never hard-code hex except plain `white`. The theme has 4 palettes — anything you build must survive a palette switch.
- API calls follow the existing pattern in `page-isr.jsx` (`api()` helper with bearer token) or go through `src/api.js`. Never `fetch` raw in a component without the auth header.
- Auth: current user from `useAuth()` (`user.name`, `user.role`, `userSites`). The signed-in scorer's name is `user.name`.
- Keep everything in one page file (`src/pages/page-isr.jsx`) with internal sub-components, matching the current structure.

**Current state (what exists, to be reworked):**

The page has three tabs — `Scoring studies` (user), `Compliance reports`, and `Admin`. Backend tables already exist:

- `IsrReferenceStudy` — `{ Id, StudyId, Quarter, Label, AddedAt, AddedBy }` — the PSGs the admin assigns each quarter.
- `IsrScoringSession` — `{ Id, ReferenceStudyId, ScorerName, Status (pending|opened|completed), OpenedAt, CompletedAt, Notes }` — one row per scorer per reference study.
- `IsrAssessment` — `{ Id, AssessmentRef, Quarter, Scorer, Reviewer, ReviewerRole, AttestationBy, AttestationDate, StudyIds (JSON[3]), Results (JSON per-parameter %), Thresholds (JSON), ProdigiSessionData, Status (pending|in-progress|complete|signed), SignedBy, SignedAt, Notes, CreatedAt }` — the quarterly per-scorer concordance report.

Endpoints already present: `GET/POST/PUT /api/isr`, `POST /api/isr/{id}/sign`, `GET/POST/DELETE /api/isr/reference`, `GET/POST /api/isr/sessions`, `GET /api/isr/prodigi-url/{studyId}` (returns an authenticated ProDigi WebPSG open-study URL). **Reuse these.** If a new endpoint is genuinely needed (e.g. saving concordance results per parameter, generating an action plan), add it following the existing minimal-API pattern in `api/Program.cs` and extend the model in `api/Models/Models.cs` — but prefer reusing what exists.

You may extend the data model where the requirements below need it (e.g. per-parameter concordance entry, action-plan tracking, scorer acknowledgement), but call out every schema change explicitly.

---

## 2. The compliance model you are implementing (read carefully)

This service uses the **internal concordance** model of ISR (NOT the AASM online ISR program). The authority is the **ASA Standard for Sleep Disorders Services** plus the lab's **Inter-Scorer Reliability** SOP (AASM-style "Not Using AASM Sleep ISR" policy). The rules the UI must enforce and make visible:

**Cadence & sampling**
- Every individual who scores sleep studies is assessed **quarterly**.
- Per scorer per quarter: a **minimum of 3 PSGs**, each with **≥ 200 consecutive 30-second epochs** compared → **12 PSGs per scorer per year**.
- The same reference recordings are scored **independently** by every scorer and by the gold standard.

**Gold standard**
- The **Network Director** is the gold standard for agreement.
- If the reviewer is **board-certified medical staff** (not the Network Director), the **Network Director must provide a written attestation** (capture `AttestationBy` + `AttestationDate`).

**Parameters compared (per study, per scorer):**
1. Sleep staging — **epoch-by-epoch**
2. Respiratory events — **obstructive apnea**, **central apnea**, **hypopnea** (and **RERA** *only if the lab reports it* — optional)
3. Leg movements
4. Arousals

**Concordance definition (show this in a tooltip/help text):**
> Percent concordance for a parameter = (total epochs of agreement for that parameter ÷ total epochs in the analysis sample) × 100.

Optionally surface **Cohen's κ** alongside percent agreement where the lab captures it (κ corrects for chance agreement; it is the field-standard secondary statistic — overall manual staging agreement is typically ~82%, κ≈0.76, with N1 the weakest stage). Treat κ as an **optional** display field, never a gate.

**Thresholds (lab-defined minimums — make them editable, with these defaults):**
- Sleep staging: **90%**
- Obstructive apnea / central apnea / hypopnea / leg movements / arousals: **80%** each
- RERA (optional): 80%
- Overall acceptable level of agreement: **80%** (per the lab SOP). Make the overall pass/fail rule explicit: a scorer **passes** a study/quarter when every *required* parameter meets its threshold.

**When a scorer falls below threshold → an Action Plan is required.** The Network Director develops a corrective plan, which may include: review of the current AASM Scoring Manual; additional inter-scorer assessment with review; focused review/retraining with the supervisor; educational assistance from the facility/network director. The UI must let the ND record which action(s) apply, free-text notes, an owner, and a due/review date, and track it to closure.

**Reporting & records**
- Concordance results are compiled into a **quarterly report per scorer**, reviewed by the Network Director.
- Each report is **signed and dated** by the Network Director (the existing sign action).
- Reports are **retained ≥ 5 years** — surface this and never hard-delete a signed report.
- The module maps to the accreditation evidence requirement for inter-scorer reliability — show the clause reference in the page eyebrow/header (as it does today).

---

## 3. Page A — User (scorer) page: "My ISR scoring"

**Who uses it:** a scoring technologist, logged in, managing *their own* ISR activity for the current quarter. They should never see other scorers' raw results except where the report has been finalised and shared with them.

**Primary job-to-be-done:** "What do I have to score this quarter, what's left, how do I open it in ProDigi, and how did I do once it's reviewed?"

Design requirements:

1. **Quarter header + progress at a glance.** Current quarter, a clear "X of Y reference studies scored" progress indicator, and a single status chip (e.g. *3/3 done*, *In progress*, *Action required*). Replace the tiny dot-row with a clearer progress treatment (segmented bar or numbered stepper) that reads at a glance.

2. **Assigned reference studies list.** One card/row per reference PSG assigned for the quarter, showing: label/study ID, my status (Pending → Opened → Scored), and timestamps (opened, scored). Each row has:
   - **Open in ProDigi** — calls `GET /api/isr/prodigi-url/{studyId}`, opens in a new tab, and records an `opened` session. Handle the "ProDigi URL not configured" error gracefully (show the server's message inline, not a crash).
   - **Mark as scored** — records a `completed` session. Once scored, this study locks (no accidental re-open of the action), but the user can still re-open in ProDigi to review.
   - Empty state when nothing is assigned: explain the admin must assign reference studies, don't show a broken table.

3. **My results (post-review).** A section where, once the Network Director has entered and the report is signed, the scorer sees **their own** concordance per parameter vs threshold (Met / Not met pills, percent, optional κ), the overall pass/fail, and — if they failed — their **action plan** (what's required, owner, due date) with an **Acknowledge / sign-off** button so the scorer attests they've seen it. Until the report is signed, show "Results pending review" rather than partial data.

4. **History.** Let the scorer page back through previous quarters (read-only) to see their own trend — a small sparkline or quarter-by-quarter pass/fail strip is enough; don't over-build.

5. **Tone & clarity.** This is a compliance tool used by clinicians, not a dashboard for analysts. Minimal chrome, generous whitespace, plain language, no jargon without a tooltip. Keyboard-friendly. Accessible colour contrast (don't rely on colour alone — pair every status colour with text/icon).

---

## 4. Page B — Administrator page: "ISR administration"

**Who uses it:** the Network Director / QA manager. They set up each quarter, watch progress, enter concordance results, judge pass/fail, raise action plans, and generate + sign the quarterly reports.

**Primary jobs-to-be-done:** "Set the quarter's reference studies → see who's done what → record each scorer's concordance → flag failures and assign corrective action → sign and archive the quarterly reports → prove we meet the standard."

Design requirements:

1. **Quarter selector + quarter summary strip.** Stat tiles: scorers in scope, reference studies assigned (target ≥3), studies scored / outstanding, reports signed, and a 12-PSGs-per-year tracker per scorer (so the ND can see annual coverage, not just the current quarter).

2. **Reference study management.** Add/remove the quarter's reference PSGs (reuse `POST/DELETE /api/isr/reference`), validate against the "≥3 per quarter" rule with a clear warning if under target. Allow a free-text label. Deleting cascades to sessions — confirm destructively.

3. **Live progress matrix.** Rows = scorers, columns = reference studies, cells = pending / opened / scored (icon + tooltip with timestamp), plus a per-scorer "done" count. Keep this — it's the most useful current feature — but make it scannable: sticky header, highlight any scorer who is behind, and let the ND click a cell to jump to that scorer's result entry.

4. **Concordance result entry (the main gap to build well).** For each scorer × quarter, the ND records the concordance per parameter across the assessed studies. Provide a clean entry form (per parameter: percent agreement, optional κ, optional epochs-agreed / epochs-total so percent can be auto-computed), with the lab thresholds pre-filled and editable. As values are entered, show live Met/Not-met and the **overall pass/fail** verdict. Persist to `IsrAssessment.Results` / `Thresholds`. If results can be pulled from ProDigi's compare output, support importing them (`ProdigiSessionData`) to avoid manual transcription — but manual entry must always work.

5. **Action plans.** When a scorer fails any required parameter, the page prompts the ND to create an action plan: multi-select of the standard corrective actions (manual review / additional inter-scorer assessment with review / focused retraining / educational assistance), free-text detail, owner, due date, and status (open / in-progress / closed). Track these to closure and show outstanding ones prominently. (This likely needs a small new field or table — note the schema change.)

6. **Attestation rule.** When `ReviewerRole = Medical Staff`, require and capture the Network Director's written attestation (`AttestationBy`, `AttestationDate`) before the report can be signed. Block signing until present and explain why.

7. **Quarterly report generation + signing.** Per scorer, assemble the report (studies used, per-parameter concordance vs threshold, overall verdict, attestation, action plan if any, notes), then **sign & date** (reuse `POST /api/isr/{id}/sign`, stamp `SignedBy`/`SignedAt`). Signed reports become read-only and are retained ≥5 years — never offer hard delete on a signed report. Provide an **export** (print-friendly view or PDF) suitable for the QA binder / auditor.

8. **Standard-compliance checklist.** Keep and refine the N-/F- style requirements checklist, but drive each item from real data (3 PSGs/quarter present, 12/year on track, thresholds defined, every scorer assessed vs ND or attested medical staff, reports signed, retention honoured) so it's a live audit readiness panel, not static text.

9. **Audit trail.** Every admin action (assign study, enter results, sign report, raise/close action plan) should write to the existing audit log (the sign endpoint already does). Make it visible that actions are logged.

---

## 5. Cross-cutting requirements

- **Single source of truth for parameters & thresholds:** keep the `PARAMS` and `DEFAULT_THRESHOLDS` constants; the staging default is 90, others 80, RERA optional. Required vs optional must be honoured everywhere pass/fail is computed.
- **Status colour semantics are consistent** across both pages: `good` = met/scored/signed, `warn` = in-progress/opened/near-threshold (≥90% of threshold but below), `bad` = failed/below, `outline` = pending/not started. Always pair colour with a label or icon.
- **Never block on the backend being down** — degrade gracefully, show the server's error text, keep the UI usable.
- **Don't leak other scorers' results to a non-admin user.**
- **Quarter format** stays `Q# YYYY` to match existing data and the `currentQuarter()` helper.
- **Accessibility:** semantic markup, focus states, contrast, no colour-only signalling, sensible tab order.

---

## 6. Deliverables I expect from you

1. Reworked `src/pages/page-isr.jsx` implementing the user page and admin page as above (sub-components are fine; one file, matching current structure).
2. Any required backend additions in `api/Program.cs` + `api/Models/Models.cs`, each schema change explicitly listed in your summary.
3. A short summary of: what changed, any new endpoints/fields, and any assumptions you made.
4. **Do not** add dependencies, switch to a UI framework, hard-code colours, or break the 4-palette theming.

Before you start, restate the data flow you'll use (which endpoints feed which view) and flag anything in the current schema that can't support a requirement, so we agree on schema changes up front.

---

## 7. Reference notes (sourcing for the requirements above)

- Lab ISR SOP (internal model): quarterly, ≥3 PSGs/quarter × ≥200 epochs, 12/year; parameters = staging epoch-by-epoch, respiratory events, leg movements, arousals; Network Director = gold standard; 80% overall agreement; action plan below threshold; quarterly signed reports retained in QA binder. *(AASM "Inter-Scorer Reliability Assessment — Not Using AASM Sleep ISR" sample policy.)*
- ASA Standard for Sleep Disorders Services — proficiency-testing / reliability of results and processes to evaluate and correct non-conforming work (§4.5.5); equipment/QA program expectations.
- Concordance defined as epochs-of-agreement ÷ total-epochs × 100, reported per parameter against Network Director / medical staff. *(AASM Inter-scorer Reliability fact sheet.)*
- Secondary statistic: Cohen's κ (chance-corrected); manual staging agreement ~82%, κ≈0.76 in meta-analysis, N1 the weakest stage — supports showing κ as optional context, not a gate.
- AASM external ISR program (for contrast — NOT what this lab uses): monthly 200-epoch online scoring vs AASM Gold Standard, 85% passing average, no retakes; reported quarterly. *(isr.aasm.org.)*
