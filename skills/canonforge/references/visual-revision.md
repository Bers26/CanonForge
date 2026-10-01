# Visual revision protocol

## Purpose

Correct visual errors without replacing a controlled identity with another fresh approximation.

## Mandatory analyze-before-draw rule

When the user comments that a visual result is wrong, inconsistent, drifting, malformed, or otherwise needs correction, CanonForge must not immediately generate another image.

First analyze.

The analysis should answer:

1. What exactly is wrong?
2. Which visible properties differ from the approved target?
3. What type of error is this?
4. What likely caused it?
5. Which parts of the current image are already correct?
6. What is the smallest correction that addresses the cause?

Only after this analysis may image generation or editing resume.

## Error classes

Use concrete classes where possible:

- identity geometry;
- body proportions;
- facial proportions;
- cross-view consistency;
- pose;
- expression;
- gaze;
- hairstyle;
- costume;
- prop;
- state/transformation;
- composition;
- camera/lens;
- lighting;
- style;
- material/detail;
- text/label/layout.

A correction may involve more than one class, but do not use vague labels such as "looks wrong" as the final diagnosis.

## Preserve-correct rule

A revision must explicitly distinguish:

```text
CHANGE
PRESERVE
OPTIONAL
```

Do not let a local correction reopen already approved traits.

## Fix the cause, not the operation

If a full regeneration caused identity drift, another full regeneration is not the default repair.

If a multi-view sheet contains incompatible face geometry, do not solve it by generating another complete multi-view sheet from text alone.

Choose the correction mechanism based on the defect:

- local detail error -> targeted local edit;
- pose error -> pose edit while preserving identity;
- expression error -> expression edit from neutral anchor;
- identity drift -> return to approved identity anchor;
- cross-view drift -> derive the incorrect view from the anchor;
- transformation error -> edit from the approved prior state.

## Approved anchor rule

For identity-sensitive corrections, the approved image that defines the character is the geometric source of truth.

Examples:

- approved exploration candidate;
- approved source portrait;
- approved Master Identity;
- approved prior state for a transformation.

If the required anchor is unavailable, do not pretend to perform a controlled targeted edit. Treat the missing anchor as a blocker.

## Cross-view correction

When front, 3/4, and profile views disagree, choose one approved anchor and preserve its geometry.

Track at least:

- cheekbone contour and width;
- mandibular angle;
- jaw taper;
- chin height;
- chin width;
- chin projection;
- nose length and projection;
- eye placement;
- brow/forehead proportions;
- ear position relative to eyes/nose.

Correct the drifting view rather than averaging conflicting panels.

## Master Identity acceptance

A sheet is not valid Master Identity merely because:

- the title says "Master Identity";
- captions say "same geometry";
- faces are generally similar;
- style, hair, and colors match.

Reject Master Identity when identity-bearing geometry changes materially across views or expressions.

The intended sequence is:

```text
approved anchor
 -> derive one controlled view
 -> compare
 -> correct if needed
 -> derive next view
 -> compare
 -> assemble sheet
 -> final cross-view review
 -> user approval
```

## Repeated failure

If the same defect survives two correction attempts, stop repeating the edit mechanically.

Re-analyze the cause, anchor choice, preservation constraints, and generation strategy before a third attempt.
