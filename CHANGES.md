# Part Splitter — change brief for Claude Code

Repo contains a single deliverable, `index.html`: a self-contained web page (pdf.js + pdf-lib + JSZip from cdnjs) that reads a Salvation Army brass band "set of parts" PDF, detects the part name from each page header, drops duplicate copies, and exports one PDF per part inside a ZIP. It must keep working as a single file opened from GitHub Pages on an iPad — no build step, no new dependencies, no server.

Three changes are required. Do them in the phases below, committing after each phase.

---

## Getting started (for Mark — do this once before handing the rest to Claude Code)

### 1. Open the repo in a Codespace
On github.com, open the `part-splitter` repo → green **Code** button → **Codespaces** tab → **Create codespace on main**. Use the same machine type you use for Birdseye; the default 2-core is plenty. Wait for the VS Code window and terminal to appear in the browser. (A Codespace is used rather than editing on GitHub directly because the test PDFs must stay local and never be committed.)

### 2. Install Claude Code in the terminal
In the Codespace terminal:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Close and reopen the terminal (or run `source ~/.bashrc`), then confirm:

```bash
claude --version
claude doctor
```

If `claude` isn't found, add `export PATH="$HOME/.local/bin:$PATH"` to `~/.bashrc` and reopen the terminal. Codespaces rebuilt from scratch lose this install; re-run the one-liner if that happens.

### 3. Sign in
Run `claude` once. It opens a browser sign-in — choose the Claude account option (not the API-key option) and log in with your Claude subscription. Back in the terminal it will ask to trust the folder; say yes. Type `/exit` to leave.

### 4. Add the test PDFs, gitignored
Still in the terminal:

```bash
mkdir -p fixtures
printf 'fixtures/\nnode_modules/\n' >> .gitignore
git add .gitignore && git commit -m "Ignore local fixtures" && git push
```

Then drag your test PDFs from your computer into the `fixtures/` folder in the VS Code file explorer (right-click the folder → Upload also works). You need three:

- `regression.pdf` — the Goodness of God / First Nowell set (32 pages, two pieces per page)
- `multipage.pdf` — a set where at least one part runs to two or more pages
- `score.pdf` — a set with the full score in front

Confirm `git status` shows nothing under `fixtures/` before continuing.

### 5. Save this brief into the repo
Save this file as `CHANGES.md` in the repo root and commit it. Claude Code reads files in the working directory, so this is how it gets the full instructions without pasting.

### 6. Kick off Claude Code
```bash
claude
```

Then give it this opening prompt:

> Read CHANGES.md in full. Implement it phase by phase, starting with Phase 0. After each phase, run the harness against every PDF in fixtures/ and show me the output before you commit. Do not commit anything in fixtures/. Stop and ask me if a real PDF doesn't match an assumption in the brief.

It will ask permission for file edits and shell commands; approve them as they come (or use `/permissions` to pre-approve `npm`, `node`, and `git` commands for the session). Pushing to `main` republishes GitHub Pages within a minute or two, so test on the iPad after each pushed phase — Phase 1 is a good first check that the pipeline works end to end.

### If the Codespace times out
Codespaces stop after 30 minutes idle. Reopen it from the same **Code → Codespaces** menu; your files and Claude Code install persist unless you delete the Codespace. Run `claude --continue` to pick up the last conversation.

---

## Ground rules

- Keep everything in `index.html`. Don't split into modules or add a bundler.
- Don't commit any sheet-music PDFs to this public repo — they're licensed to one corps. Test against local files that are gitignored (add `fixtures/` to `.gitignore`).
- Regression bar: the existing 32-page test set (`goodness-of-god---set-of-parts.pdf`, two pieces per page, 1389/1390) must still produce exactly 17 parts with the same page assignments as today: Soprano, 1st Cornet, 2nd Cornet, 1st Horn, 2nd Horn, 1st Baritone, 2nd Baritone, 1st Trombone, 2nd Trombone, Bass Trombone, Euphonium, Bass Eb, Bass Bb, Percussion I, Percussion II, Percussion Score — one page each — and 15 pages dropped as duplicates.
- Before touching detection logic, build the verification harness in Phase 0 so you can see the page→part mapping without a browser.

## Phase 0 — Node verification harness (no behaviour change)

Add `tools/map.mjs` that loads a PDF and prints, per page: page number, detected part, keep/dup/skip status, and the first 60 characters of header text. It must reuse the exact detection functions from `index.html` — extract them into a `<script id="core">` block that has no DOM references, and have the harness read `index.html`, pull that block out with a regex, and `eval`/`new Function` it. That guarantees the harness tests the shipped code rather than a copy.

Notes for pdf.js in Node: `npm i pdfjs-dist@3.11.174` and load it with `createRequire(import.meta.url)("pdfjs-dist/legacy/build/pdf.js")` — the ESM import path does not expose `getDocument`. Text items come back with `transform`; `transform[5]` is y (bottom-up), `transform[0]` is font size, and `transform[1] !== 0` means rotated text (the licence stamp on the right edge — ignore it).

Add `npm run map -- fixtures/whatever.pdf` to `package.json`. Commit the harness and the `.gitignore`.

## Phase 1 — Filename change (trivial, ship first)

In `exportParts()` the ZIP is named `` `${prefix} – parts.zip` ``. Change it to `` `${prefix}.zip` ``. Leave the per-part filenames (`` `${prefix} – ${part}.pdf` ``) unchanged. Update the `.hint` example text if it mentions the ZIP. Commit.

## Phase 2 — Multi-page parts (continuation pages)

### Problem
Detection runs per page and looks for a part label in the top-left of the header. A second or third page of a longer part usually has no such label (or only a small running head), so today it comes back `null` and is skipped. The user wants those pages bundled into the part's file, in order.

### Design
Separate what the header says from what the page is:

- `p.detected` — result of header detection (may be `null`). Never changes after load.
- `p.override` — value chosen in the dropdown, or `undefined`.
- Effective part is computed in `plan()`, in page order:
  1. if `p.override === "__skip__"` → skipped
  2. else if `p.override` is set → that part
  3. else if `p.detected` → that part
  4. else if the previous page has an effective part → inherit it, mark `p.inherited = true`
  5. else → skipped, flagged red as before

Inheritance must use the previous page's effective part even if that page was dropped as a duplicate. This matters because a two-copy, two-page part arrives as A1 A2 A1 A2: the second A1 is dropped as a dup of the first, but the second A2 must still inherit "A" and then be dropped as a dup of the first A2. The existing page-text dedupe key already handles this correctly once the part is inherited — don't change the dedupe.

### Detection improvements that reduce reliance on inheritance
Running heads on continuation pages in SP&S editions look like `2 1st CORNET B♭` or `1st CORNET B♭ – 2` in a smaller font. The current reading-order accumulation should catch these, but verify against a real multi-page set. If a page has a piece number (`No. NNNN`) in its header it is a first page; if it has no piece number and no label, treat it as a continuation candidate. Do not use page-number digits alone as a signal — the shaker and drum parts are full of small numerals.

### UI
- Dropdown gains a first option `— inherit from previous page —` (value `""`) and a last option `Skip this page` (value `"__skip__"`). A page that resolved by inheritance shows the inherited part name in the dropdown with the status column reading `cont. of p.N` (N = the page it inherited from); it should not be styled red. Only pages that resolve to nothing are red.
- Changing a dropdown re-runs `plan()` and `render()`, so downstream inherited pages follow the change automatically.
- In the export file list, show the page count per part (already does) — with multi-page parts this is now the main sanity check, so keep it prominent.

### Acceptance
- Regression set: unchanged result (17 parts, 15 dups).
- A multi-page set (user will provide locally): each part's PDF contains all of its pages in original order, duplicates removed, no page assigned to the wrong neighbour. Print the harness map for the user to eyeball before declaring done.

## Phase 3 — Full score as its own file

### Problem
Some sets ship with the full score in front of the parts. The user wants it extracted as a single file, `` `${prefix} – Full Score.pdf` ``, alongside the parts.

### What's already there
`PARTS` already contains `["Full Score", [/\bFULL SCORE\b/, /^SCORE\b/]]` as the first entry, and the export loop already writes one file per detected part, so a correctly detected score comes out as its own file with no export changes. The work is detection and ordering.

### Required changes
1. **Ordering hazard.** `Full Score` is tested before `Percussion Score`. With the cumulative reading-order matcher, `/^SCORE\b/` won't fire mid-string, but `/\bFULL SCORE\b/` could match text elsewhere in a header. Move `Percussion Score` above `Full Score` in `PARTS`, and change the Full Score regex to `/\bFULL SCORE\b|(?<!PERCUSSION\s{0,3})\bSCORE\b/` so a bare `SCORE` still matches but never a percussion score. Also accept `CONDUCTOR` as a score label.
2. **Continuation pages.** A score is many pages and only the first carries the label. Phase 2's inheritance handles the rest, but score continuation pages have instrument abbreviations down the left margin (`Sop.`, `Solo Cor.`, `1st Hn.` …) and some of these will sit inside the top-20% header band and can false-match a part. Add a guard: once a page has been detected as `Full Score`, subsequent pages that have no piece number in the header and whose header matches a part only via an abbreviated label (regex `/\b(SOP|COR|HN|BAR|TROM|TBN|EUPH|PERC)\.?$/` on the matching item's own text, or a matching item with font size < 9) are treated as continuation, not as a new part. Prefer being conservative: if unsure, inherit and let the user override in the dropdown.
3. **Page size.** Scores are often a different page size or landscape. pdf-lib's `copyPages` preserves the source page box, so nothing to do — but confirm the exported score opens correctly, and confirm thumbnails render (they use `110/vp.width` scale, so landscape pages will be short and wide; that's fine).
4. **Dedupe.** Score pages are all distinct, so page-text dedupe won't collapse them. If two copies of the score are present, they dedupe page-by-page correctly. No change.
5. **Export order.** Files are sorted by `PARTS` index. Keep Full Score first in the ZIP listing even though it moves below Percussion Score in the array — sort by an explicit `order` field or by a separate `DISPLAY_ORDER` list rather than array index.

### Acceptance
- Regression set: unchanged.
- A score-fronted set (user will provide locally): the harness map shows every score page assigned to `Full Score` and the first real part detected correctly at the boundary; the exported `… – Full Score.pdf` has the right page count and opens.

## Hand-back

When all phases pass, summarise: the harness output for each local fixture, any pages that needed manual override and why, and anything about the real PDFs that didn't match the assumptions above (font sizes, label wording, header band height). Don't tune thresholds without saying what changed.
