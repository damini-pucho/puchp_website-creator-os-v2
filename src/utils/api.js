// src/utils/api.js
// Central place to trigger the Pucho AI Studio workflows.
//
// Every flow runs through this app's own server: the browser POSTs the flow's input to
// /api/flow/<flow> on the same origin, and nginx forwards it to the flow's configured Studio
// webhook (the URL, /sync and the inbound token come from the container environment —
// PLANNING_WORKFLOW_WEBHOOK_URL, BUILD_WORKFLOW_WEBHOOK_URL, INBOUND_TOKEN, APP_URL — never from
// this bundle). The webhook's HTTP response is returned to the caller as the flow output.
// Local development: vite.config.js proxies /api/flow the same way from .env.

const FLOW_API_BASE = (import.meta.env.VITE_FLOW_API_URL || '/api/flow').replace(/\/+$/, '');

// The flows this app triggers (the name is the last part of /api/flow/<name>)
export const FLOWS = {
  planning: 'planning',          // Planning & Proposal: answers when the run is accepted; results arrive in the database
  planningTest: 'planning-test', // the same flow's Studio test URL (sample data for the flow editor)
  build: 'build',                // Build / live-site audit: waits for the flow's Return Response (the audit report)
};

// This app's public URL, sent with every flow input (the flows write back to the X-App-Url the server adds)
export const APP_URL = import.meta.env.VITE_APP_URL
  || (typeof window !== 'undefined' ? `${window.location.origin}/` : '');

// The audit flow can take a few minutes; the server allows 300 s
const FLOW_TIMEOUT_MS = 330000;

// Known template catalog fallback lookup map (Sourced 100% from official WordPress.org Theme Directory API)
const KNOWN_TEMPLATE_CATALOG = {
  'astra-agency': {
    preview_url: 'https://wordpress.org/themes/astra/',
    original_url: 'https://wordpress.org/themes/astra/',
    thumbnail_url: 'https://ts.w.org/wp-content/themes/astra/screenshot.jpg?ver=4.13.11'
  },
  'kadence-digital-agency': {
    preview_url: 'https://wordpress.org/themes/kadence/',
    original_url: 'https://wordpress.org/themes/kadence/',
    thumbnail_url: 'https://ts.w.org/wp-content/themes/kadence/screenshot.png?ver=1.5.2'
  },
  'oceanwp-business': {
    preview_url: 'https://wordpress.org/themes/oceanwp/',
    original_url: 'https://wordpress.org/themes/oceanwp/',
    thumbnail_url: 'https://ts.w.org/wp-content/themes/oceanwp/screenshot.png?ver=3.6.0'
  },
  'blocksy-saas': {
    preview_url: 'https://wordpress.org/themes/blocksy/',
    original_url: 'https://wordpress.org/themes/blocksy/',
    thumbnail_url: 'https://ts.w.org/wp-content/themes/blocksy/screenshot.png?ver=2.0.0'
  },
  'neve-multipurpose': {
    preview_url: 'https://wordpress.org/themes/neve/',
    original_url: 'https://wordpress.org/themes/neve/',
    thumbnail_url: 'https://ts.w.org/wp-content/themes/neve/screenshot.png?ver=3.8.0'
  },
  'generatepress-real-estate': {
    preview_url: 'https://wordpress.org/themes/generatepress/',
    original_url: 'https://wordpress.org/themes/generatepress/',
    thumbnail_url: 'https://ts.w.org/wp-content/themes/generatepress/screenshot.png?ver=3.4.0'
  },
  'hello-elementor': {
    preview_url: 'https://wordpress.org/themes/hello-elementor/',
    original_url: 'https://wordpress.org/themes/hello-elementor/',
    thumbnail_url: 'https://ts.w.org/wp-content/themes/hello-elementor/screenshot.png?ver=3.5.1'
  },
  'twentytwentyfive': {
    preview_url: 'https://wordpress.org/themes/twentytwentyfive/',
    original_url: 'https://wordpress.org/themes/twentytwentyfive/',
    thumbnail_url: 'https://ts.w.org/wp-content/themes/twentytwentyfive/screenshot.png?ver=1.5'
  }
};

function resolveTemplateObject(tpl) {
  if (!tpl) return null;
  if (typeof tpl === 'object') return tpl;
  if (typeof tpl === 'string') {
    const trimmed = tpl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { preview_url: trimmed, original_url: trimmed, thumbnail_url: '' };
    }
    if (trimmed.startsWith('{')) {
      try { return JSON.parse(trimmed); } catch(e) {}
    }
    if (KNOWN_TEMPLATE_CATALOG[trimmed]) {
      return KNOWN_TEMPLATE_CATALOG[trimmed];
    }
  }
  return null;
}

/**
 * Robust helper to extract template original/preview URL from any catalog item format.
 */
export function extractTemplateOriginalUrl(tpl) {
  if (!tpl) return '';
  if (typeof tpl === 'string') {
    const trimmed = tpl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const resolved = resolveTemplateObject(trimmed);
    if (resolved && resolved !== tpl) return extractTemplateOriginalUrl(resolved);
    return '';
  }

  const target = tpl.selectedTemplate || tpl.selected_template || tpl.template || tpl;

  return (
    target.original_url ||
    target.originalUrl ||
    target.preview_url ||
    target.previewUrl ||
    target.preview ||
    target.demoUrl ||
    target.demo_url ||
    target.wordpress_org_url ||
    target.wordpressOrgUrl ||
    target.download_url ||
    target.downloadUrl ||
    target.url ||
    target.link ||
    target.href ||
    target.siteUrl ||
    target.site_url ||
    target.demo ||
    target.templateOriginalUrl ||
    target.template_original_url ||
    target.templatePreviewUrl ||
    target.template_preview_url ||
    ''
  );
}

/**
 * Robust helper to extract template thumbnail URL from any catalog item format.
 */
export function extractTemplateThumbnailUrl(tpl) {
  if (!tpl) return '';
  if (typeof tpl === 'string') {
    const trimmed = tpl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const resolved = resolveTemplateObject(trimmed);
    if (resolved && resolved !== tpl) return extractTemplateThumbnailUrl(resolved);
    return '';
  }

  const target = tpl.selectedTemplate || tpl.selected_template || tpl.template || tpl;

  return (
    target.thumbnail_url ||
    target.thumbnailUrl ||
    target.thumbnail ||
    target.image_url ||
    target.imageUrl ||
    target.image ||
    target.thumb ||
    target.img ||
    target.templateThumbnailUrl ||
    target.template_thumbnail_url ||
    ''
  );
}

/**
 * Run a flow: POST its input to /api/flow/<flow> once and return the webhook's response.
 * Never retried and never sent a second way, so one call is one flow run.
 * @param {string} flow     One of FLOWS (planning, planning-test, build).
 * @param {object} payload  The flow's input (JSON).
 * @returns {Promise<{success: boolean, status?: number, data?: any, message?: string}>}
 *   success is true only for a 2xx answer; data is the parsed response body (the flow output).
 */
export async function triggerWorkflow(flow, payload) {
  const url = `${FLOW_API_BASE}/${encodeURIComponent(flow)}`;
  const body = { ...payload, app_url: APP_URL, appUrl: APP_URL };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), FLOW_TIMEOUT_MS) : null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller?.signal,
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!res.ok) {
      const message = (data && typeof data === 'object' && (data.message || data.error))
        || `Flow "${flow}" answered HTTP ${res.status}`;
      console.warn(`[Flow ${flow}] HTTP ${res.status}`, data);
      return { success: false, status: res.status, data, message };
    }
    return { success: true, status: res.status, data };
  } catch (err) {
    const message = err?.name === 'AbortError'
      ? `Flow "${flow}" did not answer within ${Math.round(FLOW_TIMEOUT_MS / 1000)} seconds`
      : `Flow "${flow}" could not be reached: ${err?.message || 'network error'}`;
    console.warn(`[Flow ${flow}]`, message);
    return { success: false, message };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Trigger the Planning & Proposal pipeline (1st Flow) for a client.
 * @param {object} client  The full client record from ClientContext.
 */
export function sendClientToPlanningWorkflow(client) {
  let selectedTpl = client.selectedTemplate || client.selected_template || null;
  if (typeof selectedTpl === 'string') {
    const resolved = resolveTemplateObject(selectedTpl);
    if (resolved) selectedTpl = resolved;
  }

  // Extract plain gallery image URLs array safely
  let rawGallery = client.galleryImages || client.gallery_images || [];
  if (typeof rawGallery === 'string') {
    try { rawGallery = JSON.parse(rawGallery); } catch(e) { rawGallery = [rawGallery]; }
  }
  const galleryImageUrls = Array.isArray(rawGallery) 
    ? rawGallery.map(img => (typeof img === 'string' ? img : img.url || img.src || '')).filter(Boolean)
    : [];

  // Extract selected logo URL safely
  const logoUrl = client.logoUrl || client.logo_url || client.logo || client.brandGuidelines?.logoUrl || client.brand_guidelines?.logoUrl || '';

  // Extract brand doc URL safely
  const brandDocUrl = client.brandDocUrl || client.brand_doc_url || client.brandGuidelinesDoc || client.brandGuidelines?.brandDocUrl || client.brand_guidelines?.brandDocUrl || '';

  // Extract template URLs reliably with fallback to designRefUrl or existingUrl
  const templateOriginalUrl = extractTemplateOriginalUrl(selectedTpl) || client.designRefUrl || client.design_ref_url || client.existingUrl || client.existing_url || '';
  const templateThumbnailUrl = extractTemplateThumbnailUrl(selectedTpl) || logoUrl || (galleryImageUrls.length > 0 ? galleryImageUrls[0] : '');

  return triggerWorkflow(FLOWS.planning, {
    action: 'create_client',
    clientId: client.id,
    client_id: client.id,
    businessName: client.name || client.business_name,
    business_name: client.name || client.business_name,
    name: client.name || client.business_name,
    location: client.location,
    industry: client.industry,
    targetAudience: client.targetAudience || client.target_audience,
    target_audience: client.targetAudience || client.target_audience,
    existingUrl: client.existingUrl || client.existing_url,
    existing_url: client.existingUrl || client.existing_url,
    designRefUrl: client.designRefUrl || client.design_ref_url || templateOriginalUrl,
    design_ref_url: client.designRefUrl || client.design_ref_url || templateOriginalUrl,
    services: client.services || [],
    mobile: client.mobile,
    email: client.email,
    gstin: client.gstin,
    keywordsInput: client.keywordsInput || client.keywords_input,
    keywords_input: client.keywordsInput || client.keywords_input,
    preferences: client.preferences || { seo: true, aeo: false, geo: false },
    additionalInfo: client.additionalInfo || client.additional_info,
    additional_info: client.additionalInfo || client.additional_info,
    logoOption: client.logoOption || client.logo_option,
    logo_option: client.logoOption || client.logo_option,

    // Logo & Brand Guidelines Upload URLs
    logoUrl: logoUrl,
    logo_url: logoUrl,
    brandDocUrl: brandDocUrl,
    brand_doc_url: brandDocUrl,
    brandGuidelines: client.brandGuidelines || client.brand_guidelines || null,
    brand_guidelines: client.brandGuidelines || client.brand_guidelines || null,
    vibePlatform: client.vibePlatform || client.vibe_platform || 'Pucho Code',
    vibe_platform: client.vibePlatform || client.vibe_platform || 'Pucho Code',

    // Photo Gallery & Uploaded Image URLs
    galleryImages: rawGallery,
    gallery_images: rawGallery,
    galleryUploadUrls: galleryImageUrls,
    gallery_upload_urls: galleryImageUrls,
    portfolioItems: client.portfolioItems || client.portfolio_items || [],
    portfolio_items: client.portfolioItems || client.portfolio_items || [],

    // Selected WordPress / Theme Template Details for Automation
    selectedTemplate: selectedTpl,
    selected_template: selectedTpl,
    wordpressTemplate: {
      id: selectedTpl?.id || '',
      name: selectedTpl?.name || selectedTpl?.title || '',
      source: selectedTpl?.source || selectedTpl?.designer || selectedTpl?.slug || 'themeforest',
      builder: selectedTpl?.builder || 'Elementor / WordPress',
      category: selectedTpl?.category || client.industry || '',
      originalUrl: templateOriginalUrl,
      original_url: templateOriginalUrl,
      previewUrl: templateOriginalUrl,
      preview_url: templateOriginalUrl,
      thumbnailUrl: templateThumbnailUrl,
      thumbnail_url: templateThumbnailUrl,
      downloadUrl: selectedTpl?.download_url || selectedTpl?.downloadUrl || '',
      download_url: selectedTpl?.download_url || selectedTpl?.downloadUrl || '',
      tags: selectedTpl?.tags || []
    },
    templateId: selectedTpl?.id || '',
    template_id: selectedTpl?.id || '',
    templateName: selectedTpl?.name || selectedTpl?.title || '',
    template_name: selectedTpl?.name || selectedTpl?.title || '',
    templateCategory: selectedTpl?.category || '',
    template_category: selectedTpl?.category || '',
    templateBuilder: selectedTpl?.builder || '',
    template_builder: selectedTpl?.builder || '',
    templateBadge: selectedTpl?.badge || '',
    template_badge: selectedTpl?.badge || '',
    templateOriginalUrl: templateOriginalUrl,
    template_original_url: templateOriginalUrl,
    templatePreviewUrl: templateOriginalUrl,
    template_preview_url: templateOriginalUrl,
    templateThumbnailUrl: templateThumbnailUrl,
    template_thumbnail_url: templateThumbnailUrl
  });
}

/**
 * Trigger the Build / Compliance pipeline (2nd Flow) using the Live URL (FLOWS.build, synchronous:
 * the result's data is the flow's audit report). Sends full client details from DB + Live URL.
 * @param {object} client  The client record.
 * @param {string} liveUrl The deployed live website URL.
 */
export function sendLiveUrlToComplianceWorkflow(client, liveUrl) {
  let selectedTpl = client?.selectedTemplate || client?.selected_template || null;
  if (typeof selectedTpl === 'string') {
    const resolved = resolveTemplateObject(selectedTpl);
    if (resolved) selectedTpl = resolved;
  }

  // Extract plain gallery image URLs array safely
  let rawGallery = client?.galleryImages || client?.gallery_images || [];
  if (typeof rawGallery === 'string') {
    try { rawGallery = JSON.parse(rawGallery); } catch(e) { rawGallery = [rawGallery]; }
  }
  const galleryImageUrls = Array.isArray(rawGallery) 
    ? rawGallery.map(img => (typeof img === 'string' ? img : img.url || img.src || '')).filter(Boolean)
    : [];

  const logoUrl = client?.logoUrl || client?.logo_url || client?.logo || client?.brandGuidelines?.logoUrl || client?.brand_guidelines?.logoUrl || '';
  const brandDocUrl = client?.brandDocUrl || client?.brand_doc_url || client?.brandGuidelinesDoc || client?.brandGuidelines?.brandDocUrl || client?.brand_guidelines?.brandDocUrl || '';

  const templateOriginalUrl = extractTemplateOriginalUrl(selectedTpl) || client?.designRefUrl || client?.design_ref_url || client?.existingUrl || client?.existing_url || '';
  const templateThumbnailUrl = extractTemplateThumbnailUrl(selectedTpl) || logoUrl || (galleryImageUrls.length > 0 ? galleryImageUrls[0] : '');

  const fullClientPayload = {
    ...(client || {}),
    action: 'live_url_compliance',
    // Identifiers & Basic Info (Guaranteed DB Client ID)
    id: client?.id || client?.client_id || '',
    clientId: client?.id || client?.client_id || '',
    client_id: client?.id || client?.client_id || '',
    name: client?.name || client?.business_name || '',
    businessName: client?.name || client?.business_name || '',
    business_name: client?.name || client?.business_name || '',
    location: client?.location || '',
    industry: client?.industry || '',
    targetAudience: client?.targetAudience || client?.target_audience || '',
    target_audience: client?.targetAudience || client?.target_audience || '',

    // Deployed Live URL (as-is in all formats)
    liveUrl: liveUrl,
    live_url: liveUrl,
    url: liveUrl,
    deployUrl: liveUrl,
    deploy_url: liveUrl,

    // Selected Template Details
    selectedTemplate: selectedTpl,
    selected_template: selectedTpl,
    wordpressTemplate: {
      id: selectedTpl?.id || '',
      name: selectedTpl?.name || selectedTpl?.title || '',
      source: selectedTpl?.source || selectedTpl?.designer || selectedTpl?.slug || 'themeforest',
      builder: selectedTpl?.builder || 'Elementor / WordPress',
      category: selectedTpl?.category || client?.industry || '',
      originalUrl: templateOriginalUrl,
      original_url: templateOriginalUrl,
      previewUrl: templateOriginalUrl,
      preview_url: templateOriginalUrl,
      thumbnailUrl: templateThumbnailUrl,
      thumbnail_url: templateThumbnailUrl,
      downloadUrl: selectedTpl?.download_url || selectedTpl?.downloadUrl || '',
      download_url: selectedTpl?.download_url || selectedTpl?.downloadUrl || '',
      tags: selectedTpl?.tags || []
    },
    templateId: selectedTpl?.id || '',
    template_id: selectedTpl?.id || '',
    templateName: selectedTpl?.name || selectedTpl?.title || '',
    template_name: selectedTpl?.name || selectedTpl?.title || '',
    templateCategory: selectedTpl?.category || '',
    template_category: selectedTpl?.category || '',
    templateBuilder: selectedTpl?.builder || '',
    template_builder: selectedTpl?.builder || '',
    templateBadge: selectedTpl?.badge || '',
    template_badge: selectedTpl?.badge || '',
    templateOriginalUrl: templateOriginalUrl,
    template_original_url: templateOriginalUrl,
    templatePreviewUrl: templateOriginalUrl,
    template_preview_url: templateOriginalUrl,
    templateThumbnailUrl: templateThumbnailUrl,
    template_thumbnail_url: templateThumbnailUrl,

    // Brand Guidelines & Assets
    brandGuidelines: client?.brandGuidelines || client?.brand_guidelines || null,
    brand_guidelines: client?.brandGuidelines || client?.brand_guidelines || null,
    brandDocUrl: brandDocUrl,
    brand_doc_url: brandDocUrl,
    galleryImages: rawGallery,
    gallery_images: rawGallery,
    galleryUploadUrls: galleryImageUrls,
    gallery_upload_urls: galleryImageUrls,
    portfolioItems: client?.portfolioItems || client?.portfolio_items || [],
    portfolio_items: client?.portfolioItems || client?.portfolio_items || [],

    // Services & Keywords
    services: client?.services || [],
    keywordsInput: client?.keywordsInput || client?.keywords_input || '',
    keywords_input: client?.keywordsInput || client?.keywords_input || '',
    keywordsApproved: client?.keywordsApproved || [],
    keywords: client?.keywordsApproved || [],

    // Contact Info & Logistics
    mobile: client?.mobile || '',
    email: client?.email || '',
    gstin: client?.gstin || '',
    logoOption: client?.logoOption || client?.logo_option || 'upload',
    logo_option: client?.logoOption || client?.logo_option || 'upload',
    logoUrl: logoUrl,
    logo_url: logoUrl,

    // Preferences & Details
    preferences: client?.preferences || { seo: true, aeo: false, geo: false },
    additionalInfo: client?.additionalInfo || client?.additional_info || '',
    additional_info: client?.additionalInfo || client?.additional_info || '',

    // Blueprint & Architecture Specs
    sitemap: client?.sitemap || [],
    pagePlans: client?.pagePlans || client?.page_plans || {},
    page_plans: client?.pagePlans || client?.page_plans || {},
    proposalText: client?.proposalText || client?.prompt_text || '',
    proposalDocUrl: client?.proposalDocUrl || client?.proposal_pdf_url || '',
    proposal_pdf_url: client?.proposalDocUrl || client?.proposal_pdf_url || '',
    promptText: client?.promptText || client?.build_prompt || '',
    build_prompt: client?.promptText || client?.build_prompt || '',
    buildStatus: client?.buildStatus || client?.build_status || 'Not Started',
    build_status: client?.buildStatus || client?.build_status || 'Not Started',
    proposalStatus: client?.proposalStatus || client?.proposal_status || 'Pending',
    proposal_status: client?.proposalStatus || client?.proposal_status || 'Pending',

    // Timestamps & Meta
    dateAdded: client?.dateAdded || client?.created_at || '',
    timestamp: new Date().toISOString()
  };

  return triggerWorkflow(FLOWS.build, fullClientPayload);
}

