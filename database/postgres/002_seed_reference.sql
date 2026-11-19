-- ============================================================================
-- Website Creator OS V2 — reference data (run after 001_schema.sql)
-- Safe to re-run: existing rows are left untouched (ON CONFLICT DO NOTHING).
-- No client records and no secrets here.
--
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 002_seed_reference.sql
-- ============================================================================

BEGIN;

-- One settings row. Fill inbound_token in pgAdmin / your secrets process after running.
INSERT INTO app_settings (id, app_url, partner_name, partner_email, planning_webhook_url, build_webhook_url)
VALUES (
  'default',
  'https://website-creator-os.myapps.pucho.ai/',
  'Arjun Khanna',
  'partner@pucho.ai',
  'https://studio.pucho.ai/api/v1/webhooks/o185Ecx1ixFYx4WULp16A',
  'https://studio.pucho.ai/api/v1/webhooks/i4NwllV8JM5R9CSGk64Gb'
)
ON CONFLICT (id) DO NOTHING;

-- Starter template catalog
INSERT INTO template_catalog
  (id, slug, source, title, name, description, category, industry_category, builder, rating, active_installs,
   original_url, preview_url, thumbnail_url, badge, is_curated)
VALUES
  ('tpl-astra', 'astra-agency', 'WordPress.org', 'Astra Agency & Corporate', 'Astra',
   'Ultra-fast, lightweight theme engineered for high converting local business and corporate web architecture.',
   'Corporate & Agency', 'Corporate & Business', 'Elementor / Gutenberg', 4.90, '1,000,000+',
   'https://wordpress.org/themes/astra/', 'https://wordpress.org/themes/astra/',
   'https://ts.w.org/wp-content/themes/astra/screenshot.jpg?ver=4.13.11', 'Most Popular', true),
  ('tpl-kadence', 'kadence-digital-agency', 'WordPress.org', 'Kadence Digital Agency', 'Kadence',
   'Lightning-fast modern performance theme with pre-built local business sections, schema support and header builder.',
   'Digital & Tech', 'SaaS & Tech', 'Gutenberg Blocks', 4.95, '300,000+',
   'https://wordpress.org/themes/kadence/', 'https://wordpress.org/themes/kadence/',
   'https://ts.w.org/wp-content/themes/kadence/screenshot.png?ver=1.5.2', 'Top Rated', true),
  ('tpl-oceanwp', 'oceanwp-business', 'WordPress.org', 'OceanWP Multi-Service Business', 'OceanWP',
   'Comprehensive multipurpose design optimized for local service providers, lead generation and WooCommerce.',
   'Services & Retail', 'E-Commerce & Food', 'Elementor', 4.85, '700,000+',
   'https://wordpress.org/themes/oceanwp/', 'https://wordpress.org/themes/oceanwp/',
   'https://ts.w.org/wp-content/themes/oceanwp/screenshot.png?ver=3.6.0', 'High Conversion', true),
  ('tpl-blocksy', 'blocksy-saas', 'WordPress.org', 'Blocksy SaaS & Clean Business', 'Blocksy',
   'Ultra-clean modern aesthetics with dark mode accents, micro-interactions and native Gutenberg blocks.',
   'SaaS & Tech', 'SaaS & Tech', 'Gutenberg / Elementor', 4.95, '100,000+',
   'https://wordpress.org/themes/blocksy/', 'https://wordpress.org/themes/blocksy/',
   'https://ts.w.org/wp-content/themes/blocksy/screenshot.png?ver=2.0.0', 'Modern UI', true),
  ('tpl-neve', 'neve-multipurpose', 'WordPress.org', 'Neve Multipurpose Business', 'Neve',
   'Mobile-first design perfect for quick mobile conversions and clean minimalist branding.',
   'Consulting & Services', 'Hospitality', 'Elementor / Gutenberg', 4.80, '300,000+',
   'https://wordpress.org/themes/neve/', 'https://wordpress.org/themes/neve/',
   'https://ts.w.org/wp-content/themes/neve/screenshot.png?ver=3.8.0', 'Mobile First', true),
  ('tpl-generatepress', 'generatepress-real-estate', 'WordPress.org', 'GeneratePress Architecture & Real Estate', 'GeneratePress',
   'Rock-solid lightweight codebase focused on pure speed, SEO accessibility and technical compliance.',
   'Real Estate & Architecture', 'Corporate & Business', 'GenerateBlocks', 4.90, '500,000+',
   'https://wordpress.org/themes/generatepress/', 'https://wordpress.org/themes/generatepress/',
   'https://ts.w.org/wp-content/themes/generatepress/screenshot.png?ver=3.4.0', 'Performance', true),
  ('tpl-hello-elementor', 'hello-elementor', 'WordPress.org', 'Hello Elementor Custom Canvas', 'Hello Elementor',
   'Plain lightweight canvas designed specifically for bespoke custom-built design systems.',
   'Custom Brand', 'Corporate & Business', 'Elementor Pro', 4.70, '1,000,000+',
   'https://wordpress.org/themes/hello-elementor/', 'https://wordpress.org/themes/hello-elementor/',
   'https://ts.w.org/wp-content/themes/hello-elementor/screenshot.png?ver=3.5.1', 'Flexible', true),
  ('tpl-twentytwentyfive', 'twentytwentyfive', 'WordPress.org', 'Twenty Twenty-Five Editorial', 'Twenty Twenty-Five',
   'Default theme showcasing full site editing, responsive typography and clean layouts.',
   'Editorial & F&B', 'E-Commerce & Food', 'WordPress FSE', 4.85, '800,000+',
   'https://wordpress.org/themes/twentytwentyfive/', 'https://wordpress.org/themes/twentytwentyfive/',
   'https://ts.w.org/wp-content/themes/twentytwentyfive/screenshot.png?ver=1.5', 'Official', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
