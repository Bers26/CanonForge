#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildChunkManifest } from "./chunk-source.mjs";
import { normalizeRosterProposal } from "./roster.mjs";
import { buildSourceAnalysis } from "./build-source-analysis.mjs";
import { createCharacterWorkspace } from "./create-character-workspace.mjs";
import { renderRoster } from "./render-roster.mjs";

const here=dirname(fileURLToPath(import.meta.url));
const fixtures=resolve(here,"../fixtures");
function assert(v,m){if(!v)throw new Error(m);}

const source=readFileSync(resolve(fixtures,"game-log.txt"),"utf8");
const manifest=buildChunkManifest(source,{
  sourceId:"game-log",name:"game-log.txt",path:"game-log.txt",
  maxChars:10000,maxUnits:6,overlapUnits:1,overlapChars:1200
});
const raw=JSON.parse(readFileSync(resolve(fixtures,"roster-proposals.json"),"utf8"));
const normalized=raw.map(p=>normalizeRosterProposal(p,manifest));
const bundle={schemaVersion:"0.1.0",source:manifest.source,proposals:normalized};
const analysis=buildSourceAnalysis(manifest,bundle);

assert(analysis.characters.length===3,`expected 3 resolved roster entities, got ${analysis.characters.length}`);
const mira=analysis.characters.find(c=>c.names.includes("Мира Вельская"));
assert(mira,"Mira entity missing");
assert(mira.names.includes("Мира"),"Mira alias forms were not merged");
assert(mira.chunkIds.length===3,`Mira should cover 3 chunks, got ${mira.chunkIds.length}`);
assert(mira.prominence.band==="key",`Mira should be key, got ${mira.prominence.band}`);
assert(mira.mentionCount===7,`Mira mention count should aggregate per-chunk counts, got ${mira.mentionCount}`);
assert(analysis.characters[0].characterId===mira.characterId,"roster must put the most-mentioned character first");
for (let i=1;i<analysis.characters.length;i++) {
  const prev=analysis.characters[i-1], cur=analysis.characters[i];
  assert(
    prev.mentionCount>cur.mentionCount ||
    (prev.mentionCount===cur.mentionCount && prev.chunkIds.length>=cur.chunkIds.length),
    "roster is not sorted by mentions/chunk coverage"
  );
}

const miraWorkspace=createCharacterWorkspace(analysis,mira.characterId,"source-analysis.json");
assert(miraWorkspace.sourceAnalysis.analysisId===analysis.analysisId,"workspace must reference shared source analysis");
assert(miraWorkspace.sourceUsage.directChunkIds.length===3,"Mira workspace lost direct chunk index");
assert(!JSON.stringify(miraWorkspace).includes("MOVE 1"),"workspace must not copy source text");

const alex=analysis.characters.find(c=>c.displayName==="Алекс");
assert(alex,"Alex entity missing");
const alexWorkspace=createCharacterWorkspace(analysis,alex.characterId,"source-analysis.json");
assert(alexWorkspace.sourceAnalysis.analysisId===analysis.analysisId,"second character must reuse same source analysis");
assert(alexWorkspace.workspaceId!==miraWorkspace.workspaceId,"character workspaces must be separate");

const cached=JSON.parse(JSON.stringify(analysis));
cached.chunkCache.find(c=>c.chunkId==="c0001").detailStatus="complete";
cached.chunkCache.find(c=>c.chunkId==="c0001").detailExtractionRef="cache/c0001.detail.json";
const cachedWorkspace=createCharacterWorkspace(cached,mira.characterId,"source-analysis.json");
assert(cachedWorkspace.sourceUsage.cachedDetailChunkIds.includes("c0001"),"shared detail cache was not reused");
assert(!cachedWorkspace.sourceUsage.pendingDetailChunkIds.includes("c0001"),"cached detail chunk should not be scheduled again");

const narratorBundle=JSON.parse(JSON.stringify(bundle));
narratorBundle.proposals[0].mentions[0].signals.push("first_person_narrator");
const narratorAnalysis=buildSourceAnalysis(manifest,narratorBundle);
const narratorMira=narratorAnalysis.characters.find(c=>c.names.includes("Мира Вельская"));
assert(narratorAnalysis.narratorCharacterId===narratorMira.characterId,"single first-person narrator must become narratorCharacterId");
const rendered=renderRoster(narratorAnalysis);
assert(rendered.includes(`0. **${narratorMira.displayName}**`),"first-person narrator must render as number 0");
assert(!rendered.includes(`1. **${narratorMira.displayName}**`),"first-person narrator must not also appear in numbered roster");

const multiNarratorBundle=JSON.parse(JSON.stringify(bundle));
multiNarratorBundle.proposals[0].mentions[0].signals.push("first_person_narrator");
multiNarratorBundle.proposals[0].mentions[1].signals.push("first_person_narrator");
const multiNarratorAnalysis=buildSourceAnalysis(manifest,multiNarratorBundle);
assert(multiNarratorAnalysis.narratorCharacterId===null,"multiple first-person narrators must not auto-claim number 0");
assert(multiNarratorAnalysis.narratorCandidateIds.length===2,"multiple narrator candidates must be preserved");

console.log(JSON.stringify({
  ok:true,
  tests:18,
  characters:analysis.characters.length,
  keyCharacters:analysis.keyCharacterIds.length,
  miraChunks:mira.chunkIds.length,
  sharedAnalysisId:analysis.analysisId
}));
