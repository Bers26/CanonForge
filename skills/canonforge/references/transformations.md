# States and transformations

## Principle

CanonForge treats body and appearance changes as chronological state transitions rather than destructive edits of the original character.

This supports Ship-of-Theseus-style continuity: many components may change while identity remains continuous.

## State

A state is a story-time snapshot with:

- `stateId`;
- label;
- fact IDs applicable in that state;
- Identity Core version.

Do not combine incompatible states in one generation request.

## Transformation

A transformation links two states.

Example:

```json
{
  "transformationId": "tr-017",
  "fromState": "baseline",
  "toState": "chrome-01",
  "kind": "cybernetic_replacement",
  "affectedPaths": [
    "body.leftArm",
    "body.torso"
  ],
  "identityEffect": "preserved",
  "anthropometryEffect": "none",
  "approvalStatus": "approved",
  "evidence": []
}
```

## Identity effect

Allowed values:

- `preserved` — same visual identity; current morphology changes.
- `modified` — Identity Core itself changes but continuity remains part of canon.
- `replaced` — the project intentionally switches to a different visual identity/body identity.

## Anthropometry effect

Allowed values:

- `none`
- `partial`
- `major`

Do not infer exact measurements from a qualitative transformation.

## Common transformation kinds

Examples:

- aging;
- haircut;
- injury;
- scarring;
- prosthetic replacement;
- cybernetic augmentation;
- mutation;
- surgery;
- reconstruction;
- disguise;
- costume state change.

The schema permits additional string kinds; semantics come from affected paths and effects.

## Ship-of-Theseus rule

Appearance change is not identity change.

A transformation may replace arms, legs, torso, skin regions, or other components while keeping the same Identity Core.

Identity changes only when canon or user approval explicitly modifies Identity Core facts.

## Transition requirements

A change to an `explicit_event_only` path requires an approved transformation that includes that path in `affectedPaths`.

A `story_event` change requires grounded evidence or an approved transformation.

An `immutable` path cannot be superseded by a different value.

Historical facts remain present and become `superseded`; they are not silently rewritten.
