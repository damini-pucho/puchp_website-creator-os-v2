# UI rebuild — what changed (18 Nov 2026)

The whole UI was rebuilt to the Pucho OS skill v5.1.x look (rules: `docs/ui-rules.md`). It is a UI-only change.
Routes, data calls (`src/utils/api.js`, `/api/db`, `/api/flow/planning|planning-test|build`), contexts and the 4 workflow
steps are unchanged. `npm run build` passes. **Not deployed:** the live site still runs `index-DfTtBPjc.js` until the
next redeploy. The deploy bundle, `schema.sql` and `handover/` were not touched.

## Foundation (every screen)
- `src/index.css` is now the one token file: DS light + dark values, Tailwind names (`bg-surface`, `text-ink-3`,
  `border-line`, `bg-primary text-on-primary`, `ok/warn/bad/info`, `accent`), radius 8/12/16/20, no resting shadows,
  weights capped at 600, 12 px floor, motion 120–280 ms, reduced motion, sonner toasts as the DS toast.
- Fonts self-hosted: Geist + Geist Mono + Newsreader (`src/assets/fonts`, OFL) inside the app; IBM Plex Sans
  (`@fontsource/ibm-plex-sans`, new dependency) on the login page. Google Fonts removed from `index.html`.
- Primitives: `components/ui/Cards.jsx` (Card, StatCard, Button, StatusPill, EmptyState, same exports),
  `components/ui/primitives.jsx` (Page, PageHeader, SectionLabel, CardHeader, Badge, Tag, Chip/ChipRow, Callout,
  Progress, StepDot, Tabs, Segmented, Field/TextInput/TextArea/Select, Toggle, IconButton, Skeleton, Working, Modal,
  Drawer, KeyValue, Tile, Avatar, fmtINR), `components/ui/tone.js` (status word → tone), `ui/Input.jsx` (DS field, eye).
- Dark mode: `context/ThemeContext.jsx`, boot script in `index.html` (no flash), header toggle (Shift-click = follow
  system), persisted `pucho-theme`.
- PWA: `public/manifest.webmanifest`, `public/brand/icon.svg|icon-192.png|icon-512.png` (the Pucho mark),
  `public/sw.js` (hashed `/assets` cache-first, navigations network-first, `/api` and `/health` never cached), registered
  in production only; install button in the header when the browser offers it.

## Shell
- **Sidebar**: DS sidebar (260 px, light, 36 px rows, subtle selected row), groups "Workspace" / "Client", active client
  with status dot, collapse kept, phone drawer with Escape + focus return. **Account menu** at the bottom-left
  (Profile & settings · Sign out). "Powered by Pucho.ai" moved here (local logo, no CDN request).
- **Header**: title + client name, **client search in the centre** (Ctrl/⌘ K, name / industry / city / website),
  theme toggle, **bell** = clients that need the partner (changes requested, failed builds), install, "Live site" link,
  quiet clock on very wide screens. Fake "Pucho Live" ping pill removed. No avatar in the header.
- Floating "Powered by" badge now only on the public proposal page `/p/:clientId`.

## Per screen
- **Login** — kept as the Pucho brand page; IBM Plex Sans, 12 px floor, show/hide password eye, error as a DS banner.
- **Overview** — serif greeting, one primary ("Onboard new client"), 4 KPIs that open `/clients?status=…`, token chart
  labelled "Sample data", step distribution "Step n of 4", client table → cards on phones, recent activity. Removed the
  invented +25 % / +40 % … deltas and the "98 % quality" KPI.
- **Clients** — status chips with counts (reads `?status=`), table → cards under 640 px, labelled row actions, Modal for
  the logo, empty state.
- **Settings** — identity strip, Profile / Security / Preferences sections, password fields with the eye, Toggles.
- **Templates** — category chips, accent selection, preview Modal with desktop / tablet / phone frames; ratings and the
  "99/100 speed" claim no longer shown.
- **Website workflow** — DS stepper (StepDot, "Step n of 4", progress, phone select), client strip, truthful pipeline
  state (real elapsed time and poll count; the fake cycling percentage removed).
- **Business Setup (step 1)** — six titled sections, two columns on desktop, DS fields, dashed upload zones, one
  primary "Save & continue" bottom-right, validation errors stay visible. The "Quick fill with real business data"
  section was removed on request, with its sample data (`src/data/demoClients.js`, its handler and state).
- **Proposal (step 2) + public `/p/:id`** — DS document layout, Approve = the one primary, "Request changes" secondary,
  public page as a centred document; print kept.
- **Build handoff (step 3)** — prompt block on subtle surface, copy/download secondary, status rows.
- **Pre-publish / Post-deploy (step 4)** — status-dot checklist, computed "n of m passed", score tiles, tables → cards.
- **Keywords / Structure / Planning** — DS tables and tree, Modals, empty states; fixed a crash (`Input` was not
  imported in KeywordResearch, "Add keyword" broke the page).
- **Pages / SEO-AEO-GEO / Analytics / Leads / Media** — chips with counts, tables → cards, DS forms, lead Drawer with
  tel:/mailto:, media grid with always-visible actions; Analytics KPIs labelled "Sample figures".

## Rules not applied, and why
- **Indian languages**: no `translations:` were declared, so the UI stays English and no language switch is shown;
  Devanagari / Gujarati text falls back to Noto / the system font. Adding Hindi labels needs the strings from you.
- **Kernel stack** (Next.js, antd, server-side roles, argon2 sign-in, Users & roles page, audit log): this app is a Vite
  SPA on nginx + PostgREST; changing that is a data-model / deploy change, out of scope for a UI rebuild.
- **Every KPI opens its list**: the Analytics KPIs sort the query list or open Leads; there is no list behind the sample
  impressions figure beyond that.
- **Website-colour hex values** remain in BusinessSetup / TemplateGallery data — they are the generated website's
  palette, not app styling.
- **Delete confirm** on blocks / fields / media: none existed before, none added.
- Login page keeps its gradient button and mascots — the skill says the login is the brand page and keeps its styling.

## Hard-coded or invented content still shown (needs a decision)
- Analytics KPIs 42,400 / 4,810 / 184 (labelled sample); GSC / GA4 start as "Connected" without a login.
- SEO scores (94 / 96 / 90 / 92) are constants; the meta template mentions "FSSAI/GST" and "shipping across India" for
  every client.
- Proposal fallback price table (₹45,000 / 15,000 / 5,000) and "Channel Partner: Arjun Khanna".
- Pre-publish audit is a 2-second timer with fixed pass results (only GST is really checked).
- Post-deploy fallback page rows marked "VERIFIED" and fallback technical notes when the report lacks them.
