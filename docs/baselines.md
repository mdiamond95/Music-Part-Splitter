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
