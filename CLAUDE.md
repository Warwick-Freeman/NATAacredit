# Nexus 360 Accreditation — CLAUDE.md

Healthcare accreditation management system for sleep disorders services undergoing NATA/ASA Standard compliance. Full-stack: React 18 + Vite frontend, ASP.NET Core 10 REST API, SQLite database.

---

## Prerequisites

| Tool | Required | Check |
|------|----------|-------|
| Node.js | ≥ 18 | `node --version` |
| .NET SDK | **10.0** | `dotnet --list-sdks` |
| OpenSSH client | any | `ssh -V` |

> **Important:** .NET 9 is NOT sufficient. The API targets `net10.0` with package versions `10.0.*`. Install .NET 10 SDK from https://dotnet.microsoft.com/download/dotnet/10.0

---

## Running Dev

### Frontend (React/Vite)
```powershell
# From repo root
npm install       # first time only
npm run dev       # starts on http://localhost:5173
```

### Backend (.NET API)
```powershell
# From repo root
cd api
dotnet run        # starts on http://localhost:5000
```

Run both simultaneously — the frontend proxies API calls to `http://localhost:5000` via `VITE_API_URL` in `.env.development`.

### Build for production locally
```powershell
npm run build     # outputs to dist/
```

---

## Deploying to Production

Production server: `ubuntu@18.221.101.26` (AWS EC2) — `https://acdem.nexus360.cloud`
Stack: nginx (HTTPS on 443) → reverse proxy → .NET systemd service (port 5000)

### Full deploy (frontend + API)
```powershell
# From repo root
.\deploy\deploy.ps1
```

### Deploy with database reset (re-seeds from SeedData.cs)
```powershell
.\deploy\deploy.ps1 -Reseed
```

The script:
1. Builds the React frontend (`npm run build`)
2. Publishes the .NET API (`dotnet publish -c Release`)
3. Uploads frontend to `/var/www/nexus` via SSH/SCP
4. Uploads API to `/opt/nexus-api/` and restarts the systemd service
5. Uploads TLS certificate from `cert/` (GoDaddy-signed for acdem.nexus360.cloud)
6. Installs/reloads nginx config

After deploy: `https://acdem.nexus360.cloud`

### SSH key location
`Hosting/N360Accredit.pem` — do not commit changes to this file, it is already in `.gitignore`.

---

## Architecture

```
repo root/
├── src/              # React frontend
│   ├── pages/        # One file per route (page-accreditation.jsx, page-studies.jsx, etc.)
│   ├── api.js        # Fetch wrapper + data normalisation for all models
│   ├── App.jsx       # Router + sidebar orchestration
│   ├── AuthContext.jsx       # JWT login/logout
│   ├── NexusDataContext.jsx  # Central data fetch & cache
│   └── components.jsx        # Shared UI primitives (Sidebar, Drawer, modals)
├── api/              # ASP.NET Core 10 backend
│   ├── Program.cs    # All endpoints, JWT auth, CORS, EF Core setup
│   ├── Models/       # EF Core entity classes
│   └── Data/         # DbContext, SeedData, HTML SOPs & forms
├── deploy/           # Deployment automation
│   ├── deploy.ps1    # Main deploy script (run from repo root)
│   ├── deploy.sh     # Bash equivalent for Linux pipelines
│   ├── nexus-api.service  # systemd unit file
│   └── nginx.conf    # nginx reverse proxy config
├── Hosting/          # SSH keys (N360Accredit.pem / .ppk)
├── .env.development  # VITE_API_URL=http://localhost:5000
├── .env.production   # VITE_API_URL= (empty — nginx same-origin proxy)
└── NATAacredit.sln   # Visual Studio solution (wraps api/ only)
```

---

## Domain Model

The app implements **ASA Standard for Sleep Disorders Services** compliance:

| Module | Route | Description |
|--------|-------|-------------|
| Accreditation | `/accreditation` | Clause-by-clause evidence map (4.1–4.15, 5.1–5.8) |
| Studies | `/studies` | Patient study queue, 10-day SLA tracking |
| Equipment | `/equipment` | Asset register, verification/calibration calendar |
| Documents | `/documents` | Controlled QMS docs (SOPs, forms, policies) |
| Indicators | `/indicators` | KPI dashboard with traffic-light status |
| Audits | `/audits` | Internal audit planner |
| NCR | `/ncr` | Non-conformance & CAPA register |
| Staff | `/staff` | Staff register & rostering |
| Tasks | `/tasks` | Task management (critical/overdue tracking) |

---

## Key Conventions

- **No UI framework** — all components are hand-rolled in `src/components.jsx` and `src/icons.jsx`. Do not introduce component libraries.
- **Minimal dependencies** — the package.json is intentionally lean (React + Vite only). Add packages only when truly necessary.
- **API calls** — always go through `src/api.js` functions, never fetch directly in components.
- **Auth** — JWT stored in React state via `AuthContext`. Token included on every API call via the `authFetch` wrapper in `api.js`.
- **Database** — SQLite single file (`nexus.db`). Schema is created at startup via EF Core. Use `-Reseed` flag to reset it.
- **Theme** — 4 colour palettes (default/navy/neutral/teal) toggled via `src/tweaks-panel.jsx`. CSS variables drive all colours.
- **All endpoints** are defined in `api/Program.cs` — there is no controller layer, everything is minimal API style.

---

## Common Tasks

### Add a new API endpoint
Edit `api/Program.cs` — follow the existing `app.MapGet/MapPost` pattern. Add the corresponding model property to `Models/Models.cs` if needed.

### Add a new page
1. Create `src/pages/page-<name>.jsx`
2. Register the route in `src/App.jsx`
3. Add the nav item to the sidebar in `src/components.jsx`

### Update an SOP or form document
HTML files live in `api/Data/` (prefixed `SOP-` or `FRM-`). Edit directly — they are served as controlled documents via the Documents module.

### Check production logs
```powershell
ssh -i Hosting/N360Accredit.pem ubuntu@18.221.101.26 "sudo journalctl -u nexus-api -n 100 --no-pager"
```

### SSH into production
```powershell
ssh -i Hosting/N360Accredit.pem ubuntu@18.221.101.26
```
