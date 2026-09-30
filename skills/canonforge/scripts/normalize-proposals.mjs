#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { normalizeProposal, readProposalFiles } from "./proposals.mjs";

const [manifestPath, proposalPath, outPath] = process.argv.slice(2);
if (!manifestPath || !proposalPath || !outPath) {
  console.error("usage: node normalize-proposals.mjs <chunks.json> <proposal.json|dir> <out.json>");
  process.exit(2);
}
try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const proposals = readProposalFiles(proposalPath).map((p) => normalizeProposal(p, manifest));
  writeFileSync(outPath, JSON.stringify({ schemaVersion: "0.1.0", source: manifest.source, proposals }, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ ok: true, proposals: proposals.length, out: outPath }));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  process.exit(1);
}
