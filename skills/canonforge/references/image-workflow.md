# Image workflow

## Renderer

CanonForge v0.1 uses ChatGPT native image generation and editing.

The generator renders proposals. It does not author canon.

## Exploration

Before visual identity is locked:

1. collect confirmed canon;
2. collect hard locks;
3. collect user-approved facts;
4. identify open design variables;
5. identify forbidden drift;
6. generate several materially distinct candidates.

All candidates must satisfy fixed facts. Variation should occur only in open design variables.

A candidate remains unapproved until the user selects or explicitly approves it.

## Selection

The user may:

- approve one candidate;
- reject candidates;
- combine elements from several candidates;
- specify additional corrections.

When combining candidates, the combined result is a new candidate and requires approval.

## Master Identity

After selection, create a neutral reference intended to maximize identity readability:

- clear face;
- clear full-body proportions;
- neutral or controlled lighting;
- neutral expression;
- canonical colors;
- minimal lens distortion;
- minimal scene clutter.

After user approval, record it as a `master_identity` asset and advance the visual identity version.

## Reference bundle

Use the smallest useful bundle.

Preferred pattern:

```text
Master Identity
+ one task-relevant secondary reference
+ Current State
+ explicit constraints
```

Examples:

```text
Master Identity
+ Costume Reference
+ pose/action brief
```

or:

```text
Master Identity
+ Cybernetic State Reference
+ scene brief
```

Do not attach every available sheet to every generation.

## Production sheets

Sheet types are declarative templates over the same identity engine.

Initial types:

- master_identity;
- turnaround;
- expressions;
- poses;
- costume;
- props;
- details.

Future types may include scale, action, equipment, materials, damage/wear, animation, facial animation, environment interaction, UI portrait, and LOD references.

## Transformations

For strong identity-preserving changes, prefer edit-first:

```text
approved state
 -> targeted edit
 -> preserve Identity Core
 -> user approval
 -> new approved state reference
```

Explicitly separate:

- what changes;
- what must remain fixed;
- what is allowed to vary.

## Drift review

A visual reviewer may propose drift findings, but its judgment is probabilistic.

Master Identity approval and identity-sensitive transformation approval remain user decisions in v0.1.
