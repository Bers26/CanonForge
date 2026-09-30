#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const args=process.argv.slice(2);
const analysisPath=args[0], chunkId=args[1], detailRef=args[2];
if(!analysisPath||!chunkId||!detailRef){
  console.error("usage: node update-detail-cache.mjs <source-analysis.json> <chunkId> <detailExtractionRef>");
  process.exit(2);
}
try{
  const analysis=JSON.parse(readFileSync(analysisPath,"utf8"));
  const entry=(analysis.chunkCache||[]).find(c=>c.chunkId===chunkId);
  if(!entry) throw new Error("unknown chunk "+chunkId);
  entry.detailStatus="complete";
  entry.detailExtractionRef=detailRef;
  writeFileSync(analysisPath,JSON.stringify(analysis,null,2)+"\n","utf8");
  console.log(JSON.stringify({ok:true,analysisId:analysis.analysisId,chunkId,detailRef}));
}catch(err){
  console.error(JSON.stringify({ok:false,error:err.message}));
  process.exit(1);
}
