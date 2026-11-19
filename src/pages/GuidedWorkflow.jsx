import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { getClientCurrentStep } from '../utils/resolveClientName';
import { Card, Button, StatusPill } from '../components/ui/Cards';
import { StepDot, Progress, Working, Badge, Select, cx } from '../components/ui/primitives';
import BusinessSetup from './BusinessSetup';
import ClientProposal from './ClientProposal';
import BuildHandoff from './BuildHandoff';
import PostDeployCompliance from './PostDeployCompliance';
import {
  UserCheck,
  Cpu,
  FileCheck2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Layers,
  Code2,
  Key,
  FileText,
  Globe,
  ExternalLink,
  Database,
  Zap,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../utils/db';
import { sendClientToPlanningWorkflow, triggerWorkflow, FLOWS } from '../utils/api';

// Step 2: Live AI Generation Pipeline Component with continuous database polling
export function AIPipelineExecution({ client, onComplete }) {
  const { updateKeywords, updateSitemap, generateProposal, refresh } = useClients();
  const [stage, setStage] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [progress, setProgress] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [hasDbData, setHasDbData] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Listening for workflow completion...');

  const pipelineStages = [
    {
      id: 'keywords',
      title: 'Geo & AEO Keyword Clustering',
      icon: Key,
      desc: 'Clustering target search terms & geo-intent vectors for local optimization...',
      detail: `${client?.keywordsInput ? `Analyzing input keywords: "${client.keywordsInput}"` : `Researching keywords for ${client?.industry || 'Business'} in ${client?.location || 'Local Area'}`}`
    },
    {
      id: 'sitemap',
      title: 'Sitemap & Architecture Blueprinting',
      icon: Layers,
      desc: 'Building responsive site architecture, page hierarchies & URL slugs...',
      detail: `Assigning 1-to-1 keyword page mappings for ${client?.name || 'Client'}`
    },
    {
      id: 'copy',
      title: 'Page Copy & Component Blueprinting',
      icon: FileText,
      desc: 'Structuring section outlines, CTA hooks & hero copy for each page...',
      detail: `Synthesizing brand tone and ${client?.services?.length || 0} core services`
    },
    {
      id: 'schema',
      title: 'Schema & Technical Compliance Setup',
      icon: Code2,
      desc: 'Injecting LocalBusiness, JSON-LD, FAQPage schema & canonical rules...',
      detail: `Configuring AEO (${client?.preferences?.aeo ? 'Enabled' : 'Off'}) & GEO (${client?.preferences?.geo ? 'Enabled' : 'Off'})`
    }
  ];

  // Helper: check if real AI data has been written to the database
  const checkHasDbData = (rec) => {
    if (!rec) return false;
    const pdf = rec.proposal_pdf_url || rec.proposalPdfUrl || '';
    const isRemotePdf = typeof pdf === 'string' && pdf.startsWith('http') && !pdf.startsWith('data:');
    const isStatusReady = rec.proposal_status === 'Pending Client Approval' || rec.proposalStatus === 'Pending Client Approval';
    const hasBuildPrompt = typeof (rec.build_prompt || rec.buildPrompt) === 'string' && (rec.build_prompt || rec.buildPrompt).length > 250;
    return Boolean(isRemotePdf || (isStatusReady && hasBuildPrompt));
  };

  // Elapsed timer
  useEffect(() => {
    let timer;
    if (isRunning && !hasDbData) {
      timer = setInterval(() => {
        setElapsedSecs(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, hasDbData]);

  // Smooth visual progress loop: cycle across stages to show continuous live engine activity
  useEffect(() => {
    let anim;
    if (isRunning && !hasDbData) {
      anim = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            setStage(s => (s + 1) % pipelineStages.length);
            return 10;
          }
          return prev + 6;
        });
      }, 700);
    }
    return () => clearInterval(anim);
  }, [isRunning, hasDbData, pipelineStages.length]);

  // Continuous database polling: Run until real data from Pucho Studio arrives in the DB
  useEffect(() => {
    if (!client?.id) return;

    let isMounted = true;

    const pollDatabase = async () => {
      try {
        const { data, error } = await db
          .from('clients')
          .select('id, business_name, proposal_pdf_url, build_prompt, proposal_status, sitemap, keywords, updated_at')
          .eq('id', client.id)
          .maybeSingle();

        if (error) {
          console.warn('[DB Poll Warning]:', error.message);
          return;
        }

        if (!isMounted) return;
        setPollCount(prev => prev + 1);

        if (data && checkHasDbData(data)) {
          console.log('[DB Poll SUCCESS] Real AI Data Received from DB:', data);
          setHasDbData(true);
          setIsRunning(false);
          setProgress(100);
          setStage(pipelineStages.length - 1);
          setStatusMessage('Proposal PDF and AI Blueprint confirmed from the database!');
          toast.success('Pucho AI Studio data confirmed in the database!');
          if (typeof refresh === 'function') {
            await refresh();
          }
        } else {
          setStatusMessage(`Polling database for AI data... (Poll #${pollCount + 1})`);
        }
      } catch (err) {
        console.warn('[DB Poll Exception]:', err);
      }
    };

    // First check
    pollDatabase();

    // Continuous polling loop every 2.5 seconds
    const interval = setInterval(() => {
      if (!hasDbData && isRunning) {
        pollDatabase();
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [client?.id, hasDbData, isRunning, pollCount, refresh]);

  // Manual Trigger: Re-send Webhook payload to Pucho AI Studio
  const handleTriggerWebhook = async () => {
    if (!client) return;
    setIsTriggering(true);
    toast.info('Sending trigger to Pucho AI Studio webhook...');
    try {
      const res = await sendClientToPlanningWorkflow(client);
      if (res && res.success) {
        toast.success('Trigger accepted by Pucho AI Studio! Polling database for updates...');
      } else {
        toast.error(`Trigger failed: ${res?.message || 'unknown error'}`);
      }
    } catch (e) {
      toast.error('Trigger request error: ' + e.message);
    } finally {
      setIsTriggering(false);
    }
  };

  // Dedicated Sample Data Trigger (feeds /test endpoint specifically for Studio "Testing Trigger" screen)
  const handleSendSampleData = async () => {
    if (!client) return;
    setIsTriggering(true);
    toast.info('Sending sample test payload to Studio...');
    try {
      const payload = {
        action: 'create_client',
        clientId: client.id,
        client_id: client.id,
        businessName: client.name || client.business_name || 'Blue Tokai Coffee Roasters',
        business_name: client.name || client.business_name || 'Blue Tokai Coffee Roasters',
        location: client.location || 'New Delhi, India',
        industry: client.industry || 'Specialty Coffee & Cafés / F&B',
        services: client.services || [{ name: 'Specialty Arabica Coffee Beans', desc: 'Single origin' }],
        template_name: client.templateName || 'Astra Agency',
        template_preview_url: client.templatePreviewUrl || 'https://wordpress.org/themes/astra/'
      };

      const res = await triggerWorkflow(FLOWS.planningTest, payload);
      if (res.success) {
        toast.success('Sample Data delivered to Studio! Check your "Testing Trigger" screen.');
      } else {
        toast.error(`Sample data not delivered: ${res.message}`);
      }
    } catch (e) {
      toast.error('Test payload error: ' + e.message);
    } finally {
      setIsTriggering(false);
    }
  };

  // Local fallback if user explicitly wants to preview immediately without waiting
  const handleSkipWait = () => {
    runAIPopulation();
    setIsRunning(false);
    setHasDbData(true);
    setProgress(100);
    setStage(pipelineStages.length - 1);
  };

  const runAIPopulation = () => {
    if (!client) return;

    if (!client.keywordsApproved || client.keywordsApproved.length === 0) {
      const location = client.location || 'Local Area';
      const industry = client.industry || 'Business Services';
      const kwInput = client.keywordsInput ? client.keywordsInput.split(',').map(k => k.trim()) : [];

      const generated = [
        { term: kwInput[0] || `${industry} near me`, intent: 'Local / Transactional', approved: true },
        { term: kwInput[1] || `best ${industry} in ${location}`, intent: 'Commercial', approved: true },
        { term: kwInput[2] || `affordable ${industry} services ${location}`, intent: 'Commercial', approved: true },
        { term: `top rated ${industry} ${location}`, intent: 'Commercial', approved: true }
      ];
      updateKeywords(client.id, generated);
    }

    if (!client.sitemap || client.sitemap.length === 0) {
      const baseKw = client.keywordsApproved?.[0]?.term || client.keywordsInput || `${client.industry} Services`;
      const generatedSitemap = [
        { id: 'page-1', name: 'Home', keyword: baseKw, type: 'Home' },
        { id: 'page-2', name: 'Services', keyword: `${client.industry} Solutions`, type: 'Service' },
        { id: 'page-3', name: 'About Us', keyword: `About ${client.name} ${client.location}`, type: 'Service' },
        { id: 'page-4', name: 'Contact Us', keyword: `${client.name} Phone & Location`, type: 'Location' }
      ];
      updateSitemap(client.id, generatedSitemap);
    }

    generateProposal(client.id);
    toast.success('Strategy Document & Blueprint preview loaded!');
  };

  // Display note: the workflow does not report per-stage progress, so stages are shown as one truthful
  // pending state (waiting for the database) and all done once the data is confirmed — no simulated percentage.
  return (
    <Card className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-line">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-surface-2 text-ink-2 flex items-center justify-center shrink-0">
            <Cpu className="w-[18px] h-[18px]" strokeWidth={1.7} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="label-mono">AI blueprint engine</p>
            <h3 className="text-[15px] leading-6 font-semibold text-ink mt-0.5">Generating architecture & strategy proposal</h3>
            <p className="text-[13px] text-ink-3 mt-0.5">
              Keyword clusters, sitemap and proposal for <span className="font-medium text-ink">{client?.name || client?.business_name}</span>
            </p>
          </div>
        </div>

        {isRunning ? (
          <Working className="shrink-0">Polling database · <span className="tabular-nums">{elapsedSecs}s</span></Working>
        ) : (
          <Badge tone="ok" className="shrink-0">Ready</Badge>
        )}
      </div>

      {/* What the planning workflow produces */}
      <div className="space-y-2">
        {pipelineStages.map((st) => {
          const Icon = st.icon;
          const isDone = !isRunning;

          return (
            <div key={st.id} className="flex items-start gap-3 rounded-xl bg-surface-2 px-3.5 py-3">
              {isDone ? (
                <StepDot state="done" />
              ) : (
                <span className="w-[26px] h-[26px] rounded-full bg-surface border border-line text-ink-3 flex items-center justify-center shrink-0" aria-hidden>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[13px] font-medium text-ink truncate">{st.title}</h4>
                  {isDone && <span className="text-xs text-ok-text font-medium shrink-0">Done</span>}
                </div>
                <p className="text-xs text-ink-3 leading-relaxed line-clamp-2 sm:truncate mt-0.5">{isDone ? st.detail : st.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Polling status & trigger bar */}
      <div className="rounded-xl border border-line-soft px-4 py-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className={cx('w-4 h-4', isRunning ? 'text-ink-3' : 'text-ok-text')} strokeWidth={1.7} aria-hidden />
            <span className="text-[13px] font-medium text-ink">
              {isRunning ? 'Polling the database' : 'Database synchronised'}
            </span>
          </div>
          <span className="text-xs text-ink-3 tabular-nums">
            {isRunning ? `Poll #${pollCount} · ${elapsedSecs}s elapsed` : 'Confirmed'}
          </span>
        </div>

        <p className="text-xs text-ink-3 leading-relaxed">
          {isRunning
            ? 'Waiting for the Pucho AI Studio planning workflow to write proposal_pdf_url, build_prompt and sitemap to the database.'
            : 'The strategy document and build architecture are stored in the database.'}
        </p>

        {isRunning && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line-soft">
            <Button
              variant="secondary"
              size="sm"
              icon={Zap}
              disabled={isTriggering}
              onClick={handleTriggerWebhook}
            >
              Re-send webhook trigger
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={Play}
              disabled={isTriggering}
              onClick={handleSendSampleData}
            >
              Send sample data (Studio test screen)
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipWait}
              className="sm:ml-auto"
            >
              Instant preview (skip DB wait)
            </Button>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t border-line">
        <Button
          variant="secondary"
          icon={RefreshCw}
          onClick={() => {
            setStage(0);
            setProgress(0);
            setHasDbData(false);
            setIsRunning(true);
            setPollCount(0);
            setElapsedSecs(0);
          }}
        >
          Re-run pipeline
        </Button>

        <Button
          iconRight={ArrowRight}
          onClick={onComplete}
          disabled={isRunning}
        >
          Review strategy & proposal
        </Button>
      </div>
    </Card>
  );
}

export default function GuidedWorkflow() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getClient } = useClients();

  const isNew = clientId === 'new' || !clientId;
  const client = isNew ? null : getClient(clientId);

  const stepParam = parseInt(searchParams.get('step'), 10);
  const [currentStep, setCurrentStep] = useState(1);

  // Exact original system flow: Automatically determine appropriate step based on client status & URL query params
  useEffect(() => {
    if (stepParam && stepParam >= 1 && stepParam <= 4) {
      setCurrentStep(stepParam);
    } else if (client) {
      const autoStep = getClientCurrentStep(client);
      setCurrentStep(autoStep);
    } else if (isNew) {
      setCurrentStep(1);
    }
  }, [clientId, client?.id, stepParam]);

  const handleStepClick = (stepNum) => {
    if (client || stepNum === 1) {
      setCurrentStep(stepNum);
      setSearchParams({ step: stepNum });
    } else {
      toast.error('Please complete Step 1: Client Details first.');
    }
  };

  // Exact 4-step system flow preserved
  const steps = [
    {
      num: 1,
      tag: '01 Requirements',
      title: 'Business Setup',
      subtitle: 'Profile, branding & template',
      icon: UserCheck
    },
    {
      num: 2,
      tag: '02 Architecture',
      title: 'Strategy Proposal PDF',
      subtitle: 'Sitemap & client sign-off',
      icon: FileCheck2
    },
    {
      num: 3,
      tag: '03 Pucho Code',
      title: 'Master Build Prompt',
      subtitle: 'Full specification prompt',
      icon: Sparkles
    },
    {
      num: 4,
      tag: '04 Audit & Launch',
      title: 'Compliance & Live Test',
      subtitle: 'Post-deploy audit & verification',
      icon: Globe
    }
  ];


  // Stepper display state (same completion rule as before): current = the open step, done = completed and not open.
  const stepState = (st) => {
    const isActive = currentStep === st.num;
    const isCompleted = currentStep > st.num || (st.num === 2 && (client?.proposalDocUrl || client?.proposalStatus === 'Approved')) || (st.num === 1 && client?.name);
    return isActive ? 'current' : isCompleted ? 'done' : 'upcoming';
  };
  const activeStep = steps.find((st) => st.num === currentStep) || steps[0];
  const doneCount = steps.filter((st) => stepState(st) === 'done').length;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-6xl mx-auto pb-16">

      {/* Client context (the shell header already carries the page title) */}
      {client && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {client.logoUrl ? (
              <img
                src={client.logoUrl}
                alt={client.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-contain bg-surface border border-line p-1 shrink-0"
              />
            ) : (
              <span className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-ink-2 font-medium text-sm shrink-0" aria-hidden>
                {client.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-[15px] leading-6 font-semibold text-ink truncate">{client.name}</h2>
                <StatusPill status={client.proposalStatus || client.status} />
              </div>
              <p className="text-xs text-ink-3 truncate mt-0.5">
                {client.location || 'Local Business'} · {client.industry || 'Business Services'}
                {client.selected_template && (
                  <span> · Template: <span className="text-ink-2 font-medium">{client.selected_template}</span></span>
                )}
              </p>
            </div>
          </div>

          {client.liveUrl && (
            <a
              href={client.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-11 sm:h-[33px] px-3 rounded-md border border-line-strong bg-surface text-[13px] font-medium text-ink hover:bg-surface-2 transition-colors duration-150 shrink-0 self-start sm:self-auto"
            >
              <Globe className="w-4 h-4 text-ink-3" strokeWidth={1.7} aria-hidden />
              <span>Live URL</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.7} aria-hidden />
            </a>
          )}
        </div>
      )}

      {/* Stepper — DS nodes, always "Step n of m", progress bar */}
      <Card className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="label-mono">Step {currentStep} of {steps.length}</p>
            <p className="text-[15px] leading-6 font-semibold text-ink truncate mt-0.5">
              {activeStep.title}
              <span className="hidden sm:inline text-[13px] font-normal text-ink-3"> · {activeStep.subtitle}</span>
            </p>
          </div>
          <span className="text-xs text-ink-3 tabular-nums shrink-0">{doneCount} of {steps.length} done</span>
        </div>

        <Progress value={doneCount} max={steps.length} />

        {/* Desktop: horizontal step list */}
        <ol className="hidden md:flex items-center">
          {steps.map((st, i) => {
            const state = stepState(st);
            return (
              <li key={st.num} className={cx('flex items-center min-w-0', i < steps.length - 1 && 'flex-1')}>
                <button
                  type="button"
                  onClick={() => handleStepClick(st.num)}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className="flex items-center gap-2.5 min-w-0 rounded-xl px-2 py-2 text-left hover:bg-hover transition-colors duration-150"
                >
                  <StepDot state={state} n={st.num} />
                  <span className="min-w-0">
                    <span className={cx('block text-[13px] leading-5 truncate',
                      state === 'current' ? 'font-medium text-ink' : state === 'done' ? 'text-ink-2' : 'text-ink-3')}>
                      {st.title}
                    </span>
                    <span className="hidden lg:block text-xs text-ink-3 truncate">{st.subtitle}</span>
                    <span className="sr-only">{state === 'done' ? ' (completed)' : state === 'current' ? ' (current step)' : ''}</span>
                  </span>
                </button>
                {i < steps.length - 1 && <span className="flex-1 h-px bg-line mx-2 min-w-4" aria-hidden />}
              </li>
            );
          })}
        </ol>

        {/* Phones: compact step switcher */}
        <div className="md:hidden">
          <label htmlFor="workflow-step" className="sr-only">Go to step</label>
          <Select
            id="workflow-step"
            value={currentStep}
            onChange={(e) => handleStepClick(parseInt(e.target.value, 10))}
          >
            {steps.map((st) => (
              <option key={st.num} value={st.num}>
                Step {st.num} of {steps.length} · {st.title}{stepState(st) === 'done' ? ' (done)' : ''}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Active step content (flow unchanged) */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <div className="space-y-4">
            <BusinessSetup onNextStep={() => handleStepClick(2)} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            {/* If proposal doesn't exist yet, show live pipeline runner first */}
            {!client?.proposalDocUrl && client?.proposalStatus !== 'Approved' ? (
              <AIPipelineExecution
                client={client}
                onComplete={() => {
                  toast.success('Strategy Blueprint generated! Viewing proposal.');
                }}
              />
            ) : (
              <ClientProposal onNextStep={() => handleStepClick(3)} />
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <BuildHandoff onNextStep={() => handleStepClick(4)} />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <PostDeployCompliance />
          </div>
        )}
      </div>

    </div>
  );
}
