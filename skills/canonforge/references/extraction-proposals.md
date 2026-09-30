# Extraction proposal format

The model does not write directly into Character Core.

For each chunk it returns an extraction proposal.

## Why proposals use quote + occurrence

The model must not calculate absolute character offsets.

It returns:

```json
{
  "quote": "серо-зелёные глаза",
  "occurrence": 0
}
```

where `occurrence` is the zero-based occurrence of that exact quote inside the chunk.

Deterministic code then resolves the quote to:

- source ID;
- absolute start;
- absolute end;
- exact quote;
- source SHA-256;
- chunk ID.

If the quote cannot be found exactly, the proposal is rejected.

## Minimal proposal

```json
{
  "schemaVersion": "0.1.0",
  "sourceId": "story-main",
  "chunkId": "c0001",
  "mentions": [
    {
      "mentionId": "mira-1",
      "primaryName": "Мира",
      "sourceIdentityKey": null,
      "facts": [
        {
          "path": "appearance.eyes.color",
          "value": "серо-зелёные",
          "origin": "explicit_source",
          "evidence": {
            "quote": "серо-зелёные глаза",
            "occurrence": 0
          }
        }
      ]
    }
  ],
  "aliasClaims": [],
  "transformations": [],
  "conflicts": [],
  "openQuestions": []
}
```

## sourceIdentityKey

Use `sourceIdentityKey` only when the source itself supplies a stable identity label, for example a persistent speaker ID, account ID, actor tag, or other explicit identifier.

Do not invent it from context.

Repeated equal `sourceIdentityKey` values may be merged deterministically.

## Alias claims

An alias claim connects name forms.

```json
{
  "left": "Мира",
  "right": "Мира Вельская",
  "basis": "explicit",
  "evidence": {
    "quote": "Мира Вельская; это та же Мира",
    "occurrence": 0
  }
}
```

`explicit` may participate in deterministic draft merging.

`probable` is advisory only and must not cause automatic identity merge.

## Conservative identity merge

False merge is worse than missed merge.

CanonForge may join draft mentions when there is:

- the same explicit source identity key;
- an evidence-backed explicit alias relation;
- a sufficiently specific repeated name form, while still keeping the result a draft until canon commit.

Weak single-name collisions remain separate and are surfaced for review.

Example:

```text
Алекс
Алекс
```

without stronger evidence does not prove that these are the same person.

## Draft is not canon

Merged extraction output is only a human-reviewable draft.

It does not become Character Core until the normal validation and commit path succeeds.
