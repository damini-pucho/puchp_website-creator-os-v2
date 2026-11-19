import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOP_KEYS = ["created", "updated", "name", "description", "tags", "pieces", "template", "blogUrl"];
const TMPL_KEYS = ["displayName", "trigger", "valid", "agentIds", "connectionIds", "schemaVersion"];
const DOT_REF = /\{\{\s*(trigger|step_\d+)\.[A-Za-z_]/;

function validateWorkflowFile(filePath) {
  console.log(`\nValidating: ${filePath}`);
  const errs = [];
  const warns = [];

  const raw = readFileSync(filePath, 'utf-8');
  let d;
  try {
    d = JSON.parse(raw);
  } catch (e) {
    console.error(`Invalid JSON: ${e.message}`);
    return false;
  }

  // 1. Envelope
  for (const k of TOP_KEYS) {
    if (!(k in d)) errs.push(`envelope missing top-level key: ${k}`);
  }

  const t = d.template || {};
  for (const k of TMPL_KEYS) {
    if (!(k in t)) errs.push(`template missing key: ${k}`);
  }

  if (String(t.schemaVersion) !== '7') {
    errs.push(`schemaVersion must be "7", got ${t.schemaVersion}`);
  }

  // Nodes walking
  const nodes = [];
  function walk(node, path = 'trigger') {
    if (!node || typeof node !== 'object') return;
    if (node.type && node.name) nodes.push({ path, node });
    if (node.nextAction) walk(node.nextAction, `${path}.next`);
    if (node.firstLoopAction) walk(node.firstLoopAction, `${path}.loop`);
    if (Array.isArray(node.children)) {
      node.children.forEach((c, idx) => {
        if (c) walk(c, `${path}.child[${idx}]`);
      });
    }
  }

  walk(t.trigger);

  if (nodes.length === 0) {
    errs.push('No trigger node found');
  } else {
    const { node: trig } = nodes[0];
    if (trig.type !== 'TOOL_TRIGGER') {
      errs.push(`Trigger type must be TOOL_TRIGGER, got ${trig.type}`);
    }
    if (trig.name !== 'trigger') {
      errs.push(`Trigger name must be "trigger", got ${trig.name}`);
    }
    const ts = trig.settings || {};
    for (const k of ["pieceName", "pieceVersion", "triggerName", "input", "propertySettings", "sampleData"]) {
      if (!(k in ts)) errs.push(`trigger.settings missing ${k}`);
    }
    if ("errorHandlingOptions" in ts) errs.push(`trigger.settings must NOT contain errorHandlingOptions`);
    if ("skip" in trig) errs.push(`trigger node must NOT carry skip`);
  }

  // Nodes and pieces checks
  const names = {};
  const usedPieces = new Set();
  nodes.forEach(({ path, node: n }) => {
    if (n.name in names) errs.push(`Duplicate node name "${n.name}" at ${path} and ${names[n.name]}`);
    names[n.name] = path;

    const s = n.settings || {};
    if (s.pieceName) usedPieces.add(s.pieceName);

    // Check ROUTER
    if (n.type === 'ROUTER') {
      const branches = s.branches || [];
      const children = n.children || [];
      if (children.length !== branches.length) {
        errs.push(`ROUTER children length (${children.length}) does not match branches (${branches.length})`);
      }
      branches.forEach((b, idx) => {
        if (b.type) errs.push(`Router branch ${idx} uses key "type" instead of "branchType"`);
        if (!b.branchType) errs.push(`Router branch ${idx} missing "branchType"`);
        if (idx === branches.length - 1 && b.branchType !== 'FALLBACK') {
          warns.push(`Last branch should ideally be FALLBACK`);
        }
      });
    }
  });

  // Pieces set comparison
  const declaredPieces = new Set(d.pieces || []);
  for (const p of usedPieces) {
    if (!declaredPieces.has(p)) warns.push(`Piece ${p} used in flow but not declared in top-level pieces`);
  }

  if (errs.length > 0) {
    console.error(`RESULT: FAIL (${errs.length} errors)`);
    errs.forEach(e => console.error(`  - ERROR: ${e}`));
    return false;
  } else {
    console.log(`RESULT: PASS (${nodes.length} nodes verified, ${warns.length} warnings)`);
    warns.forEach(w => console.log(`  - WARN: ${w}`));
    return true;
  }
}

const f1 = join(process.cwd(), 'workflows', 'wco_workflow_1_planning_proposal.json');
const f2 = join(process.cwd(), 'workflows', 'wco_workflow_2_build_deploy.json');

const pass1 = validateWorkflowFile(f1);
const pass2 = validateWorkflowFile(f2);

if (pass1 && pass2) {
  console.log('\nAll workflows PASSED Pucho v2026-07 validation!\n');
} else {
  process.exit(1);
}

