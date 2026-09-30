#!/usr/bin/env node
import process from "node:process";
import { readJson, validateProject } from "./lib.mjs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node validate-project.mjs <project.json>");
  process.exit(2);
}

try {
  const project = readJson(path);
  const errors = validateProject(project);
  if (errors.length) {
    console.error(JSON.stringify({ ok: false, errors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, projectId: project.projectId, revision: project.revision }));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  process.exit(1);
}
