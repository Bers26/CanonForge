#!/usr/bin/env node
import process from "node:process";
import { writeFileSync } from "node:fs";

const [output, projectId, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(" ").trim();
if (!output || !projectId || !title) {
  console.error("usage: node init-project.mjs <output.json> <projectId> <title...>");
  process.exit(2);
}

const project = {
  schemaVersion: "0.1.0",
  projectId,
  title,
  revision: 1,
  sources: [],
  characters: [],
  assets: [],
  world: { facts: [] },
  style: { facts: [] },
  revisionLog: [{
    revision: 1,
    timestamp: new Date().toISOString(),
    summary: "Initialize CanonForge project",
    changes: ["project initialized"],
    approvedBy: "system"
  }]
};

writeFileSync(output, JSON.stringify(project, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ ok: true, output, projectId, revision: 1 }));
