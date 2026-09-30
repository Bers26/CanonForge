#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import process from "node:process";

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function parseArgs(argv) {
  const args = { maxChars: 16000, maxUnits: 32, overlapUnits: 2, overlapChars: 1200 };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { positional.push(a); continue; }
    const key = a.slice(2);
    const value = argv[++i];
    if (value === undefined) throw new Error(`missing value for --${key}`);
    if (key === "out") args.out = value;
    else if (key === "source-id") args.sourceId = value;
    else if (key === "max-chars") args.maxChars = Number(value);
    else if (key === "max-units") args.maxUnits = Number(value);
    else if (key === "overlap-units") args.overlapUnits = Number(value);
    else if (key === "overlap-chars") args.overlapChars = Number(value);
    else throw new Error(`unknown option --${key}`);
  }
  if (positional.length !== 1) throw new Error("usage: node chunk-source.mjs <source> --out <chunks.json> --source-id <id> [--max-chars N] [--max-units N] [--overlap-units N]");
  if (!args.out || !args.sourceId) throw new Error("--out and --source-id are required");
  for (const k of ["maxChars","maxUnits"]) if (!Number.isInteger(args[k]) || args[k] < 1) throw new Error(`--${k} must be a positive integer`);
  for (const k of ["overlapUnits","overlapChars"]) if (!Number.isInteger(args[k]) || args[k] < 0) throw new Error(`--${k} must be a non-negative integer`);
  if (args.overlapUnits >= args.maxUnits) throw new Error("--overlap-units must be smaller than --max-units");
  return { input: positional[0], ...args };
}

const PATTERNS = {
  turn: /^\s*(?:#{1,6}\s*)?(?:MOVE|TURN|ХОД)\s*(?:#|№|:|-)?\s*\d+\b/iu,
  promptResponse: /^\s*#{1,6}\s*(?:Prompt|Response|User|Assistant|Human|AI|Пользователь|Ассистент)\s*:?[ \t]*$/iu,
  genericChatRole: /^\s*(?:User|Assistant|Human|AI|Пользователь|Ассистент|\{\{user\}\}|\{\{char\}\})\s*:/iu,
  timestamp: /^\s*(?:\[\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}(?::\d{2})?[^\]]*\]|\d{1,2}\.\d{1,2}\.\d{4}[, \t]+\d{1,2}:\d{2}(?::\d{2})?)/u,
  session: /^\s*(?:#{1,6}\s*)?(?:SESSION|СЕССИЯ|DAY|ДЕНЬ)\s*(?:#|№|:|-)?\s*[\w.-]+\b/iu,
  chapter: /^\s*(?:#{1,6}\s*)?(?:CHAPTER|ГЛАВА|PART|ЧАСТЬ|BOOK|КНИГА)\s+(?:\d+|[IVXLCDM]+|[А-ЯA-Z0-9_-]+)\b/iu,
  scene: /^\s*(?:#{1,6}\s*)?(?:SCENE|СЦЕНА)\s*(?:#|№|:|-)?\s*[\w.-]+\b/iu
};

function lineStarts(text) {
  const out = [];
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === "\n") {
      const end = i < text.length ? i + 1 : i;
      out.push({ start, end, line: text.slice(start, i) });
      start = end;
    }
  }
  return out;
}

function classifyLine(line) {
  for (const [kind, re] of Object.entries(PATTERNS)) if (re.test(line)) return kind;
  return null;
}

function detectStrategy(text) {
  const markers = [];
  const counts = Object.fromEntries(Object.keys(PATTERNS).map((k) => [k, 0]));
  for (const l of lineStarts(text)) {
    const kind = classifyLine(l.line);
    if (kind) { markers.push({ start: l.start, kind }); counts[kind]++; }
  }
  const conversational = counts.turn + counts.promptResponse + counts.genericChatRole;
  const structural = counts.chapter + counts.scene + counts.session;
  if (conversational >= 3) return { strategy: "turn-log", markers, counts };
  if (counts.timestamp >= 3) return { strategy: "timestamp-log", markers, counts };
  if (structural >= 2) return { strategy: "structured-narrative", markers, counts };

  const paragraphs = [0];
  const re = /(?:^|\n\s*\n)(\S)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const idx = m.index + m[0].lastIndexOf(m[1]);
    if (idx > 0 && !paragraphs.includes(idx)) paragraphs.push(idx);
  }
  paragraphs.sort((a,b) => a-b);
  if (paragraphs.length >= 3) return {
    strategy: "paragraph-window",
    markers: paragraphs.map((start) => ({ start, kind: "paragraph" })),
    counts
  };
  return { strategy: "fixed-window", markers: [], counts };
}

function boundariesFor(text, detection) {
  const { strategy, markers } = detection;
  let starts = [];
  if (strategy === "turn-log") {
    const allowed = new Set(["turn","promptResponse","genericChatRole","session"]);
    starts = markers.filter((m) => allowed.has(m.kind));
  } else if (strategy === "timestamp-log") {
    const allowed = new Set(["timestamp","session"]);
    starts = markers.filter((m) => allowed.has(m.kind));
  } else if (strategy === "structured-narrative") {
    const allowed = new Set(["chapter","scene","session"]);
    starts = markers.filter((m) => allowed.has(m.kind));
  } else if (strategy === "paragraph-window") {
    starts = markers;
  }
  starts.sort((a,b) => a.start - b.start);
  const deduped = [];
  for (const item of starts) if (!deduped.length || deduped.at(-1).start !== item.start) deduped.push(item);
  if (deduped.length && deduped[0].start !== 0) deduped.unshift({ start: 0, kind: "preamble" });
  if (!deduped.length) deduped.push({ start: 0, kind: "window" });
  return deduped.map((b, i) => ({
    unitIndex: i,
    start: b.start,
    end: i + 1 < deduped.length ? deduped[i+1].start : text.length,
    kind: b.kind
  }));
}

function splitOversizeUnit(text, unit, maxChars, overlapChars) {
  if (unit.end - unit.start <= maxChars) return [unit];
  const parts = [];
  let start = unit.start;
  while (start < unit.end) {
    let end = Math.min(unit.end, start + maxChars);
    if (end < unit.end) {
      const floor = start + Math.floor(maxChars * 0.6);
      const nl = text.lastIndexOf("\n\n", end);
      const one = text.lastIndexOf("\n", end);
      const cut = nl >= floor ? nl + 2 : (one >= floor ? one + 1 : end);
      end = cut;
    }
    parts.push({ ...unit, start, end, kind: `${unit.kind}:part` });
    if (end >= unit.end) break;
    start = Math.max(start + 1, end - overlapChars);
  }
  return parts;
}

function chunkUnits(text, units, { strategy, maxChars, maxUnits, overlapUnits, overlapChars }) {
  const expanded = units.flatMap((u) => splitOversizeUnit(text, u, maxChars, overlapChars));
  if (strategy === "structured-narrative") {
    return expanded.map((u) => ({ start: u.start, end: u.end, unitStart: u.unitIndex, unitEnd: u.unitIndex, boundaryKinds: [u.kind] }));
  }
  if (strategy === "fixed-window") {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      let end = Math.min(text.length, start + maxChars);
      if (end < text.length) {
        const floor = start + Math.floor(maxChars * 0.6);
        const nl = text.lastIndexOf("\n\n", end);
        const one = text.lastIndexOf("\n", end);
        end = nl >= floor ? nl + 2 : (one >= floor ? one + 1 : end);
      }
      chunks.push({ start, end, unitStart: null, unitEnd: null, boundaryKinds: ["window"] });
      if (end >= text.length) break;
      start = Math.max(start + 1, end - overlapChars);
    }
    return chunks;
  }

  const chunks = [];
  let i = 0;
  while (i < expanded.length) {
    const first = expanded[i];
    let j = i;
    let end = first.end;
    while (j + 1 < expanded.length && j - i + 1 < maxUnits) {
      const candidate = expanded[j + 1];
      if (candidate.end - first.start > maxChars) break;
      j++;
      end = candidate.end;
    }
    const slice = expanded.slice(i, j + 1);
    chunks.push({
      start: first.start,
      end,
      unitStart: first.unitIndex,
      unitEnd: slice.at(-1).unitIndex,
      boundaryKinds: [...new Set(slice.map((u) => u.kind))]
    });
    if (j >= expanded.length - 1) break;
    const advance = Math.max(1, (j - i + 1) - overlapUnits);
    i += advance;
  }
  return chunks;
}

export function buildChunkManifest(text, options) {
  const detection = detectStrategy(text);
  const units = boundariesFor(text, detection);
  const rawChunks = chunkUnits(text, units, { ...options, strategy: detection.strategy });
  const hash = sha256(text);
  return {
    schemaVersion: "0.1.0",
    source: {
      sourceId: options.sourceId,
      name: options.name ?? options.sourceId,
      path: options.path ?? null,
      sha256: hash,
      length: text.length
    },
    strategy: detection.strategy,
    markerCounts: detection.counts,
    parameters: {
      maxChars: options.maxChars,
      maxUnits: options.maxUnits,
      overlapUnits: options.overlapUnits,
      overlapChars: options.overlapChars
    },
    chunks: rawChunks.map((c, i) => ({
      chunkId: `c${String(i + 1).padStart(4, "0")}`,
      start: c.start,
      end: c.end,
      unitStart: c.unitStart,
      unitEnd: c.unitEnd,
      boundaryKinds: c.boundaryKinds,
      text: text.slice(c.start, c.end)
    }))
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const text = readFileSync(args.input, "utf8");
    const manifest = buildChunkManifest(text, {
      sourceId: args.sourceId,
      name: basename(args.input),
      path: basename(args.input),
      maxChars: args.maxChars,
      maxUnits: args.maxUnits,
      overlapUnits: args.overlapUnits,
      overlapChars: args.overlapChars
    });
    writeFileSync(args.out, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.log(JSON.stringify({ ok: true, strategy: manifest.strategy, chunks: manifest.chunks.length, out: args.out }));
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exit(1);
  }
}
