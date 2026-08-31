# CHANGES3 — Shared parts (e.g. Baritone/Trombone)

Sets sometimes contain shared parts labelled with two instruments joined by a slash, e.g. "Baritone/Trombone", "1st Baritone/2nd Trombone Bb", "2nd Baritone/Trombone B.C.". These are single parts in the set and must come out as one file named by the full printed label, never silently absorbed into one of the two instruments' files.

## Phase 1 — Inventory (no code change)
Search all five fixtures' extracted labels for combined labels (any label containing "/" or " & " between two known instrument names). Report every distinct one found, which pages carry it, and — critically — what today's code does with each: which group those pages currently land in. If any currently land inside a plain instrument group, list them as the silent-wrong-assignment cases this change exists to fix.

## Phase 2 — Detection and grouping
- Recognise combined labels generically, not by enumerating combos: an optional ordinal (1st/2nd/Solo), an instrument name, a joiner (/ or &), an optional second ordinal, a second instrument name, and optional trailing key/clef (Bb/Eb/B.C./T.C.). All within a single label span, same single-text-item constraint as series parsing where applicable.
- A combined label is its own part. Canonical display/file name: preserve the printed form but replace "/" with "-" for the filename (safeName strips "/" already — verify it maps to "-" rather than deleting, so the name stays readable).
- Longest-match already prefers qualified labels; ensure the combined match ranks above either of its halves so "1st Baritone/2nd Trombone" never resolves to "1st Baritone".
- Sort order: place a combined part immediately after the first of its two instruments in band order.
- The score-signal labelCount must count a combined label as ONE instrument (I believe this is already true from the earlier overlap fix — verify with a test, don't assume).

## Phase 3 — Verification
- Five-fixture harness: regression.pdf, score.pdf/scorefront.pdf/carols.pdf byte-identical unless Phase 1 found combined labels in them; multipage.pdf's map changes only on the pages Phase 1 identified, and show the before/after rows for exactly those pages.
- Add stub tests: each pattern shape above, a combined label vs its halves, filename mapping of "/", and the labelCount-counts-one check.

Hand back the Phase 1 inventory, the before/after rows, the five-fixture table, and anything in the real labels that didn't fit the pattern.
