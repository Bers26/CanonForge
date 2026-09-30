# CanonForge: source analysis and character branches

## User-visible behavior

After a user uploads a story or game log, CanonForge does not immediately build a full visual bible for every named person.

It first performs one reusable whole-source pass and presents a character roster.

Example:

~~~text
Найденные ключевые персонажи

1. Зира
2. Лиа
3. Вилена
4. Роланд
5. Гаррет

Также найдено: 12 второстепенных персонажей.
~~~

CanonForge must wait for user selection before creating a character branch.

## Why this exists

A 1000-turn log may be expensive to inspect in full.

Repeating whole-file preprocessing for each character would waste work and can introduce inconsistent alias resolution between character sessions.

Therefore one source has one reusable source analysis.

## Data flow

~~~text
SOURCE FILE
   |
   v
CHUNK MANIFEST
   |
   v
LIGHTWEIGHT ROSTER PASS
   |
   v
SOURCE ANALYSIS
   |
   +--> character roster shown to user
   |
   +--> Branch: Zira
   |
   +--> Branch: Lia
   |
   +--> Branch: Vilena
~~~

All branches reference the same analysisId and source SHA-256.

## Lightweight roster pass

The first pass extracts only enough information to answer:

- who appears;
- which name forms belong together with strong support;
- which chunks contain the character;
- which characters are prominent across the source;
- which same-name cases remain ambiguous.

It deliberately avoids building a complete appearance/history record for every minor NPC.

## Character selection

The user chooses a character by name or ID.

Only after selection CanonForge creates a character workspace.

The workspace contains references, not a copy of the source.

It records:

- direct chunks where the character appears;
- adjacent context chunks;
- which detailed chunk extractions are already cached;
- which chunks still need detailed extraction.

## Shared detailed extraction cache

Detailed extraction is cached by chunk.

This matters when two selected characters share scenes.

~~~text
chunk c0084 contains both Zira and Lia

Zira branch processes c0084
        |
        v
shared cache: c0084 = complete
        |
        v
Lia branch later needs c0084
        |
        v
reuse cached detailed extraction
~~~

The second branch does not ask the model to analyze that chunk again.

## Source changes

The source analysis is tied to source SHA-256.

If the source file changes, old offsets and chunk identities may no longer be valid.

The old source analysis must therefore be treated as stale until refreshed.

Future work may support incremental refresh for append-only logs, but v0.1 prefers correctness over clever partial invalidation.

## Key-character ordering

The "key" label is only a navigation aid.

It may use:

- chunk coverage;
- mention frequency;
- dialogue/action/description participation;
- explicit stable identity signals.

It must never delete or suppress non-key characters from the underlying roster.

## Privacy

Real user logs may be used locally as development fixtures or format checks only when authorized.

They must not be copied into the public CanonForge repository unless the user explicitly requests publication of that exact material.
