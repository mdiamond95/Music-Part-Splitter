# CHANGES4 — Unity Series format: "or" joiner and flexible "PART n in Key" parts

New fixture at `fixtures/unity.pdf` (Unity Series 549, "Thank You, Lord", score-fronted, portrait
parts, several copies per part). Same rules as before: single file, harness first, commit per phase,
don't push. Baseline it in `docs/baselines.md` before any code change.

## Phase 1 — Inventory (no code change)
Run the harness on unity.pdf and report every page's detected label and today's group/status. I expect two classes of loss: the "BARITONE or TROMBONE Bb" pages and the six "PART I in C / PART II in F / PART III in F / PART III in C / PART IV in C / PART V in C" pages. Confirm, and flag anything else that's red or misgrouped. Also report the series extraction (expected "US #549 - Thank You, Lord") and the score run boundary — score p.3 has a ten-instrument column, so the signal should fire there and the run should be pp.1–10 after the cover rule.

## Phase 2 — "or" as a shared-part joiner
Extend the combined-label pattern's joiner set from {/, &} to {/, &, or} where "or" is a whole word surrounded by spaces (so it never matches inside "Tenor" or "Horn"). Display name preserves the printed form ("Baritone or Trombone Bb"); filename is the same since there's no slash. It is its own part like every other shared part, sorted after Baritone. Check that the score's abbreviated column label "Bar./Trom. Bb" still counts as one instrument in labelCount (it should already, via the overlap rule — verify).

## Phase 3 — Flexible "PART n in Key" family
Add a generic pattern, not six entries: PART followed by a Roman numeral (I–VIII) or Arabic digit, then "in", then a key (C, F, Bb, Eb, B♭, E♭ — normalise flats). Canonical name "Part III in F" (title case, Roman numeral preserved, flat rendered as "b" in filenames). Each distinct (numeral, key) pair is its own part — "Part III in F" and "Part III in C" are two parts, not one. Sort them as a block after the standard brass band parts and before percussion, ordered by numeral then key. Add them to the dropdown only when the document prints them (same rule as shared parts). The first-page test must still fire on these pages — they carry "No. 549" in the header.

## Phase 4 — Verification
- Seven-fixture harness table. All six existing fixtures byte-identical (none of them prints "or" joiners or PART-in-Key labels — confirm rather than assume; score.pdf's notes page mentions instruments in prose and must not gain a match).
- unity.pdf after: Full Score [1–10]; 1st Cornet, 2nd Cornet, 1st Horn, 2nd Horn, Baritone or Trombone Bb, Euphonium Bb, Bass Eb, Bass Bb, Percussion I, Percussion II, Percussion Score, Part I in C, Part II in F, Part III in F, Part III in C, Part IV in C, Part V in C — one page each after dedupe. Show the map and the dup count.
- Stub checks: "or" joiner positive and negatives (Tenor Horn, "Horn or" at a line end), each PART shape incl. flats and Arabic digits, the two-parts-not-one rule for same numeral different key, sort placement, and prose non-match.

Hand back: Phase 1 inventory, before/after rows, seven-fixture table, series line, and anything in the real labels that didn't fit.
