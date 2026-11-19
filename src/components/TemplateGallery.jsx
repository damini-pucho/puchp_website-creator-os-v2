import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Check,
  X,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  Palette,
  MousePointerClick,
} from 'lucide-react';
import { Button, EmptyState } from './ui/Cards';
import { Chip, ChipRow, Modal, Segmented, IconButton, Tag, cx } from './ui/primitives';
import { toast } from 'sonner';
import { 
  queryTemplateCatalog, 
  getStoredCatalog, 
  fetchWordPressThemes 
} from '../services/catalogSyncService';
import { INITIAL_TEMPLATE_CATALOG } from '../data/templateCatalogData';
import { useClients } from '../context/ClientContext';

const CATEGORIES = [
  'All',
  'Corporate & Business',
  'E-Commerce & Food',
  'Healthcare',
  'Hospitality',
  'SaaS & Tech'
];

export default function TemplateGallery({
  business = null,
  channelPartnerName = 'Channel Partner',
  onConfirmSelection = null,
  onClose = null,
  isStandalonePage = false
}) {
  const { clients, updateClient, selectedClient } = useClients();

  // Active target client for selection
  const targetClient = business || selectedClient || clients[0] || null;

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Catalog items & selection
  const [items, setItems] = useState(INITIAL_TEMPLATE_CATALOG);
  const [selectedCard, setSelectedCard] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected card if targetClient already has selected_template
  useEffect(() => {
    if (targetClient?.selected_template) {
      const match = items.find(
        (t) => t.id === targetClient.selected_template.id || t.slug === targetClient.selected_template.slug
      );
      if (match) setSelectedCard(match);
    }
  }, [targetClient]);

  // Fetch live themes + local catalog items (sources are not shown in the UI)
  const loadCatalog = async () => {
    let wpResults = [];

    try {
      const tag = selectedCategory !== 'All' ? selectedCategory.toLowerCase().replace(/[^a-z]/g, '') : '';
      const wpData = await fetchWordPressThemes(searchQuery, tag, 1);
      wpResults = wpData.themes || [];
    } catch (err) {
      // fall back to the curated catalog below
    }

    // Read stored catalog items
    const localData = queryTemplateCatalog({
      sources: ['All'],
      category: selectedCategory,
      search: searchQuery
    });

    // Merge and deduplicate by slug or original_url
    // ... and by id as well, since the id is the React key (QA L-01)
    const combinedMap = new Map();
    const seenIds = new Set();
    [...INITIAL_TEMPLATE_CATALOG, ...wpResults, ...localData].forEach((item) => {
      const key = (item.slug || item.originalUrl || item.original_url || item.title || '').toLowerCase().trim();
      if (item.id && seenIds.has(item.id)) return;
      if (key && !combinedMap.has(key)) {
        if (item.id) seenIds.add(item.id);
        // Normalize fields
        combinedMap.set(key, {
          ...item,
          thumbnail_url: item.thumbnail_url || item.thumbnailUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
          screenshot_url: item.screenshot_url || item.screenshotUrl || item.thumbnail_url || item.thumbnailUrl,
          original_url: item.original_url || item.originalUrl || item.preview_url || item.previewUrl,
          preview_url: item.preview_url || item.previewUrl || item.original_url || item.originalUrl,
          title: item.title || item.name || 'Modern Template',
          // Hide where a template comes from: strip platform names from visible text
          description: (item.description || '').replace(/\s*\bWordPress(\.org)?\b/gi, ''),
          source: item.source || 'WordPress.org',
          rating: item.rating || 98,
          tags: Array.isArray(item.tags) ? item.tags : ['responsive', 'modern', 'b2b'],
          industry_category:
            item.industry_category && !/wordpress/i.test(item.industry_category)
              ? item.industry_category
              : 'Corporate & Business',
          features: item.features || ['Responsive Layout', 'Clean Typography', 'SEO Schema', 'Fast Load Times']
        });
      }
    });

    let filtered = Array.from(combinedMap.values());
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (t) => t.industry_category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => String(tag).toLowerCase().includes(q))
      );
    }

    setItems(filtered);
  };

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, searchQuery]);

  // Confirm Template Selection
  const handleConfirmSelection = async (cardToConfirm = selectedCard) => {
    const card = cardToConfirm || selectedCard;
    if (!card) {
      toast.error('Please select a template design card first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedSelected = {
        id: card.id || card.slug,
        slug: card.slug,
        title: card.title || card.name,
        name: card.name || card.title,
        source: card.source || 'WordPress.org',
        original_url: card.original_url || card.originalUrl || '',
        thumbnail_url: card.thumbnail_url || card.thumbnailUrl || '',
        preview_url: card.preview_url || card.previewUrl || '',
        rating: card.rating || 98,
        archetype: card.archetype || 'Modern Minimalist',
        primaryColor: card.primaryColor || '#8B5CF6',
        secondaryColor: card.secondaryColor || '#5833EF',
        features: card.features || []
      };

      // Picking a template only updates the client; the planning flow runs when Business Setup is saved
      // 1. Update client in context and the database
      if (targetClient?.id && targetClient.id !== 'new' && updateClient) {
        updateClient(targetClient.id, {
          selected_template: normalizedSelected,
          design_ref_url: normalizedSelected.original_url || normalizedSelected.preview_url,
          branding: {
            primaryColor: normalizedSelected.primaryColor,
            secondaryColor: normalizedSelected.secondaryColor,
            fontFamily: 'Inter',
            style: normalizedSelected.archetype
          }
        });
      }

      // 2. Callback
      if (onConfirmSelection) {
        onConfirmSelection(normalizedSelected);
      }

      toast.success(`Selected "${normalizedSelected.title}" for ${targetClient?.name || 'Client'}. Template and design parameters updated!`);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error confirming template selection:', err);
      toast.error('Failed to apply the template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closePreview = useCallback(() => setPreviewTemplate(null), []);

  const DEVICE_OPTIONS = [
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
    { value: 'mobile', label: 'Mobile', icon: Smartphone },
  ];

  return (
    <div
      className={cx(
        'flex flex-col min-h-0 bg-surface',
        isStandalonePage ? 'rounded-2xl border border-line overflow-hidden' : 'h-full overflow-hidden'
      )}
    >
      {/* 1. Title (when embedded — on its own page the shell header names it) */}
      {(!isStandalonePage || onClose) && (
        <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[17px] leading-6 font-semibold text-ink">Design & template gallery</h2>
            <p className="text-[13px] text-ink-3 mt-0.5">
              Responsive design archetypes with built-in SEO, AEO voice-search schemas and modern animations.
            </p>
          </div>
          {onClose && <IconButton icon={X} label="Close gallery" onClick={onClose} className="-mr-2 -mt-1" />}
        </div>
      )}

      {/* 2. Filters & search */}
      <div className={cx('px-4 sm:px-6 pb-4 border-b border-line-soft space-y-3', isStandalonePage && 'pt-4')}>
        <div className="field flex items-center gap-2 !py-0">
          <Search className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.7} aria-hidden />
          <input
            type="text"
            placeholder="Search by name, industry or tag (e.g. food, saas, b2b, luxury)…"
            aria-label="Search templates"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 h-[42px] bg-transparent outline-none text-sm text-ink placeholder:text-ink-4"
          />
        </div>
        <ChipRow>
          {CATEGORIES.map((cat) => (
            <Chip key={cat} selected={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>
              {cat === 'All' ? 'All categories' : cat}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {/* 3. Templates grid */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 py-5 overflow-y-auto bg-canvas">
        <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-ink-3 mb-4">
          <span className="tabular-nums">
            Showing <span className="font-medium text-ink">{items.length}</span> template{items.length === 1 ? '' : 's'}
          </span>
          {targetClient && (
            <span className="min-w-0 truncate">
              For <span className="font-medium text-ink">{targetClient.name}</span>
            </span>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const isSelected =
                selectedCard?.id === item.id ||
                selectedCard?.slug === item.slug ||
                (targetClient?.selected_template && (targetClient.selected_template.id === item.id || targetClient.selected_template.slug === item.slug));
              const thumb = item.thumbnail_url || item.thumbnailUrl;

              return (
                <motion.div
                  key={item.id || item.slug}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedCard(item)}
                  aria-selected={isSelected}
                  className={cx(
                    'group bg-surface rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-colors duration-150',
                    isSelected ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="h-44 relative overflow-hidden bg-surface-2">
                    <img
                      src={thumb}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Selected mark */}
                    <span
                      className={cx(
                        'absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center border transition-colors',
                        isSelected ? 'bg-accent border-accent text-surface' : 'bg-surface border-line text-transparent'
                      )}
                      aria-hidden
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </span>

                    {/* Quick preview (hover / keyboard focus) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(item);
                      }}
                      className="absolute bottom-3 right-3 h-8 px-2.5 bg-surface text-ink border border-line text-xs font-medium rounded-md flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    >
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <div className="space-y-1 flex-1">
                      <p className="label-mono truncate">{item.industry_category}</p>
                      <h4 className="text-[15px] leading-6 font-semibold text-ink line-clamp-1">{item.title}</h4>
                      <p className="text-[13px] text-ink-3 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="space-y-2">
                      {item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag, idx) => (
                            <Tag key={idx}>#{tag}</Tag>
                          ))}
                        </div>
                      )}
                      {item.archetype && (
                        <div className="flex items-center gap-1.5 text-xs text-ink-3 min-w-0">
                          <Palette className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} aria-hidden />
                          <span className="font-medium text-ink-2 truncate">{item.archetype}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card actions */}
                  <div className="px-3 py-2.5 border-t border-line-soft flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(item);
                      }}
                    >
                      Preview
                    </Button>

                    {isSelected ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCard(item);
                          handleConfirmSelection(item);
                        }}
                        className="inline-flex items-center gap-1.5 h-[33px] px-3 rounded-md text-[13px] font-medium bg-ok-soft text-ok-text border border-ok-edge transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
                        Applied
                      </button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCard(item);
                          handleConfirmSelection(item);
                        }}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No templates match"
            description="Nothing fits this category and search. Pick another category or try a different keyword."
          />
        )}
      </div>

      {/* 4. Selection bar */}
      <div className="px-4 sm:px-6 py-3.5 bg-surface border-t border-line flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {selectedCard ? (
            <>
              <div className="w-12 h-10 rounded-xl bg-surface-2 border border-line overflow-hidden shrink-0">
                <img
                  src={selectedCard.thumbnail_url || selectedCard.thumbnailUrl}
                  alt={selectedCard.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink truncate">{selectedCard.title}</p>
                <p className="text-xs text-ink-3 truncate">
                  {selectedCard.archetype || 'Custom Design'} · ready for build handoff
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-ink-3">
              <MousePointerClick className="w-4 h-4 shrink-0" strokeWidth={1.7} aria-hidden />
              <span>Select a template above to set it as the design reference.</span>
            </div>
          )}
        </div>

        <Button
          icon={CheckCircle2}
          onClick={() => handleConfirmSelection()}
          disabled={!selectedCard}
          loading={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Saving…' : `Apply template for ${targetClient?.name || 'Client'}`}
        </Button>
      </div>

      {/* 5. Device preview */}
      <Modal
        open={!!previewTemplate}
        onClose={closePreview}
        title={previewTemplate?.title}
        description={previewTemplate?.archetype || 'Minimalist'}
        size="xl"
        className="sm:h-[88vh]"
        footer={
          <>
            <Button variant="secondary" onClick={closePreview}>Close</Button>
            <Button
              icon={CheckCircle2}
              onClick={() => {
                setSelectedCard(previewTemplate);
                handleConfirmSelection(previewTemplate);
                setPreviewTemplate(null);
              }}
            >
              Use this template
            </Button>
          </>
        }
      >
        {previewTemplate && (
          <div className="space-y-4">
            <Segmented
              options={DEVICE_OPTIONS}
              value={deviceMode}
              onChange={setDeviceMode}
            />

            <div className="rounded-xl bg-surface-2 p-3 sm:p-5 flex justify-center">
              <div
                className={cx(
                  'w-full bg-surface rounded-2xl border border-line overflow-hidden flex flex-col transition-[max-width] duration-200',
                  deviceMode === 'desktop' ? 'max-w-4xl' : deviceMode === 'tablet' ? 'max-w-[640px]' : 'max-w-[375px]'
                )}
              >
                {/* Browser frame */}
                <div className="h-8 bg-surface-2 border-b border-line-soft px-3 flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5" aria-hidden>
                    <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
                    <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
                    <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
                  </div>
                  <span className="text-xs text-ink-3 truncate max-w-[200px]">{previewTemplate.title}</span>
                  <span className="w-3" />
                </div>

                <div className="p-4 space-y-4">
                  <img
                    src={previewTemplate.screenshot_url || previewTemplate.thumbnail_url}
                    alt={previewTemplate.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto rounded-xl border border-line object-cover"
                  />

                  <div className="p-4 bg-surface-2 rounded-xl space-y-3">
                    <p className="label-mono">Design architecture & built-in features</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                      {previewTemplate.features?.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-ink">
                          <CheckCircle2 className="w-3.5 h-3.5 text-ok shrink-0" strokeWidth={1.7} aria-hidden />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <p className="pt-2 border-t border-line-soft text-xs text-ink-3">
                      <span className="font-medium text-ink-2">Tech stack:</span> React 18, Tailwind CSS, Lucide Icons
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
