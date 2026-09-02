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
| `mlb.pdf` | Prelude - The Reason I Live (Maple Leaf Brass 115), 46 pages, score in front, portrait throughout, score staves labelled by abbreviation. **Kept encrypted on purpose** — it is the local evidence that the export guard fires |
| `mlb-dec.pdf` | the same set, `qpdf --decrypt`ed. Its map must stay identical to `mlb.pdf`'s; it is the evidence that those 46 pages export cleanly once the encryption is gone |

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

## Baseline before CHANGES5.md — `mlb.pdf`

`npm run map -- fixtures/mlb.pdf` at commit `ed6c831`, before any CHANGES5 code. 46 pages, every one
612x792 (US letter, portrait) — the score is the same size and orientation as the parts, so the page-size
cue that bounds the score run on the other score-fronted fixtures carries no information here.

```
16 parts · 46 pages kept (16 by inheritance) · 0 dropped as duplicates · 0 skipped
piece numbers: 115   ·   titles: MLB 115   ·   series: none found on the cover
default prefix: 115
```

| part | pages | | part | pages |
| --- | --- | --- | --- | --- |
| Full Score | 1–18 | | 2nd Trombone Bb | 34, 35 |
| Soprano Eb | 19 | | Bass Trombone | 36, 37 |
| 1st Cornet Bb | 20, 21 | | Euphonium Bb | 38, 39 |
| 2nd Cornet Bb | 22, 23 | | Bass Eb | 40, 41 |
| 1st Horn Eb | 24, 25 | | Bass Bb | 42, 43 |
| 2nd Horn Eb | 26, 27 | | Percussion I | 44 |
| 1st Baritone Bb | 28, 29 | | Percussion II | 45, 46 |
| 2nd Baritone Bb | 30, 31 | | | |
| 1st Trombone Bb | 32, 33 | | | |

### The page map is already right — four of the brief's premises do not hold

The brief expects Soprano/Bass contamination across the score and a score run that never opens. Neither
happens. Measured, page by page:

1. **p.2 is not label-less.** It is the score's first page and, like every first score page, it prints
   the *full* stave names down the left margin at 7.7pt: `Soprano Cornet Eb`, `1st Cornet Bb`,
   `2nd Cornet Bb`, `1st Horn Eb`, `2nd Horn Eb`, `1st Baritone Bb`, `2nd Baritone Bb`,
   `1st Trombone Bb`, `2nd Trombone Bb`, `Bass Trombone`, `Euphonium Bb`, `Bass Eb`, `Bass Bb`,
   `Percussion 1`, `Percussion 2`. `labelCount` reads **17** distinct labels there (the 15 staves plus
   `Timpani` and `Drums`, named in the percussion staves' instrument lists), so the *existing* signal
   fires on p.2 with a margin of 13 over its threshold of 4.
2. **The run therefore opens, and holds.** pp.3–18 are the abbreviated pages; each reads `labelCount`
   2 (`Bass Eb`, `Bass Bb`, the only two staves still spelled in full down the abbreviated column).
   Two is under the threshold, but they never need it: none of them is a first page and none carries a
   piece number, so the score run carries them by inheritance. p.19 (`Soprano Cornet Eb`, a real title
   block) ends the run.
3. **Only one leading page, not two.** p.2 resolves to Full Score on its own, so the leading run the
   cover rule sweeps is `[1]`, not `[1, 2]`. The result is the same — Full Score [1–18].
4. **p.43 extracts its label.** Its running head comes out as `2` · `Bass B` · `b` ·
   `- The Reason I Live` and detects `Bass Bb` directly; it does not need to inherit from p.42.

So the only thing actually lost on this fixture is the **name**: the default prefix is `115`, from the
piece number, where it should be `MLB #115 - Prelude - The Reason I Live`.

### The naming cues, and where they are not

`seriesName` finds nothing because `SERIES_LINE` needs `<Two Or More Capitalised Words> <number>` on
one text item. What the front matter actually prints:

```
p.1  "The Salvation Army" 12pt · "Music and Gospel Arts" 12pt · "MLB 115" 19.9pt
     "Prelude" 22.1pt · "The Reason I Live" 28.1pt · "Wayne & Cathy Perrin" 18pt · programme notes
p.2  "Prelude - The Reason I Live" 26.1pt · "No. 115" 12.4pt · "WAYNE & CATHY PERRIN" 12.4pt
p.3  (no front matter — first abbreviated score page)
```

`MLB 115` *is* recognised by `SERIES_LINE` and then deliberately discarded: one capitalised word with
no year is rejected as "a page or hymn reference rather than a series".

**The string the brief names as the Phase 3 cue is not in the first three pages.** `The Salva` ·
`on Army Maple Leaf Brass` is the *running head of every part page*, pp.19–46 — precisely the place
Phase 3 says the path must not read. Pages 1–3 print no series name at all, only the abbreviation
`MLB` and, on p.2, `No. 115`. Phase 3 as literally specified would fire on nothing here.

### The "ti" dropout is real, and it splits items rather than mangling them

`Salvation` comes out as two adjacent text items, `The Salva` and `on Army Maple Leaf Brass`, on every
part page. Note the dropout is a property of the part/score fonts only: p.1's letterhead is set in a
different face and reads `The Salvation Army` intact. It never falls inside `Maple Leaf Brass` itself.

### The abbreviated column, as extracted (p.3, and identically pp.4–18)

```
Sop. Cor. · 1st Cor. · 2nd Cor. · 1st Hn · 2nd Hn · 1st Bari. · 2nd Bari. · 1st Tbn. · 2nd Tbn.
B. Tbn. · Euph. · Bass Eb · Bass Bb · Perc. 1 · Perc. 2
```

All at 7.7pt, all at x = 42–52 of a 612pt page. Thirteen are abbreviated; `Bass Eb` and `Bass Bb` are
the two spelled in full, and are the two `labelCount` sees. Note `1st Hn` and `2nd Hn` carry no
trailing period, and `B. Tbn.` carries a leading one.

### The other seven fixtures, unchanged, for the nine-row table

| fixture | pages | parts | kept | inherited | dups | skipped | prefix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `regression.pdf` | 32 | 16 | 16 | 0 | 16 | 0 | `1389-1390` |
| `multipage.pdf` | 48 | 23 | 48 | 0 | 0 | 0 | `multipage` |
| `score.pdf` | 36 | 21 | 36 | 11 | 0 | 0 | `NJS #2104 - The First Noel` |
| `scorefront.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | `TS #1352 - A Suite of English Carols` |
| `carols.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | `TS #1352 - A Suite of English Carols` |
| `encore.pdf` | 70 | 24 | 70 | 19 | 0 | 0 | `AGS #2004 - A Christmas Encore Medley` |
| `unity.pdf` | 38 | 18 | 26 | 6 | 12 | 0 | `US #549 - Thank You, Lord` |
| `mlb.pdf` | 46 | 16 | 46 | 16 | 0 | 0 | `115` |

## Baseline after CHANGES5 — the Maple Leaf Brass format

`npm run map` and `npm run check` at the Phase 3 commit, against the pre-CHANGES5 code (`ed6c831`).

| fixture | pages | parts | kept | inherited | dups | skipped | prefix | changed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `regression.pdf` | 32 | 16 | 16 | 0 | 16 | 0 | `1389-1390` | byte-identical |
| `multipage.pdf` | 48 | 23 | 48 | 0 | 0 | 0 | `multipage` | byte-identical |
| `score.pdf` | 36 | 21 | 36 | 11 | 0 | 0 | `NJS #2104 - The First Noel` | byte-identical |
| `scorefront.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | `TS #1352 - A Suite of English Carols` | byte-identical |
| `carols.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | `TS #1352 - A Suite of English Carols` | byte-identical |
| `encore.pdf` | 70 | 24 | 70 | 19 | 0 | 0 | `AGS #2004 - A Christmas Encore Medley` | byte-identical |
| `unity.pdf` | 38 | 18 | 26 | 6 | 12 | 0 | `US #549 - Thank You, Lord` | byte-identical |
| `mlb.pdf` | 46 | 16 | 46 | 16 → **0** | 0 | 0 | `115` → **`MLB #115 - Prelude - The Reason I Live`** | named, and pp.3–18 self-classify |

Byte-identical is measured, not assumed: the whole `npm run map` output of all eight fixtures was
diffed before and after, and the only lines that moved are mlb.pdf's pp.3–18 and its three naming
lines. In particular `encore.pdf`, `carols.pdf` and `scorefront.pdf` fire the *original* signal on
their score pages, not this one — their worst abbreviated column reads 2 — and `unity.pdf` reads 0
abbreviations anywhere, its score signal resting where it always did on the nine spelled-out
instruments in its column.

### The threshold measurement — distinct abbreviated column labels per page

Counted over all eight fixtures, 428 pages, the same way `SCORE_LABELS` was measured: distinct
abbreviated stave labels sitting in the left quarter of the page at under 9pt.

| fixture | 0 | 1 | 2 | 3 | 13 | highest page, and what it is |
| --- | --- | --- | --- | --- | --- | --- |
| `regression.pdf` | 32 | | | | | — |
| `score.pdf` | 36 | | | | | — |
| `unity.pdf` | 38 | | | | | — (its column label `Bar./Trom. Bb` ends on a key, not an abbreviation) |
| `multipage.pdf` | 38 | 7 | 2 | 1 | | p.13, a Baritone/Trombone part: `Bar.` `Trom.` `B. Trom.` |
| `carols.pdf` | 63 | 15 | 1 | | | p.6, a score page: `1st Trom.` `2nd Trom.` |
| `scorefront.pdf` | 63 | 15 | 1 | | | p.6, a score page: `1st Trom.` `2nd Trom.` |
| `encore.pdf` | 56 | 11 | 2 | 1 | | p.35, a Baritone/Trombone part: `Bar.` `Trom.` `B. Trom.` |
| `mlb.pdf` | 30 | | | | 16 | pp.3–18, the score: thirteen abbreviated staves |

The distribution is empty between 3 and 13. **`SCORE_ABBREVS = 6`**: three clear above every page in
the corpus that is not a score page, seven clear below every abbreviated score page — double the
false ceiling and under half the true floor.

The column test earns its place. Dropping the left-quarter and small-type constraints and counting
abbreviations anywhere on the page takes the worst non-score page from 3 to 4 (`encore.pdf` and
`multipage.pdf` each put seven pages at 4), because the cues printed over the music — `Bar.` above a
rest bar, `B. Trom.` at an entry — are the same words as the stave names.

### mlb.pdf before → after

| pages | before | after |
| --- | --- | --- |
| 3–18 | Full Score, `cont. of p.2` — carried by inheritance from the one page whose staves are named in full | Full Score, `keep` — each page classified on its own thirteen abbreviated staves |
| default prefix | `115`, from the piece number | `MLB #115 - Prelude - The Reason I Live` |

The group map is unchanged, and was already right — see the Phase 1 baseline above. What changed is
what holds it up: the score run no longer depends on p.2 being the one page in eighteen that spells
its staves out. Sixteen pages that were inherited are now first-class score pages, which is why the
inheritance count drops to zero.

```
16 parts · 46 pages kept (0 by inheritance) · 0 dropped as duplicates · 0 skipped
series: "MLB" #115 (no year) -> MLB  ·  title: "Prelude - The Reason I Live"  ·  from p.2
default prefix: MLB #115 - Prelude - The Reason I Live
example file:   MLB #115 - Prelude - The Reason I Live - 1st Cornet Bb.pdf
```

| part | pages | | part | pages |
| --- | --- | --- | --- | --- |
| Full Score | 1–18 | | 2nd Trombone Bb | 34, 35 |
| Soprano Eb | 19 | | Bass Trombone | 36, 37 |
| 1st Cornet Bb | 20, 21 | | Euphonium Bb | 38, 39 |
| 2nd Cornet Bb | 22, 23 | | Bass Eb | 40, 41 |
| 1st Horn Eb | 24, 25 | | Bass Bb | 42, 43 |
| 2nd Horn Eb | 26, 27 | | Percussion I | 44 |
| 1st Baritone Bb | 28, 29 | | Percussion II | 45, 46 |
| 2nd Baritone Bb | 30, 31 | | | |
| 1st Trombone Bb | 32, 33 | | | |

Every two-page part is intact, held by its own running head rather than by inheritance — `2` ·
`1st Cornet B` · `b` · `- The Reason I Live` detects `1st Cornet Bb` directly. Percussion I really is
one page in this set; p.45 opens Percussion II with a full title block of its own. Nothing is red.

### Where the naming actually comes from — the deviation from the brief

Phase 3 as written looks for a known series *name* inside a text item of the first three pages. That
string is not there: `Maple Leaf Brass` appears in this document only in the running head of pp.19–46,
the pages Phase 3 forbids reading. Implemented literally, the path would fire on nothing and the
prefix would stay `115`.

So the cue vocabulary admits one more shape alongside the series name: a **known series abbreviation
printed with its number as its own item** — `MLB 115`, on p.1 at 19.9pt. `SERIES_LINE` already
recognises that shape and deliberately discards it ("a one-word name with no year is a page or hymn
reference rather than a series"); the secondary path readmits it, and only it, when the one word is an
abbreviation the map already publishes. `SASB 126` and `TB 857` — the hymn book references printed in
exactly this shape — are not in the map and still name nothing.

The number then comes from the separate `No. 115` item as the brief specifies, and the title from the
page that item sits on: p.2, which prints `Prelude - The Reason I Live` whole at 26.1pt. Reading the
title from the largest item across all three front pages instead would give `The Reason I Live` — the
cover breaks the title over two lines, `Prelude` at 22.1pt above `The Reason I Live` at 28.1pt, and the
larger half is the second one.

The "ti" dropout is real but is not what this fixture's naming rests on. It splits `The Salvation Army`
into two items, `The Salva` and `on Army`, on every part page, and leaves `Maple Leaf Brass` intact
beside it. The tolerance is built anyway — series names are matched with every `ti` optional, against
the page's items joined rather than one at a time, so a dropout falling *inside* a name
(`Judd Street Collec` · `on`) is matched too — and `npm run check` is what holds it, since no fixture
exercises it.

## Export: what a permissions-encrypted source does

`npm run export -- fixtures/*.pdf`, which runs the real export path headlessly — the same `plan`, the
same pdf-lib calls, the same guard — and then re-opens every part PDF it wrote to confirm the page
count matches the plan.

| fixture | parts | exported | guard |
| --- | --- | --- | --- |
| `regression.pdf` | 16 | 16 | — |
| `multipage.pdf` | 23 | 23 | — |
| `score.pdf` | 21 | 21 | — |
| `scorefront.pdf` | 17 | 17 | — |
| `carols.pdf` | 17 | 17 | — |
| `encore.pdf` | 24 | 24 | — |
| `unity.pdf` | 18 | 18 | — |
| `mlb.pdf` | 16 | **0** | **fires** |

### `ignoreEncryption: true` does not make mlb.pdf exportable

The encryption dictionary reads `/Filter/Standard /V 5 /R 6 /CF<</StdCF<</CFM/AESV3 …>>>` `/Length 256`
`/P -1052` — AES-256 with an empty user password and permissions restrictions, the shape a web PDF tool
leaves behind. pdf.js decrypts that without being asked, which is why all 46 pages read, detect,
thumbnail and plan perfectly. **pdf-lib 1.17.1 has no decryption at all.** `ignoreEncryption` only
suppresses its refusal to load; every string and stream behind the door is still ciphertext, so:

```
PDFDocument.load(bytes)                          -> "Input document to `PDFDocument.load` is encrypted."
PDFDocument.load(bytes, {ignoreEncryption:true}) -> loads
  .getPageCount() / .copyPages()                 -> "Expected instance of PDFDict, but got instance of undefined"
```

So the guard is not a formality on this fixture — it is the whole outcome. The probe copies page 1 into
a new document and saves it; that throws, nothing is built, and the user is told rather than handed a
ZIP with sixteen broken files in it. pdf-lib has had no release since 2021, so this will not fix itself.

The wording shown is `This PDF is password-protected and can't be split`. It is not strictly accurate
here — no password is needed, and the app plainly read the file — but it is the string specified.

## Diagnostics — `npm run diagnose`

Per-page evidence: every label found with its text, size and position; the first-page verdict with both
halves of the test spelled out; what detected, what resolved, and the final group. The accumulator it
walks is the one `detectPart` walks, so a label split across two text items (`Bass E` · `b`) is reported
where it is actually matched rather than being reported as absent.

### mlb.pdf pp.19–46 — the map is right, and one number is far closer than it looks

All fifteen parts resolve from their own header on their own page. Nothing inherits, nothing is weak,
nothing is red. Twelve two-page parts, three one-page parts (Soprano p.19, Percussion I p.44, and the
score's own run above).

The continuation pages are held apart from the parts they follow by one number:

```
p.20  first: YES  No. "No. 115" 20.07pt; title 24.985pt >= 12 by 12.985
p.21  first: no   no piece number;       title 11.961pt <  12 by  0.039
```

**Every continuation page in this set sits 0.039pt below `FIRST_PAGE_PT`.** The running head is set at a
nominal 12pt and arrives at 11.961 — a 0.9967 scale, the fingerprint of a tool that re-imposed the page.
Measured across the corpus, the margin below the threshold on every other set:

| fixture | largest continuation-page title | margin below 12pt |
| --- | --- | --- |
| `unity.pdf` | 9.718 | 2.282 |
| `multipage.pdf` | 9.992 | 2.008 |
| `encore.pdf` | 9.992 | 2.008 |
| `score.pdf` | 11.000 | 1.000 |
| `carols.pdf` | 11.074 | 0.926 |
| `mlb.pdf` | **11.961** | **0.039** |

Twenty-four times tighter than the next worst. If anything moved that number up by a third of one
percent — a different pdf.js, a source re-exported by another tool — every continuation page in the set
would read as a first page, and all twelve two-page parts would come apart into twenty-four one-page
parts. That is exactly the symptom being reported from the device. **No code was changed for this:
`FIRST_PAGE_PT` is still 12 and the fixture still passes.** Recording it as the next thing to fix.

Ruled out as the cause of a device/harness split: `useSystemFonts` (the harness pins it `false`, the
browser defaults it `true`) — re-running the whole map with it `true` gives a byte-identical plan.

### Can the review table show something `plan()` did not say?

No. There is one implementation of grouping, `plan()` at `index.html:665`, and `groups` is built nowhere
else. `render()` and `exportParts()` each call `currentPlan()` and read the same `{groups, status}`;
the table's status column is `status[n].label`, the dropdown's value is `status[n].part`, the button's
count is `groups.size`, and the exported file list is `groups` itself. No second grouping pass, no
per-row recomputation.

Three things do make the app's answer legitimately differ from `npm run map`'s, none of them a bug:

1. **The dedupe checkbox.** `currentPlan()` reads it live; `map` defaults it on. Both default to on
   (`index.html:197` carries `checked`), so they agree unless it is unticked.
2. **Dropdown overrides.** A choice writes `p.override` and outranks everything, including the score
   signal. `map` never has any.
3. **The page records.** They come from whichever pdf.js read the file. The app loads 3.11.174 from
   cdnjs and the harness runs the same version's legacy build, so they should agree — but this is the
   one place a device could diverge, and the 0.039pt margin above is what it would divide.

## Known behaviour — an inherited page shows its part, not "inherit"

In the review table, a page that resolved by inheritance displays the **effective** part in its
dropdown — `1st Cornet Bb` on p.21, not `— inherit from previous page —`. That is deliberate and worth
keeping: the table's job is to show what each page will be exported as, and a row reading "inherit"
tells a tester nothing about where the page is going.

The edge is that the display is indistinguishable from an explicit choice. Selecting the value already
shown is not a no-op: it writes `p.override`, which pins the page to that part regardless of what
happens upstream of it. Change the part on p.20 afterwards and p.21 no longer follows it.

Nothing in the fixtures trips over this and no code changed for it. It is recorded because the symptom
— "I fixed the part above and the page under it didn't follow" — reads like a detection bug and is not
one. `plan()` is the only thing that groups pages; see the section above.

## After the threshold fix — `FIRST_PAGE_PT` 12 -> 13.5

The 0.039pt margin recorded above was the on-device failure: `isFirstPage` is the one threshold whose
input comes from a renderer rather than from the file, and mlb.pdf's running heads arrive at 11.961
against a threshold of 12. On the device they measured at or above it, so every continuation page read
as a first page and each two-page part came apart into two one-page parts.

13.5 is the midpoint of the real gap — 11.961 below, 15.466 above. Margins after the change, from
`npm run margins`, which is now part of `npm test`:

| fixture | continuation titles | margin below | first-page titles | margin above |
| --- | --- | --- | --- | --- |
| `regression.pdf` | — | — | 20.001 | 6.501 |
| `multipage.pdf` | 9.366..9.992 | 3.508 | 15.466..15.543 | **1.966** |
| `score.pdf` | 5.754..11.000 | 2.500 | 15.544..24.000 | 2.044 |
| `scorefront.pdf` | 6.477..11.074 | 2.426 | 20.001..24.000 | 6.501 |
| `carols.pdf` | 6.477..11.074 | 2.426 | 20.001..24.000 | 6.501 |
| `encore.pdf` | 6.503..9.992 | 3.508 | 15.466..24.000 | **1.966** |
| `unity.pdf` | 8.204..9.718 | 3.782 | 19.953..24.000 | 6.453 |
| `mlb.pdf` | 7.669..11.961 | **1.539** | 24.985..26.095 | 11.485 |
| `mlb-dec.pdf` | 7.669..11.961 | **1.539** | 24.985..26.095 | 11.485 |

Tightest margin anywhere is now 1.539pt, against 0.039 before — a 39-fold improvement, and 1.5pt is
far past any difference in font measurement between two renderers.

`tools/margins.mjs` asserts a **1.0pt dead band** around the threshold across every fixture and exits
non-zero if any page is inside it. Verified as a real assertion, not a rubber stamp: put the threshold
back to 12 and it fails four fixtures — `mlb.pdf` and `mlb-dec.pdf` at 13 pages each, `carols.pdf` and
`scorefront.pdf` at 1 each (0.926pt, which was the *second* closest call in the corpus and nobody knew).

No page in any fixture sits between 12 and 13.5, so **all eight existing fixtures are byte-identical**
across this change — measured by diffing the whole `npm run map` output, not assumed.

### The nine-row harness

| fixture | pages | parts | kept | inherited | dups | skipped | prefix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `regression.pdf` | 32 | 16 | 16 | 0 | 16 | 0 | `1389-1390` |
| `multipage.pdf` | 48 | 23 | 48 | 0 | 0 | 0 | `multipage` |
| `score.pdf` | 36 | 21 | 36 | 11 | 0 | 0 | `NJS #2104 - The First Noel` |
| `scorefront.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | `TS #1352 - A Suite of English Carols` |
| `carols.pdf` | 79 | 17 | 49 | 19 | 30 | 0 | `TS #1352 - A Suite of English Carols` |
| `encore.pdf` | 70 | 24 | 70 | 19 | 0 | 0 | `AGS #2004 - A Christmas Encore Medley` |
| `unity.pdf` | 38 | 18 | 26 | 6 | 12 | 0 | `US #549 - Thank You, Lord` |
| `mlb.pdf` | 46 | 16 | 46 | 0 | 0 | 0 | `MLB #115 - Prelude - The Reason I Live` |
| `mlb-dec.pdf` | 46 | 16 | 46 | 0 | 0 | 0 | `MLB #115 - Prelude - The Reason I Live` |

`mlb-dec.pdf`'s map is identical to `mlb.pdf`'s line for line — same 16 parts, same pages, same
prefix, same series extraction. Decryption changes nothing the detector can see, which is the point:
it isolates the export failure to pdf-lib.

### Export verification, nine rows

`npm run export` with no arguments now covers every fixture, and asserts both directions of the guard —
a fixture that starts refusing fails, and so does one that stops.

| fixture | parts | exported | guard |
| --- | --- | --- | --- |
| `regression.pdf` | 16 | 16 | — |
| `multipage.pdf` | 23 | 23 | — |
| `score.pdf` | 21 | 21 | — |
| `scorefront.pdf` | 17 | 17 | — |
| `carols.pdf` | 17 | 17 | — |
| `encore.pdf` | 24 | 24 | — |
| `unity.pdf` | 18 | 18 | — |
| `mlb.pdf` | 16 | **0** | **fires** (expected) |
| `mlb-dec.pdf` | 16 | **16** | — |

`mlb-dec.pdf` exports all sixteen, and every one re-opens with the page count the plan promised: the
Full Score at 18, twelve brass parts at 2 pages each, Percussion II at 2, and Soprano Eb and
Percussion I at 1. 9,017 KB against the encrypted original's 1,880 KB of source, because pdf-lib
copies the whole font and image resource set into each part.

The guard message now names the way out:

```
This PDF is locked by the tool that created it and can't be split.
Unlock it once (e.g. qpdf --decrypt, or iLovePDF's Unlock tool) and reload.
```
