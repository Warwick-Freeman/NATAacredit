# Nexus 360 Accreditation

Healthcare accreditation management system for sleep disorders services undergoing NATA/ASA Standard and AASM compliance. Tracks clauses, evidence, staff, studies, equipment, audits, non-conformances, and inter-scorer reliability across a multi-site lab network.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | ASP.NET Core 10 (minimal API) |
| Database | SQLite via EF Core |
| Auth | JWT (7-day tokens, stored in `localStorage`) |
| Hosting | nginx → systemd service on AWS EC2 |

---

## Prerequisites

| Tool | Required version | Check |
|---|---|---|
| Node.js | ≥ 18 | `node --version` |
| .NET SDK | **10.0** | `dotnet --list-sdks` |
| OpenSSH client | any | `ssh -V` |

> **.NET 9 is not sufficient.** The API targets `net10.0` with `10.0.*` package versions. Install .NET 10 from https://dotnet.microsoft.com/download/dotnet/10.0

---

## Running locally

Both the frontend and API must run simultaneously. The frontend proxies API calls to `http://localhost:5000` via `VITE_API_URL` in `.env.development`.

### Frontend

```powershell
npm install        # first time only
npm run dev        # http://localhost:5173
```

### API

```powershell
cd api
dotnet run         # http://localhost:5000
```

The database (`nexus.db`) is created automatically on first run. The API seeds default data including a demo admin user.

### Production build (local)

```powershell
npm run build      # outputs to dist/
```

---

## Deploying to production

**Production server:** `ubuntu@18.221.101.26`
**Public URL:** `https://acdem.nexus360.cloud`
**Stack:** nginx (HTTPS 443) → reverse proxy → .NET systemd service (port 5000)

### Full deploy (frontend + API)

```powershell
.\deploy\deploy.ps1
```

### Deploy with database reset

Re-seeds the database from `api/Data/SeedData.cs`. **Destructive — wipes all data.**

```powershell
.\deploy\deploy.ps1 -Reseed
```

The deploy script:
1. Builds the React frontend (`npm run build`)
2. Publishes the .NET API (`dotnet publish -c Release`)
3. Uploads frontend to `/var/www/nexus` via SCP
4. Uploads API to `/opt/nexus-api/` and restarts the systemd service
5. Uploads the TLS certificate from `cert/` (GoDaddy-signed for `acdem.nexus360.cloud`)
6. Installs and reloads the nginx configuration

### SSH access

```powershell
ssh -i Hosting/N360Accredit.pem ubuntu@18.221.101.26
```

The PEM key is at `Hosting/N360Accredit.pem` and is excluded from version control.

### Production logs

```powershell
ssh -i Hosting/N360Accredit.pem ubuntu@18.221.101.26 "sudo journalctl -u nexus-api -n 100 --no-pager"
```

---

## Project layout

```
repo root/
├── src/                          # React frontend
│   ├── pages/                    # One file per route
│   │   ├── page-accreditation.jsx
│   │   ├── page-audits.jsx
│   │   ├── page-documents.jsx
│   │   ├── page-equipment.jsx
│   │   ├── page-home.jsx
│   │   ├── page-indicators.jsx
│   │   ├── page-isr.jsx          # Inter-Scorer Reliability (AASM)
│   │   ├── page-ncr.jsx          # Non-conformance & CAPA
│   │   ├── page-patients.jsx
│   │   ├── page-scheduler.jsx
│   │   ├── page-settings.jsx
│   │   ├── page-staff.jsx
│   │   ├── page-studies.jsx
│   │   └── page-tasks.jsx
│   ├── api.js                    # Fetch wrapper + data normalisation
│   ├── App.jsx                   # Router + shell orchestration
│   ├── AuthContext.jsx           # JWT auth, user session, role helpers
│   ├── NexusDataContext.jsx      # Central data fetch & cache
│   ├── components.jsx            # Shared UI primitives (Sidebar, Drawer, Tabs, …)
│   ├── icons.jsx                 # SVG icon library
│   └── user-profile-drawer.jsx  # Self-service profile panel
├── api/                          # ASP.NET Core 10 backend
│   ├── Program.cs                # All endpoints (minimal API style)
│   ├── Models/Models.cs          # EF Core entity classes
│   └── Data/                     # DbContext, SeedData, HTML SOPs & forms
├── deploy/
│   ├── deploy.ps1                # Main deploy script (run from repo root)
│   ├── deploy.sh                 # Bash equivalent for Linux pipelines
│   ├── nexus-api.service         # systemd unit file
│   └── nginx.conf                # nginx reverse proxy config
├── Hosting/                      # SSH keys (gitignored)
├── .env.development              # VITE_API_URL=http://localhost:5000
├── .env.production               # VITE_API_URL= (empty — nginx same-origin)
└── NATAacredit.sln               # Visual Studio solution (wraps api/ only)
```

---

## Application modules

| Module | Route | Description |
|---|---|---|
| Home | `/home` | Dashboard — compliance summary, overdue tasks, SLA alerts |
| Accreditation | `/accreditation` | Clause-by-clause evidence map (ASA §4–§5 / AASM) |
| Documents & SOPs | `/documents` | Controlled QMS document library |
| Audits | `/audits` | Internal audit planner and tracker |
| NC & CAPA | `/ncr` | Non-conformance register and corrective action plans |
| ISR | `/isr` | Inter-Scorer Reliability — quarterly concordance (AASM N-24) |
| Scheduler | `/scheduler` | Patient appointment calendar |
| Patients | `/patients` | Patient register |
| Studies & reports | `/studies` | Study queue, 10-day SLA tracking, physician sign-off |
| Quality indicators | `/indicators` | KPI dashboard with traffic-light status |
| Equipment | `/equipment` | Asset register, calibration/verification calendar |
| Staff & training | `/staff` | Staff register and training records |
| Referring Physicians | `/referring-physicians` | Physician register and portal invitations |
| Workbooks | `/workbooks` | Competency workbooks (AASM) |
| Settings | `/settings` | Site config, integrations, user management |
| Audit trail | `/trail` | System activity log |

---

## Testing

There are two independent test suites: **Playwright** UI smoke tests (in `tests/`) and **xUnit** API integration tests (in `api.Tests/`).

### UI tests — Playwright (`tests/`)

Smoke and navigation tests that drive a real Chromium browser against the local dev stack. Tests log in, visit every module, exercise core interactions (global search, profile drawer, notifications), and assert each page renders without console or page errors. They do not mutate data.

**First-time setup** (installs the Chromium browser binary):

```powershell
npm install
npx playwright install
```

**Running:**

```powershell
npm test                 # headless, all specs
npm run test:headed      # watch it drive a visible browser
npm run test:ui          # interactive Playwright UI mode (step through tests)
npm run test:report      # open the HTML report from the last run
```

The config in `playwright.config.js` auto-starts both dev servers (`dotnet run --project api` and `npm run dev`) if they are not already running, so you do not need to start them manually beforehand. If they are already running they are reused.

**Run a single spec or filter by test title:**

```powershell
npx playwright test tests/navigation.spec.js
npx playwright test -g "global search"
```

**Smoke-test the production deployment (read-only):**

```powershell
$env:BASE_URL="https://acdem.nexus360.cloud"
$env:API_URL="https://acdem.nexus360.cloud"
npx playwright test tests/navigation.spec.js
```

Setting `BASE_URL` to a non-localhost address disables the auto-start `webServer` block — the tests assume the target is already up.

**Test files:**

| File | What it covers |
|---|---|
| `tests/auth.spec.js` | Login screen, invalid credentials, demo shortcut, sign in/out cycle |
| `tests/navigation.spec.js` | Visits every sidebar module; asserts breadcrumb renders and no console errors |
| `tests/interactions.spec.js` | Global search, profile drawer, notification panel |
| `tests/helpers/auth.js` | Demo accounts; programmatic login + form login helpers |
| `tests/helpers/modules.js` | Sidebar module list and breadcrumb map |
| `tests/helpers/fixtures.js` | `errors` fixture that captures and filters console/page errors |

**Notes:**
- Tests use the seeded demo accounts (password `demo`). If logins fail, the database may need reseeding: `.\deploy\deploy.ps1 -Reseed` or delete `api/nexus.db` and restart the API for a fresh local seed.
- AASM-only modules (ISR, Workbooks) are skipped automatically when the active standard is set to ASA.
- Known third-party console noise (AG Grid, React DevTools, ResizeObserver) is filtered in `tests/helpers/fixtures.js`.

---

### API integration tests — xUnit (`api.Tests/`)

End-to-end tests for the ASP.NET Core API. Each test boots the **real** application via `WebApplicationFactory<Program>` (running the full `Program.cs` including startup seeding) but swaps the SQLite connection to a throwaway temp file, so tests never touch the dev `nexus.db`. No dev servers need to be running.

**Running:**

```powershell
# Single test project
dotnet test api.Tests/NexusApi.Tests.csproj

# Entire solution
dotnet test NATAacredit.sln
```

**Test files:**

| File | What it covers |
|---|---|
| `api.Tests/NexusApiFactory.cs` | Boots the API, replaces the DB with a temp SQLite file, cleans up on dispose |
| `api.Tests/TestSupport.cs` | `[Collection("backend")]` definition, demo accounts, `AuthedClientAsync()` login helper |
| `api.Tests/AuthTests.cs` | Login (valid/invalid), 401 on unauthenticated requests |
| `api.Tests/PatientsCrudTests.cs` | Full create → read → update → delete round-trip + 404 handling |
| `api.Tests/TasksTests.cs` | List + create |
| `api.Tests/StudiesTests.cs` | Status transitions + role gate (only physician roles may sign `Final`) |
| `api.Tests/SitesCrudTests.cs` | Site create → update → delete round-trip + 404 handling |
| `api.Tests/RegressionTests.cs` | Guards specific 500s caught via the UI suite (appointments date-range, ISR) |

**Notes:**
- All test classes share one seeded database via the `backend` xUnit collection and run **sequentially** — parallel writers cause SQLite file-lock failures. Tests stay independent by creating uniquely-named records and cleaning up after themselves.
- Auth uses the seeded demo accounts (password `demo`): `kavya.patel@nexus360.com` (Quality Manager) and `rafael.okafor@nexus360.com` (Medical Director — required for `Final` sign-off role-gate tests).
- The API serialises JSON as camelCase; tests read `studyId`, `patientId`, etc. accordingly.
- `Program.cs` ends with `public partial class Program { }` so the test project can reference the entry point — top-level statements otherwise emit an internal class the test assembly cannot see.

---

## Key conventions

- **No UI framework.** All components are hand-rolled in `src/components.jsx`. Do not introduce component libraries.
- **Minimal dependencies.** The package.json is intentionally lean (React + Vite core). Add packages only when truly necessary.
- **API calls** always go through `src/api.js` — never `fetch` directly in components.
- **Auth** — JWT stored in React state via `AuthContext`. Every API call includes the token via `authFetch`.
- **All endpoints** are in `api/Program.cs` — no controller layer, everything is minimal API style.
- **Theme** — four colour palettes (default / navy / neutral / teal) toggled via the tweaks panel. All colours are CSS custom properties; never hard-code hex values except `white`.
- **Standard toggle** — ASA/NATA and AASM modules are gated by `activeStandard` (stored in `SiteConfig`). Some nav items and pages are AASM-only.

---

## Common development tasks

### Add a new API endpoint

Edit `api/Program.cs` — follow the existing `app.MapGet` / `app.MapPost` pattern. Add model properties to `Models/Models.cs` if needed, and add an idempotent `ALTER TABLE … ADD COLUMN` entry to the startup migration loop (search for `"Add columns introduced after initial schema creation"`).

### Add a new page

1. Create `src/pages/page-<name>.jsx`
2. Register the route in `src/App.jsx` (`renderPage` switch + `crumbsFor` map)
3. Add the nav item to `items` in `src/components.jsx` → `Sidebar`

### Update an SOP or form document

HTML files live in `api/Data/` prefixed `SOP-` or `FRM-`. Edit directly — they are served as controlled documents via the Documents module.

### Reset the local database

Stop the API, delete `api/nexus.db`, then restart with `dotnet run`. The schema and seed data are recreated automatically.

### Run database migrations (schema additions)

Schema changes are applied at startup via idempotent `ALTER TABLE … ADD COLUMN` statements wrapped in `try/catch`. There is no migration runner — add new columns to the loop in `api/Program.cs` and restart the API.
