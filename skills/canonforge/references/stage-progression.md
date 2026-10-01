# Stage progression and blockers

## Purpose

CanonForge should feel like a guided workflow rather than a collection of disconnected outputs.

Every user-visible stage has:

- a current result;
- a blocker set;
- a readiness state;
- one concrete next stage.

## Blocker rule

A blocker is a condition that genuinely prevents safe or meaningful entry into the next stage.

Examples of blockers:

- no resolvable character;
- several characters when one must be selected;
- unresolved identity collision affecting the selected character;
- failed evidence validation;
- a contradiction that changes Identity Core and cannot be resolved from source;
- missing user approval where approval is required.

The following are **not** blockers by default:

- unspecified hairstyle when hairstyle is an open design variable;
- unknown exact height when only qualitative height is canon;
- optional biography details;
- minor unresolved facts irrelevant to the next artifact;
- design choices intentionally left for Exploration.

## Ready rule

After producing or updating a stage result:

1. recompute blockers;
2. if blockers remain, state the minimum blocker set;
3. if no blockers remain, state that the stage is ready;
4. propose the exact next stage and what it will produce.

Do not finish a ready stage with a passive summary only.

## User control

A proposal to advance is not automatic execution.

Wait for the user's acceptance unless:

- the user already instructed CanonForge to continue through subsequent stages; or
- the next action is an internal deterministic substep needed to complete the current requested stage.

## Standard gates

### Roster -> Character branch

Blockers:

- zero resolvable characters;
- multiple characters with no selection;
- identity ambiguity that prevents knowing which character the user means.

Special case:

- exactly one unambiguous character: no selection blocker. Propose detailed analysis of that character.

### Character branch -> Character Core review

Blockers:

- failed evidence verification;
- unresolved critical conflicts;
- ambiguous identity affecting extracted facts.

When clear, propose review/commit of Character Core.

### Character Core -> Visual Exploration

Blockers:

- uncommitted critical corrections;
- unresolved hard contradiction in Identity Core.

Open design variables are not blockers. They are inputs to Exploration.

When clear, propose Exploration Sheet.

### Exploration -> Master Identity

Blocker:

- no approved candidate or approved combination of candidate components.

When approved, propose Master Identity.

### Visual correction loop

When the user reports a defect in a generated visual, generation pauses before the next image operation.

Blockers:

- the defect has not yet been identified precisely;
- the correction would require an approved anchor that is unavailable;
- the requested fix conflicts with locked identity/canon and the conflict is unresolved.

Required action before drawing again:

- analyze the failure;
- identify its cause;
- state what must remain unchanged;
- define the targeted correction.

When those blockers are clear, proceed with the targeted edit if the user already asked for correction; otherwise propose the edit.

### Master Identity -> Production

Blockers:

- Master Identity not approved;
- cross-view identity geometry still drifts;
- unresolved required state/transformation mismatch.

When clear, propose the next useful production artifact such as turnaround, expressions, costume, transformation state, or requested scene.

### Expression specification -> Expression sheet

Before drawing expressions, each requested emotion must have a written facial specification.

Blockers:

- one or more emotions are only labels without concrete facial changes;
- the specification changes anatomy instead of expression;
- the neutral Master Identity anchor is unavailable when consistency depends on it.

When clear, generate the expression sheet with deliberately strong, diagnostic expressions while preserving identity.

## Response style

Keep stage transitions explicit and short.

Good pattern:

```text
Блокеров больше нет.
Следующий этап — Exploration Sheet: 4–6 вариантов внешности по открытым параметрам.
Перейти к нему?
```

Do not bury readiness inside a long technical explanation.
