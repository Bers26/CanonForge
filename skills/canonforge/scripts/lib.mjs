import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, normalize, resolve } from "node:path";

export const ORIGINS = new Set(["explicit_source", "user", "inferred", "design_choice", "unknown"]);
export const STATUSES = new Set(["proposed", "confirmed", "approved", "rejected", "conflict", "superseded"]);
export const LOCK_POLICIES = new Set(["immutable", "explicit_event_only", "story_event", "allowed_variation", "scene_variable", "open_design_variable"]);
const IDENTITY_EFFECTS = new Set(["preserved", "modified", "replaced"]);
const ANTHROPOMETRY_EFFECTS = new Set(["none", "partial", "major"]);
const TRANSFORM_APPROVALS = new Set(["proposed", "approved", "rejected"]);
const VISUAL_STATUSES = new Set(["none", "exploration", "locked"]);
const ASSET_APPROVALS = new Set(["candidate", "approved", "rejected"]);
const SHEET_STATUSES = new Set(["planned", "candidate", "approved", "rejected"]);
const SHA256 = /^[a-fA-F0-9]{64}$/;

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function sha256Text(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
}

export function sameValue(a, b) {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const v of values) {
    if (seen.has(v)) duplicates.add(v);
    seen.add(v);
  }
  return [...duplicates];
}

function ensureArray(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path}: expected array`);
    return [];
  }
  return value;
}

function ensureString(value, path, errors, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || value.length === 0) errors.push(`${path}: expected non-empty string`);
}

function ensureInt(value, path, errors, min = 0) {
  if (!Number.isInteger(value) || value < min) errors.push(`${path}: expected integer >= ${min}`);
}

function validateEvidence(evidence, path, sourceIds, errors) {
  if (!isObject(evidence)) {
    errors.push(`${path}: expected object`);
    return;
  }
  ensureString(evidence.sourceId, `${path}.sourceId`, errors);
  ensureInt(evidence.start, `${path}.start`, errors, 0);
  ensureInt(evidence.end, `${path}.end`, errors, 1);
  if (Number.isInteger(evidence.start) && Number.isInteger(evidence.end) && evidence.end <= evidence.start) {
    errors.push(`${path}: end must be greater than start`);
  }
  if (typeof evidence.quote !== "string") errors.push(`${path}.quote: expected string`);
  if (typeof evidence.sourceHash !== "string" || !SHA256.test(evidence.sourceHash)) {
    errors.push(`${path}.sourceHash: expected SHA-256 hex`);
  }
  if (typeof evidence.sourceId === "string" && !sourceIds.has(evidence.sourceId)) {
    errors.push(`${path}.sourceId: unknown source ${evidence.sourceId}`);
  }
}

function validateFact(fact, path, sourceIds, projectRevision, errors) {
  if (!isObject(fact)) {
    errors.push(`${path}: expected object`);
    return;
  }
  ensureString(fact.factId, `${path}.factId`, errors);
  ensureString(fact.path, `${path}.path`, errors);
  if (!("value" in fact)) errors.push(`${path}.value: missing`);
  if (!ORIGINS.has(fact.origin)) errors.push(`${path}.origin: invalid value`);
  if (!STATUSES.has(fact.status)) errors.push(`${path}.status: invalid value`);
  if (!LOCK_POLICIES.has(fact.lockPolicy)) errors.push(`${path}.lockPolicy: invalid value`);
  const evidence = ensureArray(fact.evidence, `${path}.evidence`, errors);
  evidence.forEach((e, i) => validateEvidence(e, `${path}.evidence[${i}]`, sourceIds, errors));
  if (!(fact.validFrom === null || typeof fact.validFrom === "string")) errors.push(`${path}.validFrom: expected string or null`);
  if (!(fact.validTo === null || typeof fact.validTo === "string")) errors.push(`${path}.validTo: expected string or null`);
  ensureInt(fact.revisionIntroduced, `${path}.revisionIntroduced`, errors, 1);
  if (Number.isInteger(fact.revisionIntroduced) && fact.revisionIntroduced > projectRevision) {
    errors.push(`${path}.revisionIntroduced: cannot exceed project revision`);
  }
  const supersedes = ensureArray(fact.supersedes, `${path}.supersedes`, errors);
  if (!supersedes.every((x) => typeof x === "string" && x.length > 0)) errors.push(`${path}.supersedes: every item must be a non-empty string`);
  for (const d of duplicateValues(supersedes)) errors.push(`${path}.supersedes: duplicate ${d}`);
}

export function validateProject(project) {
  const errors = [];
  if (!isObject(project)) return ["project: expected object"];
  if (project.schemaVersion !== "0.1.0") errors.push("schemaVersion: expected 0.1.0");
  ensureString(project.projectId, "projectId", errors);
  ensureString(project.title, "title", errors);
  ensureInt(project.revision, "revision", errors, 1);

  const sources = ensureArray(project.sources, "sources", errors);
  const sourceIds = new Set();
  for (const [i, source] of sources.entries()) {
    const path = `sources[${i}]`;
    if (!isObject(source)) { errors.push(`${path}: expected object`); continue; }
    ensureString(source.sourceId, `${path}.sourceId`, errors);
    ensureString(source.name, `${path}.name`, errors);
    ensureString(source.path, `${path}.path`, errors);
    if (typeof source.path === "string") {
      const n = normalize(source.path);
      if (isAbsolute(source.path) || n === ".." || n.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
        errors.push(`${path}.path: must remain inside the project directory`);
      }
    }
    if (typeof source.sha256 !== "string" || !SHA256.test(source.sha256)) errors.push(`${path}.sha256: expected SHA-256 hex`);
    if (!["text", "markdown", "script", "log", "other"].includes(source.kind)) errors.push(`${path}.kind: invalid value`);
    ensureInt(source.length, `${path}.length`, errors, 0);
    if (typeof source.sourceId === "string") {
      if (sourceIds.has(source.sourceId)) errors.push(`${path}.sourceId: duplicate ${source.sourceId}`);
      sourceIds.add(source.sourceId);
    }
  }

  const characters = ensureArray(project.characters, "characters", errors);
  const characterIds = new Set();
  const globalFactIds = new Set();
  const characterMaps = new Map();

  for (const [ci, character] of characters.entries()) {
    const cp = `characters[${ci}]`;
    if (!isObject(character)) { errors.push(`${cp}: expected object`); continue; }
    ensureString(character.characterId, `${cp}.characterId`, errors);
    ensureString(character.displayName, `${cp}.displayName`, errors);
    if (typeof character.characterId === "string") {
      if (characterIds.has(character.characterId)) errors.push(`${cp}.characterId: duplicate ${character.characterId}`);
      characterIds.add(character.characterId);
    }
    const aliases = ensureArray(character.aliases, `${cp}.aliases`, errors);
    if (!aliases.every((x) => typeof x === "string" && x.length > 0)) errors.push(`${cp}.aliases: every item must be a non-empty string`);
    for (const d of duplicateValues(aliases)) errors.push(`${cp}.aliases: duplicate ${d}`);

    const facts = ensureArray(character.facts, `${cp}.facts`, errors);
    const factMap = new Map();
    for (const [fi, fact] of facts.entries()) {
      validateFact(fact, `${cp}.facts[${fi}]`, sourceIds, project.revision, errors);
      if (isObject(fact) && typeof fact.factId === "string") {
        if (globalFactIds.has(fact.factId)) errors.push(`${cp}.facts[${fi}].factId: duplicate global factId ${fact.factId}`);
        globalFactIds.add(fact.factId);
        factMap.set(fact.factId, fact);
      }
    }
    characterMaps.set(character.characterId, { character, factMap });

    for (const fact of facts) {
      if (!isObject(fact) || !Array.isArray(fact.supersedes)) continue;
      for (const oldId of fact.supersedes) {
        const oldFact = factMap.get(oldId);
        if (!oldFact) errors.push(`${cp}.facts.${fact.factId}.supersedes: unknown fact ${oldId}`);
        else if (oldFact.path !== fact.path) errors.push(`${cp}.facts.${fact.factId}.supersedes: path mismatch with ${oldId}`);
      }
    }

    if (!isObject(character.identity)) errors.push(`${cp}.identity: expected object`);
    else {
      for (const key of ["identityCoreFactIds", "identityAnchorFactIds"]) {
        const ids = ensureArray(character.identity[key], `${cp}.identity.${key}`, errors);
        for (const id of ids) if (!factMap.has(id)) errors.push(`${cp}.identity.${key}: unknown fact ${id}`);
      }
    }

    if (!isObject(character.baselineBody)) errors.push(`${cp}.baselineBody: expected object`);
    else {
      const ids = ensureArray(character.baselineBody.factIds, `${cp}.baselineBody.factIds`, errors);
      for (const id of ids) if (!factMap.has(id)) errors.push(`${cp}.baselineBody.factIds: unknown fact ${id}`);
    }

    const states = ensureArray(character.states, `${cp}.states`, errors);
    const stateIds = new Set();
    for (const [si, state] of states.entries()) {
      const sp = `${cp}.states[${si}]`;
      if (!isObject(state)) { errors.push(`${sp}: expected object`); continue; }
      ensureString(state.stateId, `${sp}.stateId`, errors);
      ensureString(state.label, `${sp}.label`, errors);
      ensureString(state.identityCoreVersion, `${sp}.identityCoreVersion`, errors);
      const ids = ensureArray(state.factIds, `${sp}.factIds`, errors);
      for (const id of ids) if (!factMap.has(id)) errors.push(`${sp}.factIds: unknown fact ${id}`);
      if (typeof state.stateId === "string") {
        if (stateIds.has(state.stateId)) errors.push(`${sp}.stateId: duplicate ${state.stateId}`);
        stateIds.add(state.stateId);
      }
    }

    const transformations = ensureArray(character.transformations, `${cp}.transformations`, errors);
    const transformationIds = new Set();
    for (const [ti, tr] of transformations.entries()) {
      const tp = `${cp}.transformations[${ti}]`;
      if (!isObject(tr)) { errors.push(`${tp}: expected object`); continue; }
      ensureString(tr.transformationId, `${tp}.transformationId`, errors);
      ensureString(tr.fromState, `${tp}.fromState`, errors);
      ensureString(tr.toState, `${tp}.toState`, errors);
      ensureString(tr.kind, `${tp}.kind`, errors);
      if (typeof tr.fromState === "string" && !stateIds.has(tr.fromState)) errors.push(`${tp}.fromState: unknown state ${tr.fromState}`);
      if (typeof tr.toState === "string" && !stateIds.has(tr.toState)) errors.push(`${tp}.toState: unknown state ${tr.toState}`);
      if (tr.fromState === tr.toState) errors.push(`${tp}: fromState and toState must differ`);
      const affected = ensureArray(tr.affectedPaths, `${tp}.affectedPaths`, errors);
      if (affected.length === 0) errors.push(`${tp}.affectedPaths: must not be empty`);
      if (!affected.every((x) => typeof x === "string" && x.length > 0)) errors.push(`${tp}.affectedPaths: every item must be a non-empty string`);
      if (!IDENTITY_EFFECTS.has(tr.identityEffect)) errors.push(`${tp}.identityEffect: invalid value`);
      if (!ANTHROPOMETRY_EFFECTS.has(tr.anthropometryEffect)) errors.push(`${tp}.anthropometryEffect: invalid value`);
      if (!TRANSFORM_APPROVALS.has(tr.approvalStatus)) errors.push(`${tp}.approvalStatus: invalid value`);
      const evs = ensureArray(tr.evidence, `${tp}.evidence`, errors);
      evs.forEach((e, i) => validateEvidence(e, `${tp}.evidence[${i}]`, sourceIds, errors));
      if (typeof tr.transformationId === "string") {
        if (transformationIds.has(tr.transformationId)) errors.push(`${tp}.transformationId: duplicate ${tr.transformationId}`);
        transformationIds.add(tr.transformationId);
      }
    }

    const locks = ensureArray(character.locks, `${cp}.locks`, errors);
    for (const [li, lock] of locks.entries()) {
      const lp = `${cp}.locks[${li}]`;
      if (!isObject(lock)) { errors.push(`${lp}: expected object`); continue; }
      ensureString(lock.path, `${lp}.path`, errors);
      if (!LOCK_POLICIES.has(lock.policy)) errors.push(`${lp}.policy: invalid value`);
      ensureString(lock.reason, `${lp}.reason`, errors);
      ensureInt(lock.introducedRevision, `${lp}.introducedRevision`, errors, 1);
    }

    ensureArray(character.openQuestions, `${cp}.openQuestions`, errors);
    ensureArray(character.conflicts, `${cp}.conflicts`, errors);

    if (!isObject(character.visualIdentity)) errors.push(`${cp}.visualIdentity: expected object`);
    else {
      if (!VISUAL_STATUSES.has(character.visualIdentity.status)) errors.push(`${cp}.visualIdentity.status: invalid value`);
      if (!(character.visualIdentity.version === null || typeof character.visualIdentity.version === "string")) errors.push(`${cp}.visualIdentity.version: expected string or null`);
      ensureArray(character.visualIdentity.masterAssetIds, `${cp}.visualIdentity.masterAssetIds`, errors);
      ensureArray(character.visualIdentity.approvedTraits, `${cp}.visualIdentity.approvedTraits`, errors);
      ensureArray(character.visualIdentity.negativeConstraints, `${cp}.visualIdentity.negativeConstraints`, errors);
    }

    const sheets = ensureArray(character.sheets, `${cp}.sheets`, errors);
    for (const [si, sheet] of sheets.entries()) {
      const sp = `${cp}.sheets[${si}]`;
      if (!isObject(sheet)) { errors.push(`${sp}: expected object`); continue; }
      ensureString(sheet.sheetId, `${sp}.sheetId`, errors);
      ensureString(sheet.sheetType, `${sp}.sheetType`, errors);
      if (!(sheet.stateId === null || typeof sheet.stateId === "string")) errors.push(`${sp}.stateId: expected string or null`);
      if (typeof sheet.stateId === "string" && !stateIds.has(sheet.stateId)) errors.push(`${sp}.stateId: unknown state ${sheet.stateId}`);
      if (!SHEET_STATUSES.has(sheet.status)) errors.push(`${sp}.status: invalid value`);
      ensureArray(sheet.assetIds, `${sp}.assetIds`, errors);
    }
  }

  for (const key of ["world", "style"]) {
    if (!isObject(project[key])) errors.push(`${key}: expected object`);
    else {
      const facts = ensureArray(project[key].facts, `${key}.facts`, errors);
      facts.forEach((f, i) => validateFact(f, `${key}.facts[${i}]`, sourceIds, project.revision, errors));
    }
  }

  const assets = ensureArray(project.assets, "assets", errors);
  const assetIds = new Set();
  for (const [ai, asset] of assets.entries()) {
    const ap = `assets[${ai}]`;
    if (!isObject(asset)) { errors.push(`${ap}: expected object`); continue; }
    ensureString(asset.assetId, `${ap}.assetId`, errors);
    ensureString(asset.role, `${ap}.role`, errors);
    ensureString(asset.fileName, `${ap}.fileName`, errors);
    if (typeof asset.sha256 !== "string" || !SHA256.test(asset.sha256)) errors.push(`${ap}.sha256: expected SHA-256 hex`);
    if (!(asset.characterId === null || typeof asset.characterId === "string")) errors.push(`${ap}.characterId: expected string or null`);
    if (typeof asset.characterId === "string" && !characterIds.has(asset.characterId)) errors.push(`${ap}.characterId: unknown character ${asset.characterId}`);
    if (!(asset.stateId === null || typeof asset.stateId === "string")) errors.push(`${ap}.stateId: expected string or null`);
    if (!(asset.visualIdentityVersion === null || typeof asset.visualIdentityVersion === "string")) errors.push(`${ap}.visualIdentityVersion: expected string or null`);
    if (!ASSET_APPROVALS.has(asset.approvalStatus)) errors.push(`${ap}.approvalStatus: invalid value`);
    if (typeof asset.assetId === "string") {
      if (assetIds.has(asset.assetId)) errors.push(`${ap}.assetId: duplicate ${asset.assetId}`);
      assetIds.add(asset.assetId);
    }
  }

  for (const [characterId, { character }] of characterMaps.entries()) {
    for (const assetId of character.visualIdentity?.masterAssetIds ?? []) {
      if (!assetIds.has(assetId)) errors.push(`character ${characterId}.visualIdentity.masterAssetIds: unknown asset ${assetId}`);
    }
    for (const sheet of character.sheets ?? []) {
      for (const assetId of sheet.assetIds ?? []) if (!assetIds.has(assetId)) errors.push(`character ${characterId}.sheet ${sheet.sheetId}: unknown asset ${assetId}`);
    }
  }

  const log = ensureArray(project.revisionLog, "revisionLog", errors);
  if (log.length === 0) errors.push("revisionLog: must not be empty");
  let lastRevision = 0;
  for (const [ri, entry] of log.entries()) {
    const rp = `revisionLog[${ri}]`;
    if (!isObject(entry)) { errors.push(`${rp}: expected object`); continue; }
    ensureInt(entry.revision, `${rp}.revision`, errors, 1);
    ensureString(entry.timestamp, `${rp}.timestamp`, errors);
    ensureString(entry.summary, `${rp}.summary`, errors);
    ensureArray(entry.changes, `${rp}.changes`, errors);
    if (!["user", "system"].includes(entry.approvedBy)) errors.push(`${rp}.approvedBy: invalid value`);
    if (Number.isInteger(entry.revision)) {
      if (entry.revision <= lastRevision) errors.push(`${rp}.revision: must be strictly increasing`);
      lastRevision = entry.revision;
    }
  }
  if (Number.isInteger(project.revision) && lastRevision !== project.revision) errors.push(`revisionLog: last revision ${lastRevision} does not equal project revision ${project.revision}`);

  return errors;
}

function allEvidence(project) {
  const items = [];
  for (const character of project.characters ?? []) {
    for (const fact of character.facts ?? []) {
      for (const evidence of fact.evidence ?? []) items.push({ owner: `fact:${fact.factId}`, evidence });
    }
    for (const tr of character.transformations ?? []) {
      for (const evidence of tr.evidence ?? []) items.push({ owner: `transformation:${tr.transformationId}`, evidence });
    }
  }
  for (const scope of [project.world, project.style]) {
    for (const fact of scope?.facts ?? []) {
      for (const evidence of fact.evidence ?? []) items.push({ owner: `fact:${fact.factId}`, evidence });
    }
  }
  return items;
}

export function verifyEvidence(project, projectFilePath) {
  const errors = [];
  const structural = validateProject(project);
  if (structural.length) return structural.map((e) => `structural: ${e}`);
  const baseDir = dirname(resolve(projectFilePath));
  const sources = new Map();

  for (const source of project.sources) {
    const sourcePath = resolve(baseDir, source.path);
    if (!sourcePath.startsWith(baseDir)) {
      errors.push(`source ${source.sourceId}: path escapes project directory`);
      continue;
    }
    let text;
    try {
      text = readFileSync(sourcePath, "utf8");
    } catch (err) {
      errors.push(`source ${source.sourceId}: cannot read ${source.path}: ${err.message}`);
      continue;
    }
    const hash = sha256Text(text);
    if (hash !== source.sha256) errors.push(`source ${source.sourceId}: sha256 mismatch`);
    if (text.length !== source.length) errors.push(`source ${source.sourceId}: length mismatch (${text.length} != ${source.length})`);
    sources.set(source.sourceId, { text, hash });
  }

  for (const { owner, evidence } of allEvidence(project)) {
    const source = sources.get(evidence.sourceId);
    if (!source) {
      errors.push(`${owner}: source ${evidence.sourceId} unavailable`);
      continue;
    }
    if (evidence.sourceHash !== source.hash) errors.push(`${owner}: evidence sourceHash mismatch`);
    if (evidence.start < 0 || evidence.end > source.text.length || evidence.end <= evidence.start) {
      errors.push(`${owner}: evidence offsets out of range`);
      continue;
    }
    const actual = source.text.slice(evidence.start, evidence.end);
    if (actual !== evidence.quote) errors.push(`${owner}: evidence quote mismatch; got ${JSON.stringify(actual)}`);
  }
  return errors;
}

const STATUS_TRANSITIONS = new Map([
  ["proposed", new Set(["proposed", "confirmed", "approved", "rejected", "conflict", "superseded"])],
  ["confirmed", new Set(["confirmed", "approved", "conflict", "superseded"])],
  ["approved", new Set(["approved", "conflict", "superseded"])],
  ["conflict", new Set(["conflict", "confirmed", "approved", "rejected", "superseded"])],
  ["rejected", new Set(["rejected", "superseded"])],
  ["superseded", new Set(["superseded"])]
]);

function factImmutablePayload(fact) {
  return {
    factId: fact.factId,
    path: fact.path,
    value: fact.value,
    origin: fact.origin,
    lockPolicy: fact.lockPolicy,
    evidence: fact.evidence,
    validFrom: fact.validFrom,
    validTo: fact.validTo,
    revisionIntroduced: fact.revisionIntroduced,
    supersedes: fact.supersedes
  };
}

function factsByCharacter(project) {
  return new Map((project.characters ?? []).map((c) => [c.characterId, new Map((c.facts ?? []).map((f) => [f.factId, f]))]));
}

export function validateTransition(oldProject, newProject) {
  const errors = [];
  const structural = validateProject(newProject);
  if (structural.length) errors.push(...structural.map((e) => `new project: ${e}`));
  if (oldProject.projectId !== newProject.projectId) errors.push("projectId: cannot change");
  if (newProject.revision !== oldProject.revision + 1) errors.push(`revision: expected ${oldProject.revision + 1}`);

  const oldLog = oldProject.revisionLog ?? [];
  const newLog = newProject.revisionLog ?? [];
  if (newLog.length !== oldLog.length + 1) errors.push("revisionLog: exactly one entry must be appended");
  else {
    for (let i = 0; i < oldLog.length; i++) if (!sameValue(oldLog[i], newLog[i])) errors.push(`revisionLog[${i}]: historical entry changed`);
  }

  const oldChars = new Map((oldProject.characters ?? []).map((c) => [c.characterId, c]));
  const newChars = new Map((newProject.characters ?? []).map((c) => [c.characterId, c]));
  const oldFacts = factsByCharacter(oldProject);
  const newFacts = factsByCharacter(newProject);

  for (const [characterId] of oldChars) {
    const newCharacter = newChars.get(characterId);
    if (!newCharacter) {
      errors.push(`character ${characterId}: cannot be silently deleted`);
      continue;
    }
    const oFacts = oldFacts.get(characterId);
    const nFacts = newFacts.get(characterId);

    for (const [factId, oldFact] of oFacts) {
      const newFact = nFacts.get(factId);
      if (!newFact) {
        errors.push(`character ${characterId} fact ${factId}: historical fact cannot be deleted`);
        continue;
      }
      if (!sameValue(factImmutablePayload(oldFact), factImmutablePayload(newFact))) {
        errors.push(`character ${characterId} fact ${factId}: historical fact payload changed`);
      }
      const allowed = STATUS_TRANSITIONS.get(oldFact.status);
      if (!allowed?.has(newFact.status)) errors.push(`character ${characterId} fact ${factId}: illegal status transition ${oldFact.status} -> ${newFact.status}`);
    }

    const approvedTransformPaths = new Set((newCharacter.transformations ?? [])
      .filter((t) => t.approvalStatus === "approved")
      .flatMap((t) => t.affectedPaths ?? []));

    for (const [factId, newFact] of nFacts) {
      if (oFacts.has(factId)) continue;
      if (newFact.revisionIntroduced !== newProject.revision) errors.push(`character ${characterId} fact ${factId}: revisionIntroduced must equal new revision`);
      for (const oldId of newFact.supersedes ?? []) {
        const oldFact = oFacts.get(oldId);
        if (!oldFact) {
          errors.push(`character ${characterId} fact ${factId}: cannot supersede non-historical fact ${oldId}`);
          continue;
        }
        if (oldFact.path !== newFact.path) errors.push(`character ${characterId} fact ${factId}: superseded path mismatch`);
        const carried = nFacts.get(oldId);
        if (carried?.status !== "superseded") errors.push(`character ${characterId} fact ${oldId}: must be marked superseded`);
        if (sameValue(oldFact.value, newFact.value)) continue;

        const policy = oldFact.lockPolicy;
        if (policy === "immutable") errors.push(`character ${characterId} path ${newFact.path}: immutable value cannot change`);
        if (policy === "explicit_event_only" && !approvedTransformPaths.has(newFact.path)) {
          errors.push(`character ${characterId} path ${newFact.path}: explicit_event_only change requires approved transformation`);
        }
        if (policy === "story_event" && (newFact.evidence?.length ?? 0) === 0 && !approvedTransformPaths.has(newFact.path)) {
          errors.push(`character ${characterId} path ${newFact.path}: story_event change requires evidence or approved transformation`);
        }
      }
    }
  }

  return errors;
}
