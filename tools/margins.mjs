#!/usr/bin/env node
// Guards the dead band around FIRST_PAGE_PT.
//
// isFirstPage decides whether a page opens a new part or continues the one before it, and for a page
// with no piece number that decision is one comparison: the largest lettered word in the header band
// against FIRST_PAGE_PT. It is the only threshold in the app that separates two populations which
// nearly touch, and the only one whose inputs come from a renderer rather than from the file — a font
// size arrives as a text-matrix scale, and a set that has been re-imposed carries a scale like 0.9967.
//
// mlb.pdf cleared the old threshold of 12 by 0.039pt and flipped on the device, splitting every
// two-page part in half. So the rule is no longer "the fixtures pass": it is that every page in every
// fixture stays a full point clear of the threshold, on whichever side it belongs. A future set that
// squeezes the gap fails here, loudly, instead of being discovered on someone's iPad.
//
//   npm run margins            all fixtures
//   npm run margins -- fixtures/mlb.pdf

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename, join } from "node:path";

const require = createRequire(import.meta.url);
const warn = console.warn;
console.warn = (...a) => { if(!String(a[0]).includes("Cannot polyfill")) warn(...a); };
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
const m = html.match(/<script id="core">([\s\S]*?)<\/script>/);
if(!m) throw new Error('index.html has no <script id="core"> block');
const core = new Function(`${m[1]}\nreturn {uprightItems,headerItems,stitch,titleSize,hasPieceNumber,FIRST_PAGE_PT};`)();

// How far a title has to stay from the threshold. One point is wide enough that no plausible
// difference in font measurement between two renderers can cross it, and narrow enough that it still
// admits a set whose running heads are set at 12pt outright.
const DEAD_BAND = 1.0;
const PT = core.FIRST_PAGE_PT;

async function measure(file){
  const data = new Uint8Array(readFileSync(file));
  const pdf = await pdfjs.getDocument({ data, verbosity: 0, useSystemFonts: false }).promise;
  const rows = [];
  for(let i=1; i<=pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const words = core.stitch(core.headerItems(core.uprightItems(tc.items), vp.height));
    const size = core.titleSize(words);
    // A page with no lettered header text has no title to be near the threshold with.
    if(size > 0) rows.push({ n:i, size, number:core.hasPieceNumber(words) });
  }
  await pdf.destroy();
  return rows;
}

const argv = process.argv.slice(2).filter(a => !a.startsWith("--"));
const dir = resolve(ROOT, "fixtures");
const files = argv.length ? argv.map(a => resolve(ROOT, a))
  : (existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith(".pdf")).sort().map(f => join(dir, f)) : []);

if(!files.length){
  console.log("\nno fixtures present — nothing to measure (they are gitignored; see docs/baselines.md)\n");
  process.exit(0);
}

console.log(`\nFIRST_PAGE_PT = ${PT}, dead band +/-${DEAD_BAND.toFixed(1)}pt\n`);
console.log(`${"fixture".padEnd(16)}${"below".padEnd(20)}${"margin".padEnd(9)}${"above".padEnd(20)}${"margin".padEnd(9)}verdict`);
console.log("-".repeat(88));

let failed = 0;
for(const f of files){
  const rows = await measure(f);
  const below = rows.filter(r => r.size < PT).map(r => r.size);
  const above = rows.filter(r => r.size >= PT).map(r => r.size);
  const hiBelow = below.length ? Math.max(...below) : null;
  const loAbove = above.length ? Math.min(...above) : null;
  const mBelow = hiBelow === null ? Infinity : PT - hiBelow;
  const mAbove = loAbove === null ? Infinity : loAbove - PT;
  const bad = rows.filter(r => Math.abs(r.size - PT) < DEAD_BAND);
  if(bad.length) failed++;
  const span = (a) => a.length ? `${Math.min(...a).toFixed(3)}..${Math.max(...a).toFixed(3)}` : "-";
  console.log(
    basename(f).padEnd(16) +
    `${span(below)} (${below.length})`.padEnd(20) + (mBelow === Infinity ? "-" : mBelow.toFixed(3)).padEnd(9) +
    `${span(above)} (${above.length})`.padEnd(20) + (mAbove === Infinity ? "-" : mAbove.toFixed(3)).padEnd(9) +
    (bad.length ? `FAIL ${bad.length} page(s) inside the band` : "ok"));
  for(const r of bad)
    console.log(`    p.${r.n}: title ${r.size.toFixed(3)}pt is ${Math.abs(r.size-PT).toFixed(3)} from ${PT}` +
                `${r.number ? " (has a piece number, so it opens a part either way)" : ""}`);
}
console.log("-".repeat(88));
console.log(failed
  ? `\n${failed} fixture(s) sit inside the dead band. Move FIRST_PAGE_PT to the midpoint of the new gap,\nor separate the two populations another way — do not narrow the band.\n`
  : `\nevery page in every fixture is at least ${DEAD_BAND.toFixed(1)}pt clear of the threshold\n`);
process.exit(failed ? 1 : 0);
