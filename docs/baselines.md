# Fixture baselines

Recorded with `npm run map -- fixtures/<file>` against the `<script id="core">` block in
`index.html`. Fixtures themselves are gitignored; this file is the committed record of what
they produce, so a later change can be checked against a known "before".

The fixtures are local to Mark's machine:

| fixture | what it is |
| --- | --- |
| `regression.pdf` | Goodness of God / First Nowell, 32 pages, two pieces per page, No. 1389/1390 |
| `multipage.pdf` | 48 pages, every part runs to two pages, no piece number |
| `score.pdf` | The First Noel (Noel Jones Series 2104), 36 pages, score in front |
| `scorefront.pdf` | **byte-identical to `carols.pdf`** (md5 `f8dad550a4765bf4e84069527dff86d2`) |
| `carols.pdf` | A Suite of English Carols (Triumph Series 1352), 79 pages, score in front |
| `encore.pdf` | Christmas Encore Medley (Arthur Gullidge Series AGS2004), 70 pages, score in front, shared Baritone/Trombone parts |

## Baseline at commit `fbe64ce` — before CHANGES2.md

| fixture | pages | parts | kept | inherited | dups | skipped | Full Score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `regression.pdf` | 32 | 16 | 16 | 0 | 16 | 0 | — |
| `multipage.pdf` | 48 | 23 | 48 | 0 | 0 | 0 | — |
| `score.pdf` | 36 | 21 | 35 | 11 | 0 | 1 (p.1) | 13 pages [2–14] |
| `scorefront.pdf` | 79 | 17 | 48 | 19 | 30 | 1 (p.1) | 19 pages [2–20] |
| `carols.pdf` | 79 | 17 | 48 | 19 | 30 | 1 (p.1) | 19 pages [2–20] |

Default filename prefix (from `load()`: piece numbers joined, else the source filename):

| fixture | prefix |
| --- | --- |
| `regression.pdf` | `1389-1390` |
| `multipage.pdf` | `multipage` |
| `score.pdf` | `score` |
| `scorefront.pdf` | `scorefront` |
| `carols.pdf` | `1352-1353` |

### `carols.pdf` — full map

```
17 parts · 48 pages kept (19 by inheritance) · 30 dropped as duplicates · 1 skipped

  Full Score           19 pages  [2..20]
  Soprano Eb            1 page   [21]
  1st Cornet Bb         2 pages  [22, 23]
  2nd Cornet Bb         2 pages  [34, 35]
  1st Horn Eb           2 pages  [40, 41]
  2nd Horn Eb           2 pages  [44, 45]
  1st Baritone Bb       2 pages  [48, 49]
  2nd Baritone Bb       1 page   [52]
  1st Trombone Bb       2 pages  [54, 55]
  2nd Trombone Bb       1 page   [58]
  Bass Trombone         1 page   [60]
  Euphonium Bb          2 pages  [61, 62]
  Bass Eb               2 pages  [65, 66]
  Bass Bb               2 pages  [69, 70]
  Percussion Score      3 pages  [77, 78, 79]
  Percussion I          2 pages  [73, 74]
  Percussion II         2 pages  [75, 76]
```

Page 1 is the only red page. Page 2 (the prose "Score Notes" page) is what opens the score run:
its `Score Notes` heading matches the Full Score regex, and pages 3–20 inherit from it — page 4
onward carry the real instrument column (16 distinct labels on p.4).

### What the covers actually contain

Both score-fronted sets use the same SP&S cover layout, and **none of it is in the header band**
(`headerItems` keeps the top 20% of the page; the cover's topmost text sits at 60% height), so
`detected` is `null`, `labels` is 0, `first` is false. There is no mis-detection to undo.

`carols.pdf` p.1 (842x595 landscape):

```
size=36.0  "A Suite of English Carols"
size=18.0  "Kenneth Downie"
size=14.0  "Triumph Series 1352 (2023)"
```

`score.pdf` p.1 (842x595 landscape):

```
size=36.0  "The First Noel"
size=18.0  "Traditional arr. Jared Proellocks"
size=14.0  "Noel Jones Series 2104 (2021)"
```

## After CHANGES2.md — Phases 3 and 4

Phase 2 was CSS and markup only and changed nothing here. Phase 3 gives leading unassigned pages to
the Full Score; Phase 4 changes the default filename prefix. Neither changes header detection.

| fixture | pages | parts | kept | inherited | dups | skipped | Full Score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `regression.pdf` | 32 | 16 | 16 | 0 | 16 | 0 | — |
| `multipage.pdf` | 48 | 23 | 48 | 0 | 0 | 0 | — |
| `score.pdf` | 36 | 21 | **36** | 11 | 0 | **0** | **14 pages [1–14]** |
| `scorefront.pdf` | 79 | 17 | **49** | 19 | 30 | **0** | **20 pages [1–20]** |
| `carols.pdf` | 79 | 17 | **49** | 19 | 30 | **0** | **20 pages [1–20]** |

Every other part's page list is byte-for-byte what it was; the only rows that moved are the three
`Full Score` groups gaining page 1.

### Series extraction and default prefix

| fixture | series parsed | default prefix |
| --- | --- | --- |
| `regression.pdf` | none found on the cover | `1389-1390` |
| `multipage.pdf` | none found on the cover | `multipage` |
| `score.pdf` | `"Noel Jones Series" #2104 (2021) -> NJS`, title `The First Noel`, from p.1 | `NJS #2104 - The First Noel` |
| `scorefront.pdf` | `"Triumph Series" #1352 (2023) -> TS`, title `A Suite of English Carols`, from p.1 | `TS #1352 - A Suite of English Carols` |
| `carols.pdf` | same as `scorefront.pdf` (identical bytes) | `TS #1352 - A Suite of English Carols` |

`score.pdf` exercises the unknown-series fallback: "Noel Jones Series" is not in the abbreviation
map, so it takes the initials of its capitalised words.

The separator is a plain hyphen-minus with spaces (` - `) **in both places** — inside the prefix and
between prefix and part name — so a filename cannot mix the two dashes:
`TS #1352 - A Suite of English Carols - 1st Cornet Bb.pdf`. The en dash is gone from the file.

### What the real PDFs say that the brief did not

- `multipage.pdf` **does** carry a series line, in a format the brief's pattern does not describe:
  `Arthur Gullidge Series (AGS2004)` — abbreviation and number fused inside the parentheses, no
  standing number, no year. It also sits in the header of every part page rather than on a cover.
  The brief requires `multipage.pdf`'s default to stay unchanged, so the pattern is deliberately not
  widened to catch it. Widening it later means handling `(<ABBR><NUMBER>)` as a second shape.
- `score.pdf`'s notes page carries `SASB 126 TB 857`, which is why the series name is restricted to
  capitalised words: a looser pattern reads that as series "SASB 126 TB" number 857.
- The "cover present but no series line" fallback has no fixture behind it. It is covered by
  `npm run check` instead.

## Correction to CHANGES.md's regression bar

CHANGES.md stated the regression bar for `regression.pdf` as "17 parts, 15 dups", in the ground
rules and again in the Phase 2 acceptance. Both figures were wrong, and had been since the brief was
written — the part list enumerated alongside them names 16 parts, not 17, and 32 pages split as 16
kept plus 16 dropped, not 15. The harness has reported 16/16 at every commit recorded above,
including the pre-CHANGES2 baseline, so nothing regressed: the target was simply mis-stated.

Corrected to 16/16 in both places. The enumerated part list was already right and is unchanged.

## CHANGES3 Phase 1 — combined-label inventory (no code change)

Every fixture's extracted text was searched for a joiner (`/` or `&`) between two known instrument
names, in the header band that detection reads and again across the whole page. A sixth file,
`encore.pdf` (70 pages, Christmas Encore Medley, Arthur Gullidge Series AGS2004, score-fronted),
is present in `fixtures/` and was inventoried too; it is the same publisher's set as `multipage.pdf`
and carries the same shared parts.

### Distinct combined labels found

| printed label | fixture · pages | group today | verdict |
| --- | --- | --- | --- |
| `1st Baritone/Trombone Bb` | `multipage.pdf` 13, 14 · `encore.pdf` 35, 36 | **1st Baritone Bb** | silently wrong |
| `2nd Baritone/Trombone Bb` | `multipage.pdf` 15, 16 · `encore.pdf` 37, 38 | **2nd Baritone Bb** | silently wrong |
| `1st. Baritone/Trombone B.C.` | `multipage.pdf` 39, 40 · `encore.pdf` 61, 62 | **1st Baritone B.C.** | silently wrong |
| `2nd Baritone/Trombone B.C.` | `multipage.pdf` 41, 42 · `encore.pdf` 63, 64 | **2nd Baritone B.C.** | silently wrong |
| `Flute/Oboe` | `multipage.pdf` 33, 34 · `score.pdf` 30 · `encore.pdf` 55, 56 | Flute/Oboe | already right |
| `String/Electric Bass` | `multipage.pdf` 47, 48 · `score.pdf` 36 · `encore.pdf` 69, 70 | String Bass | right group, lossy name |

`regression.pdf`, `carols.pdf` and `scorefront.pdf` contain no combined labels at all. Their only
joiner text is music notation (`&` clefs, `/` repeat slashes) and the copyright line
"© 2023 SP&S, a division of…", none of which name two instruments.

### The silent-wrong-assignment cases

Eight pages across two fixtures — `multipage.pdf` 13, 14, 15, 16, 39, 40, 41, 42 (and the same eight
labels on `encore.pdf` 35–38, 61–64). Each is a Baritone/Trombone shared part that today is
filed under the Baritone half alone, so the Trombone player's part arrives in a file named for the
Baritone and the label the page actually prints appears nowhere. This is what CHANGES3 exists to fix.

Why it happens: `PARTS` has no plain `Trombone` entry, and `1st Baritone B.C.` is written
`/\b1ST\.?\s*BARITONE\b.{0,60}?\bB\.C\./` — a regex whose 60-character tolerance reaches straight
across `/Trombone` to the trailing clef, so the longest-match rule settles on the Baritone half with
nothing to outrank it.

### Things that do not fit the "instrument joiner instrument" pattern

- `String/Electric Bass` — the first half is not an instrument name and the second is qualified,
  not ordinal-prefixed. It is a shared part, but it is already carried by the dedicated
  `String Bass` entry and is deliberately left there rather than forced through the new pattern.
- `Flute/Oboe` is both a real combined label and an existing `PARTS` entry. The generic pattern must
  reconstruct exactly the name that entry already uses, or `score.pdf` and `multipage.pdf` change.
- Prose, not labels: `score.pdf` p.2's Score Notes discuss "Trombone/Baritone in Bar 36" and
  "Baritone/Trombone, 2nd Horn". Both sit well below the header band, so detection never sees them,
  but the whole-page `labelCount` does.
- `encore.pdf` p.18 prints "Words/Music: English 16th Century Folk Song" — a slash label whose
  halves are not instruments.
- `encore.pdf` p.3 is a score page whose instrument column includes `1st Baritone/` and
  `2nd Baritone/`; it already resolves to Full Score on the page-level score signal (14 labels).

### The printed label is not one text item

CHANGES3 asks for the "same single-text-item constraint as series parsing where applicable". It is
not applicable here. On every real occurrence the label wraps to a second line and pdf.js returns
the halves as separate items with the centred piece title read between them:

```
p.13  "1st Baritone/"  "Christmas Encore Medley"  "Trombone B"  "b"
p.39  "1st. Baritone/" "Christmas Encore Medley"  "Trombone B.C."
p.14  "1st Baritone/"  "Trombone B"  "b"                (continuation page, no title)
```

So the pattern has to tolerate a bounded run of unrelated text after the joiner, the same way the
existing `B.C.` qualifiers already do. It is bounded and only ever allowed *after* the joiner.

## Baseline after CHANGES3 — shared parts

Run with `npm run map` and `npm run check` at the Phase 2 commit. The `detected` column and the part
list are 8 characters wider than before so a shared part's name is not truncated; that is the only
cosmetic difference, and the diffs below were taken with column widths ignored.

| fixture | pages | parts | kept | inherited | dups | skipped | changed vs before |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `regression.pdf` | 32 | 16 | 16 | 0 | 16 | 0 | identical |
| `multipage.pdf` | 48 | 23 | 48 | 0 | 0 | 0 | 8 pages renamed |
| `score.pdf` | 36 | 21 | 36 | 11 | 0 | 0 | identical |
| `scorefront.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | identical |
| `carols.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | identical |
| `encore.pdf` | 70 | 24 | 70 | 19 | 0 | 0 | 8 pages renamed |

Part counts are unchanged everywhere: a shared part replaces the half it used to be filed under
rather than adding a group. The only rows that moved are the eight pages Phase 1 named:

| fixture | pages | before | after |
| --- | --- | --- | --- |
| `multipage.pdf` | 13, 14 | `1st Baritone Bb` | `1st Baritone/Trombone Bb` |
| `multipage.pdf` | 15, 16 | `2nd Baritone Bb` | `2nd Baritone/Trombone Bb` |
| `multipage.pdf` | 39, 40 | `1st Baritone B.C.` | `1st Baritone/Trombone B.C.` |
| `multipage.pdf` | 41, 42 | `2nd Baritone B.C.` | `2nd Baritone/Trombone B.C.` |
| `encore.pdf` | 35, 36 | `1st Baritone Bb` | `1st Baritone/Trombone Bb` |
| `encore.pdf` | 37, 38 | `2nd Baritone Bb` | `2nd Baritone/Trombone Bb` |
| `encore.pdf` | 61, 62 | `1st Baritone B.C.` | `1st Baritone/Trombone B.C.` |
| `encore.pdf` | 63, 64 | `2nd Baritone B.C.` | `2nd Baritone/Trombone B.C.` |

`score.pdf` is identical including its per-page label counts. Its Score Notes page (p.2) discusses
"Trombone/Baritone in Bar 36" in prose, which the pattern on its own does match; `labelCount` ignores
a match that starts inside a text item longer than 40 characters — the same prose test the
weak-evidence check uses — so the page still reports 5 labels, not 7.
