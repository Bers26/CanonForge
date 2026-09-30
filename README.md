# CanonForge

CanonForge is a ChatGPT plugin for building, approving, and preserving character canon and visual identity from stories, scripts, RPG logs, character cards, and related source material.

## v0.1 architecture

The first version is intentionally **skills-only**. It does not require an MCP server, external LLM, external image API, database, or commercial SaaS.

```text
source material
  -> grounded extraction
  -> Character Core
  -> conflicts / critical questions
  -> user approval
  -> exploration specification
  -> ChatGPT native image generation
  -> visual approval
  -> versioned project state
```

The project source of truth is a portable versioned JSON file. The model proposes semantic changes; deterministic scripts validate evidence, locks, transitions, references, and revisions before changes are committed.

## Core principles

- Model != database.
- Model != validator.
- Generator != canon authority.
- Unknown stays unknown.
- Canon and visual identity are separate.
- Approved visual identity becomes a visual source of truth without replacing textual canon.
- Identity-sensitive mutations use **propose -> validate -> approve -> commit**.
- Strong transformations should prefer **edit-first** workflows over reconstructing the character from scratch.
- Existing approved facts are append-only history; later facts supersede them instead of silently rewriting them.

## Repository layout

```text
plugin.json
skills/canonforge/
  SKILL.md
  references/
  scripts/
  assets/
  fixtures/
docs/
  ARCHITECTURE_V0.1.md
```

## Current milestone

Build and verify the deterministic Character Core before investing in custom UI or MCP persistence.

Planned vertical prototype:

```text
text
 -> character canon
 -> exploration
 -> selected concept
 -> Master Identity
 -> Turnaround
 -> Expression Sheet
 -> identity-preserving transformation
 -> new scene
```

## Status

Early v0.1 implementation.
