#!/usr/bin/env node
// Rule checks for the cases no local fixture exercises.
//
// The fixtures cover the happy paths: a score-fronted set with a one-page cover, and two plain
// parts sets with no cover at all. The constraints on the cover rule — no Full Score group, a run
// longer than the cap, an unassigned page mid-document, an explicit choice outranking the default —
// have no fixture behind them, so they are checked here against synthetic page records instead.
//
// Like tools/map.mjs this runs the shipped code: the <script id="core"> block, not a copy.
//
//   npm run check

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE_EXPORTS = ["PARTS", "SKIP", "plan", "safeName", "norm"];
const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
const m = html.match(/<script id="core">([\s\S]*?)<\/script>/);
if(!m) throw new Error('index.html has no <script id="core"> block');
const core = new Function(`${m[1]}\nreturn {${CORE_EXPORTS.join(",")}};`)();

let failed = 0;
function check(name, fn){
  try{ fn(); console.log(`  ok    ${name}`); }
  catch(e){ failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}
function eq(actual, expected, what){
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if(a !== b) throw new Error(`${what}: expected ${b}, got ${a}`);
}

// A page record with everything plan() reads. Defaults describe a blank page: nothing detected,
// no piece number, not a first page, so it is free to inherit or to fall to the cover rule.
let uid = 0;
const pg = (n, o={}) => ({
  n, size:"842x595", detected:null, weak:false, score:false, first:false, number:false,
  override:undefined, key:`page-${n}-${uid++}`, ...o,
});
const label   = (s, n) => s.status[n].label;
const partOf  = (s, n) => s.status[n].part;
const scoreRun = () => [pg(2,{detected:"Full Score",first:true}), pg(3), pg(4)];

console.log("\nPhase 3 — cover joins the Full Score\n");

check("a leading unassigned page joins an existing Full Score", () => {
  const r = core.plan([pg(1), ...scoreRun()], true);
  eq(r.groups.get("Full Score"), [1,2,3,4], "Full Score pages");
  eq(label(r,1), "cover → Full Score", "page 1 status");
  eq(r.status[1].dropped, false, "page 1 dropped");
});

check("cover pages are prepended in document order, ahead of the score", () => {
  const r = core.plan([pg(1), pg(2), ...scoreRun().map(p=>({...p,n:p.n+2}))], true);
  eq(r.groups.get("Full Score"), [1,2,4,5,6], "Full Score pages");
});

check("with no Full Score group, a junk first page stays red", () => {
  const r = core.plan([pg(1), pg(2,{detected:"Soprano Eb",first:true}), pg(3,{detected:"1st Cornet Bb",first:true})], true);
  eq(r.groups.has("Full Score"), false, "invented a Full Score");
  eq(partOf(r,1), null, "page 1 part");
  eq(label(r,1), "skipped", "page 1 status");
});

check("a run of exactly 3 is the cap and still joins", () => {
  const r = core.plan([pg(1), pg(2), pg(3), ...scoreRun().map(p=>({...p,n:p.n+3}))], true);
  eq(r.groups.get("Full Score"), [1,2,3,5,6,7], "Full Score pages");
});

check("a run of 4 is too long and stays red", () => {
  const r = core.plan([pg(1), pg(2), pg(3), pg(4), ...scoreRun().map(p=>({...p,n:p.n+4}))], true);
  eq(r.groups.get("Full Score"), [6,7,8], "Full Score pages");
  eq([1,2,3,4].map(n=>label(r,n)), ["skipped","skipped","skipped","skipped"], "leading statuses");
});

check("an unassigned page mid-document stays red", () => {
  const r = core.plan([...scoreRun(), pg(5,{detected:"Soprano Eb",first:true}), pg(6,{first:true}), pg(7,{detected:"1st Cornet Bb",first:true})], true);
  eq(r.groups.get("Full Score"), [2,3,4], "Full Score pages");
  eq(label(r,6), "skipped", "page 6 status");
});

check("Skip on page 1 outranks the default and ends the run", () => {
  const r = core.plan([pg(1,{override:core.SKIP}), pg(2,{n:2}), ...scoreRun().map(p=>({...p,n:p.n+2}))], true);
  eq(r.groups.get("Full Score"), [4,5,6], "Full Score pages");
  eq(label(r,1), "skipped", "page 1 status");
  eq(label(r,2), "skipped", "page 2 status");
});

check("an explicit dropdown choice on page 1 outranks the default", () => {
  const r = core.plan([pg(1,{override:"Soprano Eb"}), ...scoreRun()], true);
  eq(r.groups.get("Full Score"), [2,3,4], "Full Score pages");
  eq(r.groups.get("Soprano Eb"), [1], "Soprano Eb pages");
});

console.log(failed ? `\n${failed} check(s) failed\n` : "\nall checks passed\n");
process.exit(failed ? 1 : 0);
