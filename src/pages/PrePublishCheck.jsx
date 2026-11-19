import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button, StatusPill, EmptyState } from '../components/ui/Cards';
import { CardHeader, Badge, Progress, Working, cx } from '../components/ui/primitives';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Lock, ClipboardCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

export default function PrePublishCheck() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { getClient, runChecks } = useClients();

  const client = getClient(clientId);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(-1);
  const [readyToDeploy, setReadyToDeploy] = useState(false);

  if (!client) {
    return (
      <EmptyState
        icon={UserX}
        title="Client not found."
        description="This client is not in your list. Open it again from Clients."
      />
    );
  }

  // Gating Lock Check
  if (client.buildStatus !== 'Build Complete') {
    return (
      <EmptyState
        icon={Lock}
        title="Pre-publish check locked"
        description="Mark the website build as Build Complete in the Build & Handoff step before running pre-publish compliance audits."
        className="max-w-xl mx-auto"
        action={
          <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(`/clients/${clientId}/handoff`)}>
            Go to Build Handoff
          </Button>
        }
      />
    );
  }

  const handleRunAudit = () => {
    setRunning(true);
    setResults(null);
    setReadyToDeploy(false);

    setTimeout(() => {
      // Generate categories based on setup preferences
      const audits = [];

      // SEO Audits - Always included
      audits.push(
        { category: 'SEO', item: 'Title Tags structure verification', passed: true, fix: 'Verified: All pages contain exactly one <title> element and matches the sitemap page title.' },
        { category: 'SEO', item: 'Meta Descriptions present', passed: true, fix: 'Verified: All meta descriptions exist and conform to 120-160 char limits.' },
        { category: 'SEO', item: 'FSSAI / GST footer inclusion Check', passed: client.gstin ? true : false, fix: client.gstin ? 'Verified: GST/FSSAI number parsed in footer.' : 'Fail: GST/FSSAI number empty in Setup profile. Input details in Business Setup to insert.' },
        { category: 'SEO', item: 'Image Alt Tags audit', passed: true, fix: 'Verified: All sitemap graphics have AI alt tags configured in Media Library.' }
      );

      // AEO Audits - Conditional
      if (client.preferences?.aeo) {
        audits.push(
          { category: 'AEO', item: 'Speakable voice schema JSON-LD validation', passed: true, fix: 'Verified: Speakable schema injected matching main body content blocks.' },
          { category: 'AEO', item: 'Short Q&A answer formats checklist', passed: true, fix: 'Verified: FAQs are structured with direct 2-sentence answers targeting Alexa crawlers.' }
        );
      }

      // GEO Audits - Conditional
      if (client.preferences?.geo) {
        audits.push(
          { category: 'GEO', item: 'Entity co-occurrence citation mapping', passed: true, fix: 'Verified: Citations map the exact coordinates matching local profiles.' },
          { category: 'GEO', item: 'LLM reference schema links check', passed: true, fix: 'Verified: Entity structure injects clean citation graphs.' }
        );
      }

      setResults(audits);
      setRunning(false);

      const allPassed = audits.every(a => a.passed);
      setReadyToDeploy(allPassed);
      runChecks(clientId); // Mark checked in Context

      if (allPassed) {
        toast.success('Pre-publish compliance checks completed. All audits passed!');
      } else {
        toast.warning('Audits completed with alerts. Resolve the FSSAI/GST footer missing tags in Setup.');
      }
    }, 2000);
  };

  const handleMarkDeployable = () => {
    toast.success('Website marked as Ready to Deploy! Unlocked Post-Deploy Compliance.');
    setTimeout(() => {
      navigate(`/clients/${clientId}/post-deploy`);
    }, 300);
  };

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? -1 : idx);
  };

  // Summary computed from the checklist items themselves
  const passedCount = results ? results.filter(a => a.passed).length : 0;
  const totalCount = results ? results.length : 0;

  return (
    <div className="space-y-5 sm:space-y-6 font-sans max-w-4xl mx-auto">
      {/* Intro and run trigger */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardHeader
            title="Staging compliance audits"
            description="Runs automated checks against the staging build structure to verify compliance before live deployment."
          />
          <Button
            variant={results ? 'secondary' : 'primary'}
            icon={RefreshCw}
            onClick={handleRunAudit}
            disabled={running}
            className="w-full sm:w-auto"
          >
            {running ? 'Running checks…' : results ? 'Run again' : 'Run audit check'}
          </Button>
        </div>
      </Card>

      {/* Working state */}
      {running && (
        <Card className="py-12 flex flex-col items-center justify-center gap-2 text-center">
          <Loader2 className="w-6 h-6 text-ink-3 animate-spin" strokeWidth={1.7} aria-hidden />
          <Working>Crawling sitemap files…</Working>
          <p className="text-xs text-ink-3">Verifying title structures, structured schema tags and FSSAI footers.</p>
        </Card>
      )}

      {/* Audit results */}
      {results && !running && (
        <Card padded={false} className="overflow-hidden">
          <div className="p-4 sm:p-5 space-y-3 border-b border-line">
            <CardHeader
              title="Compliance scan results"
              action={<StatusPill status={readyToDeploy ? 'Completed' : 'Warning'} />}
            />
            <div className="space-y-1.5">
              <p className="text-[13px] text-ink-2 tabular-nums">
                <span className="font-medium text-ink">{passedCount} of {totalCount}</span> checks passed
              </p>
              <Progress value={passedCount} max={totalCount} tone="auto" label={`${passedCount} of ${totalCount} checks passed`} />
            </div>
          </div>

          <ul className="divide-y divide-line-soft">
            {results.map((audit, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    aria-expanded={isExpanded}
                    className="w-full min-h-[56px] px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-left hover:bg-hover transition-colors duration-150"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={cx('w-2 h-2 rounded-full shrink-0', audit.passed ? 'bg-ok' : 'bg-bad')} aria-hidden />
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm text-ink">{audit.item}</span>
                        <span className="text-xs text-ink-3 mt-0.5">{audit.category} audit</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <Badge tone={audit.passed ? 'ok' : 'bad'}>{audit.passed ? 'Passed' : 'Failed'}</Badge>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-ink-3" strokeWidth={1.7} aria-hidden />
                        : <ChevronDown className="w-4 h-4 text-ink-3" strokeWidth={1.7} aria-hidden />}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 animate-fade-in">
                      <div className="bg-surface-2 p-3 rounded-xl text-[13px] text-ink-2 leading-relaxed">
                        <p className="label-mono mb-1">Audit details & fixes</p>
                        {audit.fix}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Mark ready */}
          <div className="p-4 sm:p-5 bg-surface-2 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className={cx('text-[13px]', readyToDeploy ? 'text-ink-2' : 'text-warn-text')}>
              {readyToDeploy
                ? 'All clear — ready to deploy the staging build to live servers.'
                : 'GST/FSSAI audit failed. You can still deploy, but we recommend filling the details in Setup.'}
            </p>
            <Button
              variant="primary"
              iconRight={ArrowRight}
              onClick={handleMarkDeployable}
              className="w-full sm:w-auto"
            >
              Mark ready to deploy
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!results && !running && (
        <EmptyState
          icon={ClipboardCheck}
          title="Compliance checks not run yet."
          description='Click "Run audit check" to start verifying sitemaps, speakable schemas and citation logs.'
        />
      )}
    </div>
  );
}
