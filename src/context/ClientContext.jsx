import React, { createContext, useContext, useEffect } from 'react';
import { generateBuildPrompt } from '../utils/promptGenerator';
import { sendClientToPlanningWorkflow, sendLiveUrlToComplianceWorkflow } from '../utils/api';
import { resolveClientName } from '../utils/resolveClientName';
import { useData } from './DataContext';

const ClientContext = createContext(null);

export const useClients = () => useContext(ClientContext);

// Pre-packaged fallback demo list (Empty so only real database records are displayed)
const fallbackDemoList = [];

export function ClientProvider({ children }) {
  const {
    clients: rawClients,
    complianceHistory: rawComplianceHistory = [],
    activities,
    stats,
    getClient: dbGetClient,
    addClient: dbAddClient,
    saveSetup: dbSaveSetup,
    updateClient,
    deleteClient: dbDeleteClient,
    approveProposal: dbApproveProposal,
    rejectProposal: dbRejectProposal,
    logActivity,
    refresh,
    loading
  } = useData();

  // Robust parsers for the varied DB storage formats.
  const parseJson = (val, fallback) => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return val;
    if (typeof val === 'string') {
      try { const p = JSON.parse(val); return p; } catch { return fallback; }
    }
    return fallback;
  };

  const parsePagePlans = (val) => {
    if (!val) return {};
    if (typeof val === 'object' && !Array.isArray(val)) {
      const keys = Object.keys(val);
      if (keys.length && /^\d+$/.test(keys[0])) {
        try {
          const str = keys.sort((a, b) => a - b).map(k => val[k]).join('');
          return JSON.parse(str);
        } catch { return {}; }
      }
      return val;
    }
    return {};
  };

  const listToNormalize = (rawClients && rawClients.length > 0) ? rawClients : fallbackDemoList;

  // Normalise database snake_case & 1-shot fields to camelCase for UI
  const clients = listToNormalize.map(c => {
    const finalLogo = c.logo_url || c.logoUrl || '';
    const statusClean = String(c.status || '').toLowerCase().trim();
    const propStatusClean = String(c.proposal_status || '').toLowerCase().trim();

    // Approval status derived from DB status ('Approve'/'Approved'/'Live'), proposal_status or user_approved column
    const isApproved = c.user_approved === true ||
      statusClean === 'approve' || statusClean === 'approved' || statusClean === 'live' || statusClean === 'proposal_approved' ||
      propStatusClean === 'approve' || propStatusClean === 'approved' || propStatusClean === 'live' || propStatusClean === 'proposal_approved';

    // Filter DB compliance history records for this specific client
    const matchedHistory = (rawComplianceHistory || [])
      .filter(h => 
        h.client_id === c.id || 
        h.clientId === c.id || 
        (h.business_name && (h.business_name === c.business_name || h.business_name === c.name))
      )
      .map(h => ({
        id: h.id,
        timestamp: h.created_at ? new Date(h.created_at).toLocaleString() : 'Recently',
        url: h.live_url || h.url || c.live_url || '',
        // the stored result and scores only — no invented 'Pass' or 98/95/100 defaults (QA M-04)
        result: h.result || 'Recorded',
        details: h.details || [h.seo_score && `SEO ${h.seo_score}`, h.aeo_score && `AEO ${h.aeo_score}`, h.geo_score && `GEO ${h.geo_score}`].filter(Boolean).join(' | ') || 'Scores not reported',
        scores: { seo: h.seo_score || null, aeo: h.aeo_score || null, geo: h.geo_score || null },
        auditReport: h.audit_report
      }));

    const finalComplianceHistory = (matchedHistory.length > 0)
      ? matchedHistory
      : (Array.isArray(c.compliance_history) ? c.compliance_history : []);

    return {
      id: c.id,
      name: resolveClientName(c),
      business_name: resolveClientName(c),
      location: c.location || '',
      existingUrl: c.existing_url || '',
      designRefUrl: c.design_ref_url || '',
      targetAudience: c.target_audience || '',
      industry: c.industry || '',
      services: parseJson(c.services, []),
      logoOption: c.logo_option || 'upload',
      logoUrl: finalLogo,
      logoFile: null,
      mobile: c.mobile || '',
      email: c.email || '',
      gstin: c.gstin || '',
      keywordsInput: c.keywords_input || '',
      preferences: parseJson(c.preferences, { seo: true, aeo: true, geo: true }),
      additionalInfo: c.additional_info || '',
      status: isApproved ? (c.status || 'Live') : (c.status && c.status !== 'Approved' && c.status !== 'Live' ? c.status : 'Pending'),
      dateAdded: c.created_at ? c.created_at.split('T')[0] : (c.date_added || ''),
      keywordsApproved: parseJson(c.keywords, c.keywords_approved || []),
      sitemap: parseJson(c.sitemap, []),
      pagePlans: parsePagePlans(c.page_plans),
      proposalStatus: isApproved ? 'Approved' : (c.proposal_status && c.proposal_status !== 'Approved' ? c.proposal_status : 'Pending Approval'),
      proposalFeedback: c.proposal_feedback || '',
      proposalText: c.proposal_text || c.prompt_text || '',
      proposalDocUrl: c.proposal_pdf_url || c.proposalDocUrl || '',
      logoGallery: c.logo_gallery || (finalLogo ? [{ id: 'logo-db', url: finalLogo, selected: true }] : []),
      promptText: c.build_prompt || c.prompt_text || c.buildPrompt || c.promptText || '',
      buildStatus: c.build_status || 'Not Started',
      prePublishChecked: c.pre_publish_checked || false,
      deployerChecklist: parseJson(c.deployer_checklist || c.deployerChecklist, {
        zipStructure: false,
        nameLinksVerified: false,
        correctOrg: false,
        clearCache: false,
        websiteLowercase: false,
        testedTwice: false,
        stakeholderCrossVerify: false
      }),
      assignerChecklist: parseJson(c.assigner_checklist || c.assignerChecklist, {
        linkWorking: false,
        correctOrgApp: false,
        metadataMatch: false,
        slugLowercase: false,
        verifyClientAccount: false,
        stakeholderVerify: false
      }),
      assignmentStatus: c.assignment_status || 'Pending Checklist Verification',
      liveUrl: isApproved ? (c.live_url || '') : '',
      auditReport: parseJson(c.audit_report || c.auditReport, null),
      audit_report: parseJson(c.audit_report || c.auditReport, null),
      complianceHistory: isApproved ? finalComplianceHistory : [],
      setupBanner: c.setup_banner || '',
      selectedTemplate: parseJson(c.selected_template || c.selectedTemplate, null),
      brandGuidelines: parseJson(c.brand_guidelines || c.brandGuidelines, {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E293B',
        accentColor: '#F59E0B',
        fontStyle: 'Inter / Modern Sans',
        brandDocUrl: '',
        notes: ''
      }),
      galleryImages: parseJson(c.gallery_images || c.galleryImages, []),
      portfolioItems: parseJson(c.portfolio_items || c.portfolioItems, [])
    };
  });

  // Helper to get client by ID (normalised)
  const getClient = (id) => clients.find(c => c.id === id);

  // Add a new client — create in the database + trigger webhook
  const addClient = async (fields) => {
    const newClient = await dbAddClient(fields);
    const assignedId = newClient?.id || fields.id || 'client-01';
    const logoUrl = fields.logoUrl || fields.logoFileUrl || fields.logo_url || newClient?.logo_url || '';

    const clientToUse = {
      id: assignedId,
      client_id: assignedId,
      ...fields,
      ...(newClient || {}),
      name: fields.name || fields.business_name || newClient?.business_name || '',
      business_name: fields.name || fields.business_name || newClient?.business_name || '',
      logoUrl: logoUrl,
      logo_url: logoUrl
    };

    // Trigger the Planning & Proposal pipeline via Pucho webhook (fire-and-forget).
    sendClientToPlanningWorkflow(clientToUse)
      .then((res) => {
        if (res && res.success) {
          logActivity(clientToUse.name || 'Client', 'Planning & Proposal workflow triggered.', 'workflow_triggered', clientToUse.id);
        } else {
          logActivity(clientToUse.name || 'Client', `Workflow trigger failed: ${res?.message || 'unknown error'}`, 'workflow_failed', clientToUse.id);
        }
      })
      .catch((err) => {
        logActivity(clientToUse.name || 'Client', `Workflow trigger error: ${err?.message || 'unknown error'}`, 'workflow_failed', clientToUse.id);
      });

    return clientToUse;
  };

  // Save/Update Setup
  const saveSetup = async (clientId, fields) => {
    // Calculate banner
    let bannerMsg = '';
    if (fields.keywordsInput && fields.existingUrl) {
      bannerMsg = 'Your keywords will be used as priority; the site will be analyzed to enrich them.';
    } else if (fields.keywordsInput) {
      bannerMsg = 'Keywords will be used directly and expanded.';
    } else if (fields.existingUrl) {
      bannerMsg = "We'll analyze this site to research keywords.";
    } else {
      bannerMsg = 'Our AI will research keywords independently from your profile.';
    }

    if (dbSaveSetup) {
      await dbSaveSetup(clientId, fields);
    }
    updateClient(clientId, { setup_banner: bannerMsg });

    // Build merged client object to guarantee full payload is sent
    const existingClient = clients.find(c => c.id === clientId) || {};
    const logoUrl = fields.logoUrl || fields.logoFileUrl || fields.logo_url || existingClient.logoUrl || existingClient.logo_url || '';
    
    const fullUpdatedClient = {
      ...existingClient,
      ...fields,
      id: clientId,
      client_id: clientId,
      name: fields.name || fields.business_name || existingClient.name || existingClient.business_name || '',
      business_name: fields.name || fields.business_name || existingClient.name || existingClient.business_name || '',
      logoUrl: logoUrl,
      logo_url: logoUrl
    };

    // Trigger the Planning & Proposal pipeline via Pucho webhook on every Save/Update
    sendClientToPlanningWorkflow(fullUpdatedClient)
      .then((res) => {
        if (res && res.success) {
          logActivity(fullUpdatedClient.name || 'Client', 'Planning & Proposal workflow triggered on setup save.', 'workflow_triggered', clientId);
        } else {
          logActivity(fullUpdatedClient.name || 'Client', `Workflow trigger failed: ${res?.message || 'unknown error'}`, 'workflow_failed', clientId);
        }
      })
      .catch((err) => {
        logActivity(fullUpdatedClient.name || 'Client', `Workflow trigger error: ${err?.message || 'unknown error'}`, 'workflow_failed', clientId);
      });

    // DataContext.saveSetup already writes this event; logging it here too made two rows per save (QA M-05)
    if (!dbSaveSetup) logActivity(fields.name || existingClient.name || '', 'Business Setup settings updated.', 'setup_saved', clientId);
  };

  // Delete Client
  const deleteClient = async (clientId) => {
    const target = clients.find(c => c.id === clientId);
    if (target && dbDeleteClient) {
      await dbDeleteClient(clientId);
    }
  };

  // Keyword operations
  const updateKeywords = (clientId, keywords) => {
    updateClient(clientId, { keywords_approved: keywords });
  };

  const approveKeyword = (clientId, index) => {
    const client = getClient(clientId);
    if (!client) return;
    const keywords = [...(client.keywordsApproved || [])];
    keywords[index] = { ...keywords[index], approved: true };
    updateKeywords(clientId, keywords);
  };

  const approveAllKeywords = (clientId) => {
    const client = getClient(clientId);
    if (!client) return;
    const keywords = (client.keywordsApproved || []).map(k => ({ ...k, approved: true }));
    updateClient(clientId, { keywords_approved: keywords });
    logActivity(client.name, 'Approved all keywords for website structure.', 'keywords_approved', client.id);
  };

  // Sitemap tree operations
  const updateSitemap = (clientId, sitemap) => {
    const client = getClient(clientId);
    if (!client) return;
    const updatedPlans = { ...(client.pagePlans || {}) };
    sitemap.forEach(page => {
      if (!updatedPlans[page.id]) {
        updatedPlans[page.id] = {
          seo: `SEO optimization for keyword: "${page.keyword}"`,
          aeo: (client.preferences || {}).aeo ? `Voice response target queries for "${page.name}"` : '',
          geo: (client.preferences || {}).geo ? `Regional optimization for local searches in ${client.location}` : '',
          outline: `1. Introduction\n2. Key Offerings\n3. Call To Action`,
          linking: 'Links to Home page'
        };
      }
    });
    updateClient(clientId, { sitemap, page_plans: updatedPlans });
  };

  // Page planning edits
  const updatePagePlan = (clientId, pageId, field, value) => {
    const client = getClient(clientId);
    if (!client) return;
    const plans = { ...(client.pagePlans || {}) };
    plans[pageId] = { ...plans[pageId], [field]: value };
    updateClient(clientId, { page_plans: plans });
  };

  // Compile Proposal & Generate Logo Options
  const generateProposal = (clientId) => {
    const client = getClient(clientId);
    if (!client) return;
    const newLogos = client.logoOption === 'ai' && (client.logoGallery || []).length === 0 ? [
      { id: 'logo-new-1', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=150&auto=format&fit=crop&q=60', selected: true },
      { id: 'logo-new-2', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=60', selected: false },
      { id: 'logo-new-3', url: 'https://images.unsplash.com/photo-1626785774625-ddc7c8241314?w=150&auto=format&fit=crop&q=60', selected: false }
    ] : (client.logoGallery || []);
    const updatedStatus = client.status === 'Setup' ? 'Awaiting Approval' : client.status;
    updateClient(clientId, { logo_gallery: newLogos, status: updatedStatus, proposal_status: 'Pending' });
    logActivity(client.name, 'Generated Client Proposal PDF mockup.', 'proposal_generated', client.id);
  };

  // Select a logo option
  const selectLogoOption = (clientId, logoId) => {
    const client = getClient(clientId);
    if (!client) return;
    const gallery = (client.logoGallery || []).map(logo => ({
      ...logo,
      selected: logo.id === logoId
    }));
    updateClient(clientId, { logo_gallery: gallery });
  };

  // Proposal decisions
  const approveProposal = async (clientId) => {
    const client = getClient(clientId);
    if (!client) return;

    // Update database status (proposal_status & status) in DB
    await updateClient(clientId, { proposal_status: 'Approved', status: 'Approved', user_approved: true });
    logActivity(client.name, 'Proposal approved.', 'proposal_approved', client.id);
    toast.success(`Proposal approved for ${client.name}!`);
  };

  const rejectProposal = async (clientId, feedback = 'Update pricing & service details') => {
    const client = getClient(clientId);
    if (!client) return;
    await updateClient(clientId, { proposal_status: 'Changes Requested', status: 'Changes Requested', proposal_feedback: feedback, user_approved: false });
    logActivity(client.name, 'Proposal changes requested: ' + feedback, 'proposal_rejected', client.id);
    toast.info(`Status updated to Changes Requested for ${client.name}.`);
  };

  // Build Handoff update
  const setHandoffStatus = async (clientId, status) => {
    const client = getClient(clientId);
    if (!client) return;
    await updateClient(clientId, { build_status: status, buildStatus: status });
    await logActivity(client.name, `Handoff build status updated to "${status}".`, 'handoff_update', client.id);
  };

  // Pre-Publish Checks
  const runChecks = (clientId) => {
    const client = getClient(clientId);
    if (!client) return;
    logActivity(client.name, 'Completed pre-publish compliance scan.', 'audit_checked', client.id);
    updateClient(clientId, { pre_publish_checked: true });
  };

  // Post-Deploy Checks
  const runLiveCompliance = (clientId, url, auditReport = null) => {
    const client = getClient(clientId);
    if (!client) return;
    // The history row reflects the audit flow's own verdict and scores
    const report = auditReport && typeof auditReport === 'object' ? auditReport : {};
    const scores = report.scoreSummary || {};
    const verdict = String(report.overallVerdict || report.overall_verdict || report.audit_verdict || '');
    const scoreText = [
      scores.seoScore || report.seoScore ? `SEO ${scores.seoScore || report.seoScore}` : '',
      scores.aeoScore || report.aeoScore ? `AEO ${scores.aeoScore || report.aeoScore}` : '',
      scores.geoScore || report.geoScore ? `GEO ${scores.geoScore || report.geoScore}` : ''
    ].filter(Boolean).join(', ');
    const newLog = {
      id: `ch-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      url,
      result: /pass/i.test(verdict) ? 'Pass' : (verdict ? 'Review' : 'Unknown'),
      details: [verdict, scoreText].filter(Boolean).join(' · ') || 'Audit flow returned no verdict.'
    };
    if (client.status !== 'Live') {
      logActivity(client.name, 'Site live and post-deploy compliant!', 'site_deployed', client.id);
    }
    updateClient(clientId, {
      live_url: url,
      status: 'Live',
      audit_report: auditReport,
      compliance_history: [newLog, ...(client.complianceHistory || [])]
    });
  };

  // Update Deployer & Assigner Checklists
  const updateChecklists = async (clientId, deployerState, assignerState, newAssignmentStatus = null) => {
    const client = getClient(clientId);
    if (!client) return;
    const update = {
      deployer_checklist: deployerState,
      deployerChecklist: deployerState,
      assigner_checklist: assignerState,
      assignerChecklist: assignerState
    };
    if (newAssignmentStatus) {
      update.assignment_status = newAssignmentStatus;
    }
    await updateClient(clientId, update);
    await logActivity(client.name, 'Updated Deployment & Assigner Checklists.', 'checklist_update', client.id);
  };

  if (loading) {
    return <ClientContext.Provider value={{ clients: [], activities: [], stats: { totalClients: 0, proposalsPending: 0, sitesLive: 0, leadsThisWeek: 0 }, loading: true, getClient: () => null, addClient: () => null, saveSetup: () => {}, deleteClient: () => {}, updateKeywords: () => {}, approveKeyword: () => {}, approveAllKeywords: () => {}, updateSitemap: () => {}, updatePagePlan: () => {}, generateProposal: () => {}, selectLogoOption: () => {}, approveProposal: () => {}, rejectProposal: () => {}, setHandoffStatus: () => {}, runChecks: () => {}, runLiveCompliance: () => {}, updateChecklists: () => {} }}>{children}</ClientContext.Provider>;
  }

  return (
    <ClientContext.Provider value={{
      clients,
      activities,
      stats,
      loading: false,
      getClient,
      addClient,
      saveSetup,
      deleteClient,
      updateKeywords,
      approveKeyword,
      approveAllKeywords,
      updateSitemap,
      updatePagePlan,
      generateProposal,
      selectLogoOption,
      approveProposal,
      rejectProposal,
      setHandoffStatus,
      runChecks,
      runLiveCompliance,
      updateChecklists,
      refresh
    }}>
      {children}
    </ClientContext.Provider>
  );
}