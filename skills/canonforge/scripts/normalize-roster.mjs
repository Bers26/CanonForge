#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { normalizeRosterProposal, validateRosterProposal } from "./roster.mjs";

const [manifestPath,proposalsPath,outPath]=process.argv.slice(2);
if (!manifestPath || !proposalsPath || !outPath) {
  console.error("usage: node normalize-roster.mjs <chunks.json> <roster-proposals.json> <normalized-roster.json>");
  process.exit(2);
}
try {
  const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
  const raw=JSON.parse(readFileSync(proposalsPath,"utf8"));
  const proposals=Array.isArray(raw)?raw:(raw.proposals??[]);
  const errors=[];
  proposals.forEach((p,i)=>validateRosterProposal(p).forEach(e=>errors.push(`proposal[${i}]: ${e}`)));
  if (errors.length) throw new Error(errors.join(" | "));
  const normalized=proposals.map(p=>normalizeRosterProposal(p,manifest));
  writeFileSync(outPath,JSON.stringify({
    schemaVersion:"0.1.0",
    source:manifest.source,
    proposals:normalized
  },null,2)+"\n","utf8");
  console.log(JSON.stringify({ok:true,proposals:normalized.length,out:outPath}));
} catch(err) {
  console.error(JSON.stringify({ok:false,error:err.message}));
  process.exit(1);
}
