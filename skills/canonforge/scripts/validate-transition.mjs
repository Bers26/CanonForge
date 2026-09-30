#!/usr/bin/env node
import process from "node:process";
import { readJson, validateTransition } from "./lib.mjs";

const oldPath = process.argv[2];
const newPath = process.argv[3];
if (!oldPath || !newPath) {
  console.error("usage: node validate-transition.mjs <old-project.json> <new-project.json>");
  process.exit(2);
}

try {
  const oldProject = readJson(oldPath);
  const newProject = readJson(newPath);
  const errors = validateTransition(oldProject, newProject);
  if (errors.length) {
    console.error(JSON.stringify({ ok: false, errors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, projectId: newProject.projectId, revision: newProject.revision }));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  process.exit(1);
}
