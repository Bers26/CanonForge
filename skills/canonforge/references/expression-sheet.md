# Expression sheet protocol

## Purpose

An expression sheet documents how one fixed face deforms under clearly readable emotions.

It is not a collection of independently regenerated portraits.

## Specification before generation

Before drawing an expression sheet, formulate every requested emotion in words.

Each emotion must be defined as a **delta from the neutral Master Identity**.

For each expression specify, as relevant:

- brows: height, angle, convergence;
- upper and lower eyelids;
- eye opening;
- gaze direction/focus;
- forehead tension;
- nose/nostril tension when relevant;
- cheeks;
- mouth opening;
- lip compression/stretch/corners;
- jaw opening or muscular tension;
- visible teeth when relevant;
- head angle only if intentionally part of the expression.

Do not invoke image generation until all requested expressions have a concrete specification.

## Identity stays fixed

Expression may deform soft tissue and articulated facial structures.

It must not redefine:

- skull shape;
- jawbone proportions;
- chin dimensions;
- cheekbone structure;
- nose base geometry;
- inter-eye distance;
- eye socket placement;
- ear placement;
- age;
- body identity.

Use the neutral Master Identity as the geometric anchor.

Prefer targeted expression edits from the same neutral face or another controlled identity-preserving process over fresh independent portraits.

## Diagnostic intensity

Expressions on a reference sheet should be **stronger and more legible than ordinary scene acting**.

The purpose of the sheet is diagnostic readability:

- anxiety must read immediately as anxiety;
- irritation must read immediately as irritation;
- surprise must clearly differ from neutral;
- sadness must have characteristic markers rather than merely lower energy;
- fatigue must be distinguishable from neutral and sadness.

Strong does not mean caricature unless the user requests caricature.

The correct target is:

```text
reference sheet = clear, amplified, diagnostic expression
scene render     = natural intensity appropriate to the scene
```

## Example specification

```text
Irritation
CHANGE:
- brows slightly lowered and drawn together;
- upper eyelids more tense;
- lips pressed more firmly;
- mild jaw-muscle tension.

PRESERVE:
- eye shape and placement;
- nose geometry;
- cheekbone structure;
- jaw and chin proportions;
- apparent age.
```

## Review

After generation, compare each panel against the neutral anchor.

Reject or revise panels where the emotion is readable only because the face itself changed.

A valid expression sheet has:

- strongly differentiated emotions;
- stable identity;
- stable facial geometry;
- consistent age and proportions.
