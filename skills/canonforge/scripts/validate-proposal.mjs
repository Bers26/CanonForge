#!/usr/bin/env node
import { readProposalFiles, validateProposal } from "./proposals.mjs";
import process from "node:process";

const path = process.argv[2];
if (!path) { console.error("usage: node validate-proposal.mjs <proposal.json|dir>"); process.exit(2); }
try {
  const proposals = readProposalFiles(path);
  const errors = [];
  proposals.forEach((p, i) => validateProposal(p).forEach((e) => errors.push(`proposal[${i}]: ${e}`)));
  if (errors.length) { console.error(JSON.stringify({ok:false,errors},null,2)); process.exit(1); }
  console.log(JSON.stringify({ok:true,proposals:proposals.length}));
} catch (err) { console.error(JSON.stringify({ok:false,error:err.message})); process.exit(1); }
