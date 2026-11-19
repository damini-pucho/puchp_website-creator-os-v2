import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button, EmptyState } from '../components/ui/Cards';
import { SectionLabel, CardHeader, Field, TextArea, TextInput, Tag, Chip, ChipRow, cx } from '../components/ui/primitives';
import { Layout, Link2, FileHeart, Network } from 'lucide-react';
import { toast } from 'sonner';

export default function PagePlanning() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { getClient, updatePagePlan, generateProposal } = useClients();

  const client = getClient(clientId);
  const [activePageId, setActivePageId] = useState('');

  // Set default active page
  useEffect(() => {
    if (client && client.sitemap && client.sitemap.length > 0) {
      setActivePageId(client.sitemap[0].id);
    }
  }, [clientId, client]);

  if (!client || !client.sitemap || client.sitemap.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title="No sitemap yet"
        description="Page plans are written per sitemap page. Build the website structure first, then come back to plan each page."
        action={
          <Button onClick={() => navigate(`/clients/${clientId}/structure`)}>
            Generate sitemap structure
          </Button>
        }
      />
    );
  }

  const activePage = client.sitemap.find(p => p.id === activePageId) || client.sitemap[0];
  const activePlan = client.pagePlans?.[activePage?.id] || {
    seo: '', aeo: '', geo: '', outline: '', linking: ''
  };

  const handleFieldChange = (field, value) => {
    updatePagePlan(clientId, activePage.id, field, value);
  };

  const handleGenerateProposal = () => {
    generateProposal(clientId);
    toast.success('Generated Client Proposal PDF successfully!');
    setTimeout(() => {
      navigate(`/clients/${clientId}/proposal`);
    }, 300);
  };

  const hasAeo = client.preferences?.aeo;
  const hasGeo = client.preferences?.geo;
  const pages = Array.isArray(client.sitemap) ? client.sitemap : [];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 items-start">
        {/* Pages list */}
        <div className="md:col-span-1 space-y-2 min-w-0">
          <SectionLabel count={pages.length} className="px-1">Pages</SectionLabel>

          {/* Phones: sideways chip row */}
          <ChipRow className="md:hidden">
            {pages.map((page) => (
              <Chip key={page.id} selected={page.id === activePageId} onClick={() => setActivePageId(page.id)}>
                {page.name}
              </Chip>
            ))}
          </ChipRow>

          {/* Desktop: list */}
          <Card padded={false} className="hidden md:block p-1.5 max-h-[450px] overflow-y-auto">
            <ul className="space-y-0.5">
              {pages.map((page) => {
                const isActive = page.id === activePageId;
                return (
                  <li key={page.id}>
                    <button
                      type="button"
                      onClick={() => setActivePageId(page.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cx(
                        'w-full text-left px-3 py-2 rounded-xl flex flex-col min-w-0 transition-colors duration-150',
                        isActive ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:bg-hover hover:text-ink'
                      )}
                    >
                      <span className={cx('text-[13px] truncate', isActive && 'font-medium')}>{page.name}</span>
                      <span className="text-xs text-ink-3 truncate mt-0.5">{page.type}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* Page plan editor */}
        <div className="md:col-span-3 min-w-0">
          <Card className="flex flex-col gap-5 md:min-h-[450px]">
            <CardHeader
              icon={Layout}
              title={
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <span>{activePage?.name}</span>
                  <Tag>{activePage?.type}</Tag>
                </span>
              }
              description={
                <>Target keyword: <span className="font-medium text-ink-2">{activePage?.keyword}</span></>
              }
              className="pb-4 border-b border-line"
            />

            {/* Editable fields */}
            <div className="space-y-4">
              {/* SEO angle - always shown */}
              <Field label="SEO target angle" htmlFor="plan-seo">
                <TextArea
                  id="plan-seo"
                  rows={3}
                  value={activePlan.seo}
                  onChange={e => handleFieldChange('seo', e.target.value)}
                  placeholder="Target page description, keywords inclusion triggers, canonical links outline..."
                />
              </Field>

              {/* AEO angle - conditionally shown */}
              {hasAeo && (
                <Field
                  label="AEO targeting (answer engines)"
                  htmlFor="plan-aeo"
                  hint="Structured FAQs and voice snippets targeting Alexa/Siri/Google Home requests."
                  className="animate-fade-in"
                >
                  <TextArea
                    id="plan-aeo"
                    rows={3}
                    value={activePlan.aeo}
                    onChange={e => handleFieldChange('aeo', e.target.value)}
                    placeholder="Provide structured Q&A mappings. E.g., Q: Where is bulk cardamom imported? A: Wayanad..."
                  />
                </Field>
              )}

              {/* GEO angle - conditionally shown */}
              {hasGeo && (
                <Field
                  label="GEO targeting (generative LLM search)"
                  htmlFor="plan-geo"
                  hint="Entity mapping rules to optimize recommendations in ChatGPT/Gemini outputs."
                  className="animate-fade-in"
                >
                  <TextArea
                    id="plan-geo"
                    rows={3}
                    value={activePlan.geo}
                    onChange={e => handleFieldChange('geo', e.target.value)}
                    placeholder="Incorporate citation signals, schema links, and structured entity attributes key-value pairs..."
                  />
                </Field>
              )}

              {/* Content outline */}
              <Field label="Content sections outline" htmlFor="plan-outline">
                <TextArea
                  id="plan-outline"
                  rows={5}
                  value={activePlan.outline}
                  onChange={e => handleFieldChange('outline', e.target.value)}
                  placeholder="Define H1, H2, H3 headings and paragraph summaries (e.g. 1. Header Hero, 2. Trust Seals...)"
                />
              </Field>

              {/* Internal linking plan */}
              <Field
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden />
                    <span>Internal linking strategy</span>
                  </span>
                }
                htmlFor="plan-linking"
              >
                <TextInput
                  id="plan-linking"
                  type="text"
                  value={activePlan.linking}
                  onChange={e => handleFieldChange('linking', e.target.value)}
                  placeholder="e.g. Links to Product-Page-1, links from Home"
                />
              </Field>
            </div>
          </Card>
        </div>
      </div>

      {/* Action footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-xs text-ink-3">Page outlines save automatically in the workspace.</span>
        <Button
          icon={FileHeart}
          onClick={handleGenerateProposal}
        >
          Generate client proposal
        </Button>
      </div>
    </div>
  );
}
