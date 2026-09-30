#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import process from "node:process";

function uniq(v){return [...new Set(v)];}

export function createCharacterWorkspace(analysis,selector,analysisPath="source-analysis.json") {
  const exact=analysis.characters.find(c=>c.characterId===selector);
  const byName=analysis.characters.filter(c=>c.displayName===selector || (c.names??[]).includes(selector));
  const character=exact ?? (byName.length===1?byName[0]:null);
  if (!character) {
    if (byName.length>1) throw new Error(`character name is ambiguous: ${selector}; use characterId`);
    throw new Error(`character not found: ${selector}`);
  }

  const order=analysis.chunking.chunkOrder;
  const indexes=character.chunkIds.map(id=>order.indexOf(id)).filter(i=>i>=0);
  const contextIds=[];
  for (const i of indexes) {
    if (i>0) contextIds.push(order[i-1]);
    contextIds.push(order[i]);
    if (i+1<order.length) contextIds.push(order[i+1]);
  }
  const requiredChunkIds=uniq(contextIds);
  const cache=new Map((analysis.chunkCache??[]).map(c=>[c.chunkId,c]));
  const cachedDetailChunkIds=requiredChunkIds.filter(id=>cache.get(id)?.detailStatus==="complete");
  const pendingDetailChunkIds=requiredChunkIds.filter(id=>cache.get(id)?.detailStatus!=="complete");

  return {
    schemaVersion:"0.1.0",
    workspaceId:`${analysis.analysisId}:${character.characterId}`,
    branchRevision:1,
    status:"selected",
    sourceAnalysis:{
      ref:basename(analysisPath),
      analysisId:analysis.analysisId,
      sourceId:analysis.source.sourceId,
      sourceHash:analysis.source.sha256
    },
    character:{
      characterId:character.characterId,
      displayName:character.displayName,
      names:character.names,
      prominence:character.prominence
    },
    sourceUsage:{
      directChunkIds:character.chunkIds,
      requiredChunkIds,
      cachedDetailChunkIds,
      pendingDetailChunkIds
    },
    characterCoreRef:null,
    visualIdentityRef:null
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [analysisPath,selector,outPath]=process.argv.slice(2);
  if (!analysisPath || !selector || !outPath) {
    console.error("usage: node create-character-workspace.mjs <source-analysis.json> <characterId|name> <workspace.json>");
    process.exit(2);
  }
  try {
    const analysis=JSON.parse(readFileSync(analysisPath,"utf8"));
    const workspace=createCharacterWorkspace(analysis,selector,analysisPath);
    writeFileSync(outPath,JSON.stringify(workspace,null,2)+"\n","utf8");
    console.log(JSON.stringify({ok:true,workspaceId:workspace.workspaceId,pendingChunks:workspace.sourceUsage.pendingDetailChunkIds.length,out:outPath}));
  } catch(err) {
    console.error(JSON.stringify({ok:false,error:err.message}));
    process.exit(1);
  }
}
