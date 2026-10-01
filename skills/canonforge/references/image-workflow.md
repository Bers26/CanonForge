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

## Visual feedback rule

A corrective comment is not a command to regenerate blindly.

When the user says that something is wrong:

1. analyze the existing image first;
2. identify the concrete deviation;
3. explain what changed incorrectly or failed to change;
4. preserve every already-correct element;
5. formulate the smallest effective correction;
6. only then generate or edit.

Do not repeat the same generation operation with a slightly rewritten prompt unless the analysis shows that prompt wording was the actual cause.

If the correction concerns identity, geometry, cross-view consistency, or preservation of an approved design, follow `visual-revision.md`.

## Master Identity

After selection, create a neutral reference intended to maximize identity readability.

The approved exploration candidate or approved source portrait is the **primary identity anchor**. Master Identity must be derived from that anchor rather than treated as a fresh reinterpretation.

A Master Identity reference should provide:

- clear face;
- clear full-body proportions when relevant;
- neutral or controlled lighting;
- neutral expression;
- canonical colors;
- minimal lens distortion;
- minimal scene clutter.

### Cross-view geometry rule

Additional views do not independently redefine the face.

For 3/4 and profile views, preserve the approved anchor's underlying geometry, including where relevant:

- cranial proportions;
- cheekbone width and position;
- mandibular angle;
- jaw taper;
- chin width, length, and projection;
- nose bridge and projection;
- inter-eye spacing and eye placement;
- forehead and hairline;
- ear position;
- neck proportions.

Prefer targeted edits or controlled view derivation from the approved anchor.

Do not accept a multi-view sheet as Master Identity merely because all panels depict a similar-looking person. If geometry drifts between views, the sheet remains unapproved.

After user approval, record the valid reference as a `master_identity` asset and advance the visual identity version.

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

Expression sheets have an additional mandatory specification step. Follow `expression-sheet.md`.

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

A written label such as "same geometry" or "same character" is not evidence that identity was preserved. Judge the rendered geometry itself.
