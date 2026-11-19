import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button, EmptyState } from '../components/ui/Cards';
import { SectionLabel, Tabs, Tile, Badge, Tag, CardHeader } from '../components/ui/primitives';
import { RefreshCw, FileCode, FileSearch, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SeoAeoGeoManagement() {
  const { clientId } = useParams();
  const { getClient } = useClients();

  const client = getClient(clientId);
  const [activeTab, setActiveTab] = useState('meta'); // 'meta' | 'schema' | 'files'
  const [regenerating, setRegenerating] = useState(false);
  const [schemaPages, setSchemaPages] = useState(() => {
    // Derive from client sitemap, not hardcoded dummy data
    return (client?.sitemap || []).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      keyword: p.keyword,
      status: 'Pending'
    }));
  });

  if (!client) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Client not found"
        description="This client may have been removed. Open it again from the client list."
      />
    );
  }

  const handleRegenerateFiles = () => {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
      toast.success('sitemap.xml and robots.txt files successfully regenerated!');
    }, 1500);
  };

  const hasAeo = client.preferences?.aeo;
  const hasGeo = client.preferences?.geo;

  // Scores come from the latest live-site audit (step 4) only. Before that there is nothing to show — the fixed
  // 94 / 96 / 90 / 92 values are gone (QA M-04).
  const fromReport = (() => {
    let r = client.auditReport || client.audit_report || client.lastAuditReport || null;
    if (typeof r === 'string') { try { r = JSON.parse(r); } catch { r = null; } }
    if (r && typeof r.response === 'string') { try { r = JSON.parse(r.response); } catch { /* keep r */ } }
    const s = r?.scoreSummary || r;
    const scores = s ? { seo: s.seoScore || s.seo_score || null, aeo: s.aeoScore || s.aeo_score || null, geo: s.geoScore || s.geo_score || null } : null;
    return scores && (scores.seo || scores.aeo || scores.geo) ? { scores } : null;
  })();
  const latest = (client.complianceHistory || []).find((h) => h.scores && (h.scores.seo || h.scores.aeo || h.scores.geo)) || fromReport;
  const num = (v) => { const m = String(v ?? '').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
  const measured = latest ? [num(latest.scores.seo), hasAeo ? num(latest.scores.aeo) : null, hasGeo ? num(latest.scores.geo) : null].filter((n) => n != null) : [];
  const overallScore = measured.length ? Math.round(measured.reduce((a, b) => a + b, 0) / measured.length) : null;
  const pct = (v) => (num(v) == null ? '—' : `${num(v)}%`);
  const notYet = 'After the live-site audit';

  const sitemap = client.sitemap || [];
  const domain = client.name.toLowerCase().replace(/\s+/g, '');

  return (
    <div className="space-y-6">

      {/* Scores — from the latest live-site audit; '—' until one has run */}
      <section className="space-y-3">
        <SectionLabel>Optimisation scores</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile label="Overall health" value={overallScore == null ? '—' : `${overallScore}%`} sub={latest ? 'Average of enabled channels' : notYet} />
          <Tile label="SEO score" value={pct(latest?.scores.seo)} sub={latest ? 'Search engines' : notYet} />
          {hasAeo && <Tile label="AEO score" value={pct(latest?.scores.aeo)} sub={latest ? 'Voice and answer engines' : notYet} />}
          {hasGeo && <Tile label="GEO score" value={pct(latest?.scores.geo)} sub={latest ? 'AI citation' : notYet} />}
        </div>
      </section>

      <Tabs
        tabs={[
          { id: 'meta', label: 'Meta tags', count: sitemap.length },
          { id: 'schema', label: 'Schema JSON-LD', count: schemaPages.length },
          { id: 'files', label: 'Sitemap & robots.txt' }
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Meta tag editor */}
      {activeTab === 'meta' && (
        sitemap.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No pages in the sitemap yet"
            description="Meta tags are edited per page. Plan the website structure first and the pages will show here."
          />
        ) : (
          <Card padded={false} className="overflow-hidden animate-fade-in">
            <div className="hidden md:grid grid-cols-[minmax(140px,0.8fr)_1fr_1.4fr_1fr] gap-4 px-4 py-3 bg-surface-2 border-b border-line">
              <span className="label-mono">Page</span>
              <span className="label-mono">Title tag</span>
              <span className="label-mono">Meta description</span>
              <span className="label-mono">Canonical link</span>
            </div>
            <ul className="divide-y divide-line-soft">
              {sitemap.map((page) => (
                <li key={page.id} className="grid grid-cols-1 md:grid-cols-[minmax(140px,0.8fr)_1fr_1.4fr_1fr] gap-3 md:gap-4 px-4 py-4 md:py-3 md:items-start">
                  <p className="text-sm md:text-[13px] font-medium text-ink md:pt-3 break-words">{page.name}</p>
                  <div className="space-y-1.5 min-w-0">
                    <label htmlFor={`title-${page.id}`} className="block text-[13px] font-medium text-ink-3 md:sr-only">Title tag</label>
                    <input
                      id={`title-${page.id}`}
                      type="text"
                      defaultValue={`${page.name} — ${client.name}`}
                      className="field text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <label htmlFor={`desc-${page.id}`} className="block text-[13px] font-medium text-ink-3 md:sr-only">Meta description</label>
                    <textarea
                      id={`desc-${page.id}`}
                      rows={2}
                      defaultValue={`Buy high quality ${page.keyword || 'services'} from ${client.name}. Checked FSSAI/GST facilities, fast shipping across India.`}
                      className="field text-[13px] min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <label htmlFor={`canon-${page.id}`} className="block text-[13px] font-medium text-ink-3 md:sr-only">Canonical link</label>
                    <input
                      id={`canon-${page.id}`}
                      type="text"
                      defaultValue={`https://${client.name.toLowerCase().replace(/\s+/g, '')}.in/${page.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="field text-[13px]"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t border-line flex justify-end">
              <Button icon={Save} onClick={() => toast.success('Meta tags updated successfully!')}>
                Save metadata
              </Button>
            </div>
          </Card>
        )
      )}

      {/* Schema JSON-LD */}
      {activeTab === 'schema' && (
        schemaPages.length === 0 ? (
          <EmptyState
            icon={FileCode}
            title="No schema pages yet"
            description="Each sitemap page gets a JSON-LD schema. Plan the website structure first and they will show here."
          />
        ) : (
          <Card padded={false} className="overflow-hidden animate-fade-in">
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-2 border-b border-line">
                  <tr>
                    <th className="label-mono px-4 py-3 font-normal">Page</th>
                    <th className="label-mono px-4 py-3 font-normal">Schema type</th>
                    <th className="label-mono px-4 py-3 font-normal">Status</th>
                    <th className="label-mono px-4 py-3 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {schemaPages.map((sp, idx) => (
                    <tr key={sp.id} className="hover:bg-hover transition-colors duration-150">
                      <td className="px-4 py-3 font-medium text-ink">{sp.name}</td>
                      <td className="px-4 py-3 text-ink-2 font-mono text-xs">{sp.type}</td>
                      <td className="px-4 py-3"><Badge>{sp.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="secondary" size="sm">
                          Preview JSON
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="sm:hidden divide-y divide-line-soft">
              {schemaPages.map((sp) => (
                <li key={sp.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-ink min-w-0 break-words">{sp.name}</p>
                    <Badge>{sp.status}</Badge>
                  </div>
                  <p className="text-xs text-ink-3 font-mono">{sp.type}</p>
                  <Button variant="secondary" className="w-full">Preview JSON</Button>
                </li>
              ))}
            </ul>
          </Card>
        )
      )}

      {/* Sitemap & robots.txt */}
      {activeTab === 'files' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="space-y-3 min-w-0">
              <CardHeader icon={FileCode} title="sitemap.xml" action={<Tag>Preview</Tag>} />
              <pre className="p-3 bg-surface-2 rounded-xl text-xs leading-5 font-mono text-ink-2 h-52 overflow-auto whitespace-pre">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${client.name.toLowerCase().replace(/\s+/g, '')}.in/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
  ${(client.sitemap || []).filter(p => p.type !== 'Home').map(p => `<url>
    <loc>https://${client.name.toLowerCase().replace(/\s+/g, '')}.in/${p.name.toLowerCase().replace(/\s+/g, '-')}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.80</priority>
  </url>`).join('\n  ')}
</urlset>`}
              </pre>
            </Card>

            <Card className="space-y-3 min-w-0">
              <CardHeader icon={FileCode} title="robots.txt" action={<Tag>Preview</Tag>} />
              <pre className="p-3 bg-surface-2 rounded-xl text-xs leading-5 font-mono text-ink-2 h-52 overflow-auto whitespace-pre">
{`User-agent: *
Allow: /
Sitemap: https://${domain}.in/sitemap.xml

User-agent: Googlebot
Disallow: /admin/
Disallow: /staging/`}
              </pre>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              icon={RefreshCw}
              onClick={handleRegenerateFiles}
              disabled={regenerating}
              loading={regenerating}
            >
              {regenerating ? 'Regenerating files…' : 'Regenerate files'}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
