# Part Splitter

A single web page that splits a Salvation Army brass band **set of parts** PDF into one PDF per part,
zipped. Open `index.html` — from GitHub Pages, from a local server, from a file — and drop a set on it.
No build step, no server, no install. pdf.js, pdf-lib and JSZip load from cdnjs.

Everything that decides anything lives in the `<script id="core">` block of `index.html`. That block
is plain JavaScript with no DOM, no pdf.js calls and no browser globals, which is what lets the
harness below run the **shipped** code rather than a copy of it.

## The harness

```
npm run map    -- fixtures/mlb.pdf      # page -> part map for one or more PDFs, no browser
npm run check                           # rule checks for the cases no fixture exercises
npm run export -- fixtures/mlb.pdf      # the real export path, headless: guard, copy, save, verify
npm run diagnose -- fixtures/mlb.pdf 19-46   # per-page evidence: labels, sizes, positions, verdicts
```

`npm run map -- --no-dedupe` keeps duplicate copies. `npm run export -- --write out/` writes the part
PDFs to disk so they can be opened by hand.

Fixtures are gitignored — they are real published sets. `docs/baselines.md` is the committed record of
what each one produces, so a change can always be checked against a known "before".

## The build stamp

The page footer reads `build <short hash> · <date>`. It is written into `index.html` by
`tools/stamp.mjs`, which the `pre-commit` hook runs on every commit.

Install the hook once per clone:

```
npm run hooks      # git config core.hooksPath .githooks
```

The hook lives in `.githooks/` and is committed, so it travels with the repo — `.git/hooks` does not,
which is what makes the usual "drop a script in .git/hooks" arrangement quietly stop working after a
fresh clone. `git commit --no-verify` skips it for one commit; `npm run stamp` runs it by hand and
`npm run stamp -- --clear` puts the footer back to `dev`.

### The hash is the commit the build descends from

A commit's hash is computed from its content, so a file cannot contain the hash of the commit that
carries it — writing the hash in would change the content and therefore the hash. Amending does not
escape this: the amended commit has a new hash too. So the stamp names **HEAD at the moment of the
commit**, which is the commit immediately *before* the one you are testing.

To go from a footer hash to the build:

```
git log --oneline <hash>~1..            # the stamped commit is the one after <hash>
```

In practice this does not get in the way — the stamp is a 1:1 label, so two builds never share one,
which is all a tester needs to say which build they were on. If the exact commit matters more than the
convention, stamp `git write-tree` instead: the staged tree hash *is* knowable in `pre-commit` and is
exactly the tree of the commit being made (`git log --format='%h %T'` to resolve it back).

Serving the working tree — `python3 -m http.server 8000` in the repo root — shows the stamp of the last
commit, and edits made since then are not reflected in it. The footer says which commit, not which
edit.

## Rules this repo runs on

- One deliverable, `index.html`. It must keep working as a single file on an iPad, opened from GitHub
  Pages: no build step, no server, no dependency that is not already on cdnjs.
- Detection logic changes only with a fixture or a check behind them. Evidence before code.
- Every change round gets a `CHANGES<n>.md`, a baseline in `docs/baselines.md` recorded *before* the
  code moves, and one commit per phase.
