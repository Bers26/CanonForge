#!/usr/bin/env node
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, validateProject, validateTransition, verifyEvidence } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(here, "../fixtures/project.valid.json");
const base = readJson(fixturePath);

function clone(v) { return JSON.parse(JSON.stringify(v)); }
function assert(condition, message) { if (!condition) throw new Error(message); }

let errors = validateProject(base);
assert(errors.length === 0, `fixture structural validation failed: ${errors.join(" | ")}`);

errors = verifyEvidence(base, fixturePath);
assert(errors.length === 0, `fixture evidence validation failed: ${errors.join(" | ")}`);

const badEvidence = clone(base);
badEvidence.characters[0].facts[0].evidence[0].quote = "неверная цитата";
errors = verifyEvidence(badEvidence, fixturePath);
assert(errors.some((e) => e.includes("quote mismatch")), "bad quote was not detected");

const immutableDrift = clone(base);
immutableDrift.revision = 2;
immutableDrift.revisionLog.push({
  revision: 2,
  timestamp: "2026-10-01T01:00:00Z",
  summary: "Illegal eye change",
  changes: ["eye color"],
  approvedBy: "user"
});
const eye = immutableDrift.characters[0].facts.find((f) => f.factId === "fact-eye-color");
eye.status = "superseded";
immutableDrift.characters[0].facts.push({
  factId: "fact-eye-color-v2",
  path: "appearance.eyes.color",
  value: "blue",
  origin: "user",
  status: "approved",
  lockPolicy: "immutable",
  evidence: [],
  validFrom: "chrome-01",
  validTo: null,
  revisionIntroduced: 2,
  supersedes: ["fact-eye-color"]
});
errors = validateTransition(base, immutableDrift);
assert(errors.some((e) => e.includes("immutable value cannot change")), "immutable drift was not rejected");

const legalMorph = clone(base);
legalMorph.revision = 2;
legalMorph.revisionLog.push({
  revision: 2,
  timestamp: "2026-10-01T01:05:00Z",
  summary: "Upgrade left arm",
  changes: ["new left arm state"],
  approvedBy: "user"
});
const cyber = legalMorph.characters[0].facts.find((f) => f.factId === "fact-left-arm-cyber");
cyber.status = "superseded";
legalMorph.characters[0].facts.push({
  factId: "fact-left-arm-cyber-v2",
  path: "body.leftArm",
  value: "advanced cybernetic prosthesis",
  origin: "user",
  status: "approved",
  lockPolicy: "explicit_event_only",
  evidence: [],
  validFrom: "chrome-02",
  validTo: null,
  revisionIntroduced: 2,
  supersedes: ["fact-left-arm-cyber"]
});
legalMorph.characters[0].states.push({
  stateId: "chrome-02",
  label: "После модернизации протеза",
  factIds: [
    "fact-age",
    "fact-eye-color",
    "fact-hair",
    "fact-legal-name",
    "fact-left-arm-cyber-v2",
    "fact-proportions-preserved"
  ],
  identityCoreVersion: "1.0"
});
legalMorph.characters[0].transformations.push({
  transformationId: "tr-left-arm-upgrade",
  fromState: "chrome-01",
  toState: "chrome-02",
  kind: "cybernetic_upgrade",
  affectedPaths: ["body.leftArm"],
  identityEffect: "preserved",
  anthropometryEffect: "none",
  approvalStatus: "approved",
  evidence: []
});
errors = validateTransition(base, legalMorph);
assert(errors.length === 0, `legal morphology transition rejected: ${errors.join(" | ")}`);

console.log(JSON.stringify({ ok: true, tests: 4 }));
