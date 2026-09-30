#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildChunkManifest } from "./chunk-source.mjs";
import { normalizeProposal, validateProposal } from "./proposals.mjs";
import { mergeNormalized } from "./merge-proposals.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, "../fixtures");
function assert(v, m) { if (!v) throw new Error(m); }

const gameText = readFileSync(resolve(fixtures, "game-log.txt"), "utf8");
const manifest = buildChunkManifest(gameText, {
  sourceId:"game-log", name:"game-log.txt", path:"game-log.txt",
  maxChars:10000, maxUnits:6, overlapUnits:1, overlapChars:1200
});
assert(manifest.strategy === "turn-log", `expected turn-log, got ${manifest.strategy}`);
assert(manifest.chunks.length === 3, `expected 3 chunks, got ${manifest.chunks.length}`);
for (const c of manifest.chunks) assert(c.text === gameText.slice(c.start,c.end), `chunk ${c.chunkId} offsets invalid`);

const plainText = readFileSync(resolve(fixtures, "plain-game-log.txt"), "utf8");
const plainManifest = buildChunkManifest(plainText, {
  sourceId:"plain-log", name:"plain-game-log.txt", path:"plain-game-log.txt",
  maxChars:170, maxUnits:3, overlapUnits:1, overlapChars:40
});
assert(plainManifest.strategy === "paragraph-window", `expected paragraph-window, got ${plainManifest.strategy}`);
assert(plainManifest.chunks.length > 1, "chapterless paragraph log should be split into multiple chunks");
for (const c of plainManifest.chunks) assert(c.text === plainText.slice(c.start,c.end), `plain chunk ${c.chunkId} offsets invalid`);

const proposals = JSON.parse(readFileSync(resolve(fixtures,"proposals.json"),"utf8"));
for (const p of proposals) assert(validateProposal(p).length === 0, "proposal fixture should validate");
const normalized = proposals.map((p) => normalizeProposal(p, manifest));
const hair = normalized[0].mentions[0].facts[0].evidence;
assert(gameText.slice(hair.start,hair.end) === hair.quote, "normalized hair evidence does not point to source");
const eyes = normalized[1].mentions[0].facts[0].evidence;
assert(gameText.slice(eyes.start,eyes.end) === eyes.quote, "normalized eye evidence does not point to source");

const merged = mergeNormalized({schemaVersion:"0.1.0",source:manifest.source,proposals:normalized});
const mira = merged.entities.find((e) => e.names.includes("Мира Вельская"));
assert(mira && mira.names.includes("Мира"), "explicit alias claim did not merge Mira forms");
assert(mira.facts.length === 2, `expected 2 Mira facts, got ${mira?.facts.length}`);
assert(merged.ambiguities.some((a) => a.normalizedName === "алекс"), "weak repeated name Алекс should remain ambiguous");
const alexEntities = merged.entities.filter((e) => e.names.includes("Алекс"));
assert(alexEntities.length === 2, `two weak Алекс mentions must not auto-merge; got ${alexEntities.length}`);

const bad = JSON.parse(JSON.stringify(proposals[0]));
bad.mentions[0].facts[0].evidence.quote = "волосы которых нет в тексте";
let rejected = false;
try { normalizeProposal(bad, manifest); } catch { rejected = true; }
assert(rejected, "proposal with nonexistent quote must be rejected");

console.log(JSON.stringify({
  ok:true,
  tests:8,
  turnLogChunks:manifest.chunks.length,
  plainLogChunks:plainManifest.chunks.length,
  entities:merged.entities.length,
  ambiguities:merged.ambiguities.length
}));
