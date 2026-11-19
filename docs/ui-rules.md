# Website Creator OS V2 — UI rules (from the Pucho OS skill v5.1.x)

Source: `anthropic-skills:pucho-os-v511` — `reference/frontend-design.md`, `method/design-direction.md` (§0 Pucho Design
System, §1 font, §2 look, §3 motion, §5 not-slop, UX laws), `reference/microanimations.md`, `reference/pattern-catalogue.md`
§1 / §7b / §7c / §8, `reference/os-schema.md` § v3.5 (shell, look, PWA, translations).

This app is a Vite + React SPA, not a scaffolded Next.js OS, so the rules are applied by hand: `src/index.css` is the
one token file, `src/components/ui/*` are the primitives, `src/components/Sidebar.jsx` + `Header.jsx` are the shell.

## Decisions for this OS (D9)

| setting | pick | why |
|---|---|---|
| tone | `pucho` (the Pucho Design System, default since v4.8) | a Pucho product used all day by channel partners |
| shell | `sidebar` (one portal, 4 top pages + a client workspace) | ≤ 8 pages, nothing to section — a rail would add a click |
| sidebar style | `light` 260 px, `#FEFEFD`, hairline edge | DS sidebar |
| radius / edges | `pucho` 8 / 12 / 16 / 20 / 999 · hairline, no resting shadow | DS |
| canvas | `paper` (white page, subtle `#F5F4F0` for tiles and table heads) | DS |
| labels | `mono` — uppercase eyebrows in Geist Mono 12 px | DS default under the pucho tone |
| display | `serif` (Newsreader) on the greeting and empty states only | product mode default |
| dark mode | generated, header toggle, persisted as `pucho-theme`, set before first paint | v4.9 default |
| languages | English only (no `translations:` declared) | see "not applied" |

## The rules

### Colour
1. **One interactive colour.** Primary button = ink `#141413` (hover `#2A2620`). Violet `#7B5CFF` is the *accent*: focus
   ring (1.5 px, no glow), toggle / checkbox on, current step, selected tab marker, info. Never the primary button.
2. **Colour is status.** green `#4C8C6A` / amber `#B4763B` / red `#B45B4E` (+ violet for info); text on a tint uses the
   darkened AA values `#417559` / `#966333` / `#A45448`. Red only for overdue / failed / destructive. No colour for decoration.
3. **Depth is a hairline.** Cards white, border ink @15 %, radius 16, no resting shadow; nothing lifts or scales on hover
   (hover changes a background or border). Only overlays (menu, modal, drawer, toast) float, with one soft shadow.
4. **Whitespace before boxes.** Group with spacing and a small mono uppercase section label before adding a card.
5. **No hex literal in a page or component.** Every colour is a token (`bg-surface`, `text-ink-3`, `border-line` …) so
   dark mode works. No `bg-white`, `gray-*`, `slate-*`, `purple-*`, `emerald-*` utilities.
6. **Not slop:** no gradients, glass cards over data, glow shadows, neon, fake 3D, emoji as icons, mixed icon sets
   (Lucide only), floating / pinging / bouncing decoration.

### Type
7. Geist inside the app (self-hosted, `src/assets/fonts/geist`), tabular figures on every number; Geist Mono only for
   uppercase labels; the login page keeps IBM Plex Sans (self-hosted). No font fetched from a host.
8. Weights 400 body · 500 labels and buttons · 600 headings and KPI values. Nothing bolder.
9. Scale: page title 22 · section heading 17 · card heading 15 · body 14 · control label 13 · caption 12.
   **Nothing below 12 px.** KPI value 28 (20 in a strip). Long numbers chunked the Indian way (₹12,40,000).

### Components (DS sizes)
10. Buttons: S 33 h r8 13 px · M 34–40 h r12 14 px · L 44 h r12 15 px; 44 px on phones. Primary ink, secondary white +
    border @30 %, ghost, danger = red text. **One primary per view** (page header, modal, card).
11. Text field 44 h r12, border @15 %, hover @30 %, focus violet 1.5 px, error red 1.5 px; label 13 medium ink-3 above the
    control; helper 12. Password fields have a working show / hide eye.
12. Status chip = pill, subtle background, 7 px dot in the status colour, 12 px text (red text for failed).
    Filter chips: hairline pill, selected = ink fill. Chip rows scroll sideways on phones, never wrap into three rows.
13. Banner / callout: r12, tinted fill + tinted edge, icon disc. Toast: white, border, r16, toast shadow.
14. Stepper: 26 px nodes — done violet ✓, current white + violet 2 px ring, upcoming subtle + hairline; always says
    "Step n of m" and shows a progress bar (Zeigarnik / goal gradient).
15. Sidebar: rows 36 h r12, icon 18 @1.5, 14 px ink-3; selected = subtle fill + 500 ink; group labels mono uppercase.
    No brand marker bar.

### Shell
16. Header 56 px: page title (+ one short subtitle where it helps) on the left, **search in the centre**, theme toggle and
    the bell on the right. **No avatar in the header.** The account menu (Profile & settings · Sign out) is the profile
    at the bottom-left of the sidebar.
17. Client mark in the shell; Pucho only in "Powered by Pucho.ai" (quiet, local asset, no external request).
18. On phones every shell is a drawer (Escape closes, focus returns).

### Layout and UX laws
19. Fitts: primary ≥ 32 px desktop / 40 px phone, at the right end of the header or the modal footer.
20. Hick: ≤ 3 actions in a page header; the rest in a menu or on the record.
21. Zeigarnik / goal gradient: show what is left ("4 of 9 steps"), start part-way when work is already done.
22. Von Restorff: one primary, at most one highlighted KPI or callout per view, badges only for what needs action.
23. Miller: ≤ 4 KPIs per row, ≤ 7 nav items per group, forms over 7 fields get sections, few table columns.
24. Jakob: search in the header, settings in the account menu, filters above the table, save bottom-right, destructive
    actions red and confirmed.
25. **Every KPI opens the list behind it.**
26. Spacing rhythm 4 px: 8 / 12 inside a card, 16 between cards, 20–24 between blocks.

### States
27. Truthful states: skeletons only while loading, a queued job is not "done", no invented percentages or fake "Live"
    pills; entered values kept on failure; a persistent error line, not only a toast.
28. Empty states say why and offer the next step.

### Motion
29. 120 / 200 / 280 ms, standard ease, no bounce, no count-up, no looping decoration; opacity and ≤ 8 px travel only;
    `prefers-reduced-motion` shows the final state.

### Mobile and accessibility
30. Works at 1440 / 768 / 390 px with no horizontal page scroll; tables become cards under 640 px; 44 px touch targets;
    visible focus; icon-only buttons have an `aria-label` and a tooltip; text beside colour; Escape closes the top overlay.
31. `<img>` of a stored / remote image sets `referrerPolicy="no-referrer"`.

### PWA
32. `manifest.webmanifest` + icons (the client's mark), a service worker (hashed assets cache-first, navigations
    network-first with an offline fallback, `/api/*` never cached), `theme-color`, and an install action in the header.

### Indian languages
33. The UI speaks English plus every language the OS declares with translations; a header language switch appears only
    when more than one is declared. Geist has no Devanagari / Gujarati: those scripts fall back to the system font
    (`Noto Sans Devanagari`, `Noto Sans Gujarati`, then system-ui). Dates `en-IN` (IST), money `₹` with Indian grouping.
