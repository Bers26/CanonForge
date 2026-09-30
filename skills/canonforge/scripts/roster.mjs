function isObject(v) { return typeof v === "object" && v !== null && !Array.isArray(v); }
function nonempty(v) { return typeof v === "string" && v.trim() !== ""; }
const SIGNALS = new Set(["dialogue","action","description","relationship","named","player","first_person_narrator"]);

function validateLocator(loc, path) {
  const errors=[];
  if (!isObject(loc)) return [`${path}: expected object`];
  if (!nonempty(loc.quote)) errors.push(`${path}.quote: required`);
  if (!Number.isInteger(loc.occurrence) || loc.occurrence < 0) errors.push(`${path}.occurrence: expected integer >= 0`);
  return errors;
}

export function validateRosterProposal(p) {
  const errors=[];
  if (!isObject(p)) return ["proposal: expected object"];
  if (p.schemaVersion !== "0.1.0") errors.push("schemaVersion: expected 0.1.0");
  if (!nonempty(p.sourceId)) errors.push("sourceId: required");
  if (!nonempty(p.chunkId)) errors.push("chunkId: required");
  if (!Array.isArray(p.mentions)) errors.push("mentions: expected array");
  else for (const [i,m] of p.mentions.entries()) {
    const b=`mentions[${i}]`;
    if (!isObject(m)) { errors.push(`${b}: expected object`); continue; }
    if (!nonempty(m.mentionId)) errors.push(`${b}.mentionId: required`);
    if (!nonempty(m.primaryName)) errors.push(`${b}.primaryName: required`);
    if (!(m.sourceIdentityKey === null || nonempty(m.sourceIdentityKey))) errors.push(`${b}.sourceIdentityKey: expected string or null`);
    if (!Number.isInteger(m.mentionCount) || m.mentionCount < 1) errors.push(`${b}.mentionCount: expected integer >= 1`);
    errors.push(...validateLocator(m.evidence,`${b}.evidence`));
    if (!Array.isArray(m.signals)) errors.push(`${b}.signals: expected array`);
    else for (const s of m.signals) if (!SIGNALS.has(s)) errors.push(`${b}.signals: invalid signal ${s}`);
  }
  if (!Array.isArray(p.aliasClaims)) errors.push("aliasClaims: expected array");
  else for (const [i,a] of p.aliasClaims.entries()) {
    const b=`aliasClaims[${i}]`;
    if (!isObject(a)) { errors.push(`${b}: expected object`); continue; }
    if (!nonempty(a.left) || !nonempty(a.right)) errors.push(`${b}: left/right required`);
    if (!["explicit","probable"].includes(a.basis)) errors.push(`${b}.basis: invalid`);
    errors.push(...validateLocator(a.evidence,`${b}.evidence`));
  }
  return errors;
}

function nthOccurrence(haystack, needle, occurrence) {
  let from=0, index=-1;
  for (let i=0;i<=occurrence;i++) {
    index=haystack.indexOf(needle,from);
    if (index<0) return -1;
    from=index+Math.max(1,needle.length);
  }
  return index;
}

function resolveLocator(locator,chunk,source) {
  const local=nthOccurrence(chunk.text,locator.quote,locator.occurrence);
  if (local<0) throw new Error(`quote occurrence ${locator.occurrence} not found in ${chunk.chunkId}: ${JSON.stringify(locator.quote)}`);
  const start=chunk.start+local;
  return {
    sourceId:source.sourceId,
    start,
    end:start+locator.quote.length,
    quote:locator.quote,
    sourceHash:source.sha256,
    chunkId:chunk.chunkId
  };
}

export function normalizeRosterProposal(proposal,manifest) {
  const errors=validateRosterProposal(proposal);
  if (errors.length) throw new Error(errors.join(" | "));
  if (proposal.sourceId !== manifest.source.sourceId) throw new Error(`source mismatch: ${proposal.sourceId} != ${manifest.source.sourceId}`);
  const chunk=manifest.chunks.find(c=>c.chunkId===proposal.chunkId);
  if (!chunk) throw new Error(`unknown chunk ${proposal.chunkId}`);
  return {
    schemaVersion:"0.1.0",
    sourceId:proposal.sourceId,
    chunkId:proposal.chunkId,
    mentions:proposal.mentions.map(m=>({
      ...m,
      evidence:resolveLocator(m.evidence,chunk,manifest.source),
      facts:[]
    })),
    aliasClaims:proposal.aliasClaims.map(a=>({...a,evidence:resolveLocator(a.evidence,chunk,manifest.source)})),
    transformations:[],
    conflicts:[],
    openQuestions:[]
  };
}
