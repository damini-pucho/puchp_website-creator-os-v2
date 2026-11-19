# UI rebuild brief (for the page restyle work)

App: `website_creator_os_v2/` (Vite + React 18 + Tailwind v4). This is a **UI-only** rebuild to the Pucho Design System.
Read first: `docs/ui-rules.md` (the rules), `src/index.css` (token names), `src/components/ui/Cards.jsx` and
`src/components/ui/primitives.jsx` (the primitives you must use). The shell (Sidebar, Header, layout) is already done.

## Hard constraints
- Change **only** the files you were given. Never edit `src/utils/**`, `src/context/**`, `src/services/**`, `src/data/**`,
  `src/index.css`, `src/components/ui/**`, `Sidebar.jsx`, `Header.jsx`, `App.jsx`, routing, or any other page.
  If you need a small helper component, define it inside your own file.
- Keep behaviour identical: every state variable, handler, effect, prop, data call (`db`, `api`, `/api/db`, `/api/flow/*`,
  `triggerWorkflow`, `sendClientToPlanningWorkflow` …), toast, navigation, route and workflow step stays as it is.
  Same inputs with the same `value` / `onChange` / `name`. Do not rename exports. Do not reorder workflow logic.
  You may restructure JSX and classes, swap a hand-made widget for a primitive with the same behaviour, and tighten copy
  (no change in meaning).
- No new npm packages. Lucide icons only (`strokeWidth={1.7}`). No emoji as icons.
- Do not open the browser, start servers, run `npm install` or `vite build`.

## Class mapping (tokens only — no hex anywhere in className or style; `var(--token)` strings are fine in style/chart props)
| was | now |
|---|---|
| `bg-white` | `bg-surface` |
| `bg-gray-50/slate-50/canvas-soft/[#FAFAFF]/[#F8F9FC]` | `bg-surface-2` (subtle) — page background is `bg-canvas` |
| `text-[#111834]`, `text-gray-900/800`, `text-slate-900` | `text-ink` |
| `text-gray-700/600`, `text-slate-600` | `text-ink-2` |
| `text-gray-500/400`, `text-ink-muted`, `text-ink-faint` | `text-ink-3` (`text-ink-4` = placeholder / disabled only) |
| `border-gray-100/200`, `border-line`, `border-[#…]` | `border-line` (stronger: `border-line-strong`, softer divider: `border-line-soft`) |
| brand / purple / violet / indigo as the main action | `<Button variant="primary">` (ink fill) |
| brand / purple as selection, current step, progress, focus, info | accent: `bg-accent`, `text-accent-text`, `bg-accent-soft`, `border-accent-edge` |
| brand / purple as decoration (icon tints, tiles, headings) | neutral: icon `text-ink-2` / `text-ink-3` on `bg-surface-2` disc; headings `text-ink` |
| emerald / green | `ok`: `bg-ok-soft text-ok-text border-ok-edge`, dot `bg-ok` |
| amber / yellow / orange | `warn`: `bg-warn-soft text-warn-text border-warn-edge`, dot `bg-warn` |
| red / rose | `bad`: `bg-bad-soft text-bad-text border-bad-edge`, dot `bg-bad` — only failed / overdue / destructive |
| blue / sky (info) | `info`: `bg-info-soft text-info-text border-info-edge` |
| chart colours | `var(--cat-1)` … `var(--cat-8)`; axes / grid `var(--ink-3)` / `var(--line)`; status series use `var(--ok)` etc. |

Status words: prefer `<StatusPill status=… />` or `<Badge>` (pill, subtle fill, 7 px dot). Text always beside colour.

## Shape, type, depth
- Radius: `rounded-md` 8 (chips, small buttons) · `rounded-xl` 12 (controls, buttons, tiles, inner boxes) ·
  `rounded-2xl` 16 (cards) · `rounded-3xl` 20 (modals / drawers) · `rounded-full` only pills, status chips, avatars, dots.
- Depth is a hairline: cards `bg-surface border border-line rounded-2xl`, **no resting shadow**; `shadow-float` only on
  menus, popovers, modals. No `hover:-translate`, `hover:scale`, lift on hover (hover changes bg or border only).
- No gradients (`bg-gradient-*`, `linear-gradient` styles), no glass (`backdrop-blur` on cards, `bg-white/70`), no glow,
  no `animate-ping`, `animate-bounce`, `animate-float`. `animate-spin` on a loader icon is fine; `animate-pulse` only on a
  skeleton or a working dot. `transition-all` → `transition-colors` (120–200 ms).
- Type: in-page heading `text-[22px] font-semibold` (only where the shell header title is not enough); section heading
  `text-[17px] font-semibold`; card heading `text-[15px] font-semibold`; body `text-sm`; control label
  `text-[13px] font-medium text-ink-3`; caption `text-xs text-ink-3`; eyebrow / table head `label-mono`. **Nothing below
  12 px** (`text-xs`). Weights only `font-normal / font-medium / font-semibold`. Numbers `tabular-nums`. Drop
  `font-display`; `font-serif` only for a greeting or an empty-state heading.
- Spacing rhythm 4 px: 12–16 inside a card, 16 between cards, 20–24 between blocks. Whitespace + `<SectionLabel>` before
  adding a box. Don't nest bordered cards; an inner group is `bg-surface-2 rounded-xl` (no border) or a divider.

## Components and UX laws
- Buttons: `<Button variant="primary|secondary|ghost|danger|accent" size="sm|md|lg" icon={Icon}>`. **One primary per
  view** (page header, each modal, each card). Page header: ≤ 3 actions, primary rightmost. Save bottom-right.
  Destructive = `danger`, and confirmed (keep any existing confirm).
- Icon-only buttons: `<IconButton icon label>` or an `aria-label` + `title`.
- Inputs: `<Input>` (ui/Input.jsx), or the `.field` class / `<Field><TextInput|TextArea|Select/></Field>`; label above.
- Hand-made overlays (`fixed inset-0 …`): use `<Modal>` / `<Drawer>` from primitives when the open/close logic maps 1:1;
  otherwise restyle to `bg-scrim` backdrop + `bg-surface border border-line rounded-3xl shadow-float` panel and make
  Escape close it.
- KPIs: `<StatCard>`; ≤ 4 per row; **every KPI opens the list behind it** (an existing route or a filter on the same
  page). Never invent a route.
- Filters / segments: `<Chip count>` in a `<ChipRow>` (scrolls sideways on phones), `<Tabs>`, `<Segmented>`.
- Steps: `<StepDot state n>` nodes, always "Step n of m", a `<Progress>` bar; done = accent ✓, current = accent ring.
- Callouts: `<Callout tone title>`. Empty: `<EmptyState icon title description action>` (say why + next step).
- Tables: header row `bg-surface-2` with `label-mono` cells, rows `text-[13px]`, `hover:bg-hover`, dividers
  `border-line-soft`; under 640 px render rows as stacked cards (`hidden sm:block` table + `sm:hidden` cards) or at
  minimum an `overflow-x-auto` wrapper with no page-level horizontal scroll.
- Truthful states: no fake "Live" pings or invented percentages / deltas that are not computed from data. If you find a
  hard-coded number shown as if it were real, keep the data logic but drop the invented decoration and **list it in
  your report**. Skeletons only while loading; errors stay visible as text, not only a toast.
- Mobile (390 px): no fixed widths that overflow, grids collapse to one column, chip rows scroll, touch targets ≥ 44 px.
- Remote / stored `<img>`: add `referrerPolicy="no-referrer"`.
- Dark mode must work, which is why only tokens are allowed.

## Verify before you finish (from `website_creator_os_v2/`)
1. Syntax: `node_modules/.bin/esbuild <file> --loader:.jsx=jsx --jsx=automatic --log-level=error > /dev/null` for each file.
2. Off-system scan on your files must print nothing:
   `grep -nE "#[0-9a-fA-F]{3,8}\b|bg-white|(gray|slate|zinc|neutral|purple|violet|indigo|emerald|rose|amber|green|red|blue|sky|yellow|orange|pink|teal|cyan|lime|fuchsia)-[0-9]|gradient|shadow-(sm|md|lg|xl|2xl|card|soft|inner)|text-\[(8|9|10|11)px\]|font-(bold|black|extrabold)|font-display|backdrop-blur|animate-(ping|bounce|float)|hover:scale|hover:-translate|transition-all" <files>`
   (a hit inside a string the app sends to a flow, a prompt, or generated website content is allowed — say so).
3. Check that every handler / data call you saw before is still wired (diff your mental before/after).

## Report (your final message, ≤ 350 words)
Per file: 3–8 bullets "what changed on this screen"; then "Rules not applied (and why)"; then "Invented / hard-coded
numbers found". No code in the report.
