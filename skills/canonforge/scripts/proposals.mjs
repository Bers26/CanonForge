import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

function isObject(v) { return typeof v === "object" && v !== null && !Array.isArray(v); }
function text(v) { return typeof v === "string" && v.trim() !== ""; }

export function validateProposal(p) {
  const errors = [];
  if (!isObject(p)) return ["proposal: expected object"];
  if (p.schemaVersion !== "0.1.0") errors.push("schemaVersion: expected 0.1.0");
  if (!text(p.sourceId)) errors.push("sourceId: required");
  if (!text(p.chunkId)) errors.push("chunkId: required");
  if (!Array.isArray(p.mentions)) errors.push("mentions: expected array");
  else for (const [i, m] of p.mentions.entries()) {
    const base = `mentions[${i}]`;
    if (!isObject(m)) { errors.push(`${base}: expected object`); continue; }
    if (!text(m.mentionId)) errors.push(`${base}.mentionId: required`);
    if (!text(m.primaryName)) errors.push(`${base}.primaryName: required`);
    if (!(m.sourceIdentityKey === null || text(m.sourceIdentityKey))) errors.push(`${base}.sourceIdentityKey: expected string or null`);
    if (!Array.isArray(m.facts)) errors.push(`${base}.facts: expected array`);
    else for (const [j, f] of m.facts.entries()) {
      const fp = `${base}.facts[${j}]`;
      if (!isObject(f)) { errors.push(`${fp}: expected object`); continue; }
      if (!text(f.path)) errors.push(`${fp}.path: required`);
      if (!("value" in f)) errors.push(`${fp}.value: missing`);
      if (!["explicit_source","inferred"].includes(f.origin)) errors.push(`${fp}.origin: must be explicit_source or inferred`);
      errors.push(...validateLocator(f.evidence, `${fp}.evidence`));
    }
  }
  if (!Array.isArray(p.aliasClaims)) errors.push("aliasClaims: expected array");
  else for (const [i, a] of p.aliasClaims.entries()) {
    const ap = `aliasClaims[${i}]`;
    if (!isObject(a)) { errors.push(`${ap}: expected object`); continue; }
    if (!text(a.left) || !text(a.right)) errors.push(`${ap}: left/right required`);
    if (!["explicit","probable"].includes(a.basis)) errors.push(`${ap}.basis: invalid`);
    errors.push(...validateLocator(a.evidence, `${ap}.evidence`));
  }
  if (!Array.isArray(p.transformations)) errors.push("transformations: expected array");
  if (!Array.isArray(p.conflicts)) errors.push("conflicts: expected array");
  if (!Array.isArray(p.openQuestions)) errors.push("openQuestions: expected array");
  return errors;
}

function validateLocator(loc, path) {
  const errors = [];
  if (!isObject(loc)) return [`${path}: expected object`];
  if (!text(loc.quote)) errors.push(`${path}.quote: required`);
  if (!Number.isInteger(loc.occurrence) || loc.occurrence < 0) errors.push(`${path}.occurrence: expected integer >= 0`);
  return errors;
}

function nthOccurrence(haystack, needle, occurrence) {
  let from = 0;
  let index = -1;
  for (let i = 0; i <= occurrence; i++) {
    index = haystack.indexOf(needle, from);
    if (index < 0) return -1;
    from = index + Math.max(1, needle.length);
  }
  return index;
}

function resolveLocator(locator, chunk, source) {
  const local = nthOccurrence(chunk.text, locator.quote, locator.occurrence);
  if (local < 0) throw new Error(`quote occurrence ${locator.occurrence} not found in ${chunk.chunkId}: ${JSON.stringify(locator.quote)}`);
  const start = chunk.start + local;
  const end = start + locator.quote.length;
  return {
    sourceId: source.sourceId,
    start,
    end,
    quote: locator.quote,
    sourceHash: source.sha256,
    chunkId: chunk.chunkId
  };
}

export function normalizeProposal(proposal, manifest) {
  const errors = validateProposal(proposal);
  if (errors.length) throw new Error(errors.join(" | "));
  if (proposal.sourceId !== manifest.source.sourceId) throw new Error(`source mismatch: ${proposal.sourceId} != ${manifest.source.sourceId}`);
  const chunk = manifest.chunks.find((c) => c.chunkId === proposal.chunkId);
  if (!chunk) throw new Error(`unknown chunk ${proposal.chunkId}`);
  return {
    ...proposal,
    mentions: proposal.mentions.map((m) => ({
      ...m,
      facts: m.facts.map((f) => ({ ...f, evidence: resolveLocator(f.evidence, chunk, manifest.source) }))
    })),
    aliasClaims: proposal.aliasClaims.map((a) => ({ ...a, evidence: resolveLocator(a.evidence, chunk, manifest.source) })),
    transformations: proposal.transformations.map((t) => ({
      ...t,
      evidence: t.evidence ? resolveLocator(t.evidence, chunk, manifest.source) : null
    }))
  };
}

export function readProposalFiles(path) {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(path, f), "utf8")));
  }
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  return Array.isArray(parsed) ? parsed : (Array.isArray(parsed.proposals) ? parsed.proposals : [parsed]);
}

export function proposalFileName(proposal) {
  return `${proposal.chunkId}-${basename(proposal.sourceId)}.normalized.json`;
}
