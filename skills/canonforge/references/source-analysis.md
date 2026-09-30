# Shared source analysis and character workspaces

## Goal

A long source is analyzed globally once.

Selecting a character must not repeat chunking, whole-source roster discovery, or alias resolution.

## Two-stage analysis

### Stage A — lightweight roster pass

Run across every chunk and collect only what is necessary to build the cast:

- character name/label;
- exact evidence for the mention;
- stable source identity key when the source provides one;
- explicit alias relations;
- lightweight prominence signals.

Do **not** build a full biography or visual canon for every minor character at this stage.

The result is a reusable `source-analysis.json`.

### Stage B — selected character detail

After the user chooses a character, create a character workspace.

The workspace points to the existing source analysis and lists:

- chunks in which the character is directly present;
- adjacent context chunks;
- detailed chunks already present in shared cache;
- detailed chunks that still need extraction.

Detailed extraction results belong to the shared chunk cache whenever possible. If a later character needs a chunk already processed in detail, reuse it.

## Source analysis is derived cache, not canon

The original source remains authoritative.

`source-analysis.json` is a reusable derived index tied to the source SHA-256. If the source hash changes, the analysis is stale and must be refreshed.

## Key characters

"Key" is an interface ordering signal, not canon.

Use measurable prominence signals such as:

- coverage across chunks;
- repeated mentions;
- active dialogue/action/description;
- stable explicit identity.

Never discard characters solely because they are not key. The interface may present key characters first and still expose the complete roster.

## Character branch

User-facing term: **ветка персонажа**.

Internal data object: **character workspace**.

A workspace does not copy the source or repeat the global analysis. It references:

- `analysisId`;
- source ID/hash;
- selected `characterId`;
- relevant chunk IDs;
- shared cached detailed extractions;
- eventual Character Core;
- eventual visual identity.

Multiple character workspaces may coexist over one source analysis.
