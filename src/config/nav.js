import {
  LayoutGrid,
  Users,
  Settings,
  FileText,
  Search,
  Network,
  Edit3,
  CheckSquare,
  Send,
  Code,
  ShieldCheck,
  Layers,
  Sliders,
  BarChart3,
  Inbox,
  FolderHeart,
  Sparkles
} from 'lucide-react';

export const NAV = [
  { path: '/overview', label: 'Overview', icon: LayoutGrid },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const CLIENT_NAV = [
  { key: 'setup', path: 'setup', label: 'Business Setup', icon: FileText },
  { key: 'keywords', path: 'keywords', label: 'Keyword Research', icon: Search },
  { key: 'structure', path: 'structure', label: 'Website Structure', icon: Network },
  { key: 'planning', path: 'planning', label: 'Page Planning', icon: Edit3 },
  { key: 'proposal', path: 'proposal', label: 'Client Proposal', icon: Send },
  { key: 'handoff', path: 'handoff', label: 'Build & Prompt Handoff', icon: Code },
  { key: 'pre-publish', path: 'pre-publish', label: 'Pre-Publish Check', icon: CheckSquare },
  { key: 'post-deploy', path: 'post-deploy', label: 'Post-Deploy Compliance', icon: ShieldCheck },
  { key: 'pages', path: 'pages', label: 'Pages (Service / Landing / Blog)', icon: Layers },
  { key: 'seo-aeo-geo', path: 'seo-aeo-geo', label: 'SEO, AEO & GEO Management', icon: Sliders },
  { key: 'analytics', path: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'leads', path: 'leads', label: 'Leads / Forms / Bookings', icon: Inbox },
  { key: 'media', path: 'media', label: 'Media Library', icon: FolderHeart },
];

// Resolves the current page title based on path (handles nested clients routes)
// Strictly follows Pucho Header-Title rule: header title is ALWAYS derived from active NAV label.
export function titleForPath(pathname) {
  // If inside a client detail route (e.g. /clients/:id/keywords)
  const clientMatch = pathname.match(/\/clients\/[^/]+\/([^/]+)/);
  if (clientMatch) {
    const subRoute = clientMatch[1];
    if (subRoute === 'workflow') return 'Website Creation Steps';
    const hit = CLIENT_NAV.find(n => n.path === subRoute);
    if (hit) return hit.label;
  }

  // Pages that are routes but not sidebar items
  if (pathname === '/templates' || pathname.startsWith('/templates/')) return 'Templates';

  // Exact or prefix matching top level routes
  const topHit = NAV.find(n => pathname === n.path || (n.path !== '/' && pathname.startsWith(n.path)));
  return topHit ? topHit.label : 'Not found';
}
