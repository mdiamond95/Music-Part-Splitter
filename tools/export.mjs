#!/usr/bin/env node
// Headless export verification. Runs the real export path — the same plan, the same pdf-lib calls,
// the same guard — over one or more fixtures, without a browser.
//
// The point is the guard: a set that has been through a web PDF tool can come back with permissions
// encryption on it, which pdf.js reads straight through and pdf-lib cannot read at all. That case is
// invisible until something tries to copy a page, so this tries.
//
//   npm run export -- fixtures/mlb.pdf [more.pdf ...]
//   npm run export -- --write out/   (also writes the part PDFs, to open by hand)

import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename, join } from "node:path";

const require = createRequire(import.meta.url);
const warn = console.warn;
console.warn = (...a) => { if(!String(a[0]).includes("Cannot polyfill")) warn(...a); };
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
const { PDFDocument } = require("pdf-lib");

// The unlocker, from the same pinned version the page fetches from jsDelivr. Only the two lines that
// fetch it differ between here and the browser — a <script> tag and a locateFile URL there, require()
// and a filesystem path here. Everything past that point is core's unlockPdf, unchanged.
const QPDF_PKG = "@neslinesli93/qpdf-wasm";
const QPDF_DIR = dirname(require.resolve(`${QPDF_PKG}/dist/qpdf.js`));
let qpdfPromise = null;
function loadQpdf(){
  if(qpdfPromise) return qpdfPromise;
  const factory = require(`${QPDF_PKG}/dist/qpdf.js`);
  qpdfPromise = factory({ noInitialRun:true, locateFile: p => resolve(QPDF_DIR, p), print(){}, printErr(){} });
  qpdfPromise.catch(() => { qpdfPromise = null; });
  return qpdfPromise;
}
// Counts every time the module is actually fetched, so a fixture that should never need it can be
// asserted never to have paid for it.
let qpdfLoads = 0;
const countingLoad = () => { qpdfLoads++; return loadQpdf(); };

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE_EXPORTS = ["uprightItems", "pageRecord", "scanMeta", "plan", "partOrder", "safeName",
  "defaultPrefix", "SEP", "canCopyPages", "unlockPdf", "LOCKED_MSG", "PASSWORD_MSG"];

function loadCore(){
  const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
  const m = html.match(/<script id="core">([\s\S]*?)<\/script>/);
  if(!m) throw new Error('index.html has no <script id="core"> block');
  return new Function(`${m[1]}\nreturn {${CORE_EXPORTS.join(",")}};`)();
}
const core = loadCore();

async function readPages(file){
  const data = new Uint8Array(readFileSync(file));
  const pdf = await pdfjs.getDocument({ data, verbosity: 0, useSystemFonts: false }).promise;
  const pages = [], numbers = new Set(), titles = new Set();
  for(let i=1; i<=pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    core.scanMeta(core.uprightItems(tc.items), numbers, titles);
    pages.push(core.pageRecord(i, tc.items, vp.height, vp.width));
  }
  await pdf.destroy();
  return { pages, numbers };
}

// Fixtures that are expected to arrive locked and need unlocking. mlb.pdf is kept encrypted on
// purpose — it is the only local evidence that the unlock path runs at all — and mlb-dec.pdf is the
// same set already decrypted, which is the evidence that the two routes end in the same 16 parts.
// Both directions are asserted: a fixture that starts needing the unlocker, or stops, fails.
const EXPECT_LOCKED = new Set(["mlb.pdf"]);

let failed = 0;
async function exportFile(file, outDir){
  const name = basename(file);
  const bytes = readFileSync(file);
  const { pages, numbers } = await readPages(file);
  const { groups, status } = core.plan(pages, true);
  const prefix = core.safeName(core.defaultPrefix(pages, status, numbers, name));

  // Exactly what exportParts does, in the same order.
  let src = null;
  try{ src = await PDFDocument.load(new Uint8Array(bytes), { ignoreEncryption: true }); }
  catch(e){ console.log(`  load refused: ${e.message.split("\n")[0]}`); }
  const ok = src ? await core.canCopyPages(src, () => PDFDocument.create()) : false;

  console.log(`\n=== ${name} — ${pages.length} pages, ${groups.size} parts ===`);
  console.log(`prefix: ${prefix}`);
  const expected = EXPECT_LOCKED.has(name);
  let unlocked = false;
  if(!ok){
    // The page's flow, in the same order: the probe failed, so offer the unlocker, run it, and probe
    // again. Nothing is written anywhere — the bytes come back from MEMFS straight into pdf-lib.
    const loadsBefore = qpdfLoads;
    const t0 = Date.now();
    const res = await core.unlockPdf(bytes, countingLoad);
    if(!res.ok){
      console.log(`REFUSED (${res.reason}) -> "${res.reason === "password" ? core.PASSWORD_MSG : core.LOCKED_MSG}"`);
      console.log(`  nothing exported; no partial ZIP is built`);
      if(!expected){ console.log(`  FAIL  this fixture is not expected to refuse`); failed++; }
      return { file:name, parts:groups.size, exported:0, guard:true, expected, unlocked:false };
    }
    console.log(`  unlocked in ${Date.now()-t0} ms (${qpdfLoads - loadsBefore} module load), ${res.bytes.length} bytes`);
    src = await PDFDocument.load(res.bytes, { ignoreEncryption:true });
    if(!await core.canCopyPages(src, () => PDFDocument.create())){
      console.log(`  FAIL  the probe still fails after unlocking`); failed++;
      return { file:name, parts:groups.size, exported:0, guard:true, expected, unlocked:true };
    }
    unlocked = true;
    if(!expected){ console.log(`  FAIL  this fixture needed unlocking and was not expected to`); failed++; }
  } else if(expected){
    console.log(`  FAIL  this fixture was expected to need unlocking and did not`);
    failed++;
  }

  const names = [...groups.keys()].sort((a,b)=>core.partOrder(a)-core.partOrder(b));
  let total = 0;
  const pageCounts = {};
  for(const part of names){
    const pageNums = groups.get(part);
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(src, pageNums.map(n=>n-1));
    copied.forEach(pg=>doc.addPage(pg));
    doc.setTitle(`${prefix}${core.SEP}${part}`);
    const out = await doc.save();
    // The file has to be readable, and has to carry the pages the plan said it would.
    const back = await PDFDocument.load(out, { ignoreEncryption: true });
    if(back.getPageCount() !== pageNums.length){
      console.log(`  FAIL  ${part}: ${back.getPageCount()} pages, expected ${pageNums.length}`);
      failed++;
    }
    total += out.length;
    pageCounts[part] = back.getPageCount();
    const fname = `${prefix}${core.SEP}${part}.pdf`;
    if(outDir){ mkdirSync(outDir, {recursive:true}); writeFileSync(join(outDir, core.safeName(fname)), out); }
    console.log(`  ok  ${String(pageNums.length).padStart(2)}p  ${String(Math.round(out.length/1024)).padStart(5)} KB  ${fname}`);
  }
  console.log(`  ${names.length} parts, ${Math.round(total/1024)} KB total`);
  return { file:name, parts:groups.size, exported:names.length, guard:false, expected, unlocked, pageCounts };
}

const argv = process.argv.slice(2);
const wi = argv.indexOf("--write");
const outDir = wi >= 0 ? resolve(ROOT, argv[wi+1]) : null;
const named = argv.filter((a,i) => !a.startsWith("--") && !(wi >= 0 && i === wi+1));
// No arguments means every fixture, so the suite covers the guard and its decrypted twin without
// anyone having to remember to name them.
const dir = resolve(ROOT, "fixtures");
const files = named.length ? named.map(a => resolve(ROOT, a))
  : (existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith(".pdf")).sort().map(f => join(dir, f)) : []);
if(!files.length){
  console.log("\nno fixtures present — nothing to export (they are gitignored; see docs/baselines.md)\n");
  process.exit(0);
}

const rows = [];
for(const f of files) rows.push(await exportFile(f, outDir));
console.log("\n| fixture | parts | exported | lock |");
console.log("| --- | --- | --- | --- |");
for(const r of rows)
  console.log(`| ${r.file} | ${r.parts} | ${r.exported} | ${r.guard ? "**refused**" : (r.unlocked ? "**unlocked**" : "—")} |`);
// mlb.pdf is the only fixture that may pay for the unlocker, and it may pay once: the module is
// memoised, so a second locked document in the same run must not fetch it again.
const lockedRows = rows.filter(r => EXPECT_LOCKED.has(r.file));
if(qpdfLoads > (lockedRows.length ? 1 : 0)){
  console.log(`\nFAIL  the unlocker was loaded ${qpdfLoads} time(s); at most 1 was expected`);
  failed++;
}else{
  console.log(`\nunlocker loaded ${qpdfLoads} time(s) — not fetched for any unencrypted fixture`);
}
// The two routes to the same 46 pages have to agree part for part.
const a = rows.find(r => r.file === "mlb.pdf"), b = rows.find(r => r.file === "mlb-dec.pdf");
if(a && b && a.pageCounts && b.pageCounts){
  const same = JSON.stringify(a.pageCounts) === JSON.stringify(b.pageCounts);
  console.log(same
    ? `mlb.pdf unlocked and mlb-dec.pdf produce identical page structure across all ${Object.keys(a.pageCounts).length} parts`
    : `FAIL  mlb.pdf and mlb-dec.pdf disagree on page structure`);
  if(!same){ failed++; console.log(`  ${JSON.stringify(a.pageCounts)}\n  ${JSON.stringify(b.pageCounts)}`); }
}
console.log(failed ? `\n${failed} fixture(s) did not do what was expected of them\n` : "\nevery fixture behaved as expected\n");
process.exit(failed ? 1 : 0);
