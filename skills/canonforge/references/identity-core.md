# Identity Core and locks

## Purpose

Identity Core describes the visual continuity of a character across ordinary changes and identity-preserving transformations.

It is intentionally smaller than the complete appearance record.

## Typical Identity Core anchors

Examples:

- cranial geometry;
- facial proportions;
- relative eye/nose/jaw geometry;
- eye shape;
- distinctive facial marks;
- baseline silhouette;
- characteristic proportional relationships;
- visually important asymmetry;
- stable apparent-age type when canon requires it.

Do not put temporary costume, pose, lighting, dirt, scene emotion, or current body hardware into Identity Core unless the project explicitly defines them as identity-bearing.

## Baseline Body versus current morphology

Baseline Body is the reference body state.

Current morphology is represented by the selected story state and its applicable facts.

A replaced component does not automatically change identity.

Example:

```text
baseline left arm = organic
current left arm = cybernetic prosthesis
Identity Core = unchanged
```

unless an approved transformation explicitly modifies the Identity Core.

## Lock policies

### immutable

Ordinary project evolution may not change the value.

Use for properties that the canon treats as fixed.

### explicit_event_only

The value may change only through an explicitly represented and approved transformation.

Typical examples:

- cranial reconstruction;
- permanent eye replacement;
- limb replacement;
- major body reconstruction.

### story_event

The value may change through a grounded or approved story event.

Typical examples:

- current costume;
- injury state;
- temporary hair cut that occurs in the story.

### allowed_variation

The property may vary within canon-compatible bounds.

Example: hairstyle variations that preserve length, color, and hair type.

### scene_variable

The property is not stable character canon.

Examples: pose, camera angle, facial expression, weather lighting.

### open_design_variable

The source intentionally or accidentally leaves the property unspecified and it is available for visual exploration.

## Anti-drift checks

For identity-sensitive generation, explicitly review:

- apparent age;
- skull/face width;
- jaw and chin shape;
- nose geometry;
- eye placement and shape;
- eye color;
- neck length;
- body proportions;
- silhouette;
- distinctive marks;
- required asymmetry;
- required prostheses or implants;
- forbidden makeup/jewelry/stylistic drift when applicable.

Anti-drift constraints describe what the generator must preserve. They do not replace the canonical data.
