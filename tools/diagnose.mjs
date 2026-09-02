#!/usr/bin/env node
// Per-page evidence, for when the map's answer is right but the reason is not obvious — or when the
// app on the device disagrees with the map here.
//
// One row per page: what labels were found and where, whether the page opens a new part and on what
// grounds, what it detected, what it resolved to, and which group it ended up in.
//
//   npm run diagnose -- fixtures/mlb.pdf 19-46
//   npm run diagnose -- fixtures/mlb.pdf          (every page)

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";

const require = createRequire(import.meta.url);
const warn = console.warn;
console.warn = (...a) => { if(!String(a[0]).includes("Cannot polyfill")) warn(...a); };
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE_EXPORTS = ["PARTS", "norm", "stitch", "uprightItems", "headerItems", "pageRecord", "scanMeta",
  "plan", "partOrder", "detectPart", "matchShaped", "labelCount", "abbrevColumn", "titleSize",
  "hasPieceNumber", "isFirstPage", "SCORE_LABELS", "SCORE_ABBREVS", "FIRST_PAGE_PT", "COLUMN_X", "COLUMN_PT"];

const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
const m = html.match(/<script id="core">([\s\S]*?)<\/script>/);
if(!m) throw new Error('index.html has no <script id="core"> block');
const core = new Function(`${m[1]}\nreturn {${CORE_EXPORTS.join(",")}};`)();

const pad = (s, n) => { s = String(s); return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length); };
const num = (s, n) => String(s).padStart(n);

// Every label the page offers, with the type and position that decide how it is read. Header items
// are walked in the same reading order detectPart walks, and each is asked the same two questions
// detectPart asks: does a PARTS entry match, does a shaped label match.
function candidates(header, upright, vpWidth){
  const out = [];
  // detectPart reads an accumulator, not one word at a time — "Bass E" and the flat sign that follows
  // it are two text items and only match together. Testing words in isolation would report no label at
  // all on those pages, which is exactly the kind of wrong evidence this tool exists to avoid. So the
  // same accumulator is walked here, and every time the best match improves the word that carried it
  // over is recorded, with the span it matched.
  let acc = "", best = null, bestLen = 0;
  for(const w of core.stitch(header)){
    acc += " " + w.str;
    const h = core.norm(acc);
    for(const [name, res] of core.PARTS) for(const r of res){
      const mm = h.match(r);
      if(mm && mm[0].length > bestLen){
        best = name; bestLen = mm[0].length;
        out.push({ str:w.str, size:w.size, x:w.x, y:w.y, name, via:String(r), span:mm[0] });
      }
    }
    const shaped = core.matchShaped(h);
    if(shaped && shaped.length >= bestLen){
      best = shaped.name; bestLen = shaped.length;
      out.push({ str:w.str, size:w.size, x:w.x, y:w.y, name:shaped.name, via:"shaped", span:h.slice(shaped.index, shaped.index+shaped.length) });
    }
  }
  // The abbreviated stave column, which names no part but classifies the page.
  const col = [];
  for(const it of upright){
    const s = it.str.trim();
    if((s.match(/[A-Za-z]/g) || []).length < 2) continue;
    if(it.transform[4] > vpWidth * core.COLUMN_X) continue;
    if(Math.abs(it.transform[0]) >= core.COLUMN_PT) continue;
    col.push(s);
  }
  return { out, col };
}

// Why isFirstPage said what it said. Both halves, always, so a "no" is as legible as a "yes".
function firstWhy(headerWords){
  const numbered = headerWords.find(w => /^No\.?\s*\d{2,5}$/i.test(w.str.trim()) && w.size >= 11);
  const lettered = headerWords.filter(w => /[A-Za-z]{3,}/.test(w.str));
  const biggest = lettered.length ? lettered.reduce((a,b) => b.size > a.size ? b : a) : null;
  const size = core.titleSize(headerWords);
  const parts = [];
  parts.push(numbered ? `No. "${numbered.str.trim()}" ${numbered.size.toFixed(2)}pt` : `no piece number`);
  // Three decimals, not one: on mlb.pdf the running head clears the threshold by 0.039pt, and rounded
  // to 12.0 that reads as a page sitting exactly on a boundary it is in fact just inside.
  parts.push(biggest ? `title ${size.toFixed(3)}pt ${size >= core.FIRST_PAGE_PT ? ">=" : "<"} ${core.FIRST_PAGE_PT} by ${Math.abs(size-core.FIRST_PAGE_PT).toFixed(3)} ("${biggest.str.trim().slice(0,30)}")`
                     : `no lettered text`);
  return parts.join("; ");
}

async function run(file, from, to){
  const data = new Uint8Array(readFileSync(file));
  const pdf = await pdfjs.getDocument({ data, verbosity: 0, useSystemFonts: false }).promise;
  const pages = [], detail = [];
  const numbers = new Set(), titles = new Set();
  for(let i=1; i<=pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const upright = core.uprightItems(tc.items);
    core.scanMeta(upright, numbers, titles);
    pages.push(core.pageRecord(i, tc.items, vp.height, vp.width));
    const header = core.headerItems(upright, vp.height);
    detail.push({
      cand: candidates(header, upright, vp.width),
      why: firstWhy(core.stitch(header)),
      hit: core.detectPart(header),
    });
  }
  await pdf.destroy();

  const { groups, status } = core.plan(pages, true);
  const groupOf = new Map();
  for(const [part, pg] of groups) for(const n of pg) groupOf.set(n, `${part} [${pg.join(",")}]`);

  console.log(`\n=== ${basename(file)} — pages ${from}-${to} of ${pages.length} ===`);
  console.log(`thresholds: SCORE_LABELS=${core.SCORE_LABELS}  SCORE_ABBREVS=${core.SCORE_ABBREVS}  FIRST_PAGE_PT=${core.FIRST_PAGE_PT}\n`);
  console.log(`${pad("pg",4)}${pad("first",6)}${pad("lbl/stv",9)}${pad("detected",22)}${pad("resolved",22)}${pad("status",16)}group`);
  console.log("-".repeat(132));
  for(const p of pages){
    if(p.n < from || p.n > to) continue;
    const d = detail[p.n-1], s = status[p.n];
    console.log(
      pad(p.n, 4) + pad(p.first ? "YES" : "no", 6) +
      pad(`${p.labels}/${p.staves}${p.score ? " S" : ""}`, 9) +
      pad((p.detected || "-") + (p.detected && p.weak ? " (weak)" : ""), 22) +
      pad(s.part || "-", 22) + pad(s.label, 16) + (groupOf.get(p.n) || "-")
    );
    console.log(`      first: ${d.why}`);
    for(const c of d.cand.out)
      console.log(`      label: "${c.str.trim().slice(0,26)}" ${num(c.size.toFixed(2),6)}pt @ (${num(Math.round(c.x),4)},${num(Math.round(c.y),4)})  -> ${pad(c.name,18)} matched "${c.span.slice(0,26)}"  via ${c.via.slice(0,32)}`);
    if(!d.cand.out.length) console.log(`      label: (none in the header band)`);
    if(d.cand.col.length) console.log(`      column: ${d.cand.col.length} small left-margin items: ${d.cand.col.join(" · ").slice(0,96)}`);
  }
  console.log("-".repeat(132));
  const names = [...groups.keys()].sort((a,b)=>core.partOrder(a)-core.partOrder(b));
  for(const part of names){
    const pg = groups.get(part);
    if(pg.some(n => n >= from && n <= to)) console.log(`  ${pad(part,24)} ${pg.length} page${pg.length===1?"":"s"}  [${pg.join(", ")}]`);
  }
}

const argv = process.argv.slice(2);
const file = argv.find(a => a.endsWith(".pdf"));
const range = argv.find(a => /^\d+(-\d+)?$/.test(a));
if(!file){ console.error("usage: npm run diagnose -- <file.pdf> [from-to]"); process.exit(1); }
const [from, to] = range ? range.split("-").map(Number) : [1, 1e9];
await run(resolve(ROOT, file), from, to || from);
