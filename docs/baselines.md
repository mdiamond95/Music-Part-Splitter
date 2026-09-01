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
| `unity.pdf` | Thank You, Lord (Unity Series 549), 38 pages, score in front, an "or" shared part and six "Part n in Key" parts |

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
  not ordinal-prefixed. It is a shared part, carried until now by the dedicated `String Bass` entry,
  which files it correctly but under a name the page never prints. Picked up by the qualifier shape
  added in the follow-up below.
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

## Follow-up — the qualifier shape ("String/Electric Bass")

The pattern in Phase 2 wanted two instrument names. `String/Electric Bass` has neither: the first
half is a bare qualifier and the second qualifies the instrument that ends the label. A second shape
now admits it, on three conditions that keep everything else out — the joiner is printed tight, with
no space on either side; the span ends on a known instrument and its optional key; and each bare word
is three letters or more. Repeat-slash glyphs (`‰ ‰ ‰ / ‘ ‘`), `Words/Music:`, `3/4` and
`piano/rhythm guitar` all fail at least one of those. `Bass` joined the instrument list for it, with
a trailing lookahead so it cannot match inside "basses" in the notes-page prose.

`String Bass` stays in `PARTS`: a set printing the plain label, or printing the joiner loose as
`String / Electric Bass`, still lands there.

| fixture | pages | before | after |
| --- | --- | --- | --- |
| `multipage.pdf` | 47, 48 | `String Bass` | `String/Electric Bass` |
| `score.pdf` | 36 | `String Bass` | `String/Electric Bass` |
| `encore.pdf` | 69, 70 | `String Bass` | `String/Electric Bass` |

Those five rows are the whole diff. `regression.pdf`, `carols.pdf` and `scorefront.pdf` are
unchanged, no per-page label count moved anywhere, and every part count is the same as before — the
shared part replaces the group it was hiding in rather than adding one. File name:
`String-Electric Bass.pdf`; it sorts in the `String Bass` slot, at the end of the basses.

## CHANGES4 Phase 1 — unity.pdf baseline (no code change)

`npm run map -- fixtures/unity.pdf` at commit `d0dfab5`, before any CHANGES4 code.

```
38 pages · 11 parts · 19 pages kept (6 by inheritance) · 9 dropped as duplicates · 10 skipped
```

| part | pages |
| --- | --- |
| Full Score | 1–9 |
| 1st Cornet Bb | 10 |
| 2nd Cornet Bb | 14 |
| 1st Horn Eb | 16 |
| 2nd Horn Eb | 18 |
| Euphonium Bb | 24 |
| Bass Eb | 26 |
| Bass Bb | 28 |
| Percussion I | 30 |
| Percussion II | 31 |
| Percussion Score | 32 |

### Series extraction

`series: "Unity Series" #549 (2025) -> US · title: "Thank You, Lord" · from p.1`, giving the default
prefix `US #549 - Thank You, Lord`. As expected in the brief.

### Score run boundary

p.1 is the blank cover, joined to the score by the cover rule. p.2 is `SCORE NOTES`. p.3 is the first
score page and fires the page-level signal, and pp.4–9 inherit it; the run ends at p.10, which turns
portrait (595x842 against the score's landscape 842x595) and carries the `1st CORNET Bb` title block.

So the Full Score is **pp.1–9, not pp.1–10** as the brief expects. p.10 is the first Cornet part, not
the last page of the score: the score is seven pages of music (3–9) behind two of front matter.

The signal fires on p.3 with **9 labels, not 10**. The tenth instrument in that column is printed
`Bar./Trom. Bb`, and the abbreviated form matches no `PARTS` entry at all, so it contributes nothing
— it does not count as one instrument via the overlap rule, it counts as none. Harmless here (9 is
well past the threshold of 4), but it is not what the brief assumes, and it means the abbreviated
column label is invisible to the score signal rather than merged by it. The nine that do count are
1st Cornet, 2nd Cornet, 1st Horn, 2nd Horn, Euphonium, Bass Eb, Bass Bb, Percussion I, Percussion II.

### The two classes of loss — 10 pages, all red

| pages | printed label | detected today | status |
| --- | --- | --- | --- |
| 20, 21, 22, 23 | `BARITONE or TROMBONE Bb` | nothing | skipped |
| 33 | `PART I in C` | nothing | skipped |
| 34 | `PART II in F` | nothing | skipped |
| 35 | `PART III in F` | nothing | skipped |
| 36 | `PART III in C` | nothing | skipped |
| 37 | `PART IV in C` | nothing | skipped |
| 38 | `PART V in C` | nothing | skipped |

Both classes are silent losses of a different kind from CHANGES3's: nothing is mis-assigned, the
pages simply fall out of the export. Four of the ten are the shared Baritone/Trombone part, printed
four times over (pp.20–23), so the part is missing entirely rather than short of copies. Nothing else
in the file is red or misgrouped: the other 28 pages all land where they should.

### The labels themselves

Both new shapes arrive as a single text item, unlike CHANGES3's wrapped labels:

```
p.20  "THANK YOU, LORD" · "No. 549" · "ANDREW MACKERETH" · "BARITONE or TROMBONE B" · "b"
p.33  "THANK YOU, LORD" · "No. 549" · "ANDREW MACKERETH" · "PART I in C"
p.35  "THANK YOU, LORD" · "No. 549" · "ANDREW MACKERETH" · "PART III in F"
```

The label is set at 14.5pt and the flat sign is a separate item, as it is everywhere else in these
sets. Every one of the ten pages passes the first-page test on `No. 549` at 14pt, so none of them can
inherit from the page before — which is why they are skipped outright rather than absorbed.

### The other six fixtures

Scanned for both new shapes before touching any code: no `or` joiner between two instrument names and
no `Part n in Key` label anywhere in `regression.pdf`, `multipage.pdf`, `score.pdf`, `carols.pdf` or
`encore.pdf`. The only bare "or"s are prose on `encore.pdf` pp.2 and 18 ("(or any) weight on the
note", "extra percussion or vocal shouts"), neither of which puts an instrument name on both sides.

## Baseline after CHANGES4 — the Unity Series format

`npm run map` and `npm run check` at the Phase 3 commit, against the pre-CHANGES4 code (`d0dfab5`).

| fixture | pages | parts | kept | inherited | dups | skipped | changed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `regression.pdf` | 32 | 16 | 16 | 0 | 16 | 0 | byte-identical |
| `multipage.pdf` | 48 | 23 | 48 | 0 | 0 | 0 | byte-identical |
| `score.pdf` | 36 | 21 | 36 | 11 | 0 | 0 | byte-identical |
| `scorefront.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | byte-identical |
| `carols.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | byte-identical |
| `encore.pdf` | 70 | 24 | 70 | 19 | 0 | 0 | byte-identical |
| `unity.pdf` | 38 | 11 → **18** | 26 | 6 | 12 | **10 → 0** | 10 pages recovered |

Byte-identical is measured, not assumed: none of the six older fixtures prints an "or" joiner between
two instrument names or a Part-in-Key label, and `score.pdf`'s notes page gains no match — the "or"
joiner takes no gap after it, so prose cannot reach across to a distant instrument the way the slash
joiner deliberately can.

### unity.pdf before → after

| pages | printed label | before | after |
| --- | --- | --- | --- |
| 20 | `BARITONE or TROMBONE Bb` | skipped | `Baritone or Trombone Bb` |
| 21, 22, 23 | `BARITONE or TROMBONE Bb` | skipped | copies of p.20 |
| 33 | `PART I in C` | skipped | `Part I in C` |
| 34 | `PART II in F` | skipped | `Part II in F` |
| 35 | `PART III in F` | skipped | `Part III in F` |
| 36 | `PART III in C` | skipped | `Part III in C` |
| 37 | `PART IV in C` | skipped | `Part IV in C` |
| 38 | `PART V in C` | skipped | `Part V in C` |

Nothing else on the page moved: no other row, no label count, no group. The dup count rises from 9 to
12 because pp.21–23 are now recognised as copies of p.20 rather than skipped, and the skipped count
falls to zero — every page in the set is now filed.

```
18 parts · 26 pages kept (6 by inheritance) · 12 dropped as duplicates · 0 skipped
```

| part | pages | | part | pages |
| --- | --- | --- | --- | --- |
| Full Score | 1–9 | | Bass Bb | 28 |
| 1st Cornet Bb | 10 | | Part I in C | 33 |
| 2nd Cornet Bb | 14 | | Part II in F | 34 |
| 1st Horn Eb | 16 | | Part III in C | 36 |
| 2nd Horn Eb | 18 | | Part III in F | 35 |
| Baritone or Trombone Bb | 20 | | Part IV in C | 37 |
| Euphonium Bb | 24 | | Part V in C | 38 |
| Bass Eb | 26 | | Percussion Score, I, II | 32, 30, 31 |

### Addendum — Arabic numerals normalise to Roman

`PART 3 in F` and `PART III in F` are one part, named `Part III in F`, so a set printed either way
exports one file under one name. The key still separates them: `Part III in F` and `Part III in C`
remain two parts. All seven fixtures are byte-identical across this change — `unity.pdf` prints
Roman numerals throughout, so nothing in the local sets exercises the normalisation; the checks in
`npm run check` are what hold it.
