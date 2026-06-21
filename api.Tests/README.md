# API integration tests (xUnit)

End-to-end tests for the ASP.NET Core API. Each test spins up the **real**
application via `WebApplicationFactory<Program>` (running all of `Program.cs`,
including its startup seeding) but swaps the SQLite connection to a throwaway
temp file, so tests never touch the dev `nexus.db`.

## Running

```powershell
dotnet test api.Tests/NexusApi.Tests.csproj
```

Or the whole solution:

```powershell
dotnet test NATAacredit.sln
```

No dev servers need to be running — the tests host the API in-process (Kestrel
is replaced by an in-memory `TestServer`, so nothing binds to port 5000).

## How it works

| File | Role |
|------|------|
| `NexusApiFactory.cs` | Boots the API, replaces the DB with a temp SQLite file, cleans it up on dispose |
| `TestSupport.cs`     | `[Collection("backend")]` definition, demo accounts, `AuthedClientAsync()` login helper |
| `AuthTests.cs`       | Login (valid/invalid), and 401-vs-200 on a protected endpoint |
| `PatientsCrudTests.cs` | Full create → read → update → delete round-trip + 404s |
| `TasksTests.cs`      | List + create (the API exposes no task update/delete) |
| `StudiesTests.cs`    | Status transitions + **role gate**: only physician roles may sign `Final` |
| `SitesCrudTests.cs`  | Site create → update → delete round-trip + 404 |
| `RegressionTests.cs` | Guards the two 500s found via the UI suite (appointments date-range, ISR) |

## Conventions

- All classes share one seeded database via the `backend` xUnit collection and
  run **sequentially** — SQLite file locking makes parallel writers flaky.
  Tests stay independent by creating uniquely-named records and cleaning up.
- Auth uses the seeded demo accounts (password `demo`):
  `kavya.patel@nexus360.com` (Quality Manager, non-physician) and
  `rafael.okafor@nexus360.com` (Medical Director, physician — may sign `Final`).
- The API serializes JSON as camelCase, so tests read `studyId`, `patientId`,
  `taskId`, etc.

## Note

`Program.cs` ends with `public partial class Program { }` purely so this test
project can reference the entry point — top-level statements otherwise emit an
internal `Program` the test assembly can't see.
