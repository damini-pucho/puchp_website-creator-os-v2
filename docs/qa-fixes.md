# QA/QC report (18 Nov 2026) — fix status

Source: `website_creator_os_V2_QA_QC_Report.pdf` (23 findings). Fixed here = in the source; `npm run build` passes.
**Nothing is deployed yet** — production keeps every finding until the next redeploy. The deploy bundle (`deploy/`,
`handover/`), `schema.sql` and the database were not changed.

## Fixed in the app (frontend only)

| ID | Fix | Re-test done locally |
|---|---|---|
| C-03 | One generic error, "Email or password is incorrect." — the password is never shown | wrong password and unknown email both show it; page text has no password |
| C-04 | No default signed-in user: protected pages need a session created by sign-in; sign-out ends it; a session expires after 12 h | after Sign out + full reload, `/clients/client-02/setup` opens the sign-in page, no client data |
| C-02 (partly) | Only the account email + password sign in (unknown emails refused); 5 wrong tries lock the form for 60 s | `qa-random-user@example.test` + default password is refused |
| L-03 | Pre-filled fields and "Use Demo Credentials" only in development builds | production bundle has no "Use Demo Credentials" |
| L-04 | Signed-in visitors to `/` go to `/overview`; unknown addresses show a "Page not found" page; sign-in returns to the page that was asked for | `/` → `/overview`, `/nonexistent-route` → Page not found |
| M-02 | A client id that does not exist shows "Client not found" (no blank, editable form); `new` still starts onboarding | `/clients/does-not-exist/workflow` → Client not found |
| M-01 | Data loads once per page load (StrictMode double-run guarded) | 1 request each for clients, compliance_history, activities |
| M-04 | Analytics: Search Console / GA4 start "Not connected", Connect says the Google sign-in is not set up, the 42,400 / 4,810 / 184 samples are gone. SEO/AEO/GEO: scores only from a real audit, "—" before one; the invented 98/95/100 + "Pass" defaults in compliance history are gone | Blue Tokai shows "—"; Saffron Stays shows its audit's 98 / 95 / 100 |
| M-05 | Activity rows carry `client_id`; the duplicate "Business Setup settings updated" row is gone; Save buttons are disabled while a save is in flight | code path checked; no save was run against the database |
| M-08 | One display label per status (`proposal_sent` → "Proposal sent", etc.) in pills, sidebar and search | sidebar no longer shows raw values |
| L-01 | Templates de-duplicated by id in the gallery and in the stored catalog (storage self-heals) | no duplicate-key warnings on a fresh render; stored catalog 32 entries, 0 duplicate ids |
| L-02 | Header search becomes an icon below 1280 px; `/templates` titled "Templates" | at 910 px no title is cut |
| L-06 | Studio webhook URLs removed from `vite.config.js` (`.env` only); Tailwind spec set to the installed stable 4.3.5 | build passes |

## Needs server / database / nginx work (not done — your decision)

These change the deploy bundle (`deploy/nginx.conf`, entrypoint), `schema.sql` or the data model, so they were not
touched. The browser-only sign-in above is **not** real security: the shared password still sits in the bundle and
anyone can call `/api/db` directly.

| ID | What it needs |
|---|---|
| C-01 | Block anonymous `/api/db` — only possible after real sign-in (otherwise the app itself breaks) |
| C-02 / H-02 | Server-side login: `users` table, argon2id hashes, HttpOnly session or signed JWT for PostgREST, an `anon` role with no grants, RLS per workspace |
| H-01 | Random share token per proposal (new column) instead of `/p/<client id>` |
| H-03 | Planning webhook answered 404 on 17 Nov: check the flow is published in Pucho Studio and the webhook id in `.env` / CP Portal env; make `/api/flow/*` require a signed-in session |
| H-04 | Stop storing a 2 MB base64 PDF in `clients.proposal_pdf_url` (use `proposal_files` / object storage only) and select list columns only |
| M-03 | Step-order rules in the database; fix Saffron Stays' contradictory row |
| M-06 | Security headers in nginx (CSP, HSTS, X-Frame-Options / frame-ancestors, X-Content-Type-Options) |
| M-07 | Generic API error messages; keep the OpenAPI root off |
| L-05 | Move pgcrypto / uuid-ossp into a schema PostgREST does not expose |
| I-01 | Pinterest sync token: server-side only if that sync is ever turned on |
