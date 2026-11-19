// Pucho Design System primitives for this app (docs/ui-rules.md). Tokens only — no hex, no bg-white, no gray-*.
import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { toneOf, TONE_DOT } from './tone';

export { toneOf, TONE_DOT };
export const cx = (...a) => a.filter(Boolean).join(' ');

/* ── layout ─────────────────────────────────────────────────────────────────────────────────────────── */

/** Page — the content column: max width, 20–24 px between blocks, a calm one-time entrance. */
export function Page({ children, className = '', width = 'max-w-[1280px]' }) {
  return <div className={cx('w-full mx-auto space-y-5 sm:space-y-6 animate-fade-in', width, className)}>{children}</div>;
}

/**
 * PageHeader — the in-page heading row. The shell header already shows the page title, so this carries the context
 * (eyebrow, a heading only where it adds information, a one-line description) and ≤ 3 actions, primary last (right).
 */
export function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={cx('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3', className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className="label-mono">{eyebrow}</p>}
        {title && <h2 className="text-[22px] leading-7 font-semibold text-ink">{title}</h2>}
        {description && <p className="text-sm text-ink-3 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** SectionLabel — whitespace before boxes: a mono uppercase label (+ optional count and right-side content). */
export function SectionLabel({ children, count, right, className = '' }) {
  return (
    <div className={cx('flex items-center justify-between gap-3 min-h-6', className)}>
      <p className="label-mono">
        {children}
        {count != null && <span className="ml-1.5 text-ink-4">· {count}</span>}
      </p>
      {right}
    </div>
  );
}

/** CardHeader — heading 15 semibold, optional description and one action on the right. */
export function CardHeader({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={cx('flex items-start justify-between gap-3', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="w-9 h-9 rounded-xl bg-surface-2 text-ink-2 flex items-center justify-center shrink-0">
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] leading-6 font-semibold text-ink">{title}</h3>
          {description && <p className="text-[13px] text-ink-3 mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── status, chips, callouts ───────────────────────────────────────────────────────────────────────── */

/** Badge — status chip with a dot. `tone` overrides the word → tone map. */
export function Badge({ children, tone, className = '' }) {
  const t = tone || toneOf(typeof children === 'string' ? children : '');
  return (
    <span className={cx('inline-flex items-center gap-1.5 h-6 pl-2 pr-2.5 rounded-full bg-surface-2 text-xs font-medium whitespace-nowrap', t === 'bad' ? 'text-bad-text' : 'text-ink-2', className)}>
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: TONE_DOT[t] || TONE_DOT.neutral }} aria-hidden />
      {children}
    </span>
  );
}

/** Tag — a neutral label (no status meaning): hairline pill. */
export function Tag({ children, className = '' }) {
  return <span className={cx('inline-flex items-center h-6 px-2.5 rounded-full border border-line text-xs text-ink-2 whitespace-nowrap', className)}>{children}</span>;
}

/** Chip — filter chip with an optional count; aria-pressed is the selected state (ink fill). */
export function Chip({ children, count, selected = false, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors duration-150 shrink-0',
        selected ? 'bg-ink text-surface border-ink' : 'bg-surface text-ink-3 border-line hover:bg-surface-2 hover:text-ink'
      , className)}
    >
      {children}
      {count != null && <span className={cx('tabular-nums', selected ? 'opacity-70' : 'text-ink-4')}>{count}</span>}
    </button>
  );
}

/** ChipRow — scrolls sideways on phones instead of wrapping into three rows. */
export function ChipRow({ children, className = '' }) {
  return <div className={cx('flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5', className)}>{children}</div>;
}

const CALLOUT = {
  info: { box: 'bg-info-soft border-info-edge', icon: Info, ink: 'text-info-text' },
  ok: { box: 'bg-ok-soft border-ok-edge', icon: CheckCircle2, ink: 'text-ok-text' },
  warn: { box: 'bg-warn-soft border-warn-edge', icon: AlertTriangle, ink: 'text-warn-text' },
  bad: { box: 'bg-bad-soft border-bad-edge', icon: AlertCircle, ink: 'text-bad-text' },
  neutral: { box: 'bg-surface-2 border-line', icon: Info, ink: 'text-ink-2' },
};
/** Callout — the DS banner: r12, tinted fill and edge, icon disc. Renders nothing when empty. */
export function Callout({ tone = 'info', title, children, action, icon, className = '' }) {
  if (!title && !children) return null;
  const c = CALLOUT[tone] || CALLOUT.info;
  const Icon = icon || c.icon;
  return (
    <div role={tone === 'bad' ? 'alert' : undefined} className={cx('flex items-start gap-3 rounded-xl border px-4 py-3', c.box, className)}>
      <span className="w-[22px] h-[22px] rounded-full bg-surface flex items-center justify-center shrink-0 mt-px">
        <Icon className={cx('w-3.5 h-3.5', c.ink)} strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-5">
        {title && <p className={cx('font-medium', c.ink)}>{title}</p>}
        {children && <div className="text-ink-2">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── progress and steps ────────────────────────────────────────────────────────────────────────────── */

/** Progress — 6 px track. tone 'auto': ok ≥ 80, warn ≥ 50, bad below; 'accent' for a bar with no status meaning. */
export function Progress({ value = 0, max = 100, tone = 'accent', label, showValue = false, className = '' }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const t = tone === 'auto' ? (pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : 'bad') : tone;
  const fill = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', accent: 'var(--accent)', ink: 'var(--ink)' }[t] || 'var(--accent)';
  return (
    <div className={cx('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-ink-3 mb-1.5">
          <span>{label}</span>
          {showValue && <span className="tabular-nums font-medium text-ink-2">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: fill }} />
      </div>
    </div>
  );
}

/** StepDot — the DS stepper node: done violet ✓ · current white + violet ring · upcoming subtle + hairline. */
export function StepDot({ state = 'upcoming', n }) {
  if (state === 'done') return (
    <span className="w-[26px] h-[26px] rounded-full bg-accent text-surface flex items-center justify-center shrink-0" aria-hidden>
      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
    </span>
  );
  if (state === 'current') return (
    <span className="w-[26px] h-[26px] rounded-full bg-surface border-2 border-accent text-accent-text text-xs font-semibold flex items-center justify-center shrink-0" aria-hidden>{n}</span>
  );
  return <span className="w-[26px] h-[26px] rounded-full bg-surface-2 border border-line text-ink-3 text-xs font-medium flex items-center justify-center shrink-0" aria-hidden>{n}</span>;
}

/* ── tabs ──────────────────────────────────────────────────────────────────────────────────────────── */

/** Tabs — underline tabs; the selected tab gets ink text and an accent marker. Scrolls sideways on phones. */
export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div role="tablist" className={cx('flex items-center gap-1 border-b border-line overflow-x-auto no-scrollbar', className)}>
      {tabs.map((t) => {
        const id = t.id ?? t.value ?? t.key;
        const sel = id === value;
        const Icon = t.icon;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sel}
            onClick={() => onChange?.(id)}
            className={cx(
              'relative inline-flex items-center gap-2 h-11 px-3 text-sm whitespace-nowrap transition-colors duration-150 shrink-0',
              sel ? 'text-ink font-medium' : 'text-ink-3 hover:text-ink'
            )}
          >
            {Icon && <Icon className="w-4 h-4" strokeWidth={1.7} aria-hidden />}
            {t.label}
            {t.count != null && <span className="text-xs tabular-nums text-ink-4">{t.count}</span>}
            {sel && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-accent" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** Segmented — a small view switch (table / cards …): subtle track, selected = surface + hairline. */
export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={cx('inline-flex items-center p-0.5 rounded-xl bg-surface-2 border border-line-soft', className)}>
      {options.map((o) => {
        const id = o.value ?? o.id;
        const sel = id === value;
        const Icon = o.icon;
        return (
          <button key={id} type="button" aria-pressed={sel} aria-label={o.ariaLabel || (typeof o.label === 'string' ? o.label : undefined)} onClick={() => onChange?.(id)}
            className={cx('inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[13px] font-medium transition-colors duration-150',
              sel ? 'bg-surface text-ink border border-line' : 'text-ink-3 hover:text-ink border border-transparent')}>
            {Icon && <Icon className="w-4 h-4" strokeWidth={1.7} aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── fields ────────────────────────────────────────────────────────────────────────────────────────── */

/** Field — label (13 medium ink-3) above the control, helper or error (12) below. */
export function Field({ label, htmlFor, hint, error, required, children, className = '' }) {
  return (
    <div className={cx('space-y-1.5 min-w-0', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-3">
          {label}{required && <span className="text-bad-text ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-bad-text">{error}</p> : hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

export const TextInput = React.forwardRef(function TextInput({ className = '', invalid, ...p }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cx('field', className)} {...p} />;
});
export const TextArea = React.forwardRef(function TextArea({ className = '', invalid, ...p }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cx('field', className)} {...p} />;
});
export const Select = React.forwardRef(function Select({ className = '', invalid, children, ...p }, ref) {
  return <select ref={ref} aria-invalid={invalid || undefined} className={cx('field', className)} {...p}>{children}</select>;
});

/** Toggle — DS switch 44×26, off #E0DDD6 / on violet. */
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled} onClick={() => onChange?.(!checked)}
      className={cx('relative w-11 h-[26px] rounded-full transition-colors duration-200 shrink-0 disabled:opacity-40', checked ? 'bg-accent' : 'bg-line-strong')}>
      <span className={cx('absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform duration-200', checked && 'translate-x-[18px]')} />
    </button>
  );
}

/** IconButton — an icon-only button always carries an aria-label (and a title as its tooltip). 40 px (44 on phones). */
export function IconButton({ icon: Icon, label, className = '', size = 'md', ...p }) {
  const s = size === 'sm' ? 'w-8 h-8 rounded-md' : 'w-11 h-11 sm:w-10 sm:h-10 rounded-xl';
  return (
    <button type="button" aria-label={label} title={label} className={cx('inline-flex items-center justify-center text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors duration-150 shrink-0 disabled:text-ink-4', s, className)} {...p}>
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} aria-hidden />
    </button>
  );
}

/* ── loading ───────────────────────────────────────────────────────────────────────────────────────── */

export function Skeleton({ className = '' }) {
  return <div className={cx('rounded-xl bg-surface-2 animate-pulse', className)} aria-hidden />;
}

/** Working — a truthful pending line: a static dot and words (no invented percentage). */
export function Working({ children = 'Working…', className = '' }) {
  return (
    <div className={cx('inline-flex items-center gap-2 text-[13px] text-ink-3', className)} role="status" aria-live="polite">
      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden />
      {children}
    </div>
  );
}

/* ── overlays ──────────────────────────────────────────────────────────────────────────────────────── */

function useOverlay(open, onClose) {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => panel.current?.focus(), 0);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, [open, onClose]);
  return panel;
}

/**
 * Modal — centred dialog, r20, floating shadow, Escape closes and focus returns. Footer: actions bottom-right,
 * primary last. Full-height sheet on phones.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', className = '' }) {
  const panel = useOverlay(open, onClose);
  const titleId = useId();
  if (!open) return null;
  const w = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' }[size] || 'sm:max-w-xl';
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-scrim animate-fade" onClick={onClose} aria-hidden />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}
        className={cx('relative w-full bg-surface border border-line rounded-t-3xl sm:rounded-3xl shadow-float flex flex-col max-h-[92vh] outline-none animate-scale-up', w, className)}>
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3">
            <div className="min-w-0">
              {title && <h2 id={titleId} className="text-[17px] leading-6 font-semibold text-ink">{title}</h2>}
              {description && <p className="text-[13px] text-ink-3 mt-0.5">{description}</p>}
            </div>
            {onClose && <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2 -mt-1" />}
          </div>
        )}
        <div className="px-5 sm:px-6 pb-5 overflow-y-auto min-h-0 flex-1">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-line flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Drawer — right sheet for a record (r20 on the inner edge), same focus and Escape behaviour. */
export function Drawer({ open, onClose, title, description, children, footer, width = 'sm:max-w-lg' }) {
  const panel = useOverlay(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-scrim animate-fade" onClick={onClose} aria-hidden />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={cx('relative w-full h-full bg-surface border-l border-line sm:rounded-l-3xl shadow-float flex flex-col outline-none animate-slide-in-right', width)}>
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3 border-b border-line">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[17px] leading-6 font-semibold text-ink truncate">{title}</h2>
            {description && <p className="text-[13px] text-ink-3 mt-0.5">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-line flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── data ──────────────────────────────────────────────────────────────────────────────────────────── */

/** KeyValue — a label / value line for record details. */
export function KeyValue({ label, children, className = '' }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 py-2 border-b border-line-soft last:border-0 text-[13px]', className)}>
      <span className="text-ink-3 shrink-0">{label}</span>
      <span className="text-ink text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

/** Tile — label / value on the subtle surface (key figures). */
export function Tile({ label, value, sub, className = '' }) {
  return (
    <div className={cx('rounded-xl bg-surface-2 px-3.5 py-3 min-w-0', className)}>
      <p className="text-xs text-ink-3 truncate">{label}</p>
      <p className="text-[15px] font-semibold text-ink tabular-nums truncate mt-0.5">{value}</p>
      {sub && <p className="text-xs text-ink-3 truncate mt-0.5">{sub}</p>}
    </div>
  );
}

/** Avatar — initials on a neutral disc (people are not colour-coded). */
export function Avatar({ name = '', src, size = 32, className = '' }) {
  const initials = String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const style = { width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.38)) };
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" style={style} className={cx('rounded-full object-cover bg-surface-2 border border-line shrink-0', className)} />;
  return <span style={style} className={cx('rounded-full bg-surface-2 border border-line text-ink-2 font-medium flex items-center justify-center shrink-0', className)} aria-hidden>{initials}</span>;
}

/** Indian number formatting: ₹12,40,000 · 1,24,500 */
export const fmtINR = (n) => (n == null || n === '' || Number.isNaN(Number(n)) ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);
export const fmtNum = (n) => (n == null || n === '' || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('en-IN'));
