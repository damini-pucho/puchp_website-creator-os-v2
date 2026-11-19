// src/utils/promptGenerator.js
// Converts approved client data into a complete Pucho Code build specification
// following all rules of the Master Website Generation Prompt.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function indent(level = 0) {
  return '  '.repeat(level);
}

function bullet(level = 0) {
  return '  '.repeat(level) + '- ';
}

function section(title) {
  const sep = '='.repeat(Math.min(title.length + 4, 80));
  return `\n${sep}\n## ${title}\n${sep}\n`;
}

function subSection(title) {
  return `\n### ${title}\n`;
}

function kv(key, value, level = 0) {
  if (value === undefined || value === null || value === '') return '';
  return `${indent(level)}**${key}:** ${value}\n`;
}

function kvBlock(pairs, level = 0) {
  return Object.entries(pairs)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => kv(k, v, level))
    .join('');
}

// ---------------------------------------------------------------------------
// Image alt-text helper based on page context
// ---------------------------------------------------------------------------

function altTextFor(pageName, keyword, businessName, location) {
  const base = keyword
    ? keyword.split(' ').slice(0, 5).join(' ')
    : pageName;
  return `${base} - ${businessName}, ${location}`;
}

// ---------------------------------------------------------------------------
// Section generators
// ---------------------------------------------------------------------------

function generateHeroSection(page, client) {
  const { name, keyword, type } = page;
  const tagline =
    client.services.length > 0
      ? client.services[0].desc.slice(0, 80)
      : `Serving ${client.location} with trusted solutions.`;

  return `### Hero Section
- **H1:** ${name}${type === 'Home' ? ` — ${client.name}` : ''}
- **Subheadline:** ${tagline}
- **Visual direction:** Professional hero image reflecting ${client.industry}. Alt: "${altTextFor(name, keyword, client.name, client.location)}"
- **Primary CTA:** ${type === 'Home' ? 'Explore Our Services' : 'Get in Touch'} → links to contact / inquiry section
- **Secondary CTA (optional):** Learn More → scroll to next section`;
}

function generateCTASection(page, client) {
  const hasAeo = client.preferences?.aeo;
  const hasGeo = client.preferences?.geo;

  const trustSignals = [];
  if (client.gstin) trustSignals.push(`GST/FSSAI: ${client.gstin}`);
  if (client.mobile) trustSignals.push(`Phone: ${client.mobile}`);
  if (client.email) trustSignals.push(`Email: ${client.email}`);
  if (client.location) trustSignals.push(`Serving: ${client.location}`);

  let cta = `### Call to Action
- **Primary CTA Button:** "Contact ${client.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')} Today"
- **CTA Destination:** Inquiry form / phone / email
- **Trust line:** ${trustSignals.join(' | ') || `${client.name} — trusted in ${client.location}`}`;

  if (hasAeo || hasGeo) {
    cta += '\n- **Urgency/Hook:** Reach out for a consultation or quote';
  }

  return cta;
}

function generateFAQSection(page, client) {
  const plans = client.pagePlans?.[page.id];
  const outline = plans?.outline || '';
  const aeoRaw = plans?.aeo || '';
  const keyword = page.keyword || '';
  const pageName = page.name || '';

  const faqs = [];

  // Pull AEO Q&A pairs
  const qaMatches = aeoRaw.match(/"[^"]+"\s*:\s*"[^"]+"/g) || [];
  const aeoPairs = aeoRaw
    .split(/\n|(?<=")[;.]\s+/)
    .filter((l) => l.includes('?') || l.toLowerCase().includes('what') || l.toLowerCase().includes('where') || l.toLowerCase().includes('how'))
    .map((l) => l.replace(/^[-•*]?\s*/, '').trim())
    .filter(Boolean);

  if (aeoPairs.length > 0) {
    aeoPairs.slice(0, 5).forEach((q) => {
      faqs.push(`- **Q:** ${q}\n  **A:** [Provide concise answer based on ${pageName} services. Keep answer under 60 words for answer-engine extraction.]`);
    });
  } else {
    // Generate defaults for service/Home pages
    if (page.type === 'Home' || page.type === 'Service') {
      faqs.push(
        `- **Q:** What ${keyword} services does ${client.name} offer?\n  **A:** ${client.name} provides professional ${pageName.toLowerCase()} serving ${client.location}. Contact us for a custom quote.`,
        `- **Q:** Where is ${client.name} located?\n  **A:** We are based in ${client.location}, serving ${client.targetAudience || 'clients across the region'}.`,
        `- **Q:** How can I get a quote for ${pageName.toLowerCase()}?\n  **A:** Reach out via ${client.mobile || 'phone'} or ${client.email || 'email'} and our team will respond within 24 hours.`
      );
    } else if (page.type === 'Blog') {
      faqs.push(
        `- **Q:** What is ${pageName.toLowerCase()}?\n  **A:** [Provide a clear 2-3 sentence definition of the topic.]`,
        `- **Q:** Why is ${keyword} important?\n  **A:** [Explain the importance in 2-3 sentences, linking to the business context of ${client.name}.]`
      );
    }
  }

  if (faqs.length === 0) return '';

  const hasAeo = client.preferences?.aeo;
  const headerNote = hasAeo
    ? '\n> AEO enabled — these FAQs are structured for answer-engine extraction (Google Assistant, Siri, Alexa).\n'
    : '\n';

  return `### FAQ Section${headerNote}
${faqs.join('\n\n')}`;
}

function generateSchemaBlock(page, client) {
  const hasAeo = client.preferences?.aeo;
  const hasGeo = client.preferences?.geo;
  const schemas = [];

  // Always: LocalBusiness / Organization
  schemas.push(`**LocalBusiness / Organization Schema:**
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "${page.type === 'Home' ? 'Organization' : 'WebPage'}",
  "name": "${client.name}",
  "description": "${(client.services[0]?.desc || client.name).slice(0, 150)}",
  "url": "https://[domain]/${slugify(page.name === 'Home' ? '' : page.name)}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "${client.location}"
  },
  ${client.mobile ? `"telephone": "${client.mobile}",` : ''}
  ${client.email ? `"email": "${client.email}",` : ''}
}
\`\`\``);

  // GEO: structured entity data
  if (hasGeo) {
    schemas.push(`**GEO Entity Markup (for LLM citation):**
\`\`\`json
{
  "businessName": "${client.name}",
  "location": "${client.location}",
  "industry": "${client.industry}",
  "primaryService": "${page.name}",
  "serviceArea": "${client.location}",
  "targetAudience": "${client.targetAudience || ''}"
}
\`\`\``);
  }

  // AEO: FAQPage schema
  if (hasAeo && (page.type === 'Home' || page.type === 'Service')) {
    schemas.push(`**FAQPage Schema (AEO):**
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What ${page.keyword} services does ${client.name} offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${client.name} offers ${page.name.toLowerCase()} services in ${client.location}."
      }
    },
    {
      "@type": "Question",
      "name": "Where is ${client.name} located?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${client.name} is located in ${client.location}."
      }
    }
  ]
}
\`\`\``);
  }

  // Breadcrumb
  schemas.push(`**BreadcrumbList Schema:**
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://[domain]/" },
    { "@type": "ListItem", "position": 2, "name": "${page.name}", "item": "https://[domain]/${slugify(page.name === 'Home' ? '' : page.name)}" }
  ]
}
\`\`\``);

  return `### Structured Data / Schema\n${schemas.join('\n\n')}`;
}

// ---------------------------------------------------------------------------
// Page-by-page specification
// ---------------------------------------------------------------------------

function generatePageSpec(page, client) {
  const plans = client.pagePlans?.[page.id] || {};
  const hasAeo = client.preferences?.aeo;
  const hasGeo = client.preferences?.geo;
  const slug = page.name === 'Home' ? '' : slugify(page.name);
  const urlPath = slug ? `/${slug}` : '/';

  const otherPages = client.sitemap?.filter((p) => p.id !== page.id) || [];
  const servicePages = otherPages.filter((p) => p.type === 'Service' || p.type === 'Home');
  const locationPages = otherPages.filter((p) => p.type === 'Location');

  // Internal links from
  const linksTo = [];
  if (servicePages.length > 0) {
    linksTo.push(
      ...servicePages.slice(0, 3).map((p) => `/${slugify(p.name === 'Home' ? '' : p.name)}`)
    );
  }
  if (locationPages.length > 0 && page.type !== 'Location') {
    linksTo.push(...locationPages.slice(0, 1).map((p) => `/${slugify(p.name)}`));
  }

  // Internal links from (who links here)
  const linksFrom = ['Home page'];
  if (page.type === 'Service') {
    const related = otherPages
      .filter((p) => p.type === 'Service' && p.id !== page.id)
      .slice(0, 2);
    linksFrom.push(...related.map((p) => `${p.name} page`));
  }
  if (page.type === 'Blog') {
    const relatedService = servicePages[0];
    if (relatedService) linksFrom.push(`${relatedService.name} page`);
  }

  const seoTitle = client.pagePlans?.[page.id]?.seo || `SEO optimization for "${page.keyword}"`;
  const metaTitle =
    page.name === 'Home'
      ? `${page.keyword} | ${client.name} — ${client.location}`
      : `${page.name} — ${page.keyword} | ${client.name}`;

  const metaDescription =
    page.name === 'Home'
      ? `${client.name} offers ${client.services.map((s) => s.name.toLowerCase()).join(', ')} in ${client.location}. Serving ${client.targetAudience || 'clients'}. ${client.mobile ? `Call ${client.mobile}.` : ''}`
      : `${page.name} — ${client.name}, ${client.location}. ${plans.seo || `Expert ${page.keyword} services.`} ${client.mobile ? `Contact ${client.mobile}.` : ''}`;

  const spec = `--- PAGE: ${page.name} ---

### Page Identity
${kvBlock({
  'Page Name': page.name,
  'URL Slug': urlPath,
  'Primary Keyword': page.keyword,
  'Search Intent': page.type === 'Blog' ? 'Informational' : page.type === 'Location' ? 'Local' : 'Commercial',
  'Page Type': page.type,
})}

### Business Context
${kvBlock({
  'Relevant Business': client.name,
  'Relevant Service': client.services.find(() => true)?.name || 'N/A',
  'Location': client.location,
  'Target Audience': client.targetAudience,
  'Brand Tone': client.additionalInfo || 'Professional, trustworthy, service-oriented',
}, 0)}
Industry: ${client.industry}

### SEO Context
${kvBlock({
  'Primary Keyword': page.keyword,
  'Secondary Keywords': (page.relatedKeywords || []).join(', ') || `Related to ${page.keyword}`,
  'SEO Objective': seoTitle,
  'Meta Title': metaTitle.slice(0, 60),
  'Meta Description': metaDescription.slice(0, 160),
})}

${hasAeo ? `### AEO Context
- **Questions this page answers:**
${(plans.aeo || `${page.keyword} related questions`).split(/\n|(?<=")[;.]\s+/).filter(Boolean).slice(0, 5).map((l) => `  - ${l.trim()}`).join('\n')}
- **Direct-answer strategy:** Provide clear 40–60 word answers above the fold for featured snippets.
- **FAQPage schema:** Required (see schema section below).
` : ''}
${hasGeo ? `### GEO Context
- **Key entities:** ${client.name} (Organization), ${client.location} (Place), ${page.name} (Service/Product), ${client.industry} (Industry)
- **Factual statements for AI citation:**
  - ${client.name} operates in ${client.location}.
  - The business serves ${client.targetAudience || 'local and regional clients'}.
  - Primary services include ${client.services.map((s) => s.name).join(', ')}.
- **Structured data:** See schema section for entity markup.
` : ''}

### Content Context
- **Content Purpose:** ${page.type === 'Home' ? 'Introduce the business, showcase services, build trust, drive inquiries' : page.type === 'Service' ? `Detail the "${page.name}" service, its benefits, and how to engage` : page.type === 'Location' ? `Highlight local presence in ${client.location}, contact info, and area-specific relevance` : `Answer informational queries about "${page.keyword}" while linking back to services`}
- **Required Sections:** ${plans.outline || '1. Introduction\n2. Key Information\n3. Call to Action'}
- **Supporting Information:** ${client.additionalInfo || 'See Global Context.'}

${generateHeroSection(page, client)}

${generateCTASection(page, client)}

### Internal Linking Context
- **Pages this page should link TO:**
${linksTo.length > 0 ? linksTo.map((l) => `  - ${l}`).join('\n') : '  - Home page'}
- **Pages that should link BACK to this page:**
${linksFrom.length > 0 ? linksFrom.map((l) => `  - ${l}`).join('\n') : '  - Home page'}

${generateFAQSection(page, client)}

${generateSchemaBlock(page, client)}

### Image Requirements
- **Hero Image:** High-resolution image representing ${page.keyword}. Alt: "${altTextFor(page.name, page.keyword, client.name, client.location)}"
- **Supporting Images (2–3):** Service/business photos, ${client.industry} imagery. All images must have descriptive alt text using the primary keyword where natural.
- **Logo:** ${client.logoOption === 'ai' ? 'Use the approved AI-generated logo from the proposal.' : 'Use the uploaded client logo.'}

### Technical Notes
- Canonical URL: https://[domain]${urlPath}
- Open Graph / Twitter Card: Use meta title and description above.
- Mobile-first responsive design required.
- All links must point to pages within the approved sitemap only.
`;

  return spec;
}

// ---------------------------------------------------------------------------
// Global Context section
// ---------------------------------------------------------------------------

function generateGlobalContext(client) {
  const hasAeo = client.preferences?.aeo;
  const hasGeo = client.preferences?.geo;

  return `${section('A. GLOBAL WEBSITE CONTEXT')}

### Business Identity
${kvBlock({
  'Business/Client Name': client.name,
  'Location': client.location,
  'Industry': client.industry,
  'Target Audience': client.targetAudience,
}, 0)}
${client.additionalInfo ? `**Business Description:** ${client.additionalInfo}\n` : ''}

### Brand Tone & Direction
${kvBlock({
  'Brand Tone': client.additionalInfo || 'Professional, trustworthy, service-oriented',
  'Design Reference URL': client.designRefUrl || 'None — use clean, modern, minimal design',
  'Logo Source': client.logoOption === 'ai' ? 'AI-generated (approved from proposal)' : 'Client-uploaded logo',
})}

### Contact Information (NAP)
${kvBlock({
  'Mobile': client.mobile,
  'Email': client.email,
  'GST/FSSAI': client.gstin || 'Not provided',
  'Address/Location': client.location,
})}

### Approved Services
${client.services.map((s, i) => `${i + 1}. **${s.name}** — ${s.desc}`).join('\n')}

### SEO / AEO / GEO Configuration
${kvBlock({
  'SEO': 'Always enabled',
  'AEO (Answer Engine Optimization)': hasAeo ? 'ENABLED' : 'Disabled',
  'GEO (Generative Engine Optimization)': hasGeo ? 'ENABLED' : 'Disabled',
})}

${hasAeo ? `**AEO Note:** Add direct answers and FAQPage schema where applicable. Keep answers concise (40–60 words).\n` : ''}
${hasGeo ? `**GEO Note:** Make business entities explicit. Use structured data for AI citation. Include clear factual statements.\n` : ''}

${client.existingUrl ? `### Existing Business Website Context
- **URL:** ${client.existingUrl}
- **Usage:** Analyze existing services, brand language, page structure, and business facts from this URL.
- **Do NOT blindly copy** — use only for context enrichment.
` : '### No existing business website provided. Build entirely from the approved Business Setup data.'}
`;
}

// ---------------------------------------------------------------------------
// Sitemap section
// ---------------------------------------------------------------------------

function generateSitemapSection(client) {
  const pages = client.sitemap || [];

  return `${section('B. APPROVED SITEMAP')}

| # | Page Name | URL Slug | Primary Keyword | Intent | Type |
|---|-----------|----------|-----------------|--------|------|
${pages.map((p, i) => `| ${i + 1} | ${p.name} | /${p.name === 'Home' ? '' : slugify(p.name)} | ${p.keyword} | ${p.type === 'Blog' ? 'Informational' : p.type === 'Location' ? 'Local' : 'Commercial'} | ${p.type} |`).join('\n')}

**Total pages:** ${pages.length}
**Rule:** One primary keyword = one page. No duplicate keyword assignments. No unapproved pages.
`;
}

// ---------------------------------------------------------------------------
// Design System & Selected Template section (Pucho Skill File Standard)
// ---------------------------------------------------------------------------

function generateDesignSystem(client) {
  const selectedTemplate = client.selected_template || client.selectedTemplate || null;
  const branding = client.branding || {};
  const primaryColor = branding.primaryColor || selectedTemplate?.primaryColor || '#8B5CF6';
  const secondaryColor = branding.secondaryColor || selectedTemplate?.secondaryColor || '#5833EF';
  const archetype = branding.style || selectedTemplate?.archetype || 'Pucho Minimal Modern SaaS';

  let templateBlock = '';
  if (selectedTemplate) {
    templateBlock = `
### Selected Design Template Reference
- **Template Name:** ${selectedTemplate.title || selectedTemplate.name}
- **Source Platform:** ${selectedTemplate.source || 'WordPress.org'}
- **Template Archetype:** ${archetype}
- **Original Reference URL:** ${selectedTemplate.original_url || selectedTemplate.preview_url || client.designRefUrl || 'N/A'}
- **Key Architecture Features:** ${Array.isArray(selectedTemplate.features) ? selectedTemplate.features.join(', ') : 'Responsive layout, modern cards, SEO schema'}
- **Tech Stack Baseline:** React 18, Tailwind CSS, Lucide Icons, Framer Motion
`;
  } else if (client.designRefUrl) {
    templateBlock = `
### Design Reference URL
- **URL:** ${client.designRefUrl}
- **Usage:** Follow layout spacing, typography hierarchy, and visual structure from this reference. Do NOT copy business data or content.
`;
  } else {
    templateBlock = `
### Design Reference
- **Default System:** Pucho Minimal SaaS Design System (Clean, soft, rounded-2xl, generous whitespace).
`;
  }

  return `${section('C. DESIGN SYSTEM & SELECTED TEMPLATE')}
${templateBlock}
### Brand Color Tokens (Pucho Design System)
- **Primary Brand Accent:** ${primaryColor} (Buttons, active states, key focus borders)
- **Deep Brand Accent:** ${secondaryColor} (Gradients, hero highlights, hover states)
- **Neutral Dark (Ink):** #111834 (High-contrast headings, primary text)
- **Neutral Muted (Ink Muted):** #6B7280 (Subheadings, metadata, captions)
- **App Canvas Background:** #FAFAFF (Primary soft background)
- **Surface Card Fill:** #FFFFFF (Card containers, modal surfaces)
- **Hairline Borders:** #F0F0F0 (Dividers, card strokes, clean separators)
- **Success / Badge Accent:** #16A34A (bg: #ECFDF3)
- **Warning Accent:** #D97706 (bg: #FFFBEB)

### Typography & Fonts
- **Primary Body & Interface:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Headings & Display:** Space Grotesk / Inter (font-bold / font-semibold, tracking-tight)
- **Scale:** H1 (36–48px desktop / 28–32px mobile), H2 (24–30px), H3 (18–20px), Body (14–16px, leading-relaxed 1.6–1.8)

### Spacing, Radii & Elevation
- **Card Border Radius:** 16px (rounded-2xl) with 1px border (#F0F0F0)
- **Button Border Radius:** 12–14px (rounded-xl) or pill (rounded-full)
- **Elevation (Soft Shadows):** 
  - Base Card: \`0 2px 10px rgba(0, 0, 0, 0.04)\`
  - Hover Card: \`0 12px 24px rgba(0, 0, 0, 0.06)\`
  - Focus Ring: \`0 0 0 3px rgba(139, 92, 246, 0.15)\`

### Micro-Animations & Interaction Quality
- Smooth transition on card hovers (translate-y-1, subtle shadow elevation)
- Staggered entrance animations for feature items (Framer Motion \`initial={{ opacity: 0, y: 15 }}\`)
- Accordion transitions for FAQ voice answers
- Canonical "Powered by Pucho.ai" footer badge placed discreetly in footer/corner
`;
}

// ---------------------------------------------------------------------------
// Global Components section
// ---------------------------------------------------------------------------

function generateGlobalComponents(client) {
  const services = client.services || [];
  const hasAeo = client.preferences?.aeo;
  const hasGeo = client.preferences?.geo;

  return `${section('E. GLOBAL COMPONENTS')}

### Header
- **Layout:** Logo (left) | Navigation Links (center/right) | CTA Button (right)
- **Logo:** ${client.logoOption === 'ai' ? 'Approved AI-generated logo from proposal' : 'Uploaded client logo'}
- **Navigation items:** ${(client.sitemap || []).filter(p => p.type !== 'Blog').slice(0, 5).map(p => p.name).join(', ')}
- **Mobile:** Hamburger menu with slide-out panel
- **Sticky on scroll:** Yes

### Footer
- **Column 1:** ${client.name} — brief about, copyright
- **Column 2:** Quick Links (Home + top 3-4 service pages)
- **Column 3:** Contact — ${client.mobile || 'Phone'}, ${client.email || 'Email'}, ${client.location || 'Location'}
- **Column 4 (if applicable):** ${hasAeo || hasGeo ? 'Certifications & Trust (GST/FSSAI badges)' : 'Services quick list'}
- **Bottom bar:** "Built by Pucho.ai" (subtle), Privacy Policy link, Terms link

### CTA Components
- **Primary CTA:** "Contact ${client.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')}" / "Get a Quote" — links to inquiry form
- **Secondary CTA:** "Learn More" / "Explore Services" — scrolls to relevant section
- **Floating action:** Mobile sticky CTA bar at bottom

### Contact Elements
- **Inquiry Form:** Name, Email, Phone, Service Interest (dropdown from approved services), Message
- **Form destination:** ${client.email || 'Channel Partner specified email'}
- **Phone click-to-call:** ${client.mobile ? `tel:${client.mobile}` : 'Not configured'}
- **WhatsApp link (optional):** ${client.mobile ? `https://wa.me/${client.mobile}` : 'Not configured'}

### Forms
- **Lead capture form:** Present on all service pages and contact section
- **Fields:** Full Name, Email Address, Phone Number, Service Selection, Message
- **Validation:** Client-side required field validation
- **Submission:** POST to configured endpoint
- **Success state:** Thank-you message with expected response time

### Responsive Behavior
- All components must work across mobile, tablet, and desktop
- Forms stack vertically on mobile
- Navigation collapses to hamburger below 768px
- CTAs remain accessible at all breakpoints
`;
}

// ---------------------------------------------------------------------------
// Technical SEO section
// ---------------------------------------------------------------------------

function generateTechnicalSEO(client) {
  const domain = client.liveUrl || client.existingUrl || '[domain].com';
  const pages = client.sitemap || [];
  const domainClean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => {
  const loc = p.name === 'Home' ? '/' : `/${slugify(p.name)}`;
  return `  <url>
    <loc>https://${domainClean}${loc}</loc>
    <changefreq>${p.type === 'Blog' ? 'monthly' : 'weekly'}</changefreq>
    <priority>${p.type === 'Home' ? '1.0' : p.type === 'Service' ? '0.8' : '0.6'}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

  return `${section('F. TECHNICAL SEO')}

### Sitemap XML
\`\`\`xml
${sitemapXML}
\`\`\`

### Robots.txt
\`\`\`
User-agent: *
Allow: /
Sitemap: https://${domainClean}/sitemap.xml
\`\`\`

### Canonical URLs
${pages.map((p) => {
  const loc = p.name === 'Home' ? '/' : `/${slugify(p.name)}`;
  return `- ${p.name}: \`<link rel="canonical" href="https://${domainClean}${loc}" />\``;
}).join('\n')}

### Open Graph Defaults
\`\`\`html
<meta property="og:title" content="${client.name} — ${client.location}" />
<meta property="og:description" content="${client.services.map(s => s.name).join(', ')}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://${domainClean}" />
<meta property="og:site_name" content="${client.name}" />
\`\`\`

### Twitter Cards
\`\`\`html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${client.name}" />
<meta name="twitter:description" content="Serving ${client.location} — ${client.industry}" />
\`\`\`

### Performance Requirements
- **Lighthouse score target:** 90+ (all categories)
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **Total Blocking Time:** < 200ms

### Mobile Responsiveness
- Fully responsive at all breakpoints
- Touch-friendly tap targets (minimum 44px)
- No horizontal scroll at any viewport
- Test on real mobile devices

### Metadata Completeness
- Every page: unique title, meta description, canonical URL
- Every image: descriptive alt text
- Heading hierarchy: single H1, logical H2-H3 progression
- No duplicate meta content across pages
`;
}

// ---------------------------------------------------------------------------
// Main export: generate the complete build prompt
// ---------------------------------------------------------------------------

export function generateBuildPrompt(client) {
  if (!client) return '';

  const pages = client.sitemap || [];
  if (pages.length === 0) return '';

  const hasAeo = client.preferences?.aeo;
  const hasGeo = client.preferences?.geo;

  const sections = [];

  // A. Global Context
  sections.push(generateGlobalContext(client));

  // B. Sitemap
  sections.push(generateSitemapSection(client));

  // C. Design System
  sections.push(generateDesignSystem(client));

  // D. Page-by-page specifications
  sections.push(`\n${section('D. PAGE-BY-PAGE SPECIFICATIONS')}`);

  pages.forEach((page, index) => {
    sections.push(
      `\n${'#'.repeat(60)}\n### PAGE ${index + 1} of ${pages.length}\n${'#'.repeat(60)}`
    );
    sections.push(generatePageSpec(page, client));
  });

  // E. Global Components
  sections.push(generateGlobalComponents(client));

  // F. Technical SEO
  sections.push(generateTechnicalSEO(client));

  // Build instructions footer
  const domainClean = (client.liveUrl || client.existingUrl || '[domain].com')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  sections.push(`\n${section('BUILD INSTRUCTIONS')}

1. Build all ${pages.length} pages as specified above.
2. Use the Global Context as source of truth for brand, tone, and business facts.
3. Never invent services, locations, or business information not in the approved plan.
4. SEO is mandatory on every page; AEO is ${hasAeo ? 'ENABLED' : 'DISABLED'}; GEO is ${hasGeo ? 'ENABLED' : 'DISABLED'}.
5. The Design Reference URL is visual inspiration ONLY — never use it for business content.
6. Maintain cross-page consistency: header, footer, colors, typography, CTAs.
7. Internal linking must follow the sitemap — no links to pages that don't exist.
8. All schema must be valid JSON-LD.
9. The final website is a ${client.industry} business website for ${client.name} in ${client.location}.
10. Target domain: ${domainClean}
  `);

  return sections.join('\n');
}

export default generateBuildPrompt;
