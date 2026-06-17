# Design Sync Notes

## First sync — 2026-06-18

**Project:** Nexus 360 Accreditation
**URL:** https://claude.ai/design/p/d7b9cf92-f755-4562-9dc6-7fc0ea653f86
**Components synced:** 8 — Avatar, Donut, Drawer, PageHeader, Pill, Sparkline, StatusPill, Tabs

### Build decisions

- `--entry ./src/components.jsx` required because the app is a private package (no `node_modules/nexus-360-accreditation`); the converter uses it to walk up to the repo root as PKG_DIR.
- All 8 components explicitly pinned in `componentSrcMap` because the plain-JS app has no `.d.ts` files and the synth-entry path only runs without `--entry`.
- `Sidebar` and `Topbar` set to `null` in `componentSrcMap` — they depend on internal React contexts (useLocation, useNexusData, useAuth) that are unavailable in the isolated preview environment.
- `cardMode: "single"` for Drawer (fixed positioning escapes the card grid).
- `cardMode: "column"` for PageHeader and Tabs (render wider than default grid cells).

### Fonts

- No font files in repo. App CSS references Inter/Söhne/JetBrains Mono with system-ui fallbacks.
- Added Google Fonts `@import` for Inter and JetBrains Mono to `src/app.css` on 2026-06-18 (user confirmed). This benefits the live app too — it now loads Inter from Google Fonts.
- Söhne, Caveat, Snell Roundhand remain at system fallbacks — these are referenced in the CSS but were never loaded by the app.
- Validator sees `[FONT_REMOTE]` (green, not a warning) because fonts.googleapis.com is present in `_ds_bundle.css`.

### Playwright

- Installed playwright + chromium on 2026-06-18 for render verification.
- All 8/8 previews passed render check.

### Re-sync command

```powershell
cd C:\Users\wef.CMPHQ\Claude\NATAacredit
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./src/components.jsx --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```
