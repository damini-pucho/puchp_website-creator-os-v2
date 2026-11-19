import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ClientProvider, useClients } from './context/ClientContext';
import { ThemeProvider } from './context/ThemeContext';
import puchoLogo from './assets/brand/logo.png';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Overview from './pages/Overview';
import Clients from './pages/Clients';
import BusinessSetup from './pages/BusinessSetup';
import KeywordResearch from './pages/KeywordResearch';
import WebsiteStructure from './pages/WebsiteStructure';
import PagePlanning from './pages/PagePlanning';
import ClientProposal from './pages/ClientProposal';
import BuildHandoff from './pages/BuildHandoff';
import PrePublishCheck from './pages/PrePublishCheck';
import PostDeployCompliance from './pages/PostDeployCompliance';
import PagesList from './pages/PagesList';
import SeoAeoGeoManagement from './pages/SeoAeoGeoManagement';
import Analytics from './pages/Analytics';
import LeadsInbox from './pages/LeadsInbox';
import MediaLibrary from './pages/MediaLibrary';
import Settings from './pages/Settings';
import GuidedWorkflow from './pages/GuidedWorkflow';
import TemplateGalleryPage from './pages/TemplateGalleryPage';
import NotFound from './pages/NotFound';

// Route guard: only a live session opens the app; the sign-in page then returns to the page that was asked for.
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
}

// '/' is the sign-in page for visitors; a signed-in person goes straight to the overview (QA L-04).
function LoginRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/overview" replace /> : <Login />;
}

// A client page needs a client that exists ('new' starts onboarding). No blank, editable form for an unknown id (QA M-02).
function ClientRoute({ children }) {
  const { clientId } = useParams();
  const { loading, getClient } = useClients();
  if (clientId === 'new') return children;
  if (loading) return <div className="max-w-xl mx-auto pt-12 text-center text-sm text-ink-3" role="status">Loading client…</div>;
  return getClient(clientId) ? children : <NotFound kind="client" />;
}

// "Powered by Pucho.ai" — inside the app it sits in the sidebar footer; on the public proposal page (seen by the
// client) it is this quiet corner mark. Local asset: no request leaves the app.
function BrandingBadge() {
  const { pathname } = useLocation();
  if (!pathname.startsWith('/p/')) return null;
  return (
    <div data-print-hide className="hidden sm:flex fixed bottom-4 right-4 z-10 items-center gap-2 h-8 px-3 rounded-full bg-surface border border-line text-xs text-ink-3 select-none">
      <span>Powered by</span>
      <img src={puchoLogo} alt="Pucho.ai" className="h-3.5 w-auto object-contain dark:invert" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <DataProvider>
        <ClientProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/" element={<LoginRoute />} />

            {/* Authenticated Dashboard Shell */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="overview" element={<Overview />} />
              <Route path="clients" element={<Clients />} />
              <Route path="templates" element={<TemplateGalleryPage />} />
              
              {/* Client Scoped Guided AI Workflow */}
              <Route path="clients/:clientId/workflow" element={<ClientRoute><GuidedWorkflow /></ClientRoute>} />
              <Route path="clients/:clientId" element={<Navigate to="workflow" replace />} />

              {/* Client Scoped detail views (legacy / direct access) */}
              <Route path="clients/:clientId/setup" element={<ClientRoute><BusinessSetup /></ClientRoute>} />
              <Route path="clients/:clientId/keywords" element={<ClientRoute><KeywordResearch /></ClientRoute>} />
              <Route path="clients/:clientId/structure" element={<ClientRoute><WebsiteStructure /></ClientRoute>} />
              <Route path="clients/:clientId/planning" element={<ClientRoute><PagePlanning /></ClientRoute>} />
              <Route path="clients/:clientId/proposal" element={<ClientRoute><ClientProposal /></ClientRoute>} />
              <Route path="clients/:clientId/handoff" element={<ClientRoute><BuildHandoff /></ClientRoute>} />
              <Route path="clients/:clientId/pre-publish" element={<ClientRoute><PrePublishCheck /></ClientRoute>} />
              <Route path="clients/:clientId/post-deploy" element={<ClientRoute><PostDeployCompliance /></ClientRoute>} />
              <Route path="clients/:clientId/pages" element={<ClientRoute><PagesList /></ClientRoute>} />
              <Route path="clients/:clientId/seo-aeo-geo" element={<ClientRoute><SeoAeoGeoManagement /></ClientRoute>} />
              <Route path="clients/:clientId/analytics" element={<ClientRoute><Analytics /></ClientRoute>} />
              <Route path="clients/:clientId/leads" element={<ClientRoute><LeadsInbox /></ClientRoute>} />
              <Route path="clients/:clientId/media" element={<ClientRoute><MediaLibrary /></ClientRoute>} />

              {/* Top-Level Settings */}
              <Route path="settings" element={<Settings />} />

              {/* Unknown address inside the app (signed in) */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Public Live Shareable Proposal Route */}
            <Route path="p/:clientId" element={<ClientProposal isPublicShare={true} />} />
          </Routes>

          {/* Toast Notification Container */}
          <Toaster position="top-right" closeButton />

          {/* Canonical branding indicator */}
          <BrandingBadge />
        </BrowserRouter>
      </ClientProvider>
      </DataProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
