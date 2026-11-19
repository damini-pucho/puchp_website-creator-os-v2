import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button, EmptyState } from '../components/ui/Cards';
import { CardHeader, SectionLabel, cx } from '../components/ui/primitives';
import { generateBuildPrompt } from '../utils/promptGenerator';
import {
  FileCode,
  Copy,
  Check,
  ArrowRight,
  Download,
  Sparkles,
  ExternalLink,
  Code2,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';

const BUILD_STATES = [
  { label: 'Not started', val: 'Not Started' },
  { label: 'In progress in Pucho Code', val: 'In Progress' },
  { label: 'Build complete & deployed', val: 'Build Complete' }
];

export default function BuildHandoff({ onNextStep }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, getClient, setHandoffStatus, updateClient } = useClients();

  const client = getClient(clientId) || (clients && clients.length > 0 ? clients.find(c => c.id === clientId) || clients[0] : null);

  if (!client) {
    return (
      <EmptyState
        icon={UserX}
        title="Client not found."
        description="This client is not in your list. Open it again from Clients."
      />
    );
  }

  // Generate prompt live from client data if not pre-stored
  const buildPrompt = client.promptText || generateBuildPrompt(client);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(buildPrompt);
    toast.success('Pucho Code Master Prompt copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([buildPrompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${client.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-build-spec.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Specification downloaded as Markdown!');
  };

  const handleStatusChange = async (statusVal) => {
    await setHandoffStatus(client.id, statusVal);
    toast.success(`Build status updated: "${statusVal}"`);
  };

  const currentStatus = client.buildStatus || 'Not Started';

  return (
    <div className="space-y-5 sm:space-y-6 font-sans max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* Prompt output */}
        <Card className="lg:col-span-2 flex flex-col gap-4 min-w-0">
          <CardHeader
            icon={FileCode}
            title="Pucho Code master build specification"
            description={<>Production-ready build prompt, generated from the Pucho skill file guidelines for <span className="font-medium text-ink-2">{client.name}</span>.</>}
          />

          <div className="space-y-2">
            <SectionLabel
              right={<span className="text-xs text-ink-3 tabular-nums">~{buildPrompt.length.toLocaleString('en-IN')} chars</span>}
            >
              <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden />Master build specification</span>
            </SectionLabel>
            <pre className="w-full h-[420px] sm:h-[520px] p-4 bg-surface-2 text-ink border border-line-soft rounded-xl font-mono text-[13px] overflow-y-auto leading-relaxed select-text whitespace-pre-wrap break-words m-0">
              {buildPrompt}
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownload} icon={Download}>
              Download .md
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopyPrompt} icon={Copy}>
              Copy prompt
            </Button>
          </div>
        </Card>

        {/* Build status */}
        <Card className="flex flex-col gap-4">
          <CardHeader
            title="Build progress"
            description="Copy the prompt and paste it into Pucho Code. Update the build state as you work."
          />

          <div className="space-y-1.5" role="radiogroup" aria-label="Build status">
            {BUILD_STATES.map((st) => {
              const isActive = currentStatus === st.val;
              return (
                <button
                  key={st.val}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => handleStatusChange(st.val)}
                  className={cx(
                    'w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm text-left transition-colors duration-150 flex items-center gap-3',
                    isActive
                      ? 'bg-accent-soft border-accent-edge text-ink font-medium'
                      : 'bg-surface border-line text-ink-2 hover:bg-surface-2'
                  )}
                >
                  <span
                    className={cx(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                      isActive ? 'border-accent bg-accent' : 'border-line-strong bg-surface'
                    )}
                    aria-hidden
                  >
                    {isActive && <Check className="w-2.5 h-2.5 text-surface" strokeWidth={3} />}
                  </span>
                  <span className="flex-1 min-w-0">{st.label}</span>
                </button>
              );
            })}
          </div>

          {onNextStep && (
            <div className="pt-4 border-t border-line-soft">
              <Button
                variant="primary"
                onClick={onNextStep}
                iconRight={ArrowRight}
                className="w-full"
              >
                Proceed to compliance scan
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
