# Part Splitter — round 2 brief for Claude Code (CHANGES2.md)

Same repo, same rules as CHANGES.md: everything stays in `index.html`, no build step, no new runtime dependencies, fixtures never committed. The Phase 0 harness and the four existing fixtures are the regression net; a fifth fixture is added below. Commit after each phase; do not push without being told.

New fixture: `fixtures/carols.pdf` — "A Suite of English Carols" (Kenneth Downie), Triumph Series 1352, 79 pages, score-fronted. Its cover (p.1, landscape A4) **does contain text**: the composer, the line `Triumph Series 1352 (2023)`, and the title `A Suite of English Carols`. Page 2 is a prose "Score Notes" page. If this contradicts what the earlier scorefront fixture's cover looked like, treat this file as the ground truth for cover handling and say so in the hand-back. The regression bar for this file is established in Phase 1 before anything changes.

## Phase 1 — Baseline the new fixture (no code change)

Run the harness on `carols.pdf` and record the full map in the hand-back. Expected shape based on the other score-fronted set: cover skipped or red, a score run opened by a page with a full instrument column, parts breaking out later, heavy dedupe. Whatever it actually says becomes the "before" for Phases 3–4. Commit nothing except, if useful, a `docs/baselines.md` noting the map.

## Phase 2 — Visual refresh

Goal: the opening screen and review table should look clean and intentional on an iPad and an iPhone. Not a redesign of the interaction — every id, class hook used by JS, and the DOM structure the tests rely on stays; this is CSS and markup-cosmetics only. `<script id="core">` must not change at all (verify with a diff), so the harness proves detection untouched.

Direction, not pixel spec — use judgment within this:
- Keep the paper/ink/deep-red palette and the serif-display/system-body pairing; the problem is execution, not concept. Increase whitespace discipline: consistent vertical rhythm, more air around the drop zone, less cramped table rows.
- The drop zone's CSS "stave" reads as stray grey lines rather than music. Either draw a proper five-line stave as an inline SVG (hairlines, correct spacing, the brace sized to the stave) or drop the conceit entirely for a clean bordered zone with a clear verb. Choose whichever looks better at 380 px wide; don't keep the half-version.
- The review table is the main working surface: give thumbnails a fixed aspect box so rows don't jitter while images load, align the status column, and make the red "not detected" state obvious but not alarming. On phones (≤ 480 px) collapse to a card-per-page layout instead of squeezing the table.
- Buttons: one clear primary (Export), quieter secondary. Progress during load ("Reading pages… 12/79") should be visible near the top, not only in the status line.
- Respect safe-area insets and dark mode: at minimum, don't ship white-on-white in dark mode — either a real dark palette via `prefers-color-scheme` or an explicit `color-scheme: light` opt-out.

Acceptance: screenshots aren't possible headlessly, so instead list every selector changed, confirm `core` is byte-identical, and confirm the page still loads with no console errors under `node --check` on the extracted scripts. Mark will judge the look on-device.

## Phase 3 — Cover page joins the Full Score

### Rule
When the effective-part pass leaves one or more **leading** pages unassigned (pages 1..k with no detected part, no override, nothing to inherit from) **and** a Full Score group exists in the same document, those leading pages default to Full Score, prepended in order, with status `cover → Full Score`. Constraints:
- Applies only to a contiguous run starting at page 1. An unassigned page in the middle of the document stays red as today.
- If no Full Score group exists, leading unassigned pages stay red as today (a plain parts set with a junk first page must not invent a score).
- Explicit dropdown choices and Skip always outrank the default, same precedence as the score signal.
- Cap the run at 3 pages; a longer leading unassigned run suggests something is wrong and should stay visible as red rather than silently swallowed.

### Note on this fixture
`carols.pdf`'s cover has real text (composer, series line, title). Check whether the current pipeline already detects something on it — a title-block match could conceivably mis-detect. The rule above must produce `Full Score` for it either way; report what the cover detected as before the rule applied.

### Acceptance
- `carols.pdf` and the existing score-fronted fixture: Full Score file gains its cover page(s) with no dropdown interaction; page counts in the harness map reflect it.
- `regression.pdf` and `multipage.pdf`: byte-identical (no Full Score group → rule never fires).
- `score.pdf`: its p.1 cover now joins Full Score automatically — this changes its baseline on purpose; show the before/after rows.

## Phase 4 — Series-based default naming

### Rule
When a cover/leading page (page 1, or any page assigned to Full Score within the first 3 pages) contains a series line, the default filename prefix becomes:

```
<ABBR> #<NUMBER> - <TITLE>
```

e.g. `TS #1352 - A Suite of English Carols`, giving files like `TS #1352 - A Suite of English Carols - 1st Cornet Bb.pdf` and ZIP `TS #1352 - A Suite of English Carols.zip`.

Parsing:
- Series line pattern: `<Series Name> <number> (<year>)` — e.g. `Triumph Series 1352 (2023)`. Accept the year as optional. The series name is the text before the number.
- Abbreviation map (extend as needed, matching case-insensitively): Triumph Series → TS, Festival Series → FS, General Series → GS, Unity Series → US, American Band Journal → ABJ, American Festival Series → AFS, Maple Leaf Brass → MLB, Hallelujah Choruses → HC, Judd Street Collection → JSC. Unknown series: abbreviate to the initials of its capitalised words (e.g. "Winter Wonderland Series" → WWS) rather than failing.
- Title: the cover's largest text item (by font size) that isn't the series line, the composer line, or the licence stamp. On `carols.pdf` that's `A Suite of English Carols`.
- The em-dash/hyphen in the pattern is a plain hyphen-minus with spaces (` - `), exactly as in the example — not the `–` used elsewhere in filenames today. Keep the ` – ` between prefix and part name as it is, or switch both to ` - ` for consistency; pick one and say which.

### Fallbacks (unchanged behaviour)
- No cover / no series line found (e.g. `regression.pdf`): keep the current default (piece numbers joined, else source filename).
- The prefix field stays editable; this only changes the default.

### Acceptance
- `carols.pdf` defaults to `TS #1352 - A Suite of English Carols`; harness prints the parsed series, number, and title so the extraction is visible.
- The other score-fronted fixture: report what its cover yields — if it has no series line, it must fall back cleanly.
- `regression.pdf` default remains `1389-1390`. `multipage.pdf` default unchanged.
- `safeName()` must keep `#` (verify it isn't in the strip list).

## Hand-back

Per phase: what changed, the five-fixture harness table, and the `core`-untouched diff confirmation for Phase 2. Plus: the carols cover's pre-rule detection result, the naming extraction line for both score-fronted sets, and anything on these real PDFs that contradicted this brief.
