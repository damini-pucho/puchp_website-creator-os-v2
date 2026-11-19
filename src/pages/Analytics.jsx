import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, StatCard, EmptyState } from '../components/ui/Cards';
import { SectionLabel, CardHeader, Badge, Chip, ChipRow, fmtNum } from '../components/ui/primitives';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { LineChart, BarChart2, Globe, Search, MousePointerClick, Eye, Inbox } from 'lucide-react';
import { toast } from 'sonner';

// Compact Indian formatting: 42,400 → "42.4K", 12,40,000 → "12.4L", 1,20,00,000 → "1.2Cr"
const fmtCompact = (n) => {
  const v = Number(n);
  if (n == null || n === '' || Number.isNaN(v)) return n ?? '—';
  const abs = Math.abs(v);
  if (abs >= 1e7) return `${(v / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 1 })}Cr`;
  if (abs >= 1e5) return `${(v / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
  if (abs >= 1e4) return `${(v / 1e3).toLocaleString('en-IN', { maximumFractionDigits: 1 })}K`;
  return v.toLocaleString('en-IN');
};
const numOf = (x) => Number(String(x ?? '').replace(/[^0-9.-]/g, '')) || 0;
const fmtCell = (x) => (x == null || x === '' || Number.isNaN(Number(x)) ? (x ?? '—') : fmtNum(x));

const AXIS_TICK = { fontSize: 12, fill: 'var(--ink-3)' };
const TOOLTIP = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: 'var(--float-shadow)', fontSize: 12, color: 'var(--ink)' },
  labelStyle: { color: 'var(--ink-3)' },
  itemStyle: { color: 'var(--ink)' },
};

export default function Analytics() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { analyticsTraffic, queries } = useData();
  const queriesRef = useRef(null);
  const [querySort, setQuerySort] = useState(null); // null | 'clicks' | 'impressions'

  // Connection states — nothing is connected until a real Google sign-in exists (QA M-04: they used to start as
  // 'Connected' with no login at all)
  const [gscConnected, setGscConnected] = useState(false);
  const [gbpConnected, setGbpConnected] = useState(false);
  const [gaConnected, setGaConnected] = useState(false);

  const handleConnect = (serviceName, state, setter) => {
    if (state) {
      setter(false);
      toast.error(`Disconnected from ${serviceName}.`);
    } else {
      // There is no Google OAuth connection in this app yet: say so instead of pretending to connect
      toast.info(`${serviceName} cannot be connected yet: the Google sign-in for this workspace is not set up.`);
    }
  };

  const services = [
    { key: 'gsc', label: 'Search Console', name: 'Google Search Console', icon: Search, connected: gscConnected, setter: setGscConnected },
    { key: 'gbp', label: 'Business Profile', name: 'Google Business Profile', icon: Globe, connected: gbpConnected, setter: setGbpConnected },
    { key: 'ga', label: 'Analytics (GA4)', name: 'Google Analytics 4', icon: BarChart2, connected: gaConnected, setter: setGaConnected },
  ];

  // No figures until Google reports them (the hard-coded 42,400 / 4,810 / 184 samples are gone — QA M-04)
  const kpi = { impressions: null, clicks: null, conversions: null };
  const fmtKpi = (n) => (n == null ? '—' : n.toLocaleString('en-IN'));

  const sortedQueries = querySort
    ? [...queries].sort((a, b) => numOf(b[querySort]) - numOf(a[querySort]))
    : queries;

  const showQueriesBy = (key) => {
    setQuerySort((s) => (s === key ? null : key));
    queriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">

      {/* Google integrations */}
      <Card className="space-y-4">
        <CardHeader title="Google services" description="Connect the client's accounts to fetch performance reports." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="p-3 bg-surface-2 rounded-xl flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-surface text-ink-2 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={1.7} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">{s.label}</p>
                    <Badge tone={s.connected ? 'ok' : 'neutral'} className="mt-1 !pl-0">{s.connected ? 'Connected' : 'Not connected'}</Badge>
                  </div>
                </div>
                <Button
                  variant={s.connected ? 'ghost' : 'secondary'}
                  size="sm"
                  onClick={() => handleConnect(s.name, s.connected, s.setter)}
                >
                  {s.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Dashboard (only when at least one data source is connected) */}
      {(gscConnected || gaConnected) ? (
        <div className="space-y-6 animate-fade-in">

          <section className="space-y-3">
            <SectionLabel right={<span className="text-xs text-ink-3">Waiting for the first report from Google</span>}>Key metrics</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={Eye}
                label="Search impressions"
                value={fmtKpi(kpi.impressions)}
                sub="Sorts the query list"
                onClick={() => showQueriesBy('impressions')}
                active={querySort === 'impressions'}
              />
              <StatCard
                icon={MousePointerClick}
                label="Organic clicks"
                value={fmtKpi(kpi.clicks)}
                sub="Sorts the query list"
                onClick={() => showQueriesBy('clicks')}
                active={querySort === 'clicks'}
              />
              <StatCard
                icon={Inbox}
                label="Form leads"
                value={fmtKpi(kpi.conversions)}
                sub="Opens the leads inbox"
                onClick={() => navigate(`/clients/${clientId}/leads`)}
              />
            </div>
          </section>

          {/* Traffic trend */}
          <Card className="space-y-4">
            <CardHeader
              title="Organic traffic trend"
              action={gaConnected ? <Badge tone="ok">GA4 connected</Badge> : <Badge tone="neutral">GA4 not connected</Badge>}
            />
            {analyticsTraffic.length === 0 ? (
              <div className="h-60 rounded-xl bg-surface-2 flex flex-col items-center justify-center text-center px-6 gap-1">
                <p className="text-sm font-medium text-ink-2">No traffic data yet</p>
                <p className="text-xs text-ink-3 max-w-sm">The trend appears once GA4 reports visits for this site.</p>
              </div>
            ) : (
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsTraffic} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
                    <Tooltip {...TOOLTIP} formatter={(v) => [fmtNum(v), 'Visits']} cursor={{ stroke: 'var(--line-strong)' }} />
                    <Area isAnimationActive={false} type="monotone" dataKey="value" stroke="var(--cat-1)" strokeWidth={2} fill="var(--cat-1)" fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Top search queries */}
          <section ref={queriesRef} className="space-y-3 scroll-mt-20">
            <SectionLabel count={queries.length}>Top search queries</SectionLabel>
            {queries.length > 0 && (
              <ChipRow>
                <Chip selected={querySort === null} onClick={() => setQuerySort(null)}>Default order</Chip>
                <Chip selected={querySort === 'clicks'} onClick={() => setQuerySort('clicks')}>Most clicks</Chip>
                <Chip selected={querySort === 'impressions'} onClick={() => setQuerySort('impressions')}>Most impressions</Chip>
              </ChipRow>
            )}

            {queries.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No search queries yet"
                description="Queries appear once Search Console reports clicks and impressions for this site."
              />
            ) : (
              <Card padded={false} className="overflow-hidden">
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-surface-2 border-b border-line">
                      <tr>
                        <th className="label-mono px-4 py-3 font-normal">Search query</th>
                        <th className="label-mono px-4 py-3 font-normal text-right">Clicks</th>
                        <th className="label-mono px-4 py-3 font-normal text-right">Impressions</th>
                        <th className="label-mono px-4 py-3 font-normal text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {sortedQueries.map((q, idx) => (
                        <tr key={idx} className="hover:bg-hover transition-colors duration-150">
                          <td className="px-4 py-3 font-medium text-ink">{q.query}</td>
                          <td className="px-4 py-3 text-ink tabular-nums text-right">{fmtCell(q.clicks)}</td>
                          <td className="px-4 py-3 text-ink-2 tabular-nums text-right">{fmtCell(q.impressions)}</td>
                          <td className="px-4 py-3 text-ink-2 tabular-nums text-right">{q.ctr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="sm:hidden divide-y divide-line-soft">
                  {sortedQueries.map((q, idx) => (
                    <li key={idx} className="p-4 space-y-1.5">
                      <p className="text-sm font-medium text-ink break-words">{q.query}</p>
                      <p className="text-xs text-ink-3 tabular-nums">
                        {fmtCell(q.clicks)} clicks · {fmtCell(q.impressions)} impressions · CTR {q.ctr}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>

        </div>
      ) : (
        <EmptyState
          icon={LineChart}
          title="Analytics is offline"
          description="Connect Google Search Console or Google Analytics (GA4) above to see performance charts."
        />
      )}

    </div>
  );
}
