// src/data/mockData.js

export const mockOverviewStats = {
  totalClients: 14,
  proposalsPending: 3,
  sitesLive: 8,
  leadsThisWeek: 184
};

export const mockRecentActivity = [
  { id: 'act-1', clientName: 'Rajesh Masala Co.', type: 'proposal_approved', message: 'Proposal approved by Client.', timestamp: '2 hours ago' },
  { id: 'act-2', clientName: 'Kerala Ayurveda Retreat', type: 'compliance_failed', message: 'Compliance check failed: Meta tags missing on /treatments.', timestamp: '4 hours ago' },
  { id: 'act-3', clientName: 'Apex Tax Advisors', type: 'setup_saved', message: 'Business Setup configuration saved.', timestamp: 'Yesterday' },
  { id: 'act-4', clientName: 'Karnataka Silk Weavers', type: 'prompt_copied', message: 'Build prompt copied to clipboard.', timestamp: '2 days ago' },
  { id: 'act-5', clientName: 'Mumbai Dental Care', type: 'site_deployed', message: 'Website deployed to staging. Ready for compliance scan.', timestamp: '3 days ago' }
];

export const initialClients = [];

export const mockLivePages = [
  { id: 'page-l1', title: 'Home - Organic Spice Wholesale', type: 'Home', keyword: 'organic spices wholesale', status: 'published', lastUpdated: '2026-07-28' },
  { id: 'page-l2', title: 'Bulk Black Pepper & Whole Spices', type: 'Service', keyword: 'organic spices wholesale', status: 'published', lastUpdated: '2026-07-28' },
  { id: 'page-l3', title: 'Standard Turmeric Powders India', type: 'Service', keyword: 'bulk turmeric powder india', status: 'published', lastUpdated: '2026-07-25' },
  { id: 'page-l4', title: 'Delhi Factory Showroom & Contacts', type: 'Location', keyword: 'curry powder manufacturer Delhi', status: 'published', lastUpdated: '2026-07-20' },
  { id: 'page-l5', title: 'How spices are cleaned & sorted', type: 'Blog', keyword: 'how are whole spices processed', status: 'draft', lastUpdated: '2026-08-05' }
];

export const mockPageContentBlocks = {
  'page-l1': [
    { id: 'b1', type: 'Hero', heading: 'Authentic Indian Spices, Sourced Directly', text: 'Supplying bulk spices to wholesale retailers, distributors and hotels worldwide since 1984.' },
    { id: 'b2', type: 'Features', heading: 'Why Work With Us', text: '100% Organic, FSSAI Certified, Custom Blend Packaging, Direct Logistics.' },
    { id: 'b3', type: 'CTA', heading: 'Get a Wholesale Spice Quote Today', text: 'Enter your bulk requirements and our logistics team will get back to you with delivery timelines.' }
  ]
};

export const mockLeads = [
  { id: 'ld-1', name: 'Mohit Singhal', email: 'mohit@singhalfoods.com', phone: '9873452110', message: 'Need 5 tonnes of bulk grade-A turmeric powder shipped to Jaipur.', page: 'Home', keyword: 'organic spices wholesale', date: '2026-08-12 14:32' },
  { id: 'ld-2', name: 'Chef George', email: 'george@spicetrail.co.uk', phone: '+44 7911 123456', message: 'Interested in private label curry powder manufacturing. Custom packing 100g bags.', page: 'Gourmet Blends', keyword: 'curry powder manufacturer Delhi', date: '2026-08-11 10:15' },
  { id: 'ld-3', name: 'Sarath Kumar', email: 'sarath@cochinretail.com', phone: '9447112233', message: 'Do you supply certified organic cardamom in whole bags?', page: 'Bulk Whole Spices', keyword: 'organic spices wholesale', date: '2026-08-10 18:45' }
];

export const mockForms = [
  { id: 'form-1', name: 'B2B Wholesale Inquiry', fields: ['Full Name', 'Company Name', 'Email Address', 'Mobile Number', 'Spice Categories', 'Quantity (Tonnes)', 'Destination Port'], submissions: 32 },
  { id: 'form-2', name: 'Custom Blend Consultation', fields: ['Name', 'Email', 'Phone', 'Describe Blend Recipe', 'Packaging Type Requested'], submissions: 12 }
];

export const mockTeamMembers = [
  { id: 't-1', name: 'Arjun Khanna', email: 'arjun@puchopartner.com', role: 'Owner', status: 'Active' },
  { id: 't-2', name: 'Deepa Rao', email: 'deepa@puchopartner.com', role: 'Editor', status: 'Active' },
  { id: 't-3', name: 'Sanjay Dutt', email: 'sanjay@puchopartner.com', role: 'Viewer', status: 'Active' }
];

export const mockIntegrationKeys = [
  { id: 'int-1', name: 'Google Search Console', status: 'Connected', details: 'Scoped for partner client accounts' },
  { id: 'int-2', name: 'Google Business Profile', status: 'Connected', details: 'Authorized for local page schema sync' },
  { id: 'int-3', name: 'Google Analytics 4', status: 'Connected', details: 'Reporting conversions & traffic active' },
  { id: 'int-4', name: 'OpenAI / Gemini API', status: 'Connected', details: 'Used for keyword & copywriting assistants' },
  { id: 'int-5', name: 'Resend Email API', status: 'Connected', details: 'Sends Proposal notifications' },
  { id: 'int-6', name: 'PostgreSQL Database', status: 'Connected', details: 'Workspace data via the /api/db data API' }
];

export const mockMediaFiles = [
  { id: 'm1', name: 'spice_market_delhi.jpg', url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&auto=format&fit=crop&q=60', size: '1.2 MB', alt: 'A colorful wholesale spice market displaying piles of saffron and red chilli powder in Delhi.' },
  { id: 'm2', name: 'turmeric_factory.jpg', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=60', size: '890 KB', alt: 'Fine yellow organic turmeric powder being milled inside a hygienic food grade packaging facility.' },
  { id: 'm3', name: 'cardamom_farm.jpg', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=60', size: '2.1 MB', alt: 'Fresh green cardamom pods drying on trays under sunlight in a plantation in Kerala.' }
];

export const mockAnalyticsTraffic = [
  { label: 'Mon', value: 340 },
  { label: 'Tue', value: 450 },
  { label: 'Wed', value: 490 },
  { label: 'Thu', value: 430 },
  { label: 'Fri', value: 580 },
  { label: 'Sat', value: 320 },
  { label: 'Sun', value: 290 }
];

export const mockQueries = [
  { query: 'organic spices wholesale india', clicks: 245, impressions: 1800, ctr: '13.6%' },
  { query: 'bulk turmeric powder suppliers', clicks: 184, impressions: 1200, ctr: '15.3%' },
  { query: 'curry powder manufacturer delhi', clicks: 92, impressions: 850, ctr: '10.8%' },
  { query: 'wholesale cardamom export', clicks: 43, impressions: 600, ctr: '7.1%' }
];
