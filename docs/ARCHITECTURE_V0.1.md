# CanonForge v0.1 Architecture

Status: accepted initial architecture, 2026-10-01.

## Decision

CanonForge v0.1 is a **skills-only ChatGPT plugin**.

The first working version does not require:

- MCP server;
- MCP App;
- Extensions;
- external LLM;
- external image API;
- database;
- commercial SaaS;
- local diffusion stack.

The plugin uses ChatGPT for semantic interpretation and native image generation, while deterministic scripts own validation.

## Boundary

```text
USER SOURCE
    |
    v
CANONFORGE SKILL
    |
    +-- semantic work
    |     extraction proposals
    |     ambiguity analysis
    |     contradiction analysis
    |     critical questions
    |     generation specifications
    |
    +-- deterministic core
          structural validation
          evidence verification
          lock validation
          transition validation
          revision integrity
    |
    v
VERSIONED PROJECT JSON
    |
    +-- human-readable character card
    +-- generation specification
    |
    v
CHATGPT NATIVE IMAGE GENERATION
    |
    v
USER APPROVAL
    |
    v
NEW PROJECT REVISION
```

## Architectural laws

```text
MODEL != DATABASE
MODEL != VALIDATOR
GENERATOR != CANON AUTHORITY
```

Unknown values remain unknown. Approved visual output is not canon until approval is committed.

## Character Core

The unique part of CanonForge is the combination of:

- grounded textual canon;
- provenance;
- Identity Core;
- Baseline Body;
- Current Morphology;
- lock policies;
- chronological states;
- identity-preserving and identity-changing transformations;
- visual approvals;
- visual identity versions;
- anti-drift validation;
- revision history.

## Data mutation

All meaningful changes use:

```text
PROPOSE
  -> deterministic validation
  -> semantic / visual review when needed
  -> user approval when identity-sensitive
  -> COMMIT
  -> new revision
```

Existing fact IDs are append-only history. A later fact can supersede an earlier fact; the old fact is not silently rewritten.

## Evidence

A source-grounded fact carries:

- source ID;
- start offset;
- end offset;
- exact quote;
- source hash.

The validator must check:

```text
source.slice(start, end) === quote
```

and the stored hash against the current source file.

## Identity continuity

Identity is not equivalent to current body parts.

A character may retain identity across:

- hair changes;
- costume changes;
- scars;
- injuries;
- prostheses;
- partial body replacement;
- cybernetic augmentation;
- aging;

unless canon explicitly changes the Identity Core.

Identity-sensitive geometry and anchors use stronger lock policies than ordinary scene properties.

## Visual workflow

```text
SOURCE
 -> EXTRACTION
 -> CHARACTER CANON
 -> CONFLICTS / QUESTIONS
 -> OPEN DESIGN VARIABLES
 -> EXPLORATION
 -> USER SELECTION
 -> MASTER IDENTITY
 -> TURNAROUND
 -> EXPRESSIONS / POSES / COSTUME / DETAILS
 -> STATE REFERENCES
 -> SCENES
```

Use a small reference bundle:

```text
Master Identity
+ task-relevant secondary reference
+ Current State
+ constraints
```

Strong transformations are edit-first.

## Persistence

v0.1 uses a portable versioned JSON project plus separately stored visual assets.

A custom `.charpack` handler, app UI, and automatic cross-session storage are deferred until the core workflow proves itself.

## Explicit non-goals for v0.1

Do not build:

- custom image generator;
- paid provider adapters;
- LoRA training;
- vector database;
- graph database;
- custom carousel;
- full NLP/coreference engine;
- face-recognition pipeline;
- custom file handler;
- general event-sourcing framework.

## Required vertical prototype

Before expanding production sheets, verify:

```text
short source
 -> grounded canon
 -> exploration
 -> selection
 -> Master Identity
 -> Turnaround
 -> Expression Sheet
 -> identity-preserving cybernetic transformation
 -> new scene
```

The prototype must reveal whether native image generation preserves identity well enough for the intended workflow.

## Deferred experimental questions

1. Reliability of skill-driven native image generation.
2. Cross-chat continuity from project JSON plus approved images.
3. Real identity stability under profile, action, lighting, aging, injury, and heavy cyberization.
4. Native-generated image handoff into a future MCP App.
5. Large Russian/game-log extraction quality.

These require prototypes or benchmarks, not additional general market research.
