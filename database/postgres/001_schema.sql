-- ============================================================================
-- Website Creator OS V2 — PostgreSQL / AWS RDS schema
-- PostgreSQL 13+ (AWS RDS, local Postgres, pgAdmin 4)
--
-- Safe to re-run: it only creates what is missing and adds missing columns.
-- It never drops a table or deletes data, so it can also upgrade a database
-- that was created from the earlier 003_postgres_rds_schema.sql script.
--
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 001_schema.sql
-- ============================================================================

BEGIN;
SET LOCAL standard_conforming_strings = on;

-- gen_random_uuid() (used for the text ids below) is part of PostgreSQL 13+ itself, so no
-- pgcrypto extension (it needs CREATE on the database, which a managed restore login lacks).
-- Fail early with a clear message on an older server instead of a missing-function error.
DO $$
BEGIN
  IF current_setting('server_version_num')::int < 130000 THEN
    RAISE EXCEPTION 'Website Creator OS V2 needs PostgreSQL 13 or newer (this server is %)', current_setting('server_version');
  END IF;
END
$$;

-- Keeps updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. clients — business profile, AI plan, proposal, build prompt, go-live
--    Written by the app (Business Setup, approvals, checklists) and by the
--    Pucho Studio workflows (planning: step_7/13/14, build pipeline).
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT ('client-' || gen_random_uuid()::text)
);

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS workspace_id         UUID        DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
  -- Identity (the app writes business_name; name is kept in sync by a trigger)
  ADD COLUMN IF NOT EXISTS name                 TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_name        TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS location             TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS industry             TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_audience      TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS services             JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mobile               TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS email                TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS gstin                TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS existing_url         TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS design_ref_url       TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS keywords_input       TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferences          JSONB       DEFAULT '{"seo":true,"aeo":false,"geo":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS additional_info      TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS status               TEXT        DEFAULT 'Setup',
  ADD COLUMN IF NOT EXISTS date_added           TEXT        DEFAULT '',
  -- Brand, logo & template
  ADD COLUMN IF NOT EXISTS logo_option          TEXT        DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS logo_url             TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_gallery         JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_guidelines     JSONB       DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_color        TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS secondary_color      TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS accent_color         TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS selected_template    JSONB,
  ADD COLUMN IF NOT EXISTS template_name        TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS template_preview_url TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_images       JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS portfolio_items      JSONB       DEFAULT '[]'::jsonb,
  -- AI plan (keywords, sitemap, page plans)
  ADD COLUMN IF NOT EXISTS keywords             JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS keywords_approved    JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS keywords_count       INT         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sitemap              JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sitemap_count        INT         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS page_plans           JSONB       DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pages_count          INT         DEFAULT 0,
  -- Proposal & approval
  ADD COLUMN IF NOT EXISTS proposal_status      TEXT        DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS proposal_text        TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS proposal_pdf_url     TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS proposal_feedback    TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS user_approved        BOOLEAN     DEFAULT false,
  -- Build (Pucho Code master prompt) & hand-off
  ADD COLUMN IF NOT EXISTS build_prompt         TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompt_text          TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS build_status         TEXT        DEFAULT 'Not Started',
  ADD COLUMN IF NOT EXISTS pre_publish_checked  BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS deployer_checklist   JSONB       DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS assigner_checklist   JSONB       DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS assignment_status    TEXT        DEFAULT '',
  -- Go-live & compliance
  ADD COLUMN IF NOT EXISTS live_url             TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS compliance_history   JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audit_report         JSONB       DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS setup_banner         TEXT        DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ DEFAULT NOW();

-- 003 made name NOT NULL, but the app and the workflows only send business_name
ALTER TABLE clients ALTER COLUMN name DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN business_name DROP NOT NULL;

-- Fill whichever of name / business_name is empty from the other, and never let a placeholder
-- ('', 'Client', 'New Client' — sent when a payload had no name) overwrite a real business name
CREATE OR REPLACE FUNCTION clients_sync_name() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(NEW.business_name, '') IN ('', 'Client', 'New Client') AND COALESCE(NEW.name, '') NOT IN ('', 'Client', 'New Client') THEN
    NEW.business_name := NEW.name;
  END IF;
  IF TG_OP = 'UPDATE' AND COALESCE(NEW.business_name, '') IN ('', 'Client', 'New Client')
     AND COALESCE(OLD.business_name, '') NOT IN ('', 'Client', 'New Client') THEN
    NEW.business_name := OLD.business_name;
  END IF;
  IF COALESCE(NEW.name, '') IN ('', 'Client', 'New Client') THEN NEW.name := COALESCE(NEW.business_name, ''); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clients_sync_name ON clients;
CREATE TRIGGER trg_clients_sync_name BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION clients_sync_name();

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_clients_workspace       ON clients (workspace_id);
CREATE INDEX IF NOT EXISTS idx_clients_status          ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_proposal_status ON clients (proposal_status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at      ON clients (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at      ON clients (updated_at DESC);

-- ============================================================================
-- 2. compliance_history — one row per post-deploy SEO / AEO / GEO audit
--    The app reads it ordered by created_at and deletes by client_id.
-- ============================================================================
CREATE TABLE IF NOT EXISTS compliance_history (
  id            TEXT PRIMARY KEY DEFAULT ('ch-' || gen_random_uuid()::text),
  client_id     TEXT REFERENCES clients(id) ON DELETE CASCADE,
  business_name TEXT        DEFAULT '',
  live_url      TEXT        DEFAULT '',
  url           TEXT        DEFAULT '',
  result        TEXT        DEFAULT 'Pass',
  details       TEXT        DEFAULT '',
  seo_score     TEXT        DEFAULT '',   -- text: the audit flow may send "98" or "98/100"
  aeo_score     TEXT        DEFAULT '',
  geo_score     TEXT        DEFAULT '',
  audit_report  JSONB       DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_history_client  ON compliance_history (client_id);
CREATE INDEX IF NOT EXISTS idx_compliance_history_created ON compliance_history (created_at DESC);

-- ============================================================================
-- 2b. proposal_files — the proposal PDF itself, kept permanently
--     Pucho Studio's HTML-to-PDF link expires; the planning flow downloads the PDF and
--     saves it here (one row per client). Kept out of clients so the client list stays light.
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposal_files (
  client_id    TEXT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  file_name    TEXT        DEFAULT 'proposal.pdf',
  content_type TEXT        DEFAULT 'application/pdf',
  data_base64  TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_proposal_files_updated_at ON proposal_files;
CREATE TRIGGER trg_proposal_files_updated_at BEFORE UPDATE ON proposal_files
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 3. activities — partner activity feed
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id           TEXT PRIMARY KEY DEFAULT ('act-' || gen_random_uuid()::text),
  workspace_id UUID        DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
  client_id    TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name  TEXT        DEFAULT '',
  type         TEXT        DEFAULT 'general',
  message      TEXT        NOT NULL,
  metadata     JSONB       DEFAULT '{}'::jsonb,
  timestamp    TEXT        DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_client  ON activities (client_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities (created_at DESC);

-- ============================================================================
-- 4. template_catalog — website templates shown in the Template Gallery
-- ============================================================================
CREATE TABLE IF NOT EXISTS template_catalog (
  id TEXT PRIMARY KEY DEFAULT ('tpl-' || gen_random_uuid()::text)
);

ALTER TABLE template_catalog
  ADD COLUMN IF NOT EXISTS slug              TEXT,
  ADD COLUMN IF NOT EXISTS source            TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS title             TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS name              TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS description       TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS category          TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS industry_category TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS archetype         TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS builder           TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS version           TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS rating            NUMERIC(5,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_installs   TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS original_url      TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS preview_url       TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS thumbnail_url     TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS screenshot_url    TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS download_url      TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS author            TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags              JSONB         DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS features          JSONB         DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS badge             TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_curated        BOOLEAN       DEFAULT false,
  ADD COLUMN IF NOT EXISTS synced_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ   DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ   DEFAULT NOW();

-- 003 required these; live-synced themes don't always have them
ALTER TABLE template_catalog ALTER COLUMN original_url  DROP NOT NULL;
ALTER TABLE template_catalog ALTER COLUMN preview_url   DROP NOT NULL;
ALTER TABLE template_catalog ALTER COLUMN thumbnail_url DROP NOT NULL;
ALTER TABLE template_catalog ALTER COLUMN title         DROP NOT NULL;
ALTER TABLE template_catalog ALTER COLUMN name          DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_template_catalog_slug ON template_catalog (slug);
CREATE INDEX IF NOT EXISTS idx_template_catalog_category  ON template_catalog (category);
CREATE INDEX IF NOT EXISTS idx_template_catalog_industry  ON template_catalog (industry_category);

DROP TRIGGER IF EXISTS trg_template_catalog_updated_at ON template_catalog;
CREATE TRIGGER trg_template_catalog_updated_at BEFORE UPDATE ON template_catalog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 5. pages & page_blocks — published page records per client site
-- ============================================================================
CREATE TABLE IF NOT EXISTS pages (
  id            TEXT PRIMARY KEY DEFAULT ('page-' || gen_random_uuid()::text),
  client_id     TEXT REFERENCES clients(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  slug          TEXT        DEFAULT '',
  type          TEXT        DEFAULT 'Service',
  keyword       TEXT        DEFAULT '',
  status        TEXT        DEFAULT 'draft',
  order_index   INT         DEFAULT 0,
  seo_meta      JSONB       DEFAULT '{}'::jsonb,
  aeo_faq       JSONB       DEFAULT '[]'::jsonb,
  geo_citations JSONB       DEFAULT '[]'::jsonb,
  last_updated  TEXT        DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_client ON pages (client_id);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages (status);

DROP TRIGGER IF EXISTS trg_pages_updated_at ON pages;
CREATE TRIGGER trg_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS page_blocks (
  id          TEXT PRIMARY KEY DEFAULT ('blk-' || gen_random_uuid()::text),
  page_id     TEXT REFERENCES pages(id) ON DELETE CASCADE,
  block_type  TEXT        DEFAULT 'hero',
  blocks      JSONB       DEFAULT '[]'::jsonb,
  order_index INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_blocks_page ON page_blocks (page_id);

DROP TRIGGER IF EXISTS trg_page_blocks_updated_at ON page_blocks;
CREATE TRIGGER trg_page_blocks_updated_at BEFORE UPDATE ON page_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 6. leads & forms — inquiries captured on client websites
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id             TEXT PRIMARY KEY DEFAULT ('lead-' || gen_random_uuid()::text),
  client_id      TEXT REFERENCES clients(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  email          TEXT        DEFAULT '',
  phone          TEXT        DEFAULT '',
  message        TEXT        DEFAULT '',
  source_page    TEXT        DEFAULT '',
  source_keyword TEXT        DEFAULT '',
  status         TEXT        DEFAULT 'new',
  date           TEXT        DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_client  ON leads (client_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);

CREATE TABLE IF NOT EXISTS forms (
  id                TEXT PRIMARY KEY DEFAULT ('form-' || gen_random_uuid()::text),
  client_id         TEXT REFERENCES clients(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  fields            JSONB       DEFAULT '[]'::jsonb,
  submissions_count INT         DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forms_client ON forms (client_id);

-- ============================================================================
-- 7. media_files — logos, photos and design references (store URLs, not base64)
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_files (
  id         TEXT PRIMARY KEY DEFAULT ('media-' || gen_random_uuid()::text),
  client_id  TEXT REFERENCES clients(id) ON DELETE CASCADE,
  file_name  TEXT        NOT NULL,
  file_url   TEXT        NOT NULL,
  file_type  TEXT        DEFAULT 'image',
  file_size  INT         DEFAULT 0,
  alt_text   TEXT        DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE media_files ADD COLUMN IF NOT EXISTS alt_text TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_media_files_client ON media_files (client_id);

-- ============================================================================
-- 8. compliance_audits — detailed checks per audit run
-- ============================================================================
CREATE TABLE IF NOT EXISTS compliance_audits (
  id           TEXT PRIMARY KEY DEFAULT ('audit-' || gen_random_uuid()::text),
  client_id    TEXT REFERENCES clients(id) ON DELETE CASCADE,
  target_url   TEXT        NOT NULL,
  score        INT         DEFAULT 100,
  checks       JSONB       DEFAULT '[]'::jsonb,
  audit_report JSONB       DEFAULT '{}'::jsonb,
  passed       BOOLEAN     DEFAULT true,
  audited_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_audits_client ON compliance_audits (client_id);

-- ============================================================================
-- 9. app_settings — app URL, webhook URLs, partner details (one row: 'default')
--    Put the real inbound token in via your secrets process, not in this file.
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id                   TEXT PRIMARY KEY DEFAULT 'default',
  workspace_id         UUID        DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
  app_url              TEXT        DEFAULT '',
  inbound_token        TEXT        DEFAULT '',
  partner_name         TEXT        DEFAULT '',
  partner_email        TEXT        DEFAULT '',
  planning_webhook_url TEXT        DEFAULT '',
  build_webhook_url    TEXT        DEFAULT '',
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
