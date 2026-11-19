import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button } from '../components/ui/Cards';
import Input from '../components/ui/Input';
import {
  cx, SectionLabel, CardHeader, Callout, Progress, Field, TextInput, TextArea, Select, IconButton, Badge, Tag, Segmented,
  Modal, KeyValue
} from '../components/ui/primitives';
import {
  Save, Plus, Trash2, ArrowRight, Sparkles, CheckCircle2, ChevronDown, UserPlus,
  Image as ImageIcon, Upload, Palette, Layout, FileText, Globe, ExternalLink,
  Eye, Layers, Type, Check, X, ShieldAlert, FolderPlus, Search, Monitor, Smartphone, Tablet, RefreshCw,
  Heart, Star, ChevronRight, FileCode, Send, Phone, Mail, MapPin, Award, CheckCircle, Loader2, Download, Package
} from 'lucide-react';
import { toast } from 'sonner';
import TemplateGallery from '../components/TemplateGallery';
import { fetchLiveWordPressThemes, queryTemplateCatalog } from '../services/catalogSyncService';

// Official WordPress.org Theme Catalog
const OFFICIAL_WORDPRESS_KITS = [
  {
    id: 'astra-agency',
    slug: 'astra',
    name: 'Astra',
    category: 'Corporate & Business',
    thumbnail: 'https://ts.w.org/wp-content/themes/astra/screenshot.jpg?ver=4.13.11',
    screenshot_url: 'https://ts.w.org/wp-content/themes/astra/screenshot.jpg?ver=4.13.11',
    badge: 'WordPress.org Theme',
    builder: 'Elementor / Gutenberg / WordPress',
    designer: 'Brainstorm Force',
    preview_url: 'https://wordpress.org/themes/astra/',
    wordpress_org_url: 'https://wordpress.org/themes/astra/',
    download_url: 'https://wordpress.org/themes/astra/',
    stats: { views: '1M+', likes: '24.5k', rating: '5.0/5' },
    colorSwatches: ['#2563EB', '#0F172A', '#38BDF8', '#F8FAFC'],
    typography: { heading: 'Plus Jakarta Sans / ExtraBold 800', body: 'Inter Regular / 16px' },
    features: ['100% Real Live Working WordPress Theme', 'High-Converting Responsive Layout', 'Mobile Responsive & SEO Ready', 'Elementor & Gutenberg Support'],
    description: 'The Astra WordPress theme is lightning-fast, highly customizable, and perfect for business, agency, portfolio, and WooCommerce websites.',
    includedPages: ['Agency Landing Hero', 'Services & Solutions', 'Portfolio Case Studies', 'Client Testimonials', 'Contact Us'],
    sectionBreakdown: [
      { title: '01. High-Impact Header', desc: 'Modern responsive hero header with primary conversion CTA.', img: 'https://ts.w.org/wp-content/themes/astra/screenshot.jpg?ver=4.13.11' }
    ]
  },
  {
    id: 'kadence-digital-agency',
    slug: 'kadence',
    name: 'Kadence',
    category: 'Corporate & Business',
    thumbnail: 'https://ts.w.org/wp-content/themes/kadence/screenshot.png?ver=1.5.2',
    screenshot_url: 'https://ts.w.org/wp-content/themes/kadence/screenshot.png?ver=1.5.2',
    badge: 'WordPress.org Theme',
    builder: 'Kadence Blocks / Elementor',
    designer: 'Kadence WP',
    preview_url: 'https://wordpress.org/themes/kadence/',
    wordpress_org_url: 'https://wordpress.org/themes/kadence/',
    download_url: 'https://wordpress.org/themes/kadence/',
    stats: { views: '800k+', likes: '18.2k', rating: '5.0/5' },
    colorSwatches: ['#4F46E5', '#0F172A', '#06B6D4', '#F8FAFC'],
    typography: { heading: 'Plus Jakarta Sans / Bold 700', body: 'Inter Regular / 16px' },
    features: ['Real-Time Live Working Theme', 'Header & Footer Builder', 'Gutenberg Native Layouts', 'SEO Optimized Markup'],
    description: 'Kadence Theme is a lightweight yet full featured WordPress theme for creating beautiful fast loading and accessible websites.',
    includedPages: ['Studio Landing Page', 'Services Breakdown', 'Case Studies', 'Pricing & ROI Calculator', 'Contact & Booking'],
    sectionBreakdown: [
      { title: '01. Digital Studio Hero', desc: 'Ultra-clean corporate header layout with instant service stats.', img: 'https://ts.w.org/wp-content/themes/kadence/screenshot.png?ver=1.5.2' }
    ]
  },
  {
    id: 'oceanwp-business',
    slug: 'oceanwp',
    name: 'OceanWP',
    category: 'Corporate & Business',
    thumbnail: 'https://ts.w.org/wp-content/themes/oceanwp/screenshot.png?ver=3.6.0',
    screenshot_url: 'https://ts.w.org/wp-content/themes/oceanwp/screenshot.png?ver=3.6.0',
    badge: 'WordPress.org Theme',
    builder: 'OceanWP / Elementor / WordPress',
    designer: 'OceanWP Team',
    preview_url: 'https://wordpress.org/themes/oceanwp/',
    wordpress_org_url: 'https://wordpress.org/themes/oceanwp/',
    download_url: 'https://wordpress.org/themes/oceanwp/',
    stats: { views: '950k+', likes: '14.4k', rating: '4.9/5' },
    colorSwatches: ['#2563EB', '#0F172A', '#475569', '#F8FAFC'],
    typography: { heading: 'Inter Bold / Display 800', body: 'Inter Regular / 15px' },
    features: ['Lightweight & Highly Extendable', 'WooCommerce Ready', 'Custom Header & Footer', 'Responsive Layout'],
    description: 'OceanWP is the perfect theme for your project. Lightweight and highly extendable, it enables you to create almost any type of website.',
    includedPages: ['Corporate Home', 'Industrial Capabilities', 'Quality & ISO Certifications', 'Quotation Center', 'Contact Us'],
    sectionBreakdown: [
      { title: '01. Corporate Hero Banner', desc: 'Corporate credibility banner with client logo grid.', img: 'https://ts.w.org/wp-content/themes/oceanwp/screenshot.png?ver=3.6.0' }
    ]
  },
  {
    id: 'blocksy-saas',
    slug: 'blocksy',
    name: 'Blocksy',
    category: 'SaaS & Tech',
    thumbnail: 'https://ts.w.org/wp-content/themes/blocksy/screenshot.png?ver=2.0.0',
    screenshot_url: 'https://ts.w.org/wp-content/themes/blocksy/screenshot.png?ver=2.0.0',
    badge: 'WordPress.org Theme',
    builder: 'Blocksy / Gutenberg Blocks',
    designer: 'Creative Themes',
    preview_url: 'https://wordpress.org/themes/blocksy/',
    wordpress_org_url: 'https://wordpress.org/themes/blocksy/',
    download_url: 'https://wordpress.org/themes/blocksy/',
    stats: { views: '1.4M+', likes: '11.8k', rating: '5.0/5' },
    colorSwatches: ['#0284C7', '#0F172A', '#10B981', '#F0F9FF'],
    typography: { heading: 'Inter Bold / 700', body: 'Inter Regular / 15px' },
    features: ['100% Real Working Live Demo', 'Dark & Light Mode Toggle', 'Interactive Layout Builder', 'Gutenberg Native'],
    description: 'Blocksy is a blazing fast and lightweight WordPress theme, built with the latest web technologies to give you the smoothest experience.',
    includedPages: ['Software Landing', 'Feature Comparison', 'API Docs', 'Monthly / Annual Pricing', 'Contact Us'],
    sectionBreakdown: [
      { title: '01. SaaS Dashboard Hero', desc: 'Live app screenshot container with instant trial sign-up CTA.', img: 'https://ts.w.org/wp-content/themes/blocksy/screenshot.png?ver=2.0.0' }
    ]
  },
  {
    id: 'neve-multipurpose',
    slug: 'neve',
    name: 'Neve',
    category: 'Hospitality & Business',
    thumbnail: 'https://ts.w.org/wp-content/themes/neve/screenshot.png?ver=3.8.0',
    screenshot_url: 'https://ts.w.org/wp-content/themes/neve/screenshot.png?ver=3.8.0',
    badge: 'WordPress.org Theme',
    builder: 'ThemeIsle / Elementor / Gutenberg',
    designer: 'ThemeIsle',
    preview_url: 'https://wordpress.org/themes/neve/',
    wordpress_org_url: 'https://wordpress.org/themes/neve/',
    download_url: 'https://wordpress.org/themes/neve/',
    stats: { views: '720k+', likes: '6.2k', rating: '4.9/5' },
    colorSwatches: ['#C2410C', '#451A03', '#CA8A04', '#FFFBEB'],
    typography: { heading: 'Playfair Display / Serif 700', body: 'Outfit Light / 16px' },
    features: ['100% Real Working Live Demo', 'Super Fast & Easily Customizable', 'Multi-Purpose Starter Layouts', 'AMP & Mobile Optimized'],
    description: 'Neve is a super fast, easily customizable, multi-purpose theme. It is perfect for blogs, small business, startups, and agencies.',
    includedPages: ['Resort Home', 'Villas & Rooms Showcase', 'Ayurvedic Spa & Packages', 'Experiences & Booking', 'Contact Us'],
    sectionBreakdown: [
      { title: '01. Luxury Resort Banner', desc: 'Full-bleed photography header with instant room availability checker.', img: 'https://ts.w.org/wp-content/themes/neve/screenshot.png?ver=3.8.0' }
    ]
  },
  {
    id: 'generatepress-real-estate',
    slug: 'generatepress',
    name: 'GeneratePress',
    category: 'Real Estate & Corporate',
    thumbnail: 'https://ts.w.org/wp-content/themes/generatepress/screenshot.png?ver=3.4.0',
    screenshot_url: 'https://ts.w.org/wp-content/themes/generatepress/screenshot.png?ver=3.4.0',
    badge: 'WordPress.org Theme',
    builder: 'GeneratePress / Gutenberg',
    designer: 'Tom Usborne',
    preview_url: 'https://wordpress.org/themes/generatepress/',
    wordpress_org_url: 'https://wordpress.org/themes/generatepress/',
    download_url: 'https://wordpress.org/themes/generatepress/',
    stats: { views: '1.1M+', likes: '8.8k', rating: '4.9/5' },
    colorSwatches: ['#059669', '#064E3B', '#D97706', '#ECFDF5'],
    typography: { heading: 'Playfair Display / Serif', body: 'Inter Light / 16px' },
    features: ['Focus on Speed & Usability', 'Accessibility Ready', 'Block-Editor Patterns', 'Ultra Lightweight'],
    description: 'GeneratePress is a lightweight WordPress theme built with a focus on speed and usability. Performance is important to us.',
    includedPages: ['Property Hub Home', 'Listing Details Page', 'Architectural Specs', 'Schedule Site Visit', 'Contact Us'],
    sectionBreakdown: [
      { title: '01. Architectural Villa Hero', desc: 'Immersive property banner with location search filter.', img: 'https://ts.w.org/wp-content/themes/generatepress/screenshot.png?ver=3.4.0' }
    ]
  },
  {
    id: 'hello-elementor',
    slug: 'hello-elementor',
    name: 'Hello Elementor',
    category: 'Corporate & Business',
    thumbnail: 'https://ts.w.org/wp-content/themes/hello-elementor/screenshot.png?ver=3.5.1',
    screenshot_url: 'https://ts.w.org/wp-content/themes/hello-elementor/screenshot.png?ver=3.5.1',
    badge: 'WordPress.org Theme',
    builder: 'Elementor Official',
    designer: 'Elementor Team',
    preview_url: 'https://wordpress.org/themes/hello-elementor/',
    wordpress_org_url: 'https://wordpress.org/themes/hello-elementor/',
    download_url: 'https://wordpress.org/themes/hello-elementor/',
    stats: { views: '1M+', likes: '10.5k', rating: '4.8/5' },
    colorSwatches: ['#9333EA', '#1E1B4B', '#EC4899', '#FAF5FF'],
    typography: { heading: 'Plus Jakarta Sans / Bold', body: 'Inter Regular / 15px' },
    features: ['Minimalist & Lightweight', 'Seamless Elementor Integration', 'Fast Loading Times', 'Custom Header Support'],
    description: 'Hello Elementor is a lightweight and minimalist WordPress theme that was built specifically to work seamlessly with Elementor.',
    includedPages: ['Home', 'About Us', 'Services', 'Portfolio', 'Contact'],
    sectionBreakdown: [
      { title: '01. Elementor Canvas Hero', desc: 'Clean header area designed for instant visual customization.', img: 'https://ts.w.org/wp-content/themes/hello-elementor/screenshot.png?ver=3.5.1' }
    ]
  },
  {
    id: 'twentytwentyfive',
    slug: 'twentytwentyfive',
    name: 'Twenty Twenty-Five',
    category: 'Corporate & Business',
    thumbnail: 'https://ts.w.org/wp-content/themes/twentytwentyfive/screenshot.png?ver=1.5',
    screenshot_url: 'https://ts.w.org/wp-content/themes/twentytwentyfive/screenshot.png?ver=1.5',
    badge: 'WordPress.org Default Theme',
    builder: 'Full Site Editing / Gutenberg',
    designer: 'WordPress.org',
    preview_url: 'https://wordpress.org/themes/twentytwentyfive/',
    wordpress_org_url: 'https://wordpress.org/themes/twentytwentyfive/',
    download_url: 'https://wordpress.org/themes/twentytwentyfive/',
    stats: { views: '500k+', likes: '4.5k', rating: '4.7/5' },
    colorSwatches: ['#18181B', '#27272A', '#A1A1AA', '#FAFAFA'],
    typography: { heading: 'Source Serif / Bold', body: 'Inter Regular / 16px' },
    features: ['Official WordPress Default Theme', 'Full Site Editing (FSE)', 'Adaptable Design Options', 'Flexible Block Patterns'],
    description: 'Twenty Twenty-Five emphasizes simplicity and adaptability with flexible design options and Gutenberg block patterns.',
    includedPages: ['Blog Home', 'Article Template', 'About Page', 'Portfolio Grid', 'Contact'],
    sectionBreakdown: [
      { title: '01. Editorial Header', desc: 'Minimalist typography header with featured blog pattern.', img: 'https://ts.w.org/wp-content/themes/twentytwentyfive/screenshot.png?ver=1.5' }
    ]
  }
];

const COLOR_PRESETS = [
  { name: 'Warm Spice & Saffron', primary: '#D97706', secondary: '#78350F', accent: '#15803D' },
  { name: 'Modern Tech Sapphire', primary: '#2563EB', secondary: '#0F172A', accent: '#06B6D4' },
  { name: 'Fresh Eco Emerald', primary: '#16A34A', secondary: '#14532D', accent: '#FACC15' },
  { name: 'Luxury Gold & Obsidian', primary: '#D97706', secondary: '#111827', accent: '#F59E0B' },
  { name: 'Healthcare Cyan & Blue', primary: '#0284C7', secondary: '#0F172A', accent: '#06B6D4' },
  { name: 'Crimson Red & Charcoal', primary: '#DC2626', secondary: '#1F2937', accent: '#F97316' },
];

const FONT_OPTIONS = [
  { id: 'Inter / Modern Sans', label: 'Inter / Modern Sans', desc: 'Clean, neutral & highly readable' },
  { id: 'Playfair Display / Serif Elegant', label: 'Playfair Display / Serif', desc: 'Luxury, heritage & sophisticated' },
  { id: 'Outfit / Clean Modern', label: 'Outfit / Geometric Sans', desc: 'Tech-forward, crisp & bold' },
  { id: 'Roboto / Clean Professional', label: 'Roboto / Corporate', desc: 'Trustworthy, standard & clear' },
  { id: 'Poppins / Vibrant Rounded', label: 'Poppins / Friendly', desc: 'Approachable, modern & engaging' }
];

export default function BusinessSetup({ onNextStep }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { getClient, addClient, saveSetup } = useClients();

  const isNew = clientId === 'new' || !clientId;
  const client = isNew ? null : getClient(clientId);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [existingUrl, setExistingUrl] = useState('');
  const [designRefUrl, setDesignRefUrl] = useState('');
  const [designRefImg, setDesignRefImg] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [industry, setIndustry] = useState('');
  const [services, setServices] = useState([{ name: '', desc: '' }]);
  const [logoOption, setLogoOption] = useState('upload'); // 'upload' | 'ai'
  const [logoFileUrl, setLogoFileUrl] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [prefSeo, setPrefSeo] = useState(true);
  const [prefAeo, setPrefAeo] = useState(false);
  const [prefGeo, setPrefGeo] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');

  // WordPress Open Template Library Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCatalogGalleryOpen, setIsCatalogGalleryOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateFilter, setTemplateFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [previewMode, setPreviewMode] = useState('visual'); // 'visual' | 'sandbox'

  // Live WordPress Starter Template Kits State
  const [liveWpThemes, setLiveWpThemes] = useState(OFFICIAL_WORDPRESS_KITS);
  const [isLoadingWpApi, setIsLoadingWpApi] = useState(false);

  // Filter templates by category and search query
  useEffect(() => {
    let filtered = OFFICIAL_WORDPRESS_KITS;

    if (templateFilter !== 'All') {
      filtered = filtered.filter((tpl) => tpl.category === templateFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(q) ||
          tpl.description.toLowerCase().includes(q) ||
          tpl.builder.toLowerCase().includes(q) ||
          tpl.badge.toLowerCase().includes(q)
      );
    }

    setLiveWpThemes(filtered);
  }, [templateFilter, searchQuery]);

  // Real-Time WordPress REST API Sync Handler
  const handleFetchWpApiThemes = async () => {
    setIsLoadingWpApi(true);
    try {
      const res = await fetchLiveWordPressThemes(searchQuery || 'agency');
      if (res && res.logEntry) {
        toast.success(`Connected to WordPress.org REST API! Synced real-time live themes.`);
        const stored = queryTemplateCatalog({ category: templateFilter, search: searchQuery });
        if (stored.length > 0) {
          const mapped = stored.map(s => ({
            id: s.id,
            slug: s.slug || s.id,
            name: s.title,
            category: s.industry_category || 'Corporate & Business',
            thumbnail: s.thumbnail_url,
            badge: s.badge || 'WordPress.org Live Theme',
            builder: s.builder || 'Official WordPress REST API',
            designer: s.designer || s.source || 'WordPress.org',
            preview_url: s.original_url || `https://wp-themes.com/${s.slug}/`,
            stats: s.stats || { views: '500k+', likes: '9.0k', rating: '5.0/5' },
            description: s.description || s.title,
            features: s.features || ['100% Real Live Working WordPress Site', 'Official REST API Synced'],
            includedPages: s.includedPages || ['Home Landing', 'About Us', 'Services', 'Contact Us']
          }));
          setLiveWpThemes([...mapped, ...OFFICIAL_WORDPRESS_KITS]);
        }
      }
    } catch (err) {
      toast.error('Could not connect to WordPress.org REST API.');
    } finally {
      setIsLoadingWpApi(false);
    }
  };

  // Brand Guidelines state
  const [brandGuidelines, setBrandGuidelines] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#1E293B',
    accentColor: '#F59E0B',
    fontStyle: 'Inter / Modern Sans',
    brandDocUrl: '',
    notes: ''
  });

  // Photo Gallery (Product & Office Images)
  const [galleryImages, setGalleryImages] = useState([]);
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newImgTitle, setNewImgTitle] = useState('');
  const [newImgCategory, setNewImgCategory] = useState('Product Image');

  // Portfolio items
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortCategory, setNewPortCategory] = useState('Corporate Project');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [newPortUrl, setNewPortUrl] = useState('');
  const [newPortImg, setNewPortImg] = useState('');

  // Validation errors & Banner
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');

  // Demo selection state

  // Older records kept brand rules in brandGuidelines.notes; the form now has one combined notes field
  const mergeNotes = (info, guidelines) =>
    [info, guidelines?.notes].filter((t) => t && t.trim()).filter((t, i, arr) => arr.indexOf(t) === i).join('\n');

  // Prefill data if editing
  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setLocation(client.location || '');
      setExistingUrl(client.existingUrl || '');
      setDesignRefUrl(client.designRefUrl || '');
      setTargetAudience(client.targetAudience || '');
      setIndustry(client.industry || '');
      setServices(client.services && client.services.length > 0 ? client.services : [{ name: '', desc: '' }]);
      setLogoOption(client.logoOption || 'upload');
      setLogoFileUrl(client.logoUrl || '');
      setMobile(client.mobile || '');
      setEmail(client.email || '');
      setGstin(client.gstin || '');
      setKeywordsInput(client.keywordsInput || '');
      setPrefSeo(client.preferences?.seo ?? true);
      setPrefAeo(client.preferences?.aeo ?? false);
      setPrefGeo(client.preferences?.geo ?? false);
      setAdditionalInfo(mergeNotes(client.additionalInfo, client.brandGuidelines));
      setDesignRefImg(client.brandGuidelines?.designRefImg || '');
      setBanner(client.setupBanner || '');

      if (client.selectedTemplate) setSelectedTemplate(client.selectedTemplate);
      if (client.brandGuidelines) setBrandGuidelines(client.brandGuidelines);
      if (client.galleryImages) setGalleryImages(client.galleryImages);
      if (client.portfolioItems) setPortfolioItems(client.portfolioItems);
    } else {
      // Reset form
      setName('');
      setLocation('');
      setExistingUrl('');
      setDesignRefUrl('');
      setDesignRefImg('');
      setTargetAudience('');
      setIndustry('');
      setServices([{ name: '', desc: '' }]);
      setLogoOption('upload');
      setLogoFileUrl('');
      setMobile('');
      setEmail('');
      setGstin('');
      setKeywordsInput('');
      setPrefSeo(true);
      setPrefAeo(false);
      setPrefGeo(false);
      setAdditionalInfo('');
      setBanner('');
      setSelectedTemplate(null);
      setBrandGuidelines({
        primaryColor: '#3B82F6',
        secondaryColor: '#1E293B',
        accentColor: '#F59E0B',
        fontStyle: 'Inter / Modern Sans',
        brandDocUrl: '',
        notes: ''
      });
      setGalleryImages([]);
      setPortfolioItems([]);
    }
  }, [clientId, client]);

  // Service portfolio management
  const handleServiceChange = (index, field, val) => {
    const list = [...services];
    list[index][field] = val;
    setServices(list);
  };

  const addServiceRow = () => {
    setServices([...services, { name: '', desc: '' }]);
  };

  const removeServiceRow = (index) => {
    if (services.length === 1) return;
    const list = services.filter((_, i) => i !== index);
    setServices(list);
  };

  // Logo File Upload Handler
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setLogoFileUrl(dataUrl);
      toast.success(`Brand Logo uploaded: "${file.name}"`);
    };
    reader.readAsDataURL(file);
  };

  // Photo Gallery Handlers
  const handleFileUploadGallery = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target.result;
        setGalleryImages((prev) => [
          ...prev,
          {
            id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: dataUrl,
            title: file.name.replace(/\.[^/.]+$/, ''),
            category: newImgCategory
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} photo(s) added to gallery.`);
  };

  const handleAddGalleryUrl = (e) => {
    e.preventDefault();
    if (!newImgUrl.trim()) {
      toast.error('Please enter an image URL.');
      return;
    }
    setGalleryImages((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        url: newImgUrl,
        title: newImgTitle.trim() || 'Uploaded Image',
        category: newImgCategory
      }
    ]);
    setNewImgUrl('');
    setNewImgTitle('');
    toast.success('Image added to gallery!');
  };

  const removeGalleryImage = (id) => {
    setGalleryImages((prev) => prev.filter((img) => img.id !== id));
    toast.info('Image removed from gallery.');
  };

  // Portfolio Handlers
  const handleAddPortfolioItem = (e) => {
    e.preventDefault();
    if (!newPortTitle.trim()) {
      toast.error('Please enter a Project Title.');
      return;
    }
    setPortfolioItems((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        title: newPortTitle,
        category: newPortCategory,
        description: newPortDesc,
        projectUrl: newPortUrl,
        imageUrl: newPortImg || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80'
      }
    ]);
    setNewPortTitle('');
    setNewPortDesc('');
    setNewPortUrl('');
    setNewPortImg('');
    toast.success('Portfolio item added!');
  };

  const removePortfolioItem = (id) => {
    setPortfolioItems((prev) => prev.filter((item) => item.id !== id));
    toast.info('Portfolio item removed.');
  };

  // Form Validation & Save
  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Business name is required';
    if (!location.trim()) tempErrors.location = 'Location/City is required';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // One save at a time: a second click while a save is in flight is ignored (QA M-05: two rows 15 ms apart)
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (savingRef.current) return null;
    if (!validate()) {
      toast.error('Please fill in all required fields.');
      return null;
    }
    savingRef.current = true;
    setSaving(true);
    try {

    const payload = {
      name,
      location,
      existingUrl,
      designRefUrl,
      targetAudience,
      industry,
      services: services.filter((s) => s.name.trim()),
      logoOption,
      logoUrl: logoFileUrl,
      mobile,
      email,
      gstin,
      keywordsInput,
      preferences: { seo: prefSeo, aeo: prefAeo, geo: prefGeo },
      additionalInfo,
      selectedTemplate,
      // notes now live in additionalInfo; the reference image has no column of its own
      brandGuidelines: { ...brandGuidelines, notes: '', designRefImg },
      galleryImages,
      portfolioItems
    };

    const targetId = clientId && clientId !== 'new' ? clientId : (client?.id || null);

    if (isNew || !targetId) {
      const newClient = await addClient(payload);
      if (!newClient || !newClient.id) return null;
      toast.success('Saved successfully!');
      return newClient.id;
    } else {
      await saveSetup(targetId, payload);
      toast.success('Updated successfully!');

      let bannerMsg = '';
      if (keywordsInput && existingUrl) {
        bannerMsg = 'Your keywords will be used as priority; the site will be analyzed to enrich them.';
      } else if (keywordsInput) {
        bannerMsg = 'Keywords will be used directly and expanded.';
      } else if (existingUrl) {
        bannerMsg = "We'll analyze this site to research keywords.";
      } else {
        bannerMsg = 'Our AI will research keywords independently from your profile.';
      }
      setBanner(bannerMsg);
      return targetId;
    }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const activeId = await handleSave();
    if (activeId) {
      toast.success('Saved successfully! Moving to next step...');
      if (clientId === 'new' || !clientId) {
        navigate(`/clients/${activeId}/workflow`);
      }
      if (typeof onNextStep === 'function') {
        onNextStep();
      }
    }
  };

  // Escape closes the template gallery overlay (the gallery keeps its own close button)
  useEffect(() => {
    if (!isCatalogGalleryOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setIsCatalogGalleryOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isCatalogGalleryOpen]);

  // Completeness — computed from what is actually filled in (display only)
  const has = (v) => String(v ?? '').trim().length > 0;
  const SECTION_TOTAL = 6;
  const sectionsFilled = [
    has(name) && has(location),
    services.some((s) => has(s?.name)) || has(targetAudience),
    logoOption === 'ai' || has(logoFileUrl) || has(brandGuidelines?.brandDocUrl),
    Boolean(selectedTemplate),
    galleryImages.length > 0 || portfolioItems.length > 0,
    has(keywordsInput) || has(additionalInfo),
  ].filter(Boolean).length;

  const errorList = Object.values(errors).filter(Boolean);
  const templateThumb = selectedTemplate && (selectedTemplate.thumbnail || selectedTemplate.thumbnail_url || selectedTemplate.screenshot_url);
  const previewPages = previewTemplate ? (previewTemplate.includedPages || ['Home Landing', 'About Us', 'Contact']) : [];

  const searchModes = [
    { key: 'seo', checked: prefSeo, set: setPrefSeo, title: 'SEO', desc: 'Search engine optimisation — Google search ranking' },
    { key: 'aeo', checked: prefAeo, set: setPrefAeo, title: 'AEO', desc: 'Answer engine optimisation — voice searches' },
    { key: 'geo', checked: prefGeo, set: setPrefGeo, title: 'GEO', desc: 'Generative engine optimisation — LLM / chat engines' },
  ];

  const colorFields = [
    { key: 'primaryColor', label: 'Primary brand colour' },
    { key: 'secondaryColor', label: 'Secondary brand colour' },
    { key: 'accentColor', label: 'Accent colour' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Intro + completeness */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="label-mono">Business requirements</p>
          <p className="text-sm text-ink-3 max-w-xl">
            Business name and location are required. Everything else sharpens the website plan.
          </p>
        </div>
        <div className="w-full sm:w-64 shrink-0">
          <Progress value={sectionsFilled} max={SECTION_TOTAL} label={`${sectionsFilled} of ${SECTION_TOTAL} sections filled`} />
        </div>
      </div>

      {/* Onboarding banner message */}
      {banner && (
        <Callout tone="info" icon={Sparkles} title="AI strategy configured">
          {banner}
        </Callout>
      )}

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* SECTION 1: Business & contact information */}
        <SectionCard n={1} total={SECTION_TOTAL} icon={FileText} title="Business & contact information">
          <div className="space-y-3">
            <SectionLabel>Business</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Business / client name"
                required
                placeholder="e.g. Rajesh Masala Co."
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              <Input
                label="Industry / segment"
                placeholder="e.g. Food Processing / Spices"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
              <Input
                label="Location / city"
                required
                placeholder="e.g. Khari Baoli, Delhi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                error={errors.location}
              />
              <Input
                label="GST / FSSAI number (optional)"
                placeholder="e.g. FSSAI 10014011000188"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <SectionLabel>Contact &amp; current website</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact mobile"
                type="tel"
                placeholder="e.g. 9812345678"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
              <Input
                label="Contact email"
                type="email"
                placeholder="e.g. contact@business.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Existing website URL (if any)"
                type="url"
                placeholder="e.g. https://rajeshspices.in (old site to analyze & re-design)"
                value={existingUrl}
                onChange={(e) => setExistingUrl(e.target.value)}
                className="sm:col-span-2"
              />
            </div>
          </div>
        </SectionCard>

        {/* SECTION 2: Services & target audience */}
        <SectionCard n={2} total={SECTION_TOTAL} icon={Layers} title="Services & target audience">
          <div className="space-y-3">
            <SectionLabel count={services.length}>Services</SectionLabel>
            <div className="space-y-2">
              {services.map((service, index) => (
                <div key={index} className="flex items-start gap-2 bg-surface-2 p-3 rounded-xl">
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <TextInput
                        type="text"
                        aria-label={`Service ${index + 1} name`}
                        placeholder="Service name"
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <TextInput
                        type="text"
                        aria-label={`Service ${index + 1} description`}
                        placeholder="Short description of the service"
                        value={service.desc}
                        onChange={(e) => handleServiceChange(index, 'desc', e.target.value)}
                      />
                    </div>
                  </div>
                  {services.length > 1 && (
                    <IconButton
                      icon={Trash2}
                      label={`Remove service ${index + 1}`}
                      onClick={() => removeServiceRow(index)}
                      className="hover:text-bad-text"
                    />
                  )}
                </div>
              ))}
            </div>
            <Button variant="ghost" icon={Plus} type="button" onClick={addServiceRow}>
              Add service
            </Button>
          </div>

          <Input
            label="Target audience"
            placeholder="e.g. B2B Wholesalers, retail distributors, health-conscious urban families"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </SectionCard>

        {/* SECTION 3: Brand identity & logo */}
        <SectionCard n={3} total={SECTION_TOTAL} icon={Palette} title="Brand identity & logo">
          {/* Logo */}
          <div className="space-y-3">
            <fieldset className="space-y-1.5">
              <legend className="block text-[13px] font-medium text-ink-3 mb-1.5">Brand logo</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: 'upload', icon: Upload, title: 'Upload brand logo' },
                  { value: 'ai', icon: Sparkles, title: 'Design logo with AI' },
                ].map((opt) => {
                  const OptIcon = opt.icon;
                  const sel = logoOption === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={cx(
                        'flex items-center gap-3 min-h-11 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors duration-150',
                        sel ? 'bg-accent-soft border-accent-edge' : 'bg-surface border-line hover:bg-hover'
                      )}
                    >
                      <input
                        type="radio"
                        name="logoOption"
                        value={opt.value}
                        checked={logoOption === opt.value}
                        onChange={() => setLogoOption(opt.value)}
                        className="w-4 h-4 accent-accent shrink-0"
                      />
                      <OptIcon className={cx('w-4 h-4 shrink-0', sel ? 'text-accent-text' : 'text-ink-3')} strokeWidth={1.7} aria-hidden />
                      <span className="text-sm font-medium text-ink">{opt.title}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {logoOption === 'upload' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 min-w-0">
                  <Field label="Logo image URL" htmlFor="bs-logo-url" hint="Paste a link, or upload a file.">
                    <TextInput
                      id="bs-logo-url"
                      type="url"
                      placeholder="https://client.com/logo.png"
                      value={logoFileUrl}
                      onChange={(e) => setLogoFileUrl(e.target.value)}
                      className="font-mono text-[13px]"
                    />
                  </Field>

                  {/* Logo live preview */}
                  {logoFileUrl && (
                    <div className="flex items-center gap-3 p-2.5 bg-surface-2 rounded-xl">
                      <div className="w-12 h-12 rounded-md bg-surface border border-line-soft p-1 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={logoFileUrl} alt="Brand logo preview" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-ink block truncate">Brand logo preview</span>
                        <span className="text-xs text-ink-3 font-mono truncate block">{logoFileUrl.substring(0, 60)}...</span>
                      </div>
                      <IconButton icon={Trash2} label="Remove logo" onClick={() => setLogoFileUrl('')} className="hover:text-bad-text" />
                    </div>
                  )}
                </div>

                <DropZone
                  accept="image/*"
                  onChange={handleLogoUpload}
                  title="Drop the logo or click to upload"
                  hint="PNG, JPG or SVG"
                />
              </div>
            ) : (
              <Callout tone="info" icon={Sparkles} title="AI logo generator on">
                Pucho AI will design a vector logo that matches the brand guidelines.
              </Callout>
            )}
          </div>

          {/* Quick colour palette presets */}
          <div className="space-y-2">
            <SectionLabel>Colours</SectionLabel>
            <p className="text-[13px] font-medium text-ink-3">Quick colour presets</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5 sm:flex-wrap sm:overflow-visible">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setBrandGuidelines({
                      ...brandGuidelines,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary,
                      accentColor: preset.accent
                    })
                  }
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 hover:border-line-strong text-[13px] text-ink transition-colors duration-150 shrink-0 whitespace-nowrap"
                >
                  <span className="flex items-center -space-x-1 shrink-0" aria-hidden>
                    <span className="w-3.5 h-3.5 rounded-full border border-surface" style={{ backgroundColor: preset.primary }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-surface" style={{ backgroundColor: preset.secondary }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-surface" style={{ backgroundColor: preset.accent }} />
                  </span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand colours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {colorFields.map((cf) => (
              <Field key={cf.key} label={cf.label} htmlFor={`bs-${cf.key}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`${cf.label} picker`}
                    value={brandGuidelines[cf.key]}
                    onChange={(e) => setBrandGuidelines({ ...brandGuidelines, [cf.key]: e.target.value })}
                    className="w-11 h-11 rounded-xl border border-line bg-surface p-1 cursor-pointer shrink-0"
                  />
                  <TextInput
                    id={`bs-${cf.key}`}
                    type="text"
                    value={brandGuidelines[cf.key]}
                    onChange={(e) => setBrandGuidelines({ ...brandGuidelines, [cf.key]: e.target.value })}
                    className="font-mono text-[13px] min-w-0"
                  />
                </div>
              </Field>
            ))}
          </div>

          {/* Typography & brand doc link */}
          <div className="space-y-3">
            <SectionLabel>Typography &amp; guidelines</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand typography" htmlFor="bs-font">
                <Select
                  id="bs-font"
                  value={brandGuidelines.fontStyle}
                  onChange={(e) => setBrandGuidelines({ ...brandGuidelines, fontStyle: e.target.value })}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label} — ({font.desc})
                    </option>
                  ))}
                </Select>
              </Field>

              <Input
                label="Brand guidelines PDF / doc URL (optional)"
                type="url"
                placeholder="https://client.com/brand-guidelines.pdf"
                value={brandGuidelines.brandDocUrl}
                onChange={(e) => setBrandGuidelines({ ...brandGuidelines, brandDocUrl: e.target.value })}
              />
            </div>
          </div>
        </SectionCard>

        {/* SECTION 4: Website template & design reference */}
        <SectionCard n={4} total={SECTION_TOTAL} icon={Package} title="Website template & design reference">
          {/* Template selection */}
          <div className="space-y-3">
            <SectionLabel>Website template</SectionLabel>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-2 rounded-xl">
              {selectedTemplate ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-24 h-16 rounded-md overflow-hidden bg-surface border border-line-soft shrink-0">
                    {templateThumb && (
                      <img src={templateThumb} alt={selectedTemplate.name || selectedTemplate.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <Badge tone="ok">Selected template</Badge>
                    <p className="text-[15px] font-semibold text-ink truncate">{selectedTemplate.name || selectedTemplate.title}</p>
                    {(selectedTemplate.archetype || selectedTemplate.category) && (
                      <p className="text-xs text-ink-3 truncate">{selectedTemplate.archetype || selectedTemplate.category} · included in the build prompt</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-ink-3">No template yet. Pick a ready template with screenshots and device previews.</p>
              )}

              <Button
                variant="secondary"
                type="button"
                icon={Layout}
                onClick={() => setIsCatalogGalleryOpen(true)}
                className="w-full sm:w-auto"
              >
                {selectedTemplate ? 'Change template' : 'Browse templates'}
              </Button>
            </div>
          </div>

          {/* Client's own design reference */}
          <div className="space-y-3">
            <div className="space-y-1">
              <SectionLabel>Client's own design reference (optional)</SectionLabel>
              <p className="text-xs text-ink-3">A website or screenshot the client likes, in addition to the template above.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Design reference URL"
                type="url"
                placeholder="https://competitor.com/nice-site"
                value={designRefUrl}
                onChange={(e) => setDesignRefUrl(e.target.value)}
              />

              <div className="space-y-3 min-w-0">
                <Field label="Design reference image (URL or upload)" htmlFor="bs-ref-img">
                  <TextInput
                    id="bs-ref-img"
                    type="text"
                    placeholder="https://client.com/screenshot.png"
                    value={designRefImg}
                    onChange={(e) => setDesignRefImg(e.target.value)}
                    className="font-mono text-[13px]"
                  />
                </Field>

                {designRefImg ? (
                  <div className="relative w-full h-28 bg-surface-2 rounded-xl overflow-hidden">
                    <img src={designRefImg} alt="Custom design reference" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setDesignRefImg('')}
                      aria-label="Remove design reference image"
                      title="Remove design reference image"
                      className="absolute top-2 right-2 w-10 h-10 sm:w-8 sm:h-8 rounded-md bg-surface border border-line text-ink-2 hover:text-bad-text flex items-center justify-center transition-colors duration-150"
                    >
                      <X className="w-4 h-4" strokeWidth={1.7} aria-hidden />
                    </button>
                  </div>
                ) : (
                  <DropZone
                    accept="image/*"
                    compact
                    title="Drop a screenshot or click to upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setDesignRefImg(ev.target.result);
                          toast.success('Custom design reference image attached.');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* SECTION 5: Photo gallery & portfolio */}
        <SectionCard n={5} total={SECTION_TOTAL} icon={ImageIcon} title="Photo gallery & portfolio">
          {/* Photo gallery */}
          <div className="space-y-3">
            <div className="space-y-1">
              <SectionLabel count={galleryImages.length > 0 ? galleryImages.length : undefined}>Product &amp; office photos</SectionLabel>
              <p className="text-xs text-ink-3">Product photos, office premises, factory or storefront images.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DropZone
                accept="image/*"
                multiple
                onChange={handleFileUploadGallery}
                title="Drop photos or click to upload"
                hint={`Added as “${newImgCategory}”`}
                className="min-h-[148px]"
              />

              <div className="space-y-3 min-w-0">
                <Input
                  label="Image URL"
                  placeholder="https://domain.com/photo.jpg"
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Caption / title"
                    placeholder="e.g. Delhi Warehouse"
                    value={newImgTitle}
                    onChange={(e) => setNewImgTitle(e.target.value)}
                  />
                  <Field label="Image category" htmlFor="bs-img-cat" hint="Also used for uploads">
                    <Select
                      id="bs-img-cat"
                      value={newImgCategory}
                      onChange={(e) => setNewImgCategory(e.target.value)}
                    >
                      <option value="Product Image">Product Image</option>
                      <option value="Office / Facility Image">Office / Facility Image</option>
                      <option value="Storefront / Location">Storefront / Location</option>
                      <option value="Certification / Badge">Certification / Badge</option>
                    </Select>
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary" type="button" icon={Plus} onClick={handleAddGalleryUrl}>
                    Add image URL
                  </Button>
                </div>
              </div>
            </div>

            {/* Gallery thumbnails */}
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map((img) => (
                  <div key={img.id} className="relative bg-surface-2 rounded-xl overflow-hidden flex flex-col min-w-0">
                    <div className="h-28 bg-surface-2 overflow-hidden">
                      <img src={img.url} alt={img.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(img.id)}
                      aria-label={`Remove image ${img.title}`}
                      title="Remove image"
                      className="absolute top-2 right-2 w-10 h-10 sm:w-8 sm:h-8 rounded-md bg-surface border border-line text-ink-2 hover:text-bad-text flex items-center justify-center transition-colors duration-150"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.7} aria-hidden />
                    </button>
                    <div className="p-2.5 flex flex-col gap-1.5 flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-ink truncate">{img.title}</span>
                      <Tag className="self-start max-w-full truncate">{img.category}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-[13px] text-ink-3">
                <ImageIcon className="w-4 h-4 shrink-0" strokeWidth={1.7} aria-hidden />
                No gallery photos yet. Upload files or add an image URL above.
              </p>
            )}
          </div>

          {/* Portfolio */}
          <div className="space-y-3 border-t border-line-soft pt-5">
            <div className="space-y-1">
              <SectionLabel count={portfolioItems.length > 0 ? portfolioItems.length : undefined}>Portfolio &amp; past work</SectionLabel>
              <p className="text-xs text-ink-3">Previous projects, contracts or key achievements.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Project / portfolio title"
                required
                placeholder="e.g. Taj Hotels Spice Supply"
                value={newPortTitle}
                onChange={(e) => setNewPortTitle(e.target.value)}
              />
              <Input
                label="Category / segment"
                placeholder="e.g. Corporate B2B, Export"
                value={newPortCategory}
                onChange={(e) => setNewPortCategory(e.target.value)}
              />
              <Input
                label="Project link / reference URL"
                placeholder="https://project.com"
                value={newPortUrl}
                onChange={(e) => setNewPortUrl(e.target.value)}
              />
              <Input
                label="Short description of work"
                placeholder="e.g. Bulk spice contract for 45 luxury hotel locations across North India."
                value={newPortDesc}
                onChange={(e) => setNewPortDesc(e.target.value)}
                className="sm:col-span-3"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" type="button" icon={Plus} onClick={handleAddPortfolioItem}>
                Add portfolio item
              </Button>
            </div>

            {/* Portfolio list */}
            {portfolioItems.length > 0 ? (
              <div className="space-y-2">
                {portfolioItems.map((item) => (
                  <div key={item.id} className="p-3 bg-surface-2 rounded-xl flex items-start gap-3">
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-surface border border-line-soft shrink-0">
                      <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        <Tag className="bg-surface">{item.category}</Tag>
                      </div>
                      {item.description && <p className="text-[13px] text-ink-3 mt-1 leading-relaxed">{item.description}</p>}
                      {item.projectUrl && (
                        <a
                          href={item.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-text hover:underline mt-1.5"
                        >
                          <span>Visit project</span>
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden />
                        </a>
                      )}
                    </div>
                    <IconButton
                      icon={Trash2}
                      label="Delete portfolio item"
                      onClick={() => removePortfolioItem(item.id)}
                      className="hover:text-bad-text"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-[13px] text-ink-3">
                <FolderPlus className="w-4 h-4 shrink-0" strokeWidth={1.7} aria-hidden />
                No portfolio items yet. Fill in a title above and add it.
              </p>
            )}
          </div>
        </SectionCard>

        {/* SECTION 6: SEO strategy & final notes */}
        <SectionCard n={6} total={SECTION_TOTAL} icon={Globe} title="SEO strategy & final notes">
          <fieldset className="space-y-1.5">
            <legend className="block text-[13px] font-medium text-ink-3 mb-1.5">Search optimisation modes</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {searchModes.map((m) => (
                <label
                  key={m.key}
                  className={cx(
                    'flex items-start gap-3 min-h-11 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors duration-150',
                    m.checked ? 'bg-accent-soft border-accent-edge' : 'bg-surface border-line hover:bg-hover'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={m.checked}
                    onChange={(e) => m.set(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-accent shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{m.title}</span>
                    <span className="block text-xs text-ink-3 mt-0.5">{m.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Seed keywords" htmlFor="bs-keywords" hint="Comma-separated. Used first; the AI expands them.">
            <TextArea
              id="bs-keywords"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="e.g. bulk turmeric powder, wholesale chili delhi"
              rows={3}
            />
          </Field>

          <Field label="Client requirements, rules & tone" htmlFor="bs-additional">
            <TextArea
              id="bs-additional"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="e.g. Show FSSAI / ISO logos in the header, warm lighting in photos, traditional Indian feel, reassuring and professional tone..."
              rows={4}
            />
          </Field>
        </SectionCard>

        {/* Persistent validation message (fields also show their own error) */}
        {errorList.length > 0 && (
          <Callout tone="bad" title="Fill in the required fields">
            {errorList.join(' · ')}
          </Callout>
        )}

        {/* Footer actions — save bottom-right, primary last */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
          <Button variant="secondary" icon={Save} type="button" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            Save setup
          </Button>
          <Button iconRight={ArrowRight} type="button" onClick={handleSaveAndContinue} loading={saving} className="w-full sm:w-auto">
            {saving ? 'Saving…' : <>Save &amp; continue</>}
          </Button>
        </div>
      </form>

      {/* WordPress starter kit preview */}
      <Modal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        size="xl"
        title={previewTemplate?.name}
        description={previewTemplate ? [previewTemplate.badge, previewTemplate.designer].filter(Boolean).join(' · ') : undefined}
        footer={previewTemplate && (
          <>
            <p className="text-xs text-ink-3 line-clamp-1 mr-auto hidden sm:block max-w-md">{previewTemplate.description}</p>
            <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>
              Close preview
            </Button>
            <Button
              onClick={() => {
                setSelectedTemplate(previewTemplate);
                setPreviewTemplate(null);
                setIsTemplateModalOpen(false);
                toast.success(`Selected Starter Kit: "${previewTemplate.name}".`);
              }}
            >
              Select this starter kit
            </Button>
          </>
        )}
      >
        {previewTemplate && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Segmented
                value={previewMode}
                onChange={setPreviewMode}
                options={[
                  { value: 'visual', label: 'Kit details', icon: ImageIcon },
                  { value: 'sandbox', label: 'Live demo', icon: Globe },
                ]}
              />
              <a
                href={previewTemplate.preview_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-text hover:underline"
              >
                <span>Open live starter demo site</span>
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden />
              </a>
            </div>
            <p className="text-xs text-ink-3 font-mono truncate">{previewTemplate.preview_url}</p>

            {previewMode === 'visual' ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <SectionLabel right={<Tag>{previewTemplate.builder}</Tag>}>Starter site layout</SectionLabel>
                  <div className="rounded-xl overflow-hidden bg-surface-2">
                    <img src={previewTemplate.thumbnail} alt={previewTemplate.name} referrerPolicy="no-referrer" className="w-full h-auto object-cover" />
                  </div>
                </div>

                <div className="space-y-2">
                  <SectionLabel count={previewPages.length}>Included page templates</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {previewPages.map((pg, pIdx) => (
                      <div key={pIdx} className="px-3 py-2.5 bg-surface-2 rounded-xl flex items-center gap-2 text-[13px] text-ink-2">
                        <CheckCircle2 className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.7} aria-hidden />
                        <span className="min-w-0">{pg}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <SectionLabel>Key features</SectionLabel>
                    <ul className="space-y-1.5 text-[13px] text-ink-2">
                      {(previewTemplate.features || ['Responsive', 'SEO Ready']).map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-ink-4 shrink-0" aria-hidden />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <SectionLabel>Kit info</SectionLabel>
                    <div>
                      <KeyValue label="Page builder">{previewTemplate.builder}</KeyValue>
                      <KeyValue label="Category">{previewTemplate.category}</KeyValue>
                      <KeyValue label="Designer">{previewTemplate.designer}</KeyValue>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-5 bg-surface-2 rounded-xl text-center space-y-3">
                  <Tag className="bg-surface">{previewTemplate.badge || 'Official WordPress.org Theme Showcase'}</Tag>
                  <h3 className="text-[17px] font-semibold text-ink">{previewTemplate.name}</h3>
                  <p className="text-[13px] text-ink-3 max-w-xl mx-auto">{previewTemplate.description}</p>
                  <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
                    <a
                      href={previewTemplate.wordpress_org_url || previewTemplate.preview_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-surface text-ink border border-line-strong hover:bg-surface-2 transition-colors duration-150"
                    >
                      <span>Open live starter site demo</span>
                      <ExternalLink className="w-4 h-4" strokeWidth={1.7} aria-hidden />
                    </a>
                    {previewTemplate.download_url && (
                      <a
                        href={previewTemplate.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-ink-2 hover:bg-surface hover:text-ink transition-colors duration-150"
                      >
                        <Download className="w-4 h-4" strokeWidth={1.7} aria-hidden />
                        <span>Get the kit</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <SectionLabel>Desktop screenshot</SectionLabel>
                  <img src={previewTemplate.thumbnail} alt={previewTemplate.name} referrerPolicy="no-referrer" className="w-full rounded-xl object-cover bg-surface-2" />
                </div>

                {previewTemplate.sectionBreakdown?.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-2">
                    <SectionLabel right={<span className="text-xs text-ink-3 tabular-nums">Section {sIdx + 1}</span>}>{sec.title}</SectionLabel>
                    <p className="text-[13px] text-ink-3">{sec.desc}</p>
                    <img src={sec.img} alt={sec.title} referrerPolicy="no-referrer" className="w-full rounded-xl object-cover bg-surface-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Multi-source template gallery overlay */}
      {isCatalogGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-scrim animate-fade" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Template gallery"
            className="relative w-full max-w-6xl my-auto max-h-[92vh] flex flex-col bg-surface border border-line rounded-3xl shadow-float overflow-hidden animate-scale-up"
          >
            <TemplateGallery
              business={{ id: clientId, name }}
              channelPartnerName="Arjun Khanna"
              onConfirmSelection={(selectedTpl) => {
                // The template is its own field; keep "Design Reference URL" for the client's own reference
                setSelectedTemplate(selectedTpl);
                setIsCatalogGalleryOpen(false);
              }}
              onClose={() => setIsCatalogGalleryOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── local helpers ─────────────────────────────────────────────────────────────────────────────────── */

/** SectionCard — one titled form section: card heading + "Section n of m", fields below. */
function SectionCard({ n, total, icon, title, children }) {
  return (
    <Card className="space-y-5">
      <CardHeader
        icon={icon}
        title={title}
        action={<span className="text-xs text-ink-3 tabular-nums whitespace-nowrap">Section {n} of {total}</span>}
      />
      {children}
    </Card>
  );
}

/**
 * DropZone — hairline dashed zone on the subtle surface. The native file input covers the zone, so a click opens the
 * picker and a dropped file reaches the same onChange handler.
 */
function DropZone({ accept, multiple = false, onChange, title, hint, compact = false, className = '' }) {
  return (
    <label
      className={cx(
        'relative flex flex-col items-center justify-center gap-2 text-center rounded-2xl border border-dashed border-line-strong bg-surface-2 px-4 cursor-pointer transition-colors duration-150 hover:border-ink-3 focus-within:border-accent',
        compact ? 'py-4' : 'py-6',
        className
      )}
    >
      <span className="w-9 h-9 rounded-xl bg-surface text-ink-2 flex items-center justify-center" aria-hidden>
        <Upload className="w-[18px] h-[18px]" strokeWidth={1.7} />
      </span>
      <span className="text-[13px] font-medium text-ink">{title}</span>
      {hint && <span className="text-xs text-ink-3">{hint}</span>}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </label>
  );
}
