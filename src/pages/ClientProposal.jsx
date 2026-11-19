import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button, StatusPill } from '../components/ui/Cards';
import { CardHeader, Callout, Segmented, SectionLabel, Modal, Tag, cx } from '../components/ui/primitives';
import {
  CheckCircle, FileText, Sparkles, Loader2, Eye, ExternalLink, ArrowRight, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../utils/db';

// "JVBERi0…" or "data:application/pdf;base64,JVBERi0…" → Blob
const base64ToBlob = (b64, type) => {
  const bytes = atob(String(b64).replace(/^data:[^,]*,/, ''));
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type });
};

// A link styled as the DS secondary button (Button renders a <button>, these open a URL)
const LINK_SECONDARY_SM = 'inline-flex items-center justify-center gap-1.5 h-[33px] px-3 rounded-md text-[13px] font-medium whitespace-nowrap bg-surface text-ink border border-line-strong hover:bg-surface-2 transition-colors duration-150 shrink-0';
const LINK_SECONDARY_MD = 'inline-flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl text-sm font-medium whitespace-nowrap bg-surface text-ink border border-line-strong hover:bg-surface-2 transition-colors duration-150';

// Client mark: the stored logo (no referrer leaves the app) or the initial on a neutral disc
function ClientMark({ client, className = 'w-11 h-11', textClass = 'text-sm' }) {
  if (client.logoUrl) {
    return (
      <img
        src={client.logoUrl}
        alt={client.name}
        referrerPolicy="no-referrer"
        className={cx('rounded-xl object-contain bg-surface border border-line p-1 shrink-0', className)}
      />
    );
  }
  return (
    <span className={cx('rounded-xl bg-surface-2 border border-line text-ink-2 font-semibold flex items-center justify-center shrink-0', className, textClass)} aria-hidden>
      {client.name.charAt(0)}
    </span>
  );
}

// The public share page has no app shell: a calm, centred document column on the canvas
function PublicFrame({ isPublicShare, children }) {
  if (!isPublicShare) return children;
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="w-full max-w-[880px] mx-auto px-4 sm:px-6 py-6 sm:py-10">{children}</div>
    </div>
  );
}

export default function ClientProposal({ onNextStep, isPublicShare = false }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, getClient, approveProposal, loading } = useClients();

  const client = getClient(clientId) || (clients && clients.length > 0 ? clients[0] : null);

  // PDF blob state
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMissing, setPdfMissing] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const closeLogoModal = useCallback(() => setShowLogoModal(false), []);

  // Default View Mode set to 'pdf' as requested
  const [viewMode, setViewMode] = useState('pdf');

  const statusClean = String(client?.status || '').toLowerCase().trim();
  const propStatusClean = String(client?.proposalStatus || client?.proposal_status || '').toLowerCase().trim();
  const isApproved = client?.user_approved === true ||
    statusClean === 'approve' || statusClean === 'approved' || statusClean === 'live' || statusClean === 'proposal_approved' ||
    propStatusClean === 'approve' || propStatusClean === 'approved' || propStatusClean === 'live' || propStatusClean === 'proposal_approved';

  // Load the proposal PDF: the permanent copy in proposal_files first, then the stored link
  // (older records: an inline data: URL, or a Studio link that may have expired)
  useEffect(() => {
    if (!client?.id) return;
    let cancelled = false;
    let objectUrl = null;

    const load = async () => {
      setPdfLoading(true);
      try {
        let blob = null;
        const { data } = await db.from('proposal_files').select('data_base64, content_type').eq('client_id', client.id).maybeSingle();
        if (data?.data_base64) {
          blob = base64ToBlob(data.data_base64, data.content_type || 'application/pdf');
        } else if (client.proposalDocUrl) {
          const res = await fetch(client.proposalDocUrl);
          const type = res.headers.get('content-type') || '';
          if (res.ok && (type.includes('pdf') || type.includes('octet-stream'))) blob = new Blob([await res.blob()], { type: 'application/pdf' });
        }
        if (cancelled) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(objectUrl);
          setPdfMissing(false);
        } else {
          setPdfBlobUrl(null);
          setPdfMissing(Boolean(client.proposalDocUrl));
        }
      } catch (err) {
        console.error('Failed to load proposal PDF:', err);
        if (!cancelled) { setPdfBlobUrl(null); setPdfMissing(true); }
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [client?.id, client?.proposalDocUrl]);

  if (!client) {
    return (
      <PublicFrame isPublicShare={isPublicShare}>
        <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-ink-3" strokeWidth={1.7} aria-hidden />
          <p className="text-sm text-ink-3" role="status">Loading the proposal…</p>
        </Card>
      </PublicFrame>
    );
  }

  // Content Data
  const proposalTitle = `Website Creator OS Strategy Proposal — ${client.name}`;
  const executiveSummary = client.additionalInfo ||
    `Executive digital strategy & website development proposal for ${client.name}, located in ${client.location || 'India'}. Designed for high-converting user experience, search visibility (SEO/AEO/GEO), and mobile performance.`;

  // Safely parse services if string or array
  let servicesArr = client?.services;
  if (typeof servicesArr === 'string') {
    try { servicesArr = JSON.parse(servicesArr); } catch { servicesArr = []; }
  }

  const scopeItems = Array.isArray(servicesArr) && servicesArr.length > 0
    ? servicesArr.map((s, i) => ({
        id: `s-${i}`,
        name: typeof s === 'string' ? s : s?.name || `Service ${i + 1}`,
        desc: typeof s === 'object' ? s?.desc || 'Comprehensive execution and quality check.' : 'Comprehensive execution and quality check.'
      }))
    : [
        { id: 's-1', name: 'Custom Website Design & Development', desc: 'Modern responsive design tailored to brand guidelines.' },
        { id: 's-2', name: 'Search Engine Optimization (SEO)', desc: 'Targeting priority seed keywords for Google ranking.' },
        { id: 's-3', name: 'Answer & AI Engine Optimization (AEO/GEO)', desc: 'Voice snippets and LLM citation structured data.' },
        { id: 's-4', name: 'Lead Generation & RFQ Forms', desc: 'High-converting quotation forms with instant notifications.' }
      ];

  let pricingArr = client?.pricingTable;
  if (typeof pricingArr === 'string') {
    try { pricingArr = JSON.parse(pricingArr); } catch { pricingArr = []; }
  }

  const pricingTable = Array.isArray(pricingArr) && pricingArr.length > 0
    ? pricingArr
    : [
        { id: 'p-1', item: 'Custom Design & Development (5 Page Suite)', price: '₹45,000' },
        { id: 'p-2', item: 'SEO, AEO & GEO Optimization Package', price: '₹15,000' },
        { id: 'p-3', item: 'Cloud Hosting, SSL & Domain Setup', price: '₹5,000' }
      ];

  const customNotes = client.customNotes ||
    'Special Terms: All design deliverables are responsive and verified. 50% advance upon approval, 50% upon final deployment.';

  const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeoeMlVMTquIR6J2RHF2z1MijZp70qNppO_EyuMBDdK6CIsgg/viewform?usp=header';

  const plannedPages = Array.isArray(client.sitemap) ? client.sitemap.length : 0;

  return (
    <PublicFrame isPublicShare={isPublicShare}>
    <div className={cx('space-y-5 sm:space-y-6 font-sans mx-auto pb-12', isPublicShare ? 'w-full' : 'max-w-6xl')}>

      {/* Public page: a small client header (the shell header is not there) */}
      {isPublicShare && (
        <header className="flex items-center justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-3 min-w-0">
            <ClientMark client={client} className="w-10 h-10" />
            <div className="min-w-0">
              <p className="label-mono">Strategy proposal</p>
              <h1 className="text-[17px] leading-6 font-semibold text-ink truncate">{client.name}</h1>
            </div>
          </div>
          <StatusPill status={isApproved ? 'Approved' : 'Pending approval'} />
        </header>
      )}

      {/* Toolbar: step context + view switch (app chrome, not printed) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print" data-print-hide>
        <div className="min-w-0">
          <p className="label-mono">{isPublicShare ? 'Proposal document' : 'Step 2 · Strategy proposal'}</p>
          <p className="text-[13px] text-ink-3 mt-0.5">Review the strategy blueprint document.</p>
        </div>
        <Segmented
          value={viewMode}
          onChange={setViewMode}
          className="self-start sm:self-auto"
          options={[
            { value: 'doc', label: 'Strategy document', icon: FileText },
            { value: 'pdf', label: 'PDF', icon: Eye, ariaLabel: 'Compiled PDF viewer' },
          ]}
        />
      </div>

      {/* Main Grid Workspace */}
      <div className={cx('grid grid-cols-1 gap-5 sm:gap-6 items-start', !isPublicShare && 'lg:grid-cols-3')}>
        {/* Document or PDF viewer */}
        <div className={cx('space-y-4 min-w-0', !isPublicShare && 'lg:col-span-2')}>
          {viewMode === 'doc' ? (
            /* CLEAN STRATEGY PROPOSAL DOCUMENT (READ-ONLY FORMAT) */
            <article
              id="printable-proposal-doc"
              className="bg-surface border border-line rounded-2xl p-5 sm:p-8 space-y-6 text-ink overflow-x-hidden"
            >
              {/* Document header with logo */}
              <div className="border-b border-line pb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="label-mono">Website Creator OS · Client proposal</p>
                  <h2 className="text-[17px] sm:text-[22px] leading-snug font-semibold text-ink mt-1.5">
                    {proposalTitle}
                  </h2>
                  <p className="text-xs text-ink-3 mt-1.5 tabular-nums">
                    Date: {new Date().toLocaleDateString()} · Proposal ID: PROP-{client.id.substring(0, 6)}
                  </p>
                </div>
                <ClientMark client={client} className="w-14 h-14 sm:w-16 sm:h-16 p-2" textClass="text-xl" />
              </div>

              {/* Client info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-2 p-4 rounded-xl text-[13px]">
                <div className="min-w-0">
                  <p className="label-mono">Prepared for</p>
                  <p className="font-semibold text-ink text-sm mt-1">{client.name}</p>
                  <p className="text-ink-2">{client.location} | {client.industry}</p>
                  <p className="text-ink-3 mt-0.5 break-all">{client.email} | {client.mobile}</p>
                </div>
                <div className="min-w-0">
                  <p className="label-mono">Prepared by</p>
                  <p className="font-semibold text-ink text-sm mt-1">Pucho AI Studio</p>
                  <p className="text-ink-2">Channel Partner: Arjun Khanna</p>
                  <p className="text-ink-3 mt-0.5">Status: {client.proposalStatus || 'Active'}</p>
                </div>
              </div>

              {/* Executive Summary */}
              <section className="space-y-2">
                <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-ink-3" strokeWidth={1.7} aria-hidden /> Executive summary & strategy overview
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">{executiveSummary}</p>
              </section>

              {/* Scope of Work & Deliverables */}
              <section className="space-y-3 border-t border-line-soft pt-5">
                <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-ink-3" strokeWidth={1.7} aria-hidden /> Scope of work & blueprint deliverables
                </h3>
                <ul className="space-y-2">
                  {scopeItems.map((item) => (
                    <li key={item.id} className="p-3 bg-surface-2 rounded-xl space-y-0.5">
                      <p className="font-medium text-sm text-ink">{item.name}</p>
                      <p className="text-[13px] text-ink-2 leading-relaxed">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Commercial Pricing Table */}
              <section className="space-y-3 border-t border-line-soft pt-5">
                <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ink-3" strokeWidth={1.7} aria-hidden /> Commercial investment & pricing schedule
                </h3>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-left text-[13px] border-collapse">
                    <thead>
                      <tr className="bg-surface-2 border-b border-line">
                        <th className="label-mono font-normal px-3 py-2.5">Deliverable item</th>
                        <th className="label-mono font-normal px-3 py-2.5 w-28 sm:w-36 text-right">Investment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {pricingTable.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-3 text-ink">{p.item}</td>
                          <td className="px-3 py-3 text-right font-medium text-ink tabular-nums whitespace-nowrap">{p.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Custom Notes & Special Terms */}
              <section className="space-y-2 border-t border-line-soft pt-5">
                <h3 className="text-[15px] font-semibold text-ink">Custom notes & terms</h3>
                <p className="p-3 bg-surface-2 rounded-xl text-[13px] text-ink-2 leading-relaxed">{customNotes}</p>
              </section>

              {/* Signature Block */}
              <div className="border-t border-line pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-[13px]">
                <div className="space-y-0.5">
                  <p className="font-medium text-ink">Authorized signatory — Pucho AI Studio</p>
                  <p className="text-xs text-ink-3">Arjun Khanna | Channel Partner</p>
                </div>
                <div className="space-y-0.5 sm:text-right">
                  <p className="font-medium text-ink">Client acceptance signature</p>
                  <p className="text-xs text-ink-3">For {client.name}</p>
                </div>
              </div>
            </article>
          ) : (
            /* COMPILED PDF VIEWER */
            <Card padded={false} className="p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 min-h-[33px]">
                <span className="text-[13px] font-medium text-ink-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ink-3" strokeWidth={1.7} aria-hidden />
                  A4 PDF blueprint
                </span>
                {pdfBlobUrl && (
                  <a href={pdfBlobUrl} target="_blank" rel="noopener noreferrer" className={LINK_SECONDARY_SM} data-print-hide>
                    Open full screen
                    <ExternalLink className="w-4 h-4" strokeWidth={1.7} aria-hidden />
                  </a>
                )}
              </div>

              {pdfLoading || pdfBlobUrl ? (
                <div className="relative w-full h-[480px] sm:h-[700px] md:h-[900px] rounded-xl overflow-auto border border-line-soft bg-surface-2 flex items-center justify-center">
                  {pdfLoading ? (
                    <div className="flex flex-col items-center gap-2 text-ink-3" role="status">
                      <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.7} aria-hidden />
                      <span className="text-[13px]">Rendering the A4 PDF…</span>
                    </div>
                  ) : (
                    <iframe
                      src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                      title="PDF Proposal Blueprint"
                      className="w-full h-full border-0 bg-surface"
                    />
                  )}
                </div>
              ) : pdfMissing ? (
                <Callout tone="warn" title="The proposal PDF link has expired.">
                  Save Business Setup again to generate a new proposal — it will now be stored permanently.
                </Callout>
              ) : (
                <div className="py-12 px-6 text-center bg-surface-2 rounded-xl flex flex-col items-center gap-2">
                  <span className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center text-ink-3">
                    <FileText className="w-5 h-5" strokeWidth={1.7} aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-ink">The proposal PDF is still being compiled.</p>
                  <p className="text-[13px] text-ink-3">Switch to the strategy document to read it now.</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Client summary & proposal decision (app chrome, not printed) */}
        <div className={cx('no-print', isPublicShare ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 items-start' : 'space-y-4')} data-print-hide>
          {!isPublicShare && <SectionLabel>Client summary</SectionLabel>}

          {/* Proposal Decision (DB sync) — approve is the one primary */}
          <Card className={cx('flex flex-col gap-4', isPublicShare && 'sm:order-2')}>
            <CardHeader
              title="Proposal decision"
              action={<StatusPill status={isApproved ? 'Approved' : 'Pending approval'} />}
            />

            {isApproved ? (
              <div className="space-y-3">
                <Callout tone="ok" title="Proposal approved">Status updated to Approved.</Callout>
                <Button
                  variant="primary"
                  iconRight={ArrowRight}
                  onClick={() => {
                    if (onNextStep) {
                      onNextStep();
                    } else {
                      navigate(`/clients/${client.id}/workflow`);
                    }
                  }}
                  className="w-full"
                >
                  Proceed to Step 3 (Build prompt)
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-ink-3 leading-relaxed">
                  Approving updates the status to <span className="font-medium text-ok-text">Approved</span> and unlocks Step 3.
                </p>
                <Button
                  variant="primary"
                  icon={CheckCircle}
                  onClick={async () => {
                    await approveProposal(client.id);
                    if (onNextStep) {
                      onNextStep();
                    }
                  }}
                  className="w-full"
                >
                  Approve proposal
                </Button>
              </div>
            )}

            {/* Request changes — opens the change-request form */}
            <a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cx(LINK_SECONDARY_MD, 'w-full')}
              title="Request changes via Google Form"
            >
              <MessageSquare className="w-4 h-4" strokeWidth={1.7} aria-hidden />
              Request changes
              <ExternalLink className="w-4 h-4 text-ink-3" strokeWidth={1.7} aria-hidden />
            </a>
          </Card>

          {/* Profile Card */}
          <Card className={cx('flex flex-col gap-4', isPublicShare && 'sm:order-1')}>
            <CardHeader title="Client profile" action={<StatusPill status={client.proposalStatus || 'Active'} />} />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoModal(true)}
                aria-label="Preview client logo"
                title="Preview client logo"
                className="rounded-xl hover:opacity-80 transition-opacity duration-150 shrink-0"
              >
                <ClientMark client={client} />
              </button>
              <div className="flex flex-col min-w-0">
                <p className="font-medium text-ink text-sm truncate">{client.name}</p>
                <p className="text-ink-3 text-xs truncate">{client.location} | {client.industry}</p>
                <p className="text-ink-3 text-xs truncate mt-0.5">{client.email} | {client.mobile}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-line-soft">
              <p className="label-mono">Blueprint inclusions</p>
              <div className="flex flex-wrap gap-1.5">
                <Tag>SEO keywords</Tag>
                <Tag>AEO voice snippets</Tag>
                <Tag>GEO AI citations</Tag>
              </div>
              {plannedPages > 0 && (
                <p className="text-xs text-ink-3 tabular-nums">Planned pages: {plannedPages}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Enlarged logo preview */}
      <Modal open={showLogoModal} onClose={closeLogoModal} title="Client logo" size="sm">
        <div className="flex flex-col items-center gap-4 pt-2" data-print-hide>
          <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-2xl bg-surface border border-line p-4 flex items-center justify-center">
            {client.logoUrl ? (
              <img src={client.logoUrl} alt={client.name} referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-5xl font-semibold text-ink-2" aria-hidden>{client.name.charAt(0)}</span>
            )}
          </div>
          <div className="text-center space-y-0.5">
            <p className="text-[15px] font-semibold text-ink">{client.name}</p>
            <p className="text-xs text-ink-3">{client.location} | {client.industry}</p>
          </div>
        </div>
      </Modal>
    </div>
    </PublicFrame>
  );
}
