# Part Splitter

A single web page that splits a Salvation Army brass band **set of parts** PDF into one PDF per part,
zipped. Open `index.html` — from GitHub Pages, from a local server, from a file — and drop a set on it.
No build step, no server, no install. pdf.js, pdf-lib and JSZip load from cdnjs.

Everything that decides anything lives in the `<script id="core">` block of `index.html`. That block
is plain JavaScript with no DOM, no pdf.js calls and no browser globals, which is what lets the
harness below run the **shipped** code rather than a copy of it.

## The harness

```
npm test                                # check + margins + export, the whole suite
npm run map    -- fixtures/mlb.pdf      # page -> part map for one or more PDFs, no browser
npm run check                           # rule checks for the cases no fixture exercises
npm run margins                         # the dead band around FIRST_PAGE_PT, across every fixture
npm run export                          # the real export path, headless: guard, copy, save, verify
npm run diagnose -- fixtures/mlb.pdf 19-46   # per-page evidence: labels, sizes, positions, verdicts
```

`margins` and `export` take every fixture when given no arguments. `export` asserts the encryption
guard in both directions — `mlb.pdf` is kept encrypted and must refuse; `mlb-dec.pdf`
(`qpdf --decrypt fixtures/mlb.pdf fixtures/mlb-dec.pdf`) is the same set and must export all 16 parts.

`npm run map -- --no-dedupe` keeps duplicate copies. `npm run export -- --write out/` writes the part
PDFs to disk so they can be opened by hand.

Fixtures are gitignored — they are real published sets. `docs/baselines.md` is the committed record of
what each one produces, so a change can always be checked against a known "before".

## Unlocking

A set that has been through a web PDF tool often comes back with permissions encryption: AES-256, an
empty user password, and a `/P` word that forbids extraction. pdf.js reads it without being asked, so
the whole document detects and thumbnails normally — but pdf-lib has no decryption at all, so the
export used to be a dead end.

The page now offers to undo it. When the export probe fails it shows **Unlock and export**; pressing it
fetches qpdf compiled to WebAssembly, decrypts in memory, re-runs the probe, and carries on. Nothing is
uploaded, nothing is written to disk, and the source bytes are not modified — the decrypted copy exists
only for the length of the export.

The module is fetched **only when the probe has already failed**, from a pinned version:

```
https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.0/dist/qpdf.js      43 KB
https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.0/dist/qpdf.wasm  1.33 MB
```

A file with a *real* user password is a different case and still refuses, with wording that says so —
no button can recover bytes that are not there without the password.

The harness runs the same `unlockPdf` from the same pinned version, installed as a devDependency; only
the two lines that fetch the module differ (a `<script>` tag there, `require()` here).

> **Attribution.** The WebAssembly module is a build of [qpdf](https://github.com/qpdf/qpdf), which is
> licensed **Apache-2.0**. The npm wrapper `@neslinesli93/qpdf-wasm` declares ISC in its `package.json`
> and ships no LICENSE file; the licence that governs the compiled code is qpdf's. The page links to
> the CDN rather than redistributing the binary. Keep the version pinned.

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
