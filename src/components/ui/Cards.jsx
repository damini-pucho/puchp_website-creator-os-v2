// Shared primitives (Pucho Design System, docs/ui-rules.md). Kept under this file name because every page imports
// { Card, StatCard, Button, StatusPill, EmptyState } from here. More primitives live in ./primitives.jsx.
import React from 'react';
import { Loader2 } from 'lucide-react';
import { toneOf, TONE_DOT, statusLabel } from './tone';

const cx = (...a) => a.filter(Boolean).join(' ');
const TONE_DISC = { ok: 'bg-ok-soft text-ok-text', warn: 'bg-warn-soft text-warn-text', bad: 'bg-bad-soft text-bad-text', info: 'bg-info-soft text-info-text' };

/** Card — white surface, hairline @15 %, radius 16, no resting shadow. A clickable card changes its border, never lifts. */
export const Card = ({ children, className = '', onClick, padded = true, as: Tag = 'div', ...rest }) => (
  <Tag
    onClick={onClick}
    className={cx(
      'bg-surface rounded-2xl border border-line',
      padded && 'p-4 sm:p-5',
      onClick && 'cursor-pointer transition-colors duration-150 hover:border-line-strong hover:bg-hover',
      className
    )}
    {...rest}
  >
    {children}
  </Tag>
);

/**
 * StatCard — one KPI. Every KPI opens the list behind it: pass `to` (a router path) or `onClick`.
 * `tone` (ok | warn | bad | info) only when the number's meaning is a status; otherwise the value stays ink.
 */
export const StatCard = ({ icon: Icon, label, value, sub, delta, tone, onClick, active = false, className = '' }) => {
  const clickable = !!onClick;
  const Tag = clickable ? 'button' : 'div';
  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={clickable ? active : undefined}
      className={cx(
        'text-left w-full bg-surface rounded-2xl border p-4 sm:p-5 flex flex-col gap-3 min-w-0',
        active ? 'border-ink' : 'border-line',
        clickable && 'transition-colors duration-150 hover:border-line-strong',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="label-mono line-clamp-2 min-w-0">{label}</span>
        {Icon && (
          <span className={cx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
            TONE_DISC[tone] || 'bg-surface-2 text-ink-3')}>
            <Icon className="w-4 h-4" strokeWidth={1.7} aria-hidden />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className={cx('text-[22px] leading-7 sm:text-[28px] sm:leading-8 font-semibold tabular-nums truncate', tone === 'bad' ? 'text-bad-text' : 'text-ink')}>{value}</div>
        {(sub || delta != null) && (
          <div className="mt-1 text-xs text-ink-3 flex items-center gap-2 min-w-0">
            {delta != null && (
              <span className={cx('font-medium', delta >= 0 ? 'text-ok-text' : 'text-bad-text')}>{delta >= 0 ? '+' : ''}{delta}%</span>
            )}
            {sub && <span className="truncate">{sub}</span>}
          </div>
        )}
      </div>
    </Tag>
  );
};

/**
 * Button — DS sizes: sm 33 h r8 13 px · md 40 h r12 14 px · lg 44 h r12 15 px (44 on phones for md/lg).
 * primary = ink fill (one per view) · secondary = surface + border @30 % · ghost · danger = red text.
 */
export const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, className = '', disabled, type = 'button', ...p }) => {
  const sizes = {
    sm: 'h-[33px] px-3 rounded-md text-[13px] gap-1.5',
    md: 'h-11 sm:h-10 px-4 rounded-xl text-sm gap-2',
    lg: 'h-11 px-5 rounded-xl text-[15px] gap-2',
  };
  const styles = {
    primary: 'bg-primary text-on-primary hover:bg-primary-hover disabled:bg-surface-2 disabled:text-ink-4',
    secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2 disabled:text-ink-4 disabled:border-line',
    ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink disabled:text-ink-4',
    danger: 'bg-surface text-bad-text border border-line-strong hover:bg-bad-soft hover:border-bad-edge disabled:text-ink-4',
    accent: 'bg-accent-soft text-accent-text border border-accent-edge hover:bg-accent-soft/70 disabled:text-ink-4',
  };
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-colors duration-150 shrink-0',
        sizes[size] || sizes.md,
        styles[variant] || styles.primary,
        className
      )}
      {...p}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : Icon && <Icon className="w-4 h-4" strokeWidth={1.8} aria-hidden />}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4" strokeWidth={1.8} aria-hidden />}
    </button>
  );
};

/** StatusPill — the DS status chip: pill, subtle fill, 7 px dot in the status colour, 12 px text. Text beside colour. */
export const StatusPill = ({ status, label, className = '' }) => {
  const raw = String(status || 'Pending Approval').trim();
  const k = raw.toLowerCase();
  const text = label || statusLabel(raw);
  const tone = toneOf(raw);
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 h-6 pl-2 pr-2.5 rounded-full bg-surface-2 text-xs font-medium whitespace-nowrap',
        tone === 'bad' ? 'text-bad-text' : 'text-ink-2',
        className
      )}
    >
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: TONE_DOT[tone] }} aria-hidden />
      {text}
    </span>
  );
};

/** EmptyState — says why it is empty and offers the next step. The heading takes the display serif (DS Display). */
export const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={cx('flex flex-col items-center justify-center px-6 py-12 text-center bg-surface rounded-2xl border border-line gap-3', className)}>
    {Icon && (
      <div className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center text-ink-3">
        <Icon className="w-5 h-5" strokeWidth={1.7} aria-hidden />
      </div>
    )}
    <div className="space-y-1">
      <h3 className="font-serif text-[22px] leading-7 font-medium text-ink">{title}</h3>
      {description && <p className="text-sm text-ink-3 max-w-md leading-relaxed">{description}</p>}
    </div>
    {action && <div className="pt-1">{action}</div>}
  </div>
);
