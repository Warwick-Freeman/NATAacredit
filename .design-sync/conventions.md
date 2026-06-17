# Nexus 360 — Design Conventions

Nexus 360 Accreditation is a healthcare SaaS app for sleep disorders services undergoing NATA/ASA Standard compliance. The UI is deliberately minimal — no component library, hand-rolled CSS-variable–driven components.

## Colour system

The palette uses four named themes (default, navy, neutral, teal) all driven by CSS custom properties. Use these semantic tokens rather than raw hex values:

| Token | Role |
|---|---|
| `--bg` | Page background |
| `--surface` | Card / panel background |
| `--surface-2` | Subtle inset (table rows, inner panels) |
| `--border` | Default border |
| `--ink` | Primary text |
| `--ink-2` | Secondary / muted text |
| `--ink-3` | Tertiary / placeholder |
| `--accent` | Interactive highlight (buttons, active tabs, links) |
| `--accent-surface` | Light tint of accent for hover states |

Status colours follow a consistent traffic-light convention used throughout the accreditation, compliance, and NCR modules:

| Intent | Token |
|---|---|
| Good / compliant / active | `--good` / `--good-surface` |
| Warning / due soon / partial | `--warn` / `--warn-surface` |
| Error / overdue / non-conformant | `--bad` / `--bad-surface` |

## Typography

Body text: `"Inter"` → system-ui fallback stack. All sizes in `px` (the design targets 1x = 1px).

Monospace (clause IDs, codes): `"JetBrains Mono"` → `ui-monospace` fallback.

Typical scale:
- Page title: 22 px 600
- Section heading: 16 px 600
- Body: 14 px 400
- Label / eyebrow: 12 px 500 uppercase (0.06 em tracking)
- Micro: 11 px 400

## Layout patterns

- Pages use `PageHeader` at the top (eyebrow → title → subtitle + action slot).
- Tabular data lives in `.tbl` tables with `.row-clickable` rows.
- Detail panels open as a `Drawer` (right-side slide-in) rather than inline expansion.
- `Tabs` live directly below `PageHeader` when a page has multiple views.
- KPI dashboards combine `Donut` + `Sparkline` in card grids.

## Spacing

All spacing uses multiples of 4 px. Card padding is typically 20–24 px. Gaps between related elements: 8–12 px.

## Status indicators

Prefer `StatusPill` for accreditation clause status (compliant / partial / nc / na). Use `Pill` with `kind` for all other status or tag display. Avoid raw colour spans — always go through a Pill or StatusPill for semantic consistency.
