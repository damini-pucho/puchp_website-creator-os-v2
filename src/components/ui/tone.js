// toneOf — a status word → its tone. Colour is status: ok (done / approved / live), warn (waiting / in progress),
// bad (failed / overdue / rejected / destructive), info (sent / in flight / new), neutral (draft / not started).
// Unknown words are neutral.
const WORDS = {
  ok: ['approved', 'approve', 'proposal_approved', 'live', 'published', 'complete', 'completed', 'build complete', 'done', 'passed', 'pass',
    'active', 'verified', 'ok', 'success', 'succeeded', 'resolved', 'won', 'connected', 'ready', 'healthy', 'indexed', 'compliant', 'good'],
  warn: ['pending', 'pending approval', 'pending client approval', 'awaiting approval', 'in progress', 'in_progress', 'processing', 'building',
    'running', 'queued', 'waiting', 'review', 'in review', 'needs review', 'draft ready', 'partial', 'warning', 'medium', 'due soon',
    'pending checklist verification', 'needs attention', 'fair', 'changes requested', 'proposal_sent', 'proposal sent'],
  bad: ['failed', 'fail', 'error', 'rejected', 'overdue', 'blocked', 'critical', 'high', 'missing', 'broken', 'lost', 'poor', 'down'],
  info: ['new', 'sent', 'scheduled', 'awaiting', 'contacted', 'assigned', 'open', 'submitted', 'setup', 'planning', 'planned'],
};
const MAP = new Map();
for (const [tone, list] of Object.entries(WORDS)) for (const w of list) MAP.set(w, tone);

export function toneOf(status) {
  const k = String(status ?? '').trim().toLowerCase();
  if (!k) return 'neutral';
  if (MAP.has(k)) return MAP.get(k);
  if (/fail|error|reject|overdue|block|missing/.test(k)) return 'bad';
  if (/approv|complete|live|done|pass|success|verified/.test(k)) return 'ok';
  if (/pending|progress|await|review|running|queue|build/.test(k)) return 'warn';
  return 'neutral';
}

export const TONE_DOT = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  info: 'var(--accent)',
  neutral: 'var(--ink-4)',
};

// statusLabel — one display label per stored status value (QA M-08). The database mixes 'proposal_sent', 'Live',
// 'Awaiting Approval', 'Pending' and 'Pending Client Approval'; people see one consistent wording.
const LABELS = {
  proposal_sent: 'Proposal sent',
  'proposal sent': 'Proposal sent',
  'revised proposal sent': 'Revised proposal sent',
  pending: 'Pending approval',
  'pending approval': 'Pending approval',
  'pending client approval': 'Pending approval',
  'awaiting approval': 'Awaiting approval',
  approve: 'Approved',
  approved: 'Approved',
  proposal_approved: 'Approved',
  'changes requested': 'Changes requested',
  live: 'Live',
  setup: 'Setup',
  draft: 'Draft',
  'build complete': 'Build complete',
  'not started': 'Not started',
  'in progress': 'In progress',
};

export function statusLabel(status) {
  const raw = String(status ?? '').trim();
  if (!raw) return '';
  const hit = LABELS[raw.toLowerCase()];
  if (hit) return hit;
  const words = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
