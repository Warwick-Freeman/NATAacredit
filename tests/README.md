# UI test suite (Playwright)

Smoke + navigation tests that exercise the Nexus 360 frontend against the local
dev stack. These tests do **not** mutate data — they log in, visit every module,
exercise core interactions (global search, drawers, notifications), and assert
each page renders without console/page errors.

## Prerequisites

```powershell
npm install                 # installs @playwright/test
npx playwright install      # installs the Chromium browser (first time only)
```

## Running

The config auto-starts both dev servers (`dotnet run --project api` and
`npm run dev`) if they aren't already running, so you can just:

```powershell
npm test                 # headless, all specs
npm run test:headed      # watch it drive a real browser
npm run test:ui          # interactive Playwright UI mode
npm run test:report      # open the HTML report from the last run
```

Run a single spec or filter by title:

```powershell
npx playwright test tests/navigation.spec.js
npx playwright test -g "global search"
```

## Targeting a different environment

Override the URLs with env vars. Pointing `BASE_URL` off-localhost disables the
auto-start `webServer` block (assumes the target is already up):

```powershell
# Read-only smoke check against production
$env:BASE_URL="https://acdem.nexus360.cloud"; $env:API_URL="https://acdem.nexus360.cloud"; npx playwright test tests/navigation.spec.js
```

## Layout

| File | What it covers |
|------|----------------|
| `helpers/auth.js`      | Demo accounts; fast programmatic login + form login |
| `helpers/modules.js`   | The sidebar module list and breadcrumb map |
| `helpers/fixtures.js`  | `errors` fixture that captures console/page errors |
| `auth.spec.js`         | Login screen, invalid creds, demo shortcut, sign in/out |
| `navigation.spec.js`   | Visits every module; asserts breadcrumb + no errors |
| `interactions.spec.js` | Global search, profile drawer, notifications |

## Notes

- Login uses the seeded demo accounts (password `demo`). Tests assume the API is
  seeded — run `.\deploy\deploy.ps1 -Reseed` or start a fresh local DB if logins fail.
- `aasm`-only modules (Inter-Scorer Reliability, Workbooks) are skipped
  automatically when the active standard is ASA and they aren't in the sidebar.
- Known third-party console noise (AG Grid, React DevTools, ResizeObserver) is
  filtered in `helpers/fixtures.js` — add patterns there if new noise appears.
