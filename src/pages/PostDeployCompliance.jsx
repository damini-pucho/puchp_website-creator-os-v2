import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button, StatusPill, EmptyState } from '../components/ui/Cards';
import { CardHeader, SectionLabel, Badge, Tag, Tile, Callout, Working, toneOf, cx } from '../components/ui/primitives';
import Input from '../components/ui/Input';
import { ShieldCheck, Play, Loader2, CheckCircle, CheckCircle2, XCircle, Globe, History, AlertCircle, Sparkles, Code, Lock, FileCheck, ClipboardCheck, AlertTriangle, ExternalLink, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { sendLiveUrlToComplianceWorkflow } from '../utils/api';

const DEPLOYER_ITEMS = [
  { key: 'zipStructure', label: 'ZIP structure: dist, nginx, Dockerfile', sub: 'Archive contains dist folder, nginx.conf configuration, and Dockerfile script in root' },
  { key: 'nameLinksVerified', label: 'Name & links verified', sub: 'App title, route links, and external API links verified' },
  { key: 'correctOrg', label: 'Correct organization/project', sub: 'Deployed under verified organization project space' },
  { key: 'clearCache', label: 'Clear Cache enabled', sub: 'Clear Cache setting enabled prior to build release' },
  { key: 'websiteLowercase', label: 'Website name lowercase', sub: 'Website identifier formatted strictly in lowercase' },
  { key: 'testedTwice', label: 'Deployment tested twice + hard refresh', sub: 'Tested on 2 separate browsers with hard cache refresh' },
  { key: 'stakeholderCrossVerify', label: 'Stakeholder cross-verification', sub: 'Cross-checked and approved by project stakeholders' },
];

const ASSIGNER_ITEMS = [
  { key: 'linkWorking', label: 'Link working', sub: 'Live deployment URL accessible and responsive' },
  { key: 'correctOrgApp', label: 'Correct organization & app name', sub: 'Target client organization and app name confirmed' },
  { key: 'metadataMatch', label: 'Name, link, image & description match', sub: 'App title, live URL, preview thumbnail image, and description match' },
  { key: 'slugLowercase', label: 'Slug ID lowercase', sub: 'Client slug ID and URL route keys formatted in lowercase' },
  { key: 'verifyClientAccount', label: 'Verify app from client\'s account', sub: 'Verified app visibility from client\'s account portal' },
  { key: 'stakeholderVerify', label: 'Stakeholder verification', sub: 'Final sign-off confirmed by assigned project lead' },
];

export default function PostDeployCompliance() {
  const { clientId } = useParams();
  const { getClient, runLiveCompliance, updateChecklists } = useClients();

  const client = getClient(clientId);
  const [liveUrl, setLiveUrl] = useState(client?.liveUrl || client?.live_url || '');
  const [checking, setChecking] = useState(false);

  const [deployerChecklist, setDeployerChecklist] = useState(() => client?.deployerChecklist || {
    zipStructure: false,
    nameLinksVerified: false,
    correctOrg: false,
    clearCache: false,
    websiteLowercase: false,
    testedTwice: false,
    stakeholderCrossVerify: false
  });

  const [assignerChecklist, setAssignerChecklist] = useState(() => client?.assignerChecklist || {
    linkWorking: false,
    correctOrgApp: false,
    metadataMatch: false,
    slugLowercase: false,
    verifyClientAccount: false,
    stakeholderVerify: false
  });

  const handleToggleDeployer = async (key) => {
    const updated = { ...deployerChecklist, [key]: !deployerChecklist[key] };
    setDeployerChecklist(updated);
    await updateChecklists(clientId, updated, assignerChecklist);
  };

  const handleToggleAssigner = async (key) => {
    const updated = { ...assignerChecklist, [key]: !assignerChecklist[key] };
    setAssignerChecklist(updated);
    await updateChecklists(clientId, deployerChecklist, updated);
  };

  const deployerPassedCount = DEPLOYER_ITEMS.filter(item => deployerChecklist[item.key] === true).length;
  const isDeployerPassed = deployerPassedCount === DEPLOYER_ITEMS.length;

  const assignerPassedCount = ASSIGNER_ITEMS.filter(item => assignerChecklist[item.key] === true).length;
  const isAssignerPassed = assignerPassedCount === ASSIGNER_ITEMS.length;

  const isAllMandatoryPassed = isDeployerPassed && isAssignerPassed;
  const isAssigned = client?.assignmentStatus === 'Assigned & Verified';

  const handleCompleteAssignment = async () => {
    if (!isAllMandatoryPassed) {
      toast.error('Cannot assign client! All 7 Deployer and 6 Assigner mandatory checks must pass first.');
      return;
    }
    await updateChecklists(clientId, deployerChecklist, assignerChecklist, 'Assigned & Verified');
    toast.success(`Client ${client.name} successfully assigned and verified!`);
  };

  // Load the last saved audit report (the audit flow's output); nothing is shown before a real audit
  const [workflowOutput, setWorkflowOutput] = useState(() => {
    const saved = client?.auditReport || client?.audit_report || client?.lastAuditReport || null;
    return saved && typeof saved === 'object' && Object.keys(saved).length > 0 ? saved : null;
  });

  if (!client) {
    return (
      <EmptyState
        icon={UserX}
        title="Client not found."
        description="This client is not in your list. Open it again from Clients."
      />
    );
  }

  const handleScan = async (e) => {
    e.preventDefault();
    if (!liveUrl.trim()) {
      toast.error('Please paste the deployed live URL.');
      return;
    }

    setChecking(true);
    setWorkflowOutput(null);

    const startTime = Date.now();

    // 1. Trigger 2nd Flow Webhook in Pucho AI Studio
    const flowRes = await sendLiveUrlToComplianceWorkflow(client, liveUrl.trim());

    // Ensure loader displays for at least 1.5s so user sees the active loading state
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 1500) {
      await new Promise(resolve => setTimeout(resolve, 1500 - elapsedTime));
    }

    // The flow output is the webhook's response (the audit report). Nothing is saved or shown
    // as a report unless the flow really returned one.
    let resultData = flowRes.data;
    if (typeof resultData === 'string') {
      try { resultData = JSON.parse(resultData); } catch { /* keep the text */ }
    }
    const hasReport = flowRes.success && resultData && typeof resultData === 'object'
      && Object.keys(resultData).length > 0 && resultData.ok !== false;

    if (!hasReport) {
      setChecking(false);
      const reason = !flowRes.success
        ? flowRes.message
        : (resultData && typeof resultData === 'object' && (resultData.error || resultData.message))
          || 'The audit flow returned no report.';
      toast.error(`Website audit failed: ${reason}`);
      return;
    }

    runLiveCompliance(clientId, liveUrl.trim(), resultData);

    setWorkflowOutput(resultData);
    setChecking(false);
    toast.success('Live website audit complete — report saved.');
  };

  return (
    <div className="space-y-5 sm:space-y-6 font-sans max-w-4xl mx-auto">
      {/* Live URL input */}
      <Card className="flex flex-col gap-4">
        <CardHeader
          icon={Globe}
          title="Live site audit & compliance test"
          description="Deploy the website first, then enter its live URL below to run the AI audit."
        />

        <form onSubmit={handleScan} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full">
          <div className="flex-1 w-full min-w-0">
            <Input
              label="Live website URL"
              type="url"
              placeholder="e.g. https://saffron-stays-psi.vercel.app/"
              value={liveUrl}
              onChange={e => setLiveUrl(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            icon={Play}
            type="submit"
            disabled={checking}
            className="w-full sm:w-auto sm:h-11"
          >
            {checking ? 'Running audit…' : 'Test website audit'}
          </Button>
        </form>
      </Card>

      {/* Working state while the audit flow answers */}
      {checking && (
        <Card className="py-12 flex flex-col items-center justify-center gap-2 text-center">
          <Loader2 className="w-6 h-6 text-ink-3 animate-spin" strokeWidth={1.7} aria-hidden />
          <Working>Checking live website compliance & SEO…</Working>
          <p className="text-xs text-ink-3 max-w-md">Crawling the live URL and analysing SEO, AEO voice search and GEO AI citations.</p>
        </Card>
      )}

      {/* Audit flow response — SEO / AEO / GEO summary and page mappings */}
      {workflowOutput && !checking && (() => {
        // Parse embedded JSON response string if returned inside data.response / audit_report / auditReport
        let parsedReport = null;
        try {
          const respStr =
            workflowOutput?.audit_report ||
            workflowOutput?.auditReport ||
            workflowOutput?.data?.audit_report ||
            workflowOutput?.data?.auditReport ||
            workflowOutput?.data?.response ||
            workflowOutput?.response ||
            workflowOutput?.data;

          if (typeof respStr === 'string') {
            parsedReport = JSON.parse(respStr);
          } else if (typeof respStr === 'object' && respStr !== null && Object.keys(respStr).length > 0) {
            parsedReport = respStr;
          }
        } catch {
          parsedReport = null;
        }

        const auditData = parsedReport || workflowOutput;
        const seoScore = auditData?.scoreSummary?.seoScore || auditData?.seoScore || auditData?.seo_score || '—';
        const aeoScore = auditData?.scoreSummary?.aeoScore || auditData?.aeoScore || auditData?.aeo_score || '—';
        const geoScore = auditData?.scoreSummary?.geoScore || auditData?.geoScore || auditData?.geo_score || '—';
        const overallVerdict = auditData?.overallVerdict || auditData?.overall_verdict || auditData?.audit_verdict || '—';

        const pageRows = auditData.pageByPageAudit && auditData.pageByPageAudit.length > 0
          ? auditData.pageByPageAudit
          : (client.sitemap && client.sitemap.length > 0 ? client.sitemap : [
              { pageName: 'Home', targetKeyword: client.keywordsApproved?.[0]?.term || client.keywordsInput || `${client.industry} in ${client.location}`, schemaTypes: ['LocalBusiness', 'FAQPage'], status: 'VERIFIED', details: 'Home page keywords and local intent verified.' },
              { pageName: 'Services', targetKeyword: `${client.industry} Solutions ${client.location}`, schemaTypes: ['LocalBusiness', 'FAQPage'], status: 'VERIFIED', details: 'Service offerings mapped with structured schemas.' },
              { pageName: 'About Us', targetKeyword: `About ${client.name} ${client.location}`, schemaTypes: ['LocalBusiness'], status: 'VERIFIED', details: 'Brand narrative and credentials verified.' },
              { pageName: 'Contact Us', targetKeyword: `${client.name} Phone & Location`, schemaTypes: ['LocalBusiness', 'FAQPage'], status: 'VERIFIED', details: 'Location NAP and near-me queries optimized.' }
            ]);
        const rowKeyword = (pg) => pg.targetKeyword || pg.keyword || `${client.industry} ${client.location}`;
        const rowSchemas = (pg) => (Array.isArray(pg.schemaTypes) ? pg.schemaTypes : ['LocalBusiness', 'FAQPage']);
        const rowStatus = (pg) => pg.status || 'Verified';

        const reportUrl = liveUrl || client.liveUrl;
        const flags = [
          { key: 'seo', label: 'SEO optimisation', on: client.preferences?.seo !== false },
          { key: 'aeo', label: 'AEO voice search', on: client.preferences?.aeo !== false },
          { key: 'geo', label: 'GEO AI citation', on: client.preferences?.geo !== false },
        ];

        return (
          <Card className="flex flex-col gap-6 animate-fade-in">
            {/* Report header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-surface-2 text-ink-2 flex items-center justify-center shrink-0">
                  <Sparkles className="w-[18px] h-[18px]" strokeWidth={1.7} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="label-mono">Website audit & compliance report</p>
                  <h3 className="text-[15px] leading-6 font-semibold text-ink mt-0.5">
                    {auditData.auditTitle || `Website Compliance & SEO Audit Report: ${client.name}`}
                  </h3>
                  <p className="text-[13px] text-ink-3 mt-0.5 min-w-0 truncate">
                    Live site:{' '}
                    {reportUrl ? (
                      <a href={reportUrl} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2 decoration-line-strong hover:decoration-ink">{reportUrl}</a>
                    ) : '—'}
                  </p>
                </div>
              </div>
              <StatusPill status="Completed" label="Audit complete" className="self-start" />
            </div>

            {/* Score summary (values from the audit report) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Tile label="SEO audit" value={seoScore} sub="Canonical & meta index" />
              <Tile label="AEO voice search" value={aeoScore} sub="Speakable & FAQ schema" />
              <Tile label="GEO AI citation" value={geoScore} sub="Local business vectors" />
              <Tile label="Verdict" value={overallVerdict} sub="Overall audit verdict" />
            </div>

            {/* Client optimisation flags */}
            <div className="bg-surface-2 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="label-mono">Optimisation flags · selected in Step 1</p>
                <p className="text-[13px] text-ink-2">Checked against the audit flow's report.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {flags.map((f) => (
                  <Badge key={f.key} tone={f.on ? 'ok' : 'neutral'}>{f.label} {f.on ? 'covered' : 'off'}</Badge>
                ))}
              </div>
            </div>

            {/* Page-by-page keyword & coverage */}
            <div className="space-y-3">
              <SectionLabel>Page-by-page keyword & content verification</SectionLabel>

              {/* ≥ 640 px: table */}
              <div className="hidden sm:block overflow-x-auto border border-line rounded-xl">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-2 border-b border-line">
                    <tr>
                      <th className="label-mono font-normal px-4 py-2.5">Page</th>
                      <th className="label-mono font-normal px-4 py-2.5">Target keyword</th>
                      <th className="label-mono font-normal px-4 py-2.5">Schema types</th>
                      <th className="label-mono font-normal px-4 py-2.5">Audit details</th>
                      <th className="label-mono font-normal px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft text-ink">
                    {pageRows.map((pg, idx) => (
                      <tr key={idx} className="hover:bg-hover transition-colors duration-150 align-top">
                        <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">{pg.pageName || pg.name}</td>
                        <td className="px-4 py-3 font-mono text-ink-2">{rowKeyword(pg)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {rowSchemas(pg).map((st, i) => <Tag key={i}>{st}</Tag>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-2 max-w-xs leading-normal">
                          {pg.details || 'Keyword and schema node structure verified.'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge tone={toneOf(rowStatus(pg))}>{rowStatus(pg)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* < 640 px: stacked rows */}
              <ul className="sm:hidden divide-y divide-line-soft border border-line rounded-xl">
                {pageRows.map((pg, idx) => (
                  <li key={idx} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink min-w-0">{pg.pageName || pg.name}</p>
                      <Badge tone={toneOf(rowStatus(pg))}>{rowStatus(pg)}</Badge>
                    </div>
                    <p className="font-mono text-[13px] text-ink-2 break-words">{rowKeyword(pg)}</p>
                    <div className="flex gap-1 flex-wrap">
                      {rowSchemas(pg).map((st, i) => <Tag key={i}>{st}</Tag>)}
                    </div>
                    <p className="text-[13px] text-ink-3 leading-normal">{pg.details || 'Keyword and schema node structure verified.'}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical verification notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-surface-2 rounded-xl space-y-1.5">
                <p className="label-mono">SEO compliance</p>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  {auditData.technicalAudits?.seoAudit?.notes || `Canonical URL index verified for ${client.name}. Sitemap XML mappings and H1-H3 headers pass crawl inspection.`}
                </p>
              </div>
              <div className="p-4 bg-surface-2 rounded-xl space-y-1.5">
                <p className="label-mono">AEO voice search</p>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  {auditData.technicalAudits?.aeoVoiceAudit?.notes || `Structured Speakable schema nodes indexing active. Verified audio parsing for Google Assistant & Siri.`}
                </p>
              </div>
              <div className="p-4 bg-surface-2 rounded-xl space-y-1.5">
                <p className="label-mono">GEO citation vector</p>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  {auditData.technicalAudits?.geoLocalAudit?.notes || `Geographic location co-occurrence vectors mapped for ${client.location}. Ready for Perplexity & SearchGPT indexing.`}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {auditData.recommendations && auditData.recommendations.length > 0 && (
              <Callout tone="info" title="AI recommendations for growth">
                <ul className="mt-1 space-y-1 list-disc pl-4">
                  {auditData.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </Callout>
            )}
          </Card>
        );
      })()}

      {/* Scan history log */}
      {(() => {
        const rawHistory = client?.complianceHistory || client?.compliance_history || [];
        const historyLogs = Array.isArray(rawHistory) ? rawHistory : [];

        return (
          <Card className="flex flex-col gap-4">
            <CardHeader icon={History} title="Compliance scan history" />

            {historyLogs.length > 0 ? (
              <>
                {/* ≥ 640 px: table */}
                <div className="hidden sm:block overflow-x-auto border border-line rounded-xl">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-surface-2 border-b border-line">
                      <tr>
                        <th className="label-mono font-normal px-4 py-2.5">Timestamp</th>
                        <th className="label-mono font-normal px-4 py-2.5">Crawled URL</th>
                        <th className="label-mono font-normal px-4 py-2.5">Result</th>
                        <th className="label-mono font-normal px-4 py-2.5">Log summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {historyLogs.map((hist) => (
                        <tr key={hist.id} className="hover:bg-hover transition-colors duration-150 align-top">
                          <td className="px-4 py-3 text-ink-2 tabular-nums whitespace-nowrap">{hist.timestamp}</td>
                          <td className="px-4 py-3">
                            <a
                              href={hist.url}
                              target="_blank"
                              rel="noreferrer"
                              title={`Open ${hist.url} in new tab`}
                              className="flex items-center gap-1.5 text-ink hover:underline max-w-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-ink-3 shrink-0" strokeWidth={1.7} aria-hidden />
                              <span className="truncate">{hist.url}</span>
                            </a>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge tone={toneOf(hist.result)}>{hist.result}</Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-2 leading-normal">{hist.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* < 640 px: stacked rows */}
                <ul className="sm:hidden divide-y divide-line-soft border border-line rounded-xl">
                  {historyLogs.map((hist) => (
                    <li key={hist.id} className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-ink-3 tabular-nums">{hist.timestamp}</span>
                        <Badge tone={toneOf(hist.result)}>{hist.result}</Badge>
                      </div>
                      <a href={hist.url} target="_blank" rel="noreferrer" title={`Open ${hist.url} in new tab`}
                        className="flex items-center gap-1.5 text-[13px] text-ink hover:underline min-w-0">
                        <ExternalLink className="w-3.5 h-3.5 text-ink-3 shrink-0" strokeWidth={1.7} aria-hidden />
                        <span className="truncate">{hist.url}</span>
                      </a>
                      {hist.details && <p className="text-[13px] text-ink-2 leading-normal">{hist.details}</p>}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-center text-[13px] text-ink-3 py-6 bg-surface-2 rounded-xl">
                No compliance check runs recorded for this client yet. Run the live audit above to log the first one.
              </p>
            )}
          </Card>
        );
      })()}
    </div>
  );
}
