// DataContext — single source of truth for all app data.
// Reads and writes the Postgres / RDS database through the PostgREST data API (utils/db.js).

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../utils/db';
import { toast } from 'sonner';
import { sendLiveUrlToComplianceWorkflow } from '../utils/api';
import { resolveClientName } from '../utils/resolveClientName';

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  // ---- state ----
  const [clients, setClients] = useState([]);
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [pages, setPages] = useState([]);
  const [pageBlocks, setPageBlocks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [forms, setForms] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [analyticsTraffic, setAnalyticsTraffic] = useState([]);
  const [queries, setQueries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- derived stats ----
  const stats = {
    totalClients: clients.length,
    proposalsPending: clients.filter(c => c.proposal_status === 'Pending').length,
    sitesLive: clients.filter(c => c.status === 'Live').length,
    leadsThisWeek: leads.length // or filter by date
  };

  // Safe fetch helper — swallows errors per-table so one missing table
  // doesn't block all other data.
  const safeFetch = async (table, query) => {
    try {
      const { data, error } = await query;
      if (error) {
        if (error.code === 'PGRST205') return []; // table not found — ok
        console.warn(`DB fetch ${table}:`, error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn(`DB fetch ${table} failed:`, err.message);
      return [];
    }
  };

  // ---- fetch all data on mount ----
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [c, ch, acts] = await Promise.all([
      safeFetch('clients', db.from('clients').select('*').order('created_at', { ascending: false })),
      safeFetch('compliance_history', db.from('compliance_history').select('*').order('created_at', { ascending: false })),
      safeFetch('activities', db.from('activities').select('*').order('created_at', { ascending: false }).limit(50))
    ]);

    // Ensure non-dental demo clients are set to Pending Approval unless explicitly approved by user
    const sanitizedClients = (c || []).map(client => {
      const isDental = client.id === 'demo-3' || (client.business_name || client.name || '').toLowerCase().includes('dental');
      if (!isDental && client.id && client.id.startsWith('demo-') && client.proposal_status === 'Approved' && !client.user_approved) {
        db.from('clients').update({ proposal_status: 'Pending Approval', status: 'Pending' }).eq('id', client.id);
        return { ...client, proposal_status: 'Pending Approval', status: 'Pending' };
      }
      return client;
    });

    setClients(sanitizedClients);
    setComplianceHistory(ch);
    setActivities(acts);
    setLoading(false);
  }, []);

  // Load once per mount. React StrictMode re-runs effects in development; the ref keeps that to one request per
  // table (QA M-01). refresh() still reloads on demand.
  const loadedOnce = useRef(false);
  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    fetchAll();
  }, [fetchAll]);

  // ================================================================
  // ACTIVITIES
  // ================================================================

  // client_id links the row to its client (QA M-05); the column is ON DELETE SET NULL, so a deleted client passes null.
  const logActivity = useCallback(async (clientName, message, type = 'general', clientId = null) => {
    const newAct = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      client_id: clientId || null,
      client_name: clientName,
      type,
      message,
      timestamp: 'Just now',
      created_at: new Date().toISOString()
    };
    let { error } = await db.from('activities').insert(newAct);
    if (error && newAct.client_id) {
      // the client row is not there (yet): keep the event, unlinked
      newAct.client_id = null;
      ({ error } = await db.from('activities').insert(newAct));
    }
    if (error) return;
    setActivities(prev => [newAct, ...prev.slice(0, 49)]);
  }, []);

  // ================================================================
  // CLIENTS CRUD
  // ================================================================

  const getClient = useCallback((id) => clients.find(c => c.id === id), [clients]);

  // Helper to handle schema mismatches (e.g. missing columns in the clients table)
  const safeClientInsert = async (clientPayload) => {
    let payload = { ...clientPayload };
    let { error } = await db.from('clients').insert(payload);
    
    // Automatically detect and strip missing columns if the database schema doesn't have them
    while (error && error.message && error.message.includes("Could not find the")) {
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(`DB schema missing column '${missingCol}'. Stripping column and retrying...`);
        delete payload[missingCol];
        const retry = await db.from('clients').insert(payload);
        error = retry.error;
      } else {
        break;
      }
    }
    if (error) {
      console.warn('DB client insert failed:', error.message);
      toast.error(`Error saving client details: ${error.message}`);
    }
  };

  const safeClientUpdate = async (clientId, updatePayload) => {
    const existing = clients.find(c => c.id === clientId);
    const existingResolvedName = resolveClientName(existing);
    const candidateName = updatePayload.business_name || updatePayload.name;
    const bName = (candidateName && candidateName !== 'Client' && candidateName !== 'New Client')
      ? candidateName
      : existingResolvedName;
    
    let payload = {
      id: clientId,
      business_name: bName,
      ...updatePayload
    };

    let { error } = await db.from('clients').upsert([payload], { onConflict: 'id' });
    
    while (error && error.message && error.message.includes("Could not find the")) {
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(`DB schema missing column '${missingCol}' on update. Stripping column and retrying...`);
        delete payload[missingCol];
        const retry = await db.from('clients').upsert([payload], { onConflict: 'id' });
        error = retry.error;
      } else {
        break;
      }
    }
    if (error) {
      console.warn('DB client update failed:', error.message);
      toast.error(`Error updating client: ${error.message}`);
    }
  };

  // Helper to generate clean 2-digit sequential IDs starting from client-01
  const generateNextClientId = (existingList = clients) => {
    let maxNum = 0;
    (existingList || []).forEach(c => {
      if (!c || !c.id) return;
      const match = String(c.id).match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num < 10000 && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(2, '0');
    return `client-${padded}`;
  };

  const addClient = useCallback(async (fields) => {
    let newId = fields.id;
    if (!newId || newId.startsWith('client-17') || newId === 'new') {
      newId = generateNextClientId(clients);
    }
    const logoUrl = fields.logoUrl || fields.logoFileUrl || fields.logo_url || fields.logo || '';
    const newClient = {
      id: newId,
      business_name: fields.name || fields.business_name || 'New Client',
      location: fields.location || '',
      existing_url: fields.existingUrl || '',
      design_ref_url: fields.designRefUrl || '',
      target_audience: fields.targetAudience || '',
      industry: fields.industry || '',
      services: fields.services || [],
      logo_option: fields.logoOption || 'upload',
      logo_url: logoUrl,
      mobile: fields.mobile || '',
      email: fields.email || '',
      gstin: fields.gstin || '',
      keywords_input: fields.keywordsInput || '',
      keywords: '[]',
      keywords_count: 0,
      preferences: fields.preferences || { seo: true, aeo: false, geo: false },
      additional_info: fields.additionalInfo || '',
      status: 'Setup',
      date_added: new Date().toISOString().split('T')[0],
      sitemap: [],
      sitemap_count: 0,
      page_plans: {},
      proposal_status: 'Pending Approval',
      proposal_feedback: '',
      logo_gallery: logoUrl ? [{ id: 'logo-init', url: logoUrl, selected: true }] : [],
      build_prompt: '',
      build_status: 'Not Started',
      pre_publish_checked: false,
      live_url: '',
      compliance_history: [],
      setup_banner: '',
      selected_template: fields.selectedTemplate || null,
      brand_guidelines: fields.brandGuidelines || null,
      gallery_images: fields.galleryImages || [],
      portfolio_items: fields.portfolioItems || []
    };

    await safeClientInsert(newClient);
    setClients(prev => [newClient, ...prev]);
    await logActivity(newClient.business_name, 'Client record created via Business Setup.', 'setup_saved', newClient.id);
    return newClient;
  }, [clients]);

  const saveSetup = useCallback(async (clientId, fields) => {
    const logoUrl = fields.logoUrl || fields.logoFileUrl || fields.logo_url || fields.logo || '';
    const update = {
      business_name: fields.name || fields.business_name || 'New Client',
      location: fields.location || '',
      existing_url: fields.existingUrl || '',
      design_ref_url: fields.designRefUrl || '',
      target_audience: fields.targetAudience || '',
      industry: fields.industry || '',
      services: fields.services || [],
      logo_option: fields.logoOption || 'upload',
      logo_url: logoUrl,
      mobile: fields.mobile || '',
      email: fields.email || '',
      gstin: fields.gstin || '',
      keywords_input: fields.keywordsInput || '',
      preferences: fields.preferences || { seo: true, aeo: false, geo: false },
      additional_info: fields.additionalInfo || '',
      selected_template: fields.selectedTemplate || null,
      brand_guidelines: fields.brandGuidelines || null,
      gallery_images: fields.galleryImages || [],
      portfolio_items: fields.portfolioItems || [],
      proposal_status: 'Pending Approval',
      status: 'Setup'
    };

    await safeClientUpdate(clientId, update);
    setClients(prev => {
      const exists = prev.some(c => c.id === clientId);
      if (exists) {
        return prev.map(c => c.id === clientId ? { ...c, ...update } : c);
      } else {
        return [{ id: clientId, ...update }, ...prev];
      }
    });
    await logActivity(fields.name || '', 'Business Setup settings updated.', 'setup_saved', clientId);
  }, []);

  const updateClient = useCallback(async (clientId, update) => {
    await safeClientUpdate(clientId, update);
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...update } : c));
  }, []);

  const approveProposal = useCallback(async (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Update the client record status & unlock Step 3
    const update = { proposal_status: 'Approved', status: 'Approved', user_approved: true };
    await updateClient(clientId, update);
    await logActivity(client.business_name || client.name || '', 'Proposal approved.', 'proposal_approved', clientId);
    toast.success(`Proposal approved for ${client.business_name || client.name}!`);
  }, [clients, updateClient, logActivity]);

  const rejectProposal = useCallback(async (clientId, feedback = 'Update pricing & service details') => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const update = { proposal_status: 'Changes Requested', status: 'Changes Requested', proposal_feedback: feedback, user_approved: false };
    await updateClient(clientId, update);
    await logActivity(client.business_name || client.name || '', 'Proposal changes requested: ' + feedback, 'proposal_rejected', clientId);
    toast.info(`Status updated to Changes Requested for ${client.business_name || client.name}.`);
  }, [clients, updateClient, logActivity]);

  const deleteClient = useCallback(async (clientId) => {
    const client = clients.find(c => c.id === clientId);
    const clientName = client?.business_name || client?.name || 'Client';

    // 1. Delete from the clients table
    const { error } = await db.from('clients').delete().eq('id', clientId);
    if (error) {
      console.warn('DB delete client error:', error.message);
    }

    // 2. Delete related compliance history records
    await db.from('compliance_history').delete().eq('client_id', clientId);

    // 3. Immediately update frontend state
    setClients(prev => prev.filter(c => c.id !== clientId));
    setComplianceHistory(prev => prev.filter(h => h.client_id !== clientId && h.clientId !== clientId));

    await logActivity(clientName, 'Client record deleted.', 'client_deleted');
    toast.success(`${clientName} deleted.`);
  }, [clients, logActivity]);

  // ================================================================
  // OTHER MUTATION HELPERS
  // ================================================================

  const addLead = useCallback(async (lead) => {
    const newLead = { id: `lead-${Date.now()}`, ...lead, date: new Date().toISOString().split('T')[0] };
    const { error } = await db.from('leads').insert(newLead);
    if (error) { toast.error('Failed to add lead'); return; }
    setLeads(prev => [newLead, ...prev]);
  }, []);

  const addMediaFile = useCallback(async (file) => {
    const newFile = { id: `media-${Date.now()}`, ...file };
    const { error } = await db.from('media_files').insert(newFile);
    if (error) { toast.error('Failed to add media'); return; }
    setMediaFiles(prev => [newFile, ...prev]);
  }, []);

  // ================================================================
  // VALUE
  // ================================================================

  const value = {
    // data
    clients, complianceHistory, activities, pages, pageBlocks, leads, forms,
    mediaFiles, analyticsTraffic, queries, profile, stats, loading,
    // refresh
    refresh: fetchAll,
    // clients CRUD
    getClient, addClient, saveSetup, updateClient, deleteClient,
    approveProposal, rejectProposal,
    // activities
    logActivity,
    // mutations
    addLead, addMediaFile
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}