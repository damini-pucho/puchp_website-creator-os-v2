-- ============================================================================
-- Website Creator OS V2 — roles for the PostgREST data API (run after 001/002)
--
-- PostgREST logs in as wco_authenticator and runs every request as wco_web.
-- The app (browser) and the Pucho Studio HTTP steps both call the API as wco_web.
--
-- Optional on a managed database: a loading login that may not create or grant roles
-- (CP Portal "Pucho DB (managed)") gets a NOTICE for each skipped step, never an error.
-- The container then runs the data API as the portal's DB_USER, and nginx keeps
-- app_settings off the public API (the protection the REVOKE below gives wco_web).
-- Grants target current_schema(): the schema 001 created the tables in.
-- Safe to re-run. Run as the database owner / RDS master user:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 003_postgrest_roles.sql
-- When the roles were created, give the login role a password (kept out of this file):
--   ALTER ROLE wco_authenticator PASSWORD 'choose-a-strong-password';
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wco_web') THEN
    CREATE ROLE wco_web NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wco_authenticator') THEN
    CREATE ROLE wco_authenticator LOGIN NOINHERIT;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'roles wco_web / wco_authenticator not created (%) - the data API will run as DB_USER', SQLERRM;
END
$$;

DO $$
DECLARE
  sch  text := current_schema();
  stmt text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wco_web') THEN
    RAISE NOTICE 'role wco_web does not exist - data API grants skipped';
    RETURN;
  END IF;
  FOREACH stmt IN ARRAY ARRAY[
    'GRANT wco_web TO wco_authenticator',
    'GRANT wco_web TO CURRENT_USER',   -- lets DB_USER run PostgREST with PGRST_DB_ANON_ROLE=wco_web
    format('GRANT USAGE ON SCHEMA %I TO wco_web', sch),
    format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO wco_web', sch),
    format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO wco_web', sch),
    format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wco_web', sch),
    -- app_settings holds the inbound token; the app doesn't read it, so keep it off the public API
    'REVOKE ALL ON app_settings FROM wco_web'
  ] LOOP
    BEGIN
      EXECUTE stmt;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skipped: % (%)', stmt, SQLERRM;
    END;
  END LOOP;
END
$$;

-- A data API that started before this load picks up the new tables without a restart
NOTIFY pgrst, 'reload schema';

COMMIT;
