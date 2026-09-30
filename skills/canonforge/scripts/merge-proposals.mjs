#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

function normName(name) {
  return name.normalize("NFKC").toLocaleLowerCase("und").replace(/[.,;:!?"'«»“”()\[\]{}]/g, " ").replace(/\s+/g, " ").trim();
}
function strongName(name) {
  const n = normName(name);
  return n.startsWith("@") || /\d/.test(n) || n.split(" ").filter(Boolean).length >= 2;
}
class DSU {
  constructor() { this.p = new Map(); }
  add(x) { if (!this.p.has(x)) this.p.set(x, x); }
  find(x) { this.add(x); const p = this.p.get(x); if (p !== x) this.p.set(x, this.find(p)); return this.p.get(x); }
  union(a,b) { const ra=this.find(a), rb=this.find(b); if (ra!==rb) this.p.set(rb,ra); }
}
function uniq(values) { return [...new Set(values)]; }
function stableKey(v) { return JSON.stringify(v, Object.keys(v).sort()); }

export function mergeNormalized(bundle) {
  const proposals = bundle.proposals ?? [];
  const nameDsu = new DSU();
  const anchoredNameRoots = new Set();
  for (const p of proposals) {
    for (const m of p.mentions ?? []) nameDsu.add(normName(m.primaryName));
    for (const a of p.aliasClaims ?? []) {
      const left = normName(a.left), right = normName(a.right);
      nameDsu.add(left); nameDsu.add(right);
      if (a.basis === "explicit") nameDsu.union(left, right);
    }
  }
  for (const p of proposals) {
    for (const a of p.aliasClaims ?? []) if (a.basis === "explicit") anchoredNameRoots.add(nameDsu.find(normName(a.left)));
    for (const m of p.mentions ?? []) if (strongName(m.primaryName)) anchoredNameRoots.add(nameDsu.find(normName(m.primaryName)));
  }

  const mentions = [];
  for (const p of proposals) for (const m of p.mentions ?? []) mentions.push({
    ref: `${p.chunkId}:${m.mentionId}`,
    chunkId: p.chunkId,
    sourceId: p.sourceId,
    ...m,
    nameRoot: nameDsu.find(normName(m.primaryName))
  });

  const mentionDsu = new DSU();
  mentions.forEach((m) => mentionDsu.add(m.ref));
  const byIdentityKey = new Map();
  const byAnchoredRoot = new Map();
  for (const m of mentions) {
    if (m.sourceIdentityKey) {
      const key = m.sourceIdentityKey.normalize("NFKC");
      if (byIdentityKey.has(key)) mentionDsu.union(m.ref, byIdentityKey.get(key)); else byIdentityKey.set(key, m.ref);
    }
    if (anchoredNameRoots.has(m.nameRoot)) {
      if (byAnchoredRoot.has(m.nameRoot)) mentionDsu.union(m.ref, byAnchoredRoot.get(m.nameRoot)); else byAnchoredRoot.set(m.nameRoot, m.ref);
    }
  }

  const groups = new Map();
  for (const m of mentions) {
    const root = mentionDsu.find(m.ref);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(m);
  }

  const entities = [...groups.values()].map((group, idx) => {
    const names = uniq(group.flatMap((m) => [m.primaryName]));
    const facts = [];
    const seenFacts = new Set();
    for (const m of group) for (const f of m.facts ?? []) {
      const key = stableKey({ path:f.path, value:f.value, evidence:f.evidence });
      if (!seenFacts.has(key)) { seenFacts.add(key); facts.push(f); }
    }
    const bases = [];
    if (group.some((m) => m.sourceIdentityKey)) bases.push("source_identity_key");
    if (group.some((m) => anchoredNameRoots.has(m.nameRoot))) bases.push("explicit_alias_or_strong_name");
    return {
      draftId: `draft-${String(idx+1).padStart(4,"0")}`,
      displayName: names.sort((a,b) => b.length - a.length)[0],
      names,
      mentionRefs: group.map((m) => m.ref),
      mergeBasis: uniq(bases),
      facts
    };
  });

  const weak = new Map();
  for (const entity of entities) {
    for (const name of entity.names) {
      const n = normName(name), root = nameDsu.find(n);
      if (anchoredNameRoots.has(root)) continue;
      if (!weak.has(root)) weak.set(root, []);
      weak.get(root).push(entity.draftId);
    }
  }
  const ambiguities = [];
  for (const [nameRoot, ids] of weak) {
    const uniqueIds = uniq(ids);
    if (uniqueIds.length > 1) ambiguities.push({
      type: "weak-name-collision",
      normalizedName: nameRoot,
      draftIds: uniqueIds,
      action: "Do not merge automatically; review identity or ask the user if it matters."
    });
  }

  return { schemaVersion:"0.1.0", source:bundle.source, entities, ambiguities };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [input, out] = process.argv.slice(2);
  if (!input || !out) { console.error("usage: node merge-proposals.mjs <normalized-proposals.json> <draft-characters.json>"); process.exit(2); }
  try {
    const bundle = JSON.parse(readFileSync(input,"utf8"));
    const merged = mergeNormalized(bundle);
    writeFileSync(out, JSON.stringify(merged,null,2)+"\n","utf8");
    console.log(JSON.stringify({ok:true, entities:merged.entities.length, ambiguities:merged.ambiguities.length, out}));
  } catch (err) { console.error(JSON.stringify({ok:false,error:err.message})); process.exit(1); }
}
