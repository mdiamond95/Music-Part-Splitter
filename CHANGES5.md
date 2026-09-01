# CHANGES5 — Maple Leaf Brass format: abbreviation-only scores and headerless series naming

New fixture at `fixtures/mlb.pdf` (Maple Leaf Brass No. 115, "Prelude - The Reason I Live", 46pp,
all letter-size portrait). Same rules as before: single file, harness first, commit per phase,
don't push. Baseline it in `docs/baselines.md` before any code change.

Known context: this fixture's score (pp.2–18) labels staves with abbreviations only (Sop. Cor., 1st
Cor., 2nd Cor., 1st Bari., 2nd Bari., Euph., Perc. 1...) plus two full labels (Bass Eb, Bass Bb).
The current signal counts abbreviations as zero, so the score never opens a run and its pages are
being assigned to real parts. Also: this PDF's embedded fonts drop "ti" glyph pairs in extraction
("Salvation" → "Salva on") — nothing may assume clean words in headers. Note the score is portrait,
same size as the parts — page-size cues are useless here.

## Phase 1 — Inventory (no code change)
Full map of mlb.pdf today: where every score page lands (I expect Soprano and/or Bass
contamination), what p.1 (letterhead) and p.2 (score first page, which has NO stave labels at all)
do, whether the part pages 19–46 detect correctly, and what the naming default currently is.

## Phase 2 — Abbreviated-column score signal
Add a second, independent score signal: a page carrying N+ distinct abbreviated instrument labels
(the existing ABBREV vocabulary, extended as needed for Bari., Cor., Euph., Perc. with trailing
periods) in a column layout is a score page. Measure N from all eight fixtures the same way the
original N=4 was measured — count distinct abbreviations per page everywhere, show the table, and
pick a threshold with margin on both sides. Constraints:
- Abbreviations stay weak evidence for PART detection — this signal classifies the PAGE, it must not
  create new part matches.
- Full labels appearing inside the abbreviation column (Bass Eb, Bass Bb here) must not assign the
  page to that part when the signal fires — same precedence as the existing signal: score signal
  outranks detection.
- The run it opens behaves identically to the existing one (inheritance, boundary at the first real
  part page, dropdown override wins).
- p.2 (no labels at all) sits between the letterhead and the signal page: confirm the leading-pages
  rule sweeps p.1 AND p.2 into Full Score once the run exists (2 leading pages, under the cap of 3).
  Expected result: Full Score [1–18].

## Phase 3 — Secondary naming path
When no `<Series> <number> (year)` line exists in the first 3 pages: look for a known series name
from the abbreviation map appearing INSIDE any text item of those pages (here "Maple Leaf Brass"
inside "The Salva on Army Maple Leaf Brass"), paired with a separate "No. <digits>" item. If both
found: prefix `<ABBR> #<number> - <title>`, title from the largest text item as usual (here "Prelude
- The Reason I Live"). Expected: MLB #115 - Prelude - The Reason I Live. The primary single-line
pattern stays first; this path only runs when it found nothing. It must NOT fire from the running
heads of part pages — restrict to the first 3 pages of the document.

## Phase 4 — Verification
- Nine-row harness table (all seven existing fixtures byte-identical — in particular unity.pdf,
  whose Bar./Trom. abbreviation check must still hold, and the SP&S sets whose scores fire the
  original signal, not this one).
- mlb.pdf after: Full Score [1–18]; then the parts — expect Soprano Eb, 1st/2nd Cornet, 1st/2nd
  Horn, 1st/2nd Baritone, 1st/2nd Trombone, Bass Trombone, Euphonium, Bass Eb, Bass Bb, Percussion
  I, Percussion II — with the two-page parts intact (second pages carry running heads like
  "2 | 1st Cornet Bb - The Reason I Live"; p.43's running head extracts without its label and must
  inherit from p.42). Show the full map and the naming extraction line.
- Stub checks: the new signal's threshold with the measured margin; abbreviations still weak for
  detection; full-label-in-column precedence; the ti-dropout series match ("Salva on Army Maple Leaf
  Brass" → MLB); secondary path ignoring part running heads; and the p.2 sweep.

Hand back: inventory, threshold measurement table, before/after, nine-fixture table, naming line,
and anything that didn't fit.
