import React, { useState, useEffect, useCallback } from 'react';
import { useClients } from '../context/ClientContext';
import { Card, Button, StatusPill, EmptyState } from '../components/ui/Cards';
import { Page, PageHeader, Chip, ChipRow, Modal, cx } from '../components/ui/primitives';
import {
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Globe,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getClientCurrentStep } from '../utils/resolveClientName';

const STATUS_FILTERS = ['ALL', 'APPROVED', 'PENDING', 'LIVE'];
// ?status=approved | pending | live (used by the Overview KPIs) → the matching filter
const statusFromParam = (p) => {
  const s = String(p || '').toUpperCase();
  return STATUS_FILTERS.includes(s) ? s : 'ALL';
};

const ROW_ACTION_TONE = {
  ok: 'text-ok-text hover:bg-ok-soft',
  bad: 'text-bad-text hover:bg-bad-soft',
  muted: 'text-ink-3 hover:bg-bad-soft hover:text-bad-text',
  neutral: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
};

/** Icon-only row action: 44 px on phones, 32 px from 640 px; label is the tooltip and the accessible name. */
function RowAction({ icon: Icon, label, onClick, tone = 'neutral' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cx('inline-flex items-center justify-center w-11 h-11 sm:w-8 sm:h-8 rounded-md transition-colors duration-150 shrink-0', ROW_ACTION_TONE[tone])}
    >
      <Icon className="w-4 h-4" strokeWidth={1.7} aria-hidden />
    </button>
  );
}

function StepBadge({ n }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-6 pl-2 pr-2.5 rounded-full bg-accent-soft text-accent-text text-xs font-medium whitespace-nowrap">
      <span className="w-[7px] h-[7px] rounded-full bg-accent" aria-hidden />
      Step {n} of 4
    </span>
  );
}

export default function Clients() {
  const { clients, deleteClient, approveProposal, rejectProposal } = useClients();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => statusFromParam(statusParam));
  const [selectedLogoClient, setSelectedLogoClient] = useState(null);
  const closeLogo = useCallback(() => setSelectedLogoClient(null), []);

  // A KPI link (?status=…) or the sidebar (no param) sets the filter
  useEffect(() => {
    setStatusFilter(statusFromParam(statusParam));
  }, [statusParam]);

  // Pagination state (10 clients per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'APPROVED') return c.proposalStatus === 'Approved' || c.status === 'Approved';
    if (statusFilter === 'LIVE') return !!c.liveUrl || c.status === 'Live';
    if (statusFilter === 'PENDING') return c.proposalStatus !== 'Approved' && c.status !== 'Approved';

    return true;
  });

  // Reset pagination on filter or search term change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Calculate paginated slice
  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const filterTabs = [
    { id: 'ALL', label: 'All clients', count: clients.length },
    { id: 'APPROVED', label: 'Approved', count: clients.filter(c => c.proposalStatus === 'Approved' || c.status === 'Approved').length },
    { id: 'PENDING', label: 'Pending review', count: clients.filter(c => c.proposalStatus !== 'Approved' && c.status !== 'Approved').length },
    { id: 'LIVE', label: 'Live sites', count: clients.filter(c => c.liveUrl || c.status === 'Live').length },
  ];

  const openPipeline = (client) => navigate(`/clients/${client.id}/workflow?step=${getClientCurrentStep(client)}`);

  const handleApprove = (client) => {
    approveProposal(client.id);
    toast.success(`Proposal approved for ${client.name}`);
  };

  const handleReject = (client) => {
    rejectProposal(client.id);
    toast.error(`Proposal rejected for ${client.name}`);
  };

  const handleDelete = (client) => {
    if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
      deleteClient(client.id);
      toast.success(`Client ${client.name} removed`);
    }
  };

  const isPending = (client) => client.proposalStatus !== 'Approved' && client.status !== 'Approved';

  const renderLogo = (client, size = 'w-9 h-9') =>
    client.logoUrl ? (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setSelectedLogoClient(client); }}
        title="View logo"
        aria-label={`View ${client.name} logo`}
        className={cx(size, 'rounded-xl bg-surface border border-line p-1 shrink-0 hover:border-line-strong transition-colors')}
      >
        <img src={client.logoUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
      </button>
    ) : (
      <span className={cx(size, 'rounded-xl bg-surface-2 text-ink-2 flex items-center justify-center text-xs font-medium shrink-0')} aria-hidden>
        {client.name.charAt(0)}
      </span>
    );

  const renderActions = (client) => (
    <div className="inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {/* Quick Approve / Reject for proposals */}
      {isPending(client) && (
        <>
          <RowAction icon={CheckCircle2} label="Approve proposal" tone="ok" onClick={() => handleApprove(client)} />
          <RowAction icon={XCircle} label="Reject proposal" tone="bad" onClick={() => handleReject(client)} />
        </>
      )}
      {/* Delete Client */}
      <RowAction icon={Trash2} label="Delete client" tone="muted" onClick={() => handleDelete(client)} />
      {/* Jump to Pipeline */}
      <RowAction icon={ArrowRight} label="Open pipeline" onClick={() => openPipeline(client)} />
    </div>
  );

  const emptyDescription = searchTerm
    ? `No clients matching "${searchTerm}". Try another search term.`
    : statusFilter !== 'ALL'
      ? 'No clients in this filter yet. Pick another filter or onboard a client.'
      : 'Get started by onboarding your first client.';

  return (
    <Page className="pb-12">
      <PageHeader
        description="Every client, where they are in the 4-step workflow, and their proposal status."
        actions={
          <Button icon={Plus} onClick={() => navigate('/clients/new/workflow')}>
            Onboard new client
          </Button>
        }
      />

      {/* Filters above the list */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <ChipRow className="min-w-0">
          {filterTabs.map(tab => (
            <Chip key={tab.id} count={tab.count} selected={statusFilter === tab.id} onClick={() => setStatusFilter(tab.id)}>
              {tab.label}
            </Chip>
          ))}
        </ChipRow>

        <div className="field flex items-center gap-2 !py-0 md:max-w-xs shrink-0">
          <Search className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.7} aria-hidden />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients…"
            aria-label="Search clients"
            className="flex-1 min-w-0 h-[42px] bg-transparent outline-none text-sm text-ink placeholder:text-ink-4"
          />
        </div>
      </div>

      {paginatedClients.length > 0 ? (
        <Card padded={false} className="overflow-hidden">
          {/* table ≥ 640 px */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-surface-2">
                <tr>
                  <th className="label-mono font-normal px-4 py-2.5">Client</th>
                  <th className="label-mono font-normal px-4 py-2.5 hidden md:table-cell">Location & industry</th>
                  <th className="label-mono font-normal px-4 py-2.5">Workflow stage</th>
                  <th className="label-mono font-normal px-4 py-2.5">Proposal</th>
                  <th className="label-mono font-normal px-4 py-2.5 hidden lg:table-cell">Live site</th>
                  <th className="label-mono font-normal px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {paginatedClients.map((client) => {
                  const currentStepNum = getClientCurrentStep(client);
                  return (
                    <tr
                      key={client.id}
                      onClick={() => navigate(`/clients/${client.id}/workflow?step=${currentStepNum}`)}
                      className="hover:bg-hover cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {renderLogo(client)}
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{client.name}</p>
                            <p className="text-xs text-ink-3 truncate">{client.email || client.phone || 'No direct contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="block text-ink">{client.location || 'Local Business'}</span>
                        <span className="block text-xs text-ink-3">{client.industry || 'Services'}</span>
                      </td>
                      <td className="px-4 py-3"><StepBadge n={currentStepNum} /></td>
                      <td className="px-4 py-3"><StatusPill status={client.proposalStatus || client.status} /></td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {client.liveUrl ? (
                          <a
                            href={client.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-medium text-ink-2 hover:text-ink underline-offset-2 hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden />
                            Visit site
                          </a>
                        ) : (
                          <span className="text-ink-4 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{renderActions(client)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* cards < 640 px */}
          <ul className="sm:hidden divide-y divide-line-soft">
            {paginatedClients.map((client) => {
              const currentStepNum = getClientCurrentStep(client);
              return (
                <li
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}/workflow?step=${currentStepNum}`)}
                  className="px-4 py-3 space-y-2.5 cursor-pointer hover:bg-hover transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {renderLogo(client, 'w-10 h-10')}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{client.name}</p>
                      <p className="text-xs text-ink-3 truncate">{client.location || 'Local Business'} · {client.industry || 'Services'}</p>
                      <p className="text-xs text-ink-3 truncate">{client.email || client.phone || 'No direct contact'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StepBadge n={currentStepNum} />
                    <StatusPill status={client.proposalStatus || client.status} />
                    {client.liveUrl && (
                      <a
                        href={client.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 h-6 text-xs font-medium text-ink-2 hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden />
                        Visit site
                      </a>
                    )}
                  </div>
                  <div className="flex justify-end -mr-2">{renderActions(client)}</div>
                </li>
              );
            })}
          </ul>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-t border-line-soft">
            <span className="text-xs text-ink-3 tabular-nums">
              Showing <span className="font-medium text-ink">{startIndex + 1}</span>–<span className="font-medium text-ink">{endIndex}</span> of <span className="font-medium text-ink">{totalItems}</span> clients
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <span className="text-xs text-ink-3 px-1 tabular-nums">{currentPage} / {totalPages}</span>
              <Button
                variant="secondary"
                size="sm"
                iconRight={ChevronRight}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={emptyDescription}
          action={
            <Button variant="secondary" icon={Plus} onClick={() => navigate('/clients/new/workflow')}>
              Onboard business
            </Button>
          }
        />
      )}

      {/* Logo Modal */}
      <Modal
        open={!!selectedLogoClient}
        onClose={closeLogo}
        title={selectedLogoClient?.name}
        description="Brand logo"
        size="sm"
      >
        {selectedLogoClient && (
          <div className="w-full h-48 bg-surface-2 rounded-xl flex items-center justify-center p-6 overflow-hidden">
            <img
              src={selectedLogoClient.logoUrl}
              alt={selectedLogoClient.name}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </Modal>
    </Page>
  );
}
