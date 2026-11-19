import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useClients } from '../context/ClientContext';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, StatusPill, Button, EmptyState } from '../components/ui/Cards';
import { Page, PageHeader, SectionLabel, CardHeader, Progress, Tag } from '../components/ui/primitives';
import {
  Users,
  FileText,
  Globe,
  Activity,
  Plus,
  ArrowRight,
  Search,
  ChevronRight,
  Clock,
  Hourglass,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getClientCurrentStep } from '../utils/resolveClientName';

// Trend data for client website creation & compliance (sample series — not yet read from client records)
const PIPELINE_TREND_DATA = [
  { month: 'May', started: 2, approved: 1, live: 1 },
  { month: 'Jun', started: 4, approved: 3, live: 2 },
  { month: 'Jul', started: 5, approved: 4, live: 3 },
  { month: 'Aug', started: 7, approved: 5, live: 4 },
  { month: 'Sep', started: 9, approved: 7, live: 6 },
  { month: 'Oct', started: 12, approved: 9, live: 7 },
];

const CHART_SERIES = [
  { key: 'started', name: 'Onboarded', color: 'var(--cat-1)' },
  { key: 'live', name: 'Live websites', color: 'var(--cat-7)' },
];

const AXIS_TICK = { fontSize: 12, fill: 'var(--ink-3)' };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ClientMark({ client, size = 'w-8 h-8' }) {
  if (client.logoUrl) {
    return (
      <img
        src={client.logoUrl}
        alt={client.name}
        referrerPolicy="no-referrer"
        className={`${size} rounded-xl object-contain bg-surface border border-line p-0.5 shrink-0`}
      />
    );
  }
  return (
    <span className={`${size} rounded-xl bg-surface-2 text-ink-2 flex items-center justify-center text-xs font-medium shrink-0`} aria-hidden>
      {client.name.charAt(0)}
    </span>
  );
}

export default function Overview() {
  const { activities, clients } = useClients();
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  const [clientSearch, setClientSearch] = useState('');

  const totalClients = clients.length;
  const approvedProposals = clients.filter(c => c.proposalStatus === 'Approved' || c.status === 'Approved').length;
  const liveSites = clients.filter(c => c.liveUrl || c.status === 'Live').length;
  const pendingProposals = clients.filter(c => c.proposalStatus !== 'Approved' && c.status !== 'Approved').length;
  // Clients that have reached step 3 (Pucho Code master prompt) or beyond
  const promptedClients = clients.filter(c => getClientCurrentStep(c) >= 3).length;

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.location.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.industry.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const steps = [
    { n: 1, label: 'Client requirements', value: totalClients, word: 'captured' },
    { n: 2, label: 'Strategy proposal PDF', value: approvedProposals, word: 'approved' },
    { n: 3, label: 'Pucho Code master prompt', value: promptedClients, word: 'reached' },
    { n: 4, label: 'Live compliance audit', value: liveSites, word: 'live and audited' },
  ];

  const firstName = (user?.name || '').trim().split(/\s+/)[0];

  return (
    <Page className="pb-10">
      <PageHeader
        title={
          <span className="font-serif font-medium">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </span>
        }
        description="Client website delivery: requirements, strategy proposals, Pucho Code master prompts and post-deploy compliance audits."
        actions={
          <Button onClick={() => navigate('/clients/new/workflow')} icon={Plus}>
            Onboard new client
          </Button>
        }
      />

      {/* KPIs — each opens the client list behind it */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} label="Managed clients" value={totalClients} onClick={() => navigate('/clients')} />
        <StatCard icon={FileText} label="Approved proposals" value={approvedProposals} sub={`of ${totalClients} clients`} onClick={() => navigate('/clients?status=approved')} />
        <StatCard icon={Hourglass} label="Pending proposals" value={pendingProposals} sub="Awaiting approval" onClick={() => navigate('/clients?status=pending')} />
        <StatCard icon={Globe} label="Live websites" value={liveSites} sub={`of ${totalClients} clients`} onClick={() => navigate('/clients?status=live')} />
      </div>

      {/* Trend + workflow-step distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 flex flex-col gap-4 min-w-0">
          <CardHeader
            title="Pipeline throughput"
            description="Clients onboarded and websites gone live, by month"
            action={<Tag>Sample data</Tag>}
          />
          <div className="flex items-center gap-4 text-xs text-ink-3">
            {CHART_SERIES.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                {s.name}
              </span>
            ))}
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PIPELINE_TREND_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: 'var(--line-strong)' }}
                  contentStyle={{
                    background: 'var(--surface)',
                    borderRadius: 12,
                    border: '1px solid var(--line)',
                    boxShadow: 'var(--float-shadow)',
                    fontSize: 12,
                    fontFamily: 'var(--font-sans)',
                  }}
                  labelStyle={{ color: 'var(--ink)', fontWeight: 500 }}
                  itemStyle={{ color: 'var(--ink-2)' }}
                />
                {CHART_SERIES.map((s) => (
                  <Area isAnimationActive={false}
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    fill={s.color}
                    fillOpacity={0.1}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 min-w-0">
          <CardHeader title="Website creation steps" description="Clients through each of the 4 workflow steps" />
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.n} className="space-y-1.5">
                <div className="flex items-end justify-between gap-3 text-[13px]">
                  <span className="text-ink min-w-0">
                    <span className="block text-xs text-ink-3">Step {s.n} of 4</span>
                    <span className="block truncate">{s.label}</span>
                  </span>
                  <span className="text-xs text-ink-3 tabular-nums shrink-0">
                    <span className="text-ink font-medium">{s.value}</span>/{totalClients} {s.word}
                  </span>
                </div>
                <Progress value={s.value} max={totalClients || 1} tone="accent" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Client workspaces + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3 min-w-0">
          <SectionLabel
            count={totalClients}
            right={
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink transition-colors min-h-11 sm:min-h-0"
              >
                All clients <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.7} />
              </button>
            }
          >
            Client workspaces
          </SectionLabel>

          <Card padded={false} className="overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-line-soft">
              <div className="field flex items-center gap-2 !py-0 sm:max-w-xs">
                <Search className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.7} aria-hidden />
                <input
                  type="text"
                  placeholder="Search clients…"
                  aria-label="Search clients"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="flex-1 min-w-0 h-[42px] bg-transparent outline-none text-sm text-ink placeholder:text-ink-4"
                />
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-ink-3">
                No clients match “{clientSearch}”. Try a name, city or industry.
              </p>
            ) : (
              <>
                {/* table ≥ 640 px */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-surface-2">
                      <tr>
                        <th className="label-mono font-normal px-4 py-2.5">Client</th>
                        <th className="label-mono font-normal px-4 py-2.5">Location & industry</th>
                        <th className="label-mono font-normal px-4 py-2.5">Status</th>
                        <th className="label-mono font-normal px-4 py-2.5 text-right">Step</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {filteredClients.map((c) => {
                        const stepNum = getClientCurrentStep(c);
                        return (
                          <tr
                            key={c.id}
                            onClick={() => navigate(`/clients/${c.id}/workflow?step=${stepNum}`)}
                            className="hover:bg-hover cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <ClientMark client={c} />
                                <span className="font-medium text-ink truncate">{c.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="block text-ink">{c.location}</span>
                              <span className="block text-xs text-ink-3">{c.industry}</span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={c.proposalStatus || c.status} />
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-text">
                                Step {stepNum} of 4 <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.7} />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* cards < 640 px */}
                <ul className="sm:hidden divide-y divide-line-soft">
                  {filteredClients.map((c) => {
                    const stepNum = getClientCurrentStep(c);
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/clients/${c.id}/workflow?step=${stepNum}`)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-hover transition-colors"
                        >
                          <ClientMark client={c} size="w-10 h-10" />
                          <span className="min-w-0 flex-1 space-y-1">
                            <span className="block text-sm font-medium text-ink truncate">{c.name}</span>
                            <span className="block text-xs text-ink-3 truncate">{c.location} · {c.industry}</span>
                            <span className="flex items-center gap-2 flex-wrap">
                              <StatusPill status={c.proposalStatus || c.status} />
                              <span className="text-xs font-medium text-accent-text">Step {stepNum} of 4</span>
                            </span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.7} aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div className="px-4 py-3 border-t border-line-soft text-xs text-ink-3 tabular-nums">
              Showing {filteredClients.length} of {totalClients} clients
            </div>
          </Card>
        </div>

        <div className="space-y-3 min-w-0">
          <SectionLabel>Recent activity</SectionLabel>
          {activities.length > 0 ? (
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-line-soft max-h-[420px] overflow-y-auto">
                {activities.map((act) => (
                  <li key={act.id} className="px-4 py-3 flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-surface-2 text-ink-3 flex items-center justify-center shrink-0" aria-hidden>
                      <Activity className="w-4 h-4" strokeWidth={1.7} />
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-medium text-ink truncate">{act.client_name || act.clientName || 'System'}</span>
                        <span className="text-xs text-ink-3 shrink-0">{act.created_at ? formatDistanceToNow(new Date(act.created_at), { addSuffix: true }) : (act.timestamp || 'Just now')}</span>
                      </div>
                      <p className="text-[13px] text-ink-2 leading-snug">{act.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <EmptyState
              icon={Clock}
              title="No activity yet"
              description="Workflow steps you run for a client are logged here."
            />
          )}
        </div>
      </div>
    </Page>
  );
}
