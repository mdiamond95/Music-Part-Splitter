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

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename, join } from "node:path";

const require = createRequire(import.meta.url);
const warn = console.warn;
console.warn = (...a) => { if(!String(a[0]).includes("Cannot polyfill")) warn(...a); };
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
const { PDFDocument } = require("pdf-lib");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE_EXPORTS = ["uprightItems", "pageRecord", "scanMeta", "plan", "partOrder", "safeName",
  "defaultPrefix", "SEP", "canCopyPages", "ENCRYPTED_MSG"];

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
  if(!ok){
    console.log(`GUARD FIRES -> "${core.ENCRYPTED_MSG}"`);
    console.log(`  nothing exported; no partial ZIP is built`);
    failed++;
    return { file:name, parts:groups.size, exported:0, guard:true };
  }

  const names = [...groups.keys()].sort((a,b)=>core.partOrder(a)-core.partOrder(b));
  let total = 0;
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
    const fname = `${prefix}${core.SEP}${part}.pdf`;
    if(outDir){ mkdirSync(outDir, {recursive:true}); writeFileSync(join(outDir, core.safeName(fname)), out); }
    console.log(`  ok  ${String(pageNums.length).padStart(2)}p  ${String(Math.round(out.length/1024)).padStart(5)} KB  ${fname}`);
  }
  console.log(`  ${names.length} parts, ${Math.round(total/1024)} KB total`);
  return { file:name, parts:groups.size, exported:names.length, guard:false };
}

const argv = process.argv.slice(2);
const wi = argv.indexOf("--write");
const outDir = wi >= 0 ? resolve(ROOT, argv[wi+1]) : null;
const files = argv.filter((a,i) => !a.startsWith("--") && !(wi >= 0 && i === wi+1));
if(!files.length){ console.error("usage: npm run export -- [--write <dir>] <file.pdf> [more.pdf ...]"); process.exit(1); }

const rows = [];
for(const f of files) rows.push(await exportFile(resolve(ROOT, f), outDir));
console.log("\n| fixture | parts | exported | guard |");
console.log("| --- | --- | --- | --- |");
for(const r of rows) console.log(`| ${r.file} | ${r.parts} | ${r.exported} | ${r.guard ? "**fires**" : "—"} |`);
console.log(failed ? `\n${failed} fixture(s) could not be exported\n` : "\nevery fixture exported\n");
