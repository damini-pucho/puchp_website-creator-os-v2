export const resolveClientName = (c) => {
  if (!c) return 'Client';
  const nameCandidate = c.business_name || c.name || c.businessName;
  if (nameCandidate && nameCandidate !== 'Client' && nameCandidate !== 'New Client') {
    return nameCandidate;
  }
  return nameCandidate || 'Client';
};

export const getClientCurrentStep = (c) => {
  if (!c) return 1;
  // Step 4: Live Site Deployment & Audit
  if (
    c.status === 'Live' || 
    c.liveUrl || 
    c.live_url || 
    c.auditReport || 
    c.audit_report || 
    (c.complianceHistory && c.complianceHistory.length > 0)
  ) {
    return 4;
  }
  // Step 3: Pucho Code Master Prompt
  if (
    c.proposalStatus === 'Approved' || 
    c.promptText || 
    c.build_prompt || 
    c.buildStatus === 'Build Complete' || 
    c.buildStatus === 'In Progress in Pucho Code'
  ) {
    return 3;
  }
  // Step 2: Strategy Proposal PDF & AI Blueprint
  if (
    c.proposalDocUrl || 
    (c.sitemap && c.sitemap.length > 0) || 
    (c.keywordsApproved && c.keywordsApproved.length > 0)
  ) {
    return 2;
  }
  // Step 1: Details & Setup
  return 1;
};

