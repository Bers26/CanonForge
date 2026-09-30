#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { mergeNormalized } from "./merge-proposals.mjs";

function uniq(v){ return [...new Set(v)]; }
function hashId(value){ return createHash("sha256").update(value,"utf8").digest("hex").slice(0,16); }

function scoreCharacter(entity,mentionMap,totalChunks) {
  const mentions=entity.mentionRefs.map(r=>mentionMap.get(r)).filter(Boolean);
  const chunkIds=uniq(mentions.map(m=>m.chunkId));
  const signals=uniq(mentions.flatMap(m=>m.signals ?? []));
  const coverage=totalChunks ? chunkIds.length/totalChunks : 0;
  const mentionSaturation=Math.min(1,mentions.length/Math.max(4,totalChunks));
  const active=mentions.filter(m=>(m.signals??[]).some(s=>["dialogue","action","description","player"].includes(s))).length;
  const activeRatio=mentions.length ? active/mentions.length : 0;
  const identityBonus=entity.mergeBasis.includes("source_identity_key") ? 0.08 : 0;
  const score=Math.round(100*Math.min(1,0.62*coverage+0.22*mentionSaturation+0.08*activeRatio+identityBonus));
  const band = score >= 38 || coverage >= 0.35 ? "key" : (score >= 14 || chunkIds.length >= 2 ? "recurring" : "minor");
  return {score,band,mentionCount:mentions.length,chunkIds,signals,coverage};
}

export function buildSourceAnalysis(manifest, normalizedRosterBundle) {
  if (normalizedRosterBundle.source?.sourceId !== manifest.source.sourceId) throw new Error("source mismatch between manifest and roster");
  if (normalizedRosterBundle.source?.sha256 !== manifest.source.sha256) throw new Error("source hash mismatch between manifest and roster");

  const merged=mergeNormalized(normalizedRosterBundle);
  const mentionMap=new Map();
  for (const p of normalizedRosterBundle.proposals ?? []) {
    for (const m of p.mentions ?? []) mentionMap.set(`${p.chunkId}:${m.mentionId}`,{...m,chunkId:p.chunkId});
  }

  const characters=merged.entities.map(entity=>{
    const s=scoreCharacter(entity,mentionMap,manifest.chunks.length);
    const firstIndex=Math.min(...s.chunkIds.map(id=>manifest.chunks.findIndex(c=>c.chunkId===id)).filter(i=>i>=0));
    const lastIndex=Math.max(...s.chunkIds.map(id=>manifest.chunks.findIndex(c=>c.chunkId===id)).filter(i=>i>=0));
    return {
      characterId:`char-${hashId(manifest.source.sha256+"|"+entity.draftId+"|"+entity.displayName)}`,
      displayName:entity.displayName,
      names:entity.names,
      mergeBasis:entity.mergeBasis,
      mentionRefs:entity.mentionRefs,
      mentionCount:s.mentionCount,
      chunkIds:s.chunkIds,
      firstChunkId:firstIndex>=0?manifest.chunks[firstIndex].chunkId:null,
      lastChunkId:lastIndex>=0?manifest.chunks[lastIndex].chunkId:null,
      signals:s.signals,
      prominence:{score:s.score,band:s.band,chunkCoverage:s.coverage}
    };
  }).sort((a,b)=>
    b.mentionCount-a.mentionCount ||
    b.chunkIds.length-a.chunkIds.length ||
    b.prominence.score-a.prominence.score ||
    a.displayName.localeCompare(b.displayName)
  );

  const analysisId=`analysis-${hashId(manifest.source.sourceId+"|"+manifest.source.sha256)}`;
  return {
    schemaVersion:"0.1.0",
    analysisId,
    source:manifest.source,
    chunking:{
      strategy:manifest.strategy,
      parameters:manifest.parameters,
      chunkCount:manifest.chunks.length,
      chunkOrder:manifest.chunks.map(c=>c.chunkId)
    },
    characters,
    keyCharacterIds:characters.filter(c=>c.prominence.band==="key").map(c=>c.characterId),
    ambiguities:merged.ambiguities,
    chunkCache:manifest.chunks.map(c=>({
      chunkId:c.chunkId,
      rosterStatus:"complete",
      detailStatus:"missing",
      detailExtractionRef:null
    }))
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [manifestPath, rosterPath, outPath]=process.argv.slice(2);
  if (!manifestPath || !rosterPath || !outPath) {
    console.error("usage: node build-source-analysis.mjs <chunks.json> <normalized-roster.json> <source-analysis.json>");
    process.exit(2);
  }
  try {
    const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
    const roster=JSON.parse(readFileSync(rosterPath,"utf8"));
    const analysis=buildSourceAnalysis(manifest,roster);
    writeFileSync(outPath,JSON.stringify(analysis,null,2)+"\n","utf8");
    console.log(JSON.stringify({ok:true,characters:analysis.characters.length,keyCharacters:analysis.keyCharacterIds.length,out:outPath}));
  } catch(err) {
    console.error(JSON.stringify({ok:false,error:err.message}));
    process.exit(1);
  }
}
