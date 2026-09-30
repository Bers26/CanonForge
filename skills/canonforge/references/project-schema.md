# CanonForge project data semantics

The canonical file is a versioned JSON document. It is the source of truth for durable project state.

## Project

Required top-level concepts:

- `schemaVersion`
- `projectId`
- `title`
- `revision`
- `sources`
- `characters`
- `assets`
- `world`
- `style`
- `revisionLog`

## Fact is the atomic canon unit

A character property is not stored only as a bare value. It is represented as a Fact with provenance, status, lock policy, validity, and revision metadata.

Core fields:

```json
{
  "factId": "fact-eye-color",
  "path": "appearance.eyes.color",
  "value": "gray-green",
  "origin": "explicit_source",
  "status": "confirmed",
  "lockPolicy": "immutable",
  "evidence": [],
  "validFrom": null,
  "validTo": null,
  "revisionIntroduced": 3,
  "supersedes": []
}
```

## Origin

Origin answers: where did the value come from?

Allowed values:

- `explicit_source`
- `user`
- `inferred`
- `design_choice`
- `unknown`

Origin and approval status are independent.

Example:

```text
origin = design_choice
status = approved
```

means the source never specified the trait, but the user deliberately adopted it into the visual canon.

## Status

Status answers: what is the project's current relationship to the fact?

Allowed values:

- `proposed`
- `confirmed`
- `approved`
- `rejected`
- `conflict`
- `superseded`

## Lock policy

Allowed policies:

- `immutable` — cannot change in normal project evolution.
- `explicit_event_only` — may change only through an explicitly approved transformation.
- `story_event` — may change when a grounded or approved story event changes it.
- `allowed_variation` — may vary within canon-compatible bounds.
- `scene_variable` — belongs to the current scene rather than stable identity.
- `open_design_variable` — intentionally unspecified and available to Exploration.

## Evidence

Source-grounded evidence must be mechanically verifiable.

```json
{
  "sourceId": "novel-main",
  "start": 18341,
  "end": 18360,
  "quote": "серо-зелёные глаза",
  "sourceHash": "sha256..."
}
```

Offsets are zero-based JavaScript string offsets: `source.slice(start, end)` must equal `quote`.

The source hash protects against stale offsets after the source file changes.

## Character

A character contains:

```text
Character
|
+-- identity
|   +-- aliases
|   +-- identityCoreFactIds
|   +-- identityAnchorFactIds
|
+-- facts
+-- baselineBody
+-- states
+-- transformations
+-- locks
+-- openQuestions
+-- conflicts
+-- visualIdentity
+-- sheets
```

## Identity Core

Identity Core contains facts that define visual continuity across ordinary modifications.

Typical examples:

- cranial geometry;
- facial proportions;
- relative eye/nose/jaw geometry;
- distinctive marks;
- visual-age type;
- baseline silhouette;
- key proportional anchors.

It does not automatically include every current body component.

## Baseline Body

Baseline Body points to facts describing the reference body before later transformations.

Exact measurements must not be invented. Qualitative source facts remain qualitative until the user or source supplies precision.

## States

A state is a story-time snapshot.

It has:

- `stateId`
- human-readable label;
- applicable fact IDs;
- Identity Core version.

Do not mix facts from incompatible states.

## Transformations

A transformation explicitly links two states and records:

- kind;
- affected paths;
- identity effect;
- anthropometry effect;
- evidence;
- approval status.

Identity effects:

- `preserved`
- `modified`
- `replaced`

## Visual Identity

Visual identity is separate from textual canon.

Suggested fields:

- `status`: `none | exploration | locked`
- `version`
- `masterAssetIds`
- `approvedTraits`
- `negativeConstraints`

Generated images remain candidates until user approval is committed.

## Revisions

The project revision is monotonically increasing.

Historical facts are not silently rewritten. Later facts use `supersedes` to point to previous facts they replace.

The revision log records the reason for each committed state change.
