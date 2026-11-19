# Website Creator OS V2 — deployment bundle

```
browser ──HTTP :80──► nginx ──┬─ /api/db/*  ──► PostgREST 127.0.0.1:3001 ──► PostgreSQL / RDS
Pucho Studio HTTP steps ──────┤   (data API, /api/db is stripped)
                              ├─ /health    ──► 200 "ok"
                              └─ everything else ──► the React app (dist/, SPA fallback)
```

| | |
|---|---|
| Public port | **80** — nginx (`nginx.conf`) |
| Data API | `https://<domain>/api/db/<table>` — PostgREST v12, inside the container only |
| Runtime | nginx 1.27 (Alpine) + PostgREST 12.2.3, PostgreSQL 13+ |
| Liveness | `GET /health` → `ok` · data API status: `GET /health/api` (host, user, password masked) |
| Data API check | `GET /api/db/template_catalog?select=id&limit=1` → `[{"id":…}]` |

## Files

```
dist/                  the built React app (no .env, no secrets)
nginx.conf             port 80: app + /api/db proxy + /health
docker-entrypoint.sh   start-up hook (/docker-entrypoint.d/): starts PostgREST in the background and restarts it; nginx always serves the app
Dockerfile             image from this prebuilt bundle (no rebuild)
```

## CP Portal (cp.pucho.ai) with Pucho DB (managed)

| Field | Value |
|---|---|
| Build type | **Dockerfile** |
| Application source | `deploy-ready.zip` (Dockerfile at the root of the zip) |
| Env file | `.env` from the handover folder (`PORT`, `APP_URL`, `INBOUND_TOKEN`, the two webhook URLs) |
| Database | **Pucho DB (managed)**, DB (SQL) File = `schema.sql` |

The portal restores `schema.sql` with its own database login and injects `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER`, `DB_PASSWORD` and `DB_SCHEMA`. That login normally cannot create roles, so the restore prints
two NOTICEs (`roles wco_web / wco_authenticator not created`, `data API grants skipped`) and succeeds;
`docker-entrypoint.sh` then runs PostgREST as `DB_USER` on `DB_SCHEMA`, and nginx keeps `app_settings`
off the API. Do not put `DATABASE_URL`, `PGRST_DB_ANON_ROLE` or `PGRST_DB_SCHEMAS` in the portal's env file.

## 1. Database first (own PostgreSQL / RDS)

Run `schema.sql` (from the handover folder) on the database once. It creates the 12 tables, the
reference data and the two PostgREST roles, and it is safe to run again:

```bash
psql "postgres://MASTER_USER:PASSWORD@HOST:5432/DBNAME?sslmode=require" -v ON_ERROR_STOP=1 -f schema.sql
psql "postgres://MASTER_USER:PASSWORD@HOST:5432/DBNAME?sslmode=require" -c "ALTER ROLE wco_authenticator PASSWORD 'choose-a-strong-password';"
```

Existing clients: run `database/postgres/import/004_import_legacy_clients.sql`, then `005_fix_names_and_pdf.sql`, from the project
the same way (they hold customer contact details, so they are not in this bundle).

## 2. Environment

Set in the platform (Dokploy → Environment) — see `.env` in the handover folder:

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgres://wco_authenticator:<password>@<host>:5432/<db>?sslmode=require` |
| `PGRST_DB_ANON_ROLE` | `wco_web` (default) |
| `PORT` | `80` |

Flows (all platforms; read at start-up, so a change needs a restart, not a rebuild — nothing here is in `dist/`):

| Key | Value |
|---|---|
| `APP_URL` | the app's public URL, e.g. `https://website-creator-os-2.myapps.pucho.ai/` — sent to the flows as `X-App-Url` |
| `INBOUND_TOKEN` | a long random secret — sent to the flows as `X-Inbound-Token`; required as `Authorization: Bearer <token>` on `/api/inbound/*` |
| `PLANNING_WORKFLOW_WEBHOOK_URL` | Planning & Proposal flow webhook (called as is: the app does not wait) |
| `BUILD_WORKFLOW_WEBHOOK_URL` | Build / live-site audit flow webhook (called on `/sync`: its Return Response is the app's audit report) |

The browser posts a flow's input to `/api/flow/planning`, `/api/flow/planning-test` or `/api/flow/build`;
nginx forwards it (POST only) to the webhook with the two headers added and returns the webhook's answer.

## 3. Run

**Dokploy:** Application → upload this folder (or the zip) → Build type *Dockerfile* → domain with
**container port 80** → Deploy. Health check path: `/health`.

**Docker:**

```bash
docker build -t website-creator-os-v2 .
docker run -d --name website-creator-os -p 80:80 --restart unless-stopped --env-file /secure/website-creator-os.env website-creator-os-v2
```

## 4. Check it is live

1. `https://<domain>/health` → `ok`; `https://<domain>/health/api` → the data API start-up messages (look for an error line)
2. `https://<domain>/api/db/template_catalog?select=id&limit=1` → a JSON array (empty `[]` is fine
   before seeding). `{"code":"PGRST…"}` means the API runs but the database or role is wrong — see
   the container log.
3. Open `https://<domain>/` and sign in; the Clients page lists the database rows.
4. In Pucho Studio, set the three HTTP steps of the Planning & Proposal flow to
   `https://<domain>/api/db/clients` and publish the flow.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Container restarts at once, log: `no database configured` | neither `DB_*` (portal) nor `DATABASE_URL` set | portal: choose a database; elsewhere add `DATABASE_URL` |
| `/api/db/...` → 404 for every table on the portal | API schema is not where the tables are | tables go to the restore login's schema; set `PGRST_DB_SCHEMAS` to it if it is not `DB_SCHEMA` |
| `/api/db/...` → 502 | PostgREST not started | container log: usually a wrong password or host in `DATABASE_URL` |
| `/api/db/...` → `permission denied` | role grants missing | re-run `schema.sql` (it re-applies the grants) |
| `/api/db/...` → `role "wco_web" does not exist` | `schema.sql` not run on this database | run it |
| Saving a client with a large logo → 413 | body over 16 MB | use a smaller image |
