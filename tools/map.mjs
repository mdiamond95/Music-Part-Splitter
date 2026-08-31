#!/usr/bin/env node
// Verification harness. Prints the page -> part map for one or more PDFs without a browser.
//
// The detection code is not duplicated here: it is read straight out of the <script id="core">
// block in index.html, so whatever this prints is what the shipped page does.
//
//   npm run map -- fixtures/score.pdf [more.pdf ...]
//   npm run map -- --no-dedupe fixtures/score.pdf

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";

const require = createRequire(import.meta.url);
// pdf.js warns that it cannot polyfill DOMMatrix/Path2D without the optional `canvas` module.
// The harness only reads text, never renders, so those two warnings are noise; everything else passes through.
const warn = console.warn;
console.warn = (...a) => { if(!String(a[0]).includes("Cannot polyfill")) warn(...a); };
// The ESM entry point does not expose getDocument; the legacy CJS build does.
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE_EXPORTS = [
  "PARTS", "INHERIT", "SKIP", "norm", "matchPart", "detectPart", "safeName",
  "uprightItems", "headerItems", "pageRecord", "scanMeta", "plan", "stitch", "titleSize", "isFirstPage", "hasPieceNumber", "labelCount",
];

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
  const pages = [];
  const numbers = new Set(), titles = new Set();
  for(let i=1; i<=pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    core.scanMeta(core.uprightItems(tc.items), numbers, titles);
    pages.push(core.pageRecord(i, tc.items, vp.height, vp.width));
  }
  await pdf.destroy();
  return { pages, numbers, titles };
}

function pad(s, n){ s = String(s); return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length); }

async function mapFile(file, dedupe){
  const { pages, numbers, titles } = await readPages(file);
  const { groups, status } = core.plan(pages, dedupe);

  console.log(`\n=== ${basename(file)} — ${pages.length} pages${dedupe ? "" : "  (dedupe off)"} ===`);
  const nums = [...numbers].sort((a,b)=>a-b);
  console.log(`piece numbers: ${nums.join(", ") || "not found"}`);
  if(titles.size) console.log(`titles: ${[...titles].join(" | ")}`);
  console.log("");
  console.log(`${pad("pg",4)}${pad("size",10)}${pad("detected",20)}${pad("status",20)}new lbl header`);
  console.log("-".repeat(110));
  for(const p of pages){
    const s = status[p.n];
    console.log(
      pad(p.n, 4) + pad(p.size, 10) + pad(p.detected || "-", 20) + pad(s.label, 20) + (p.first ? "1st " : "    ") + pad(p.score ? `S${p.labels}` : p.labels, 4) +
      core.norm(p.header).slice(0, 60)
    );
  }

  const kept = pages.filter(p => !status[p.n].dropped).length;
  const dups = pages.filter(p => status[p.n].dup).length;
  const skipped = pages.filter(p => status[p.n].dropped && !status[p.n].dup).length;
  const inherited = pages.filter(p => status[p.n].inherited && !status[p.n].dropped).length;
  console.log("-".repeat(110));
  console.log(`${groups.size} parts · ${kept} pages kept (${inherited} by inheritance) · ${dups} dropped as duplicates · ${skipped} skipped\n`);

  const order = core.PARTS.map(p => p[0]);
  const names = [...groups.keys()].sort((a,b)=>order.indexOf(a)-order.indexOf(b));
  for(const part of names){
    const pg = groups.get(part);
    console.log(`  ${pad(part, 20)} ${pg.length} page${pg.length===1?"":"s"}  [${pg.join(", ")}]`);
  }
  return { file, parts: groups.size, kept, dups, skipped };
}

const argv = process.argv.slice(2);
const dedupe = !argv.includes("--no-dedupe");
const files = argv.filter(a => !a.startsWith("--"));
if(!files.length){
  console.error("usage: npm run map -- [--no-dedupe] <file.pdf> [more.pdf ...]");
  process.exit(1);
}
for(const f of files) await mapFile(resolve(ROOT, f), dedupe);
