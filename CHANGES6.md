# CHANGES6 — In-tool unlocking of permissions-encrypted PDFs

Goal: when the export guard fires on a permissions-encrypted PDF (empty user password, like
`fixtures/mlb.pdf`), the tool offers "Unlock and export" and does the decryption itself, on-device,
then proceeds with the normal export. No external tools, no uploads.

Same rules as before: harness first, commit per phase, don't push.

## Phase 1 — Evaluate the mechanism
Preferred: qpdf compiled to WebAssembly, loaded lazily from a pinned CDN URL only when needed (the
main page load must not grow). Evaluate available builds for: maintained/pinned versioning, works in
Safari and in Node (so the harness can exercise the identical path), size, and licence compatibility.
If no build passes, fall back to implementing R6/AESV3 empty-user-password decryption with Web Crypto,
scoped narrowly: /Filter Standard, R 6, empty user password only — anything else keeps the current
refusal. Rasterizing pages is not an option. Report the chosen mechanism and why before building.

## Phase 2 — Implement
- Guard flow becomes: probe fails → message "This PDF is locked by the tool that created it" with an
  "Unlock and export" button → decrypt in-memory → re-probe → export as normal. Show progress; a
  46-page decrypt shouldn't look frozen.
- Genuinely password-protected files (non-empty user password) must still refuse cleanly, with wording
  that distinguishes the case.
- Decryption output feeds pdf-lib directly in memory; nothing written anywhere, source bytes untouched.
- Detection/review is unaffected (pdf.js already reads these files) — only the export path changes.

## Phase 3 — Verification
- `tools/export.mjs`: mlb.pdf's row changes from "guard fires" to "unlocks, 16 parts exported", and
  every part's page count must equal mlb-dec.pdf's byte-for-byte page structure. mlb-dec.pdf row
  unchanged. All other rows unchanged.
- Stub checks: empty-password unlock succeeds; non-empty password refuses with the distinct message;
  the lazy load doesn't run for unencrypted files (assert no fetch); probe re-runs after unlock.
- Nine-row detection harness byte-identical — this round must not touch detection at all.

Hand back: the mechanism decision with alternatives considered, the export table, check count, build
stamp, and the CDN URL + pinned version if WASM was chosen.
