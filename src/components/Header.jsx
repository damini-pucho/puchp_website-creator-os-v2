// Header — 56 px. Left: the page title (from the nav config) and one short context line. Centre: global search
// (clients by name, industry, city, website — Ctrl/⌘ K). Right: install, theme toggle, the bell (clients that need
// the partner's action), a quiet clock. No avatar here: the account menu is the profile at the bottom-left.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { titleForPath } from '../config/nav';
import { useClients } from '../context/ClientContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Menu, Moon, Search, Sun, X, Download, ExternalLink } from 'lucide-react';
import { Avatar } from './ui/primitives';
import { TONE_DOT, statusLabel } from './ui/tone';

const cx = (...a) => a.filter(Boolean).join(' ');

// Current time, re-rendered at the start of every minute
function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer;
    const tick = () => {
      const current = new Date();
      setNow(current);
      timer = setTimeout(tick, 60000 - (current.getSeconds() * 1000 + current.getMilliseconds()));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return now;
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return { open, setOpen, ref };
}

// PWA install: the browser's prompt, offered only when it is available
function useInstall() {
  const [evt, setEvt] = useState(null);
  useEffect(() => {
    const on = (e) => { e.preventDefault(); setEvt(e); };
    const done = () => setEvt(null);
    window.addEventListener('beforeinstallprompt', on);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done); };
  }, []);
  return evt ? async () => { evt.prompt(); try { await evt.userChoice; } finally { setEvt(null); } } : null;
}

// one search instance at a time (both would answer Ctrl-K): a centre bar from 1280 px, an icon on the right below
// that, so the page title keeps its room on laptops and tablets (QA L-02)
function useIsWide() {
  const q = '(min-width: 1280px)';
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setWide(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return wide;
}

const iconBtn = 'relative w-10 h-10 rounded-xl flex items-center justify-center text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors duration-150 shrink-0';

function ClientSearch({ wide = false }) {
  const { clients } = useClients();
  const navigate = useNavigate();
  const S = usePopover();
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); S.setOpen((o) => !o); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return clients.filter((c) => [c.name, c.industry, c.location, c.website, c.liveUrl, c.contactName, c.email]
      .some((v) => String(v || '').toLowerCase().includes(t))).slice(0, 8);
  }, [q, clients]);

  const pick = (c) => { S.setOpen(false); setQ(''); navigate(`/clients/${c.id}/workflow`); };

  return (
    <div ref={S.ref} className={wide ? "relative w-full max-w-[420px]" : "relative"}>
      {wide ? (<button type="button" onClick={() => S.setOpen((o) => !o)} aria-label="Search clients (Ctrl+K)" title="Search clients (Ctrl+K)"
        className="flex w-full items-center gap-2.5 h-10 px-3 rounded-xl bg-surface-2 text-ink-3 text-sm hover:text-ink-2 transition-colors">
        <Search className="w-4 h-4 shrink-0" strokeWidth={1.7} aria-hidden />
        <span className="flex-1 text-left truncate">Search clients…</span>
        <kbd className="font-mono text-xs text-ink-3 border border-line rounded-md px-1.5 leading-5">Ctrl K</kbd>
      </button>
      ) : (
      <button type="button" onClick={() => S.setOpen((o) => !o)} aria-label="Search clients" title="Search clients (Ctrl+K)" className={iconBtn}>
        <Search className="w-[18px] h-[18px]" strokeWidth={1.7} />
      </button>
      )}
      {S.open && (
        <div className={cx(wide ? 'absolute left-0 right-0 top-12' : 'fixed left-2 right-2 top-14 sm:left-auto sm:right-4 sm:w-[420px]', 'bg-surface border border-line rounded-2xl shadow-float z-50 overflow-hidden animate-fade-in')}>
          <div className="flex items-center gap-2 px-3 h-12 border-b border-line">
            <Search className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.7} aria-hidden />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client name, industry, city or website"
              aria-label="Search clients" className="flex-1 min-w-0 bg-transparent outline-none text-sm text-ink placeholder:text-ink-4" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search" title="Clear" className="w-8 h-8 rounded-md flex items-center justify-center text-ink-3 hover:bg-surface-2"><X className="w-4 h-4" /></button>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {results.length > 0 && <p className="label-mono px-4 pt-2 pb-1">Clients · {results.length}</p>}
            {results.map((c) => (
              <button key={c.id} type="button" onClick={() => pick(c)} className="w-full text-left px-4 py-2 hover:bg-surface-2 flex items-center gap-3">
                <Avatar name={c.name} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink truncate">{c.name}</span>
                  <span className="block text-xs text-ink-3 truncate">{[c.industry, c.location].filter(Boolean).join(' · ') || c.website || '—'}</span>
                </span>
                <span className="text-xs text-ink-3 shrink-0">{statusLabel(c.status)}</span>
              </button>
            ))}
            {q.trim().length >= 2 && !results.length && <p className="px-4 py-6 text-[13px] text-ink-3">No client matches "{q}". Try a name, industry, city or website.</p>}
            {q.trim().length < 2 && <p className="px-4 py-5 text-[13px] text-ink-3">Type at least two letters to search {clients.length} client{clients.length === 1 ? '' : 's'}.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// The bell lists what waits on the partner: proposals the client sent back, and builds that failed.
function NeedsAction() {
  const { clients } = useClients();
  const N = usePopover();
  const items = useMemo(() => clients.flatMap((c) => {
    const out = [];
    const p = String(c.proposalStatus || c.status || '').toLowerCase();
    if (p === 'changes requested') out.push({ c, label: 'Changes requested', tone: 'bad' });
    if (/fail/.test(String(c.buildStatus || '').toLowerCase())) out.push({ c, label: 'Build failed', tone: 'bad' });
    return out;
  }), [clients]);

  return (
    <div ref={N.ref} className="relative">
      <button type="button" onClick={() => N.setOpen((o) => !o)} aria-label={`Needs action, ${items.length}`} title="Needs action" className={iconBtn}>
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.7} />
        {items.length > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-bad-soft border border-bad-edge text-bad-text text-xs leading-4 font-medium text-center tabular-nums">
            {items.length > 99 ? '99+' : items.length}
          </span>
        )}
      </button>
      {N.open && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-14 sm:top-12 sm:w-[380px] bg-surface border border-line rounded-2xl shadow-float z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-line">
            <p className="text-[13px] font-semibold text-ink">Needs action · {items.length}</p>
            <p className="text-xs text-ink-3">Proposals sent back by a client and failed builds.</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {items.map(({ c, label, tone }) => (
              <Link key={`${c.id}-${label}`} to={`/clients/${c.id}/workflow`} onClick={() => N.setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2">
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: TONE_DOT[tone] }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-ink truncate"><span className="font-medium text-bad-text">{label}</span> · {c.name}</span>
                  <span className="block text-xs text-ink-3 truncate">{[c.industry, c.location].filter(Boolean).join(' · ')}</span>
                </span>
              </Link>
            ))}
            {!items.length && <p className="px-4 py-6 text-[13px] text-ink-3">All clear — nothing is waiting on you.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, mode, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} theme${mode === 'system' ? ' (following your system)' : ''} · Shift-click: follow system`;
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button type="button" onClick={(e) => toggle(e.shiftKey)} aria-label={`Switch to ${next} theme`} title={label} className={iconBtn}>
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
    </button>
  );
}

export default function Header({ onToggleMobile }) {
  const { pathname } = useLocation();
  const now = useMinuteClock();
  const { getClient, selectedClient } = useClients();
  const install = useInstall();
  const wide = useIsWide();

  const title = titleForPath(pathname);
  const clientMatch = pathname.match(/\/clients\/([^/]+)/);
  const activeClient = clientMatch ? getClient(clientMatch[1]) : null;
  const subtitle = activeClient ? activeClient.name : null;
  const liveUrl = (activeClient || selectedClient)?.liveUrl;

  return (
    <header className="sticky top-0 z-20 h-14 shrink-0 px-3 sm:px-5 grid grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)_auto] items-center gap-3 border-b border-line"
      style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-2 min-w-0">
        <button type="button" onClick={onToggleMobile} aria-label="Open menu" title="Open menu" className={cx(iconBtn, 'md:hidden -ml-1 w-11 h-11')}>
          <Menu className="w-5 h-5" strokeWidth={1.7} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[17px] leading-6 font-semibold text-ink truncate">{title}</h1>
          {subtitle && <p className="text-xs text-ink-3 truncate leading-4">{subtitle}</p>}
        </div>
      </div>

      <div className="hidden xl:flex justify-center min-w-0">{wide && <ClientSearch wide />}</div>

      <div className="flex items-center justify-end gap-1 min-w-0">
        {!wide && <ClientSearch />}
        {liveUrl && activeClient && (
          <a href={liveUrl} target="_blank" rel="noreferrer" title="Open the live site in a new tab"
            className="hidden lg:inline-flex items-center gap-1.5 whitespace-nowrap h-[33px] px-3 rounded-md border border-line-strong text-[13px] font-medium text-ink hover:bg-surface-2 mr-1">
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden /> Live site
          </a>
        )}
        {install && (
          <button type="button" onClick={install} aria-label="Install the app" title="Install the app on this device" className={iconBtn}>
            <Download className="w-[18px] h-[18px]" strokeWidth={1.7} />
          </button>
        )}
        <ThemeToggle />
        <NeedsAction />
        <span className="hidden 2xl:inline text-xs text-ink-3 tabular-nums pl-2 whitespace-nowrap" title={now.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}>
          {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </span>
      </div>
    </header>
  );
}
