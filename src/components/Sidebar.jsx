// Sidebar — the DS sidebar: 260 wide, #FEFEFD (nav token), hairline edge, rows 36 h r12, selected = subtle fill + 500.
// The account menu is the profile at the bottom-left (Profile & settings · Sign out) — there is no avatar in the header.
// On phones the same content is a drawer (Escape closes, focus returns to the menu button).
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV } from '../config/nav';
import { useClients } from '../context/ClientContext';
import { useAuth } from '../context/AuthContext';
import logoMark from '../assets/brand/logo-mark.png';
import puchoLogo from '../assets/brand/logo.png';
import { ChevronsLeft, ChevronsRight, LogOut, X, Wand2, Settings as SettingsIcon, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from './ui/primitives';
import { toneOf, TONE_DOT, statusLabel } from './ui/tone';

const cx = (...a) => a.filter(Boolean).join(' ');
const StatusPillDot = ({ status }) => (
  <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: TONE_DOT[toneOf(status)] }} aria-hidden />
);

function NavRow({ to, icon: Icon, label, active, collapsed, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex items-center gap-3 h-11 md:h-9 rounded-xl text-sm transition-colors duration-150',
        collapsed ? 'justify-center px-0' : 'px-3',
        active ? 'bg-surface-2 text-ink font-medium' : 'text-ink-3 hover:bg-hover hover:text-ink'
      )}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} aria-hidden />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function AccountMenu({ collapsed, onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const name = user?.name || 'Channel Partner';
  const role = [user?.role, user?.agency].filter(Boolean).join(' · ') || 'Channel Partner';

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const signOut = () => {
    setOpen(false);
    logout();
    toast.success('Signed out.');
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${name}`}
        title={collapsed ? name : undefined}
        className={cx('w-full flex items-center gap-2.5 rounded-xl p-2 text-left hover:bg-hover transition-colors duration-150', collapsed && 'justify-center')}
      >
        <Avatar src={user?.avatar} name={name} size={32} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink truncate">{name}</span>
              <span className="block text-xs text-ink-3 truncate">{role}</span>
            </span>
            <ChevronUp className={cx('w-4 h-4 text-ink-3 transition-transform duration-200', !open && 'rotate-180')} aria-hidden />
          </>
        )}
      </button>
      {open && (
        <div role="menu" className={cx('absolute bottom-full mb-2 z-50 w-60 bg-surface border border-line rounded-2xl shadow-float p-1.5 animate-fade-in', collapsed ? 'left-0' : 'left-0 right-0 w-auto')}>
          <div className="px-3 py-2 border-b border-line-soft mb-1">
            <p className="text-sm font-medium text-ink truncate">{name}</p>
            <p className="text-xs text-ink-3 truncate">{user?.email}</p>
          </div>
          <Link role="menuitem" to="/settings" onClick={() => { setOpen(false); onNavigate?.(); }}
            className="flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
            <SettingsIcon className="w-4 h-4" strokeWidth={1.7} aria-hidden /> Profile &amp; settings
          </Link>
          <button role="menuitem" type="button" onClick={signOut}
            className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm text-bad-text hover:bg-bad-soft">
            <LogOut className="w-4 h-4" strokeWidth={1.7} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { pathname } = useLocation();
  const { clients, selectedClient, getClient } = useClients();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const drawerRef = useRef(null);

  const clientMatch = pathname.match(/\/clients\/([^/]+)/);
  const activeClientId = clientMatch ? clientMatch[1] : null;
  const activeClient = activeClientId ? getClient(activeClientId) : (selectedClient || clients[0] || null);

  // phone drawer: Escape closes, focus moves into it and returns to the menu button
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    setTimeout(() => drawerRef.current?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [mobileOpen, setMobileOpen]);

  const renderContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;
    const close = () => { if (isMobile) setMobileOpen(false); };
    const onWorkflow = pathname.includes('/workflow');

    return (
      <div className="flex flex-col h-full bg-nav border-r border-nav-line select-none">
        {/* brand */}
        <div className={cx('h-14 px-3 flex items-center shrink-0', collapsed ? 'justify-center' : 'justify-between')}>
          <Link to="/overview" onClick={close} className="flex items-center gap-2.5 min-w-0 rounded-xl px-1 py-1" aria-label="Website Creator OS — Overview">
            <span className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center shrink-0">
              <img src={logoMark} alt="" className="w-5 h-5 object-contain" />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink truncate">Website Creator</span>
                  <span className="text-xs font-medium text-ink-3 border border-line rounded-md px-1.5 leading-[18px]">V2</span>
                </span>
              </span>
            )}
          </Link>
          {isMobile && (
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" title="Close menu"
              className="w-11 h-11 -mr-1 rounded-xl flex items-center justify-center text-ink-3 hover:bg-hover hover:text-ink">
              <X className="w-5 h-5" strokeWidth={1.7} />
            </button>
          )}
        </div>

        {/* navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4 space-y-6" aria-label="Main">
          <div className="space-y-0.5">
            {!collapsed && <p className="label-mono px-3 pb-2">Workspace</p>}
            {NAV.map(({ path, label, icon }) => (
              <NavRow key={path} to={path} icon={icon} label={label} collapsed={collapsed} onClick={close}
                active={pathname === path || (path !== '/overview' && pathname.startsWith(path) && !(path === '/clients' && onWorkflow))} />
            ))}
          </div>

          {activeClient && (
            <div className="space-y-0.5">
              {!collapsed && <p className="label-mono px-3 pb-2">Client</p>}
              {!collapsed && (
                <Link to={`/clients/${activeClient.id}/workflow`} onClick={close}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-hover min-w-0">
                  <Avatar name={activeClient.name} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink truncate">{activeClient.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-3 truncate">
                      <StatusPillDot status={activeClient.status || 'Draft'} />
                      <span className="truncate">{statusLabel(activeClient.status || 'Draft')}{activeClient.industry ? ` · ${activeClient.industry}` : ''}</span>
                    </span>
                  </span>
                </Link>
              )}
              <NavRow to={`/clients/${activeClient.id}/workflow`} icon={Wand2} label="Website workflow" collapsed={collapsed} onClick={close} active={onWorkflow} />
            </div>
          )}
        </nav>

        {/* footer: collapse + the account menu */}
        <div className="p-3 border-t border-nav-line space-y-1 shrink-0">
          {!isMobile && (
            <button type="button" onClick={() => setIsCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cx('w-full flex items-center gap-3 h-9 rounded-xl text-sm text-ink-3 hover:bg-hover hover:text-ink transition-colors', collapsed ? 'justify-center' : 'px-3')}>
              {collapsed ? <ChevronsRight className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <ChevronsLeft className="w-[18px] h-[18px]" strokeWidth={1.5} />}
              {!collapsed && <span>Collapse</span>}
            </button>
          )}
          <AccountMenu collapsed={collapsed} onNavigate={close} />
          {!collapsed && (
            <p className="flex items-center gap-1.5 px-2 pt-1 text-xs text-ink-3">
              Powered by <img src={puchoLogo} alt="Pucho.ai" className="h-3 w-auto object-contain opacity-80 dark:invert" />
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <aside className={cx('hidden md:flex shrink-0 h-screen relative z-30 transition-[width] duration-200', isCollapsed ? 'w-16' : 'w-[260px]')}>
        <div className="w-full">{renderContent(false)}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-scrim animate-fade" onClick={() => setMobileOpen(false)} aria-hidden />
          <div ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menu"
            className="relative w-[280px] max-w-[85vw] h-full shadow-float outline-none animate-slide-in">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
