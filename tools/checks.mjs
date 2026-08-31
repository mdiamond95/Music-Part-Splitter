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
const CORE_EXPORTS = ["PARTS", "SKIP", "SEP", "plan", "safeName", "norm", "seriesName", "defaultPrefix",
  "detectPart", "matchPart", "matchCombined", "labelCount", "partOrder", "partOptions"];
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
  override:undefined, key:`page-${n}-${uid++}`, cover:null, ...o,
});
// Cover text items, largest first, as coverItems() would hand them over: string, font size, y.
const items = (...rows) => rows.map(([str,size,y]) => ({ str, size, y }));
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

console.log("\nPhase 4 — series-based default naming\n");

// A cover shaped like both local score-fronted sets: title largest, composer, then the series line.
const cover = (title, composer, seriesLine) => items([title,36,355], [composer,18,296], [seriesLine,14,244]);
const withCover = (coverText) => [pg(1,{cover:coverText}), pg(2,{detected:"Full Score",first:true,cover:[]}), pg(3)];
const prefixOf = (pages, numbers=[], file="set.pdf") =>
  core.defaultPrefix(pages, core.plan(pages, true).status, new Set(numbers), file);

check("carols-shaped cover yields TS #1352 - A Suite of English Carols", () => {
  const p = withCover(cover("A Suite of English Carols","Kenneth Downie","Triumph Series 1352 (2023)"));
  eq(prefixOf(p, ["1352","1353"]), "TS #1352 - A Suite of English Carols", "prefix");
});

check("an unknown series abbreviates to the initials of its capitalised words", () => {
  const p = withCover(cover("Snowfall","A Composer","Winter Wonderland Series 88 (2024)"));
  eq(core.seriesName(p, core.plan(p,true).status).abbr, "WWS", "abbreviation");
});

check("the year is optional", () => {
  const p = withCover(cover("Praise","A Composer","Festival Series 604"));
  const s = core.seriesName(p, core.plan(p,true).status);
  eq([s.abbr, s.number, s.year], ["FS","604",null], "series/number/year");
});

check("every mapped series name resolves to its published abbreviation", () => {
  const map = [["Triumph Series","TS"],["Festival Series","FS"],["General Series","GS"],["Unity Series","US"],
               ["American Band Journal","ABJ"],["American Festival Series","AFS"],["Maple Leaf Brass","MLB"],
               ["Hallelujah Choruses","HC"],["Judd Street Collection","JSC"]];
  for(const [name, abbr] of map){
    // Matching is case-insensitive, so the shouty cover variant has to land on the same abbreviation.
    for(const variant of [name, name.toUpperCase()]){
      const p = withCover(cover("A Title","A Composer",`${variant} 12 (2020)`));
      eq(core.seriesName(p, core.plan(p,true).status).abbr, abbr, `${variant}`);
    }
  }
});

check("the title skips the series line and the composer credit", () => {
  const p = withCover(cover("The First Noel","Traditional arr. Jared Proellocks","Noel Jones Series 2104 (2021)"));
  eq(core.seriesName(p, core.plan(p,true).status).title, "The First Noel", "title");
});

check("a cover with no series line falls back to the piece numbers", () => {
  const p = withCover(items(["Goodness of God",36,355], ["arr. Paul Sharman",18,296]));
  eq(core.seriesName(p, core.plan(p,true).status), null, "series");
  eq(prefixOf(p, ["1389","1390"]), "1389-1390", "prefix");
});

check("a cover with no series line and no piece number falls back to the filename", () => {
  const p = withCover(items(["Goodness of God",36,355]));
  eq(prefixOf(p, [], "christmas-encore-medley.pdf"), "christmas-encore-medley", "prefix");
});

check("prose that merely ends in a number is not a series line", () => {
  // score.pdf's notes page carries "SASB 126 TB 857"; multipage.pdf's part header carries the
  // Arthur Gullidge form, whose number lives inside the parens instead of standing on its own.
  for(const line of ["SASB 126 TB 857", "Arthur Gullidge Series (AGS2004)", "Bar 63"]){
    const p = withCover(items(["A Title",36,355], [line,14,244]));
    eq(core.seriesName(p, core.plan(p,true).status), null, `matched "${line}"`);
  }
});

check("the series pattern never spans two text items", () => {
  // Composer on one line, a bare number on another, must not join into "Kenneth Downie 1352".
  const p = withCover(items(["A Title",36,355], ["Kenneth Downie",18,296], ["1352",14,244]));
  eq(core.seriesName(p, core.plan(p,true).status), null, "series");
});

check("a page 1 that detected a part is still scanned, and finds nothing on a parts set", () => {
  const p = [pg(1,{detected:"Soprano Eb",first:true,cover:items(["Goodness of God",15.5,776],["SOPRANO Eb",13,786])}),
             pg(2,{detected:"1st Cornet Bb",first:true,cover:[]})];
  eq(core.seriesName(p, core.plan(p,true).status), null, "series");
});

check("a series line on a notes page filed under Full Score is still found", () => {
  const p = [pg(1,{cover:items(["A Title",36,355])}),
             pg(2,{detected:"Full Score",first:true,cover:items(["Score Notes",24,514],["Triumph Series 1352 (2023)",14,244])}),
             pg(3)];
  eq(core.seriesName(p, core.plan(p,true).status).prefix, "TS #1352 - Score Notes", "prefix");
});

check("safeName keeps the # in the prefix", () => {
  eq(core.safeName("TS #1352 - A Suite of English Carols"), "TS #1352 - A Suite of English Carols", "safeName");
  eq(core.safeName('TS #1352 - A/B: C*D?"E<F>G|H'), "TS #1352 - A-B- C-D--E-F-G-H", "safeName strips the real offenders");
});

check("the separator is a plain hyphen-minus with spaces, not an en dash", () => {
  eq(core.SEP, " - ", "SEP");
  eq(core.SEP.includes("\u2013"), false, "contains an en dash");
});

console.log("\nCHANGES3 — shared parts\n");

// Header text items as pdf.js hands them over, top-left first: [string, font size]. The real sets
// print the label at 8-10pt in the top-left corner, which is what these imitate.
// A row is either "label" or ["label", size].
const hdr = (...rows) => rows.map((row, i) => {
  const [str, size = 10] = Array.isArray(row) ? row : [row];
  return { str, width: str.length * size * 0.5, transform: [size, 0, 0, size, 40 + i * 0.001, 800 - i] };
});
const detect = (...rows) => core.detectPart(hdr(...rows)).part;

check("every shape of the pattern is recognised", () => {
  const shapes = [
    [["Baritone/Trombone"],                  "Baritone/Trombone"],            // bare, no ordinals
    [["1st Baritone/Trombone B", ["b", 10]], "1st Baritone/Trombone Bb"],     // one ordinal, key
    [["1st Baritone/2nd Trombone Bb"],       "1st Baritone/2nd Trombone Bb"], // both ordinals
    [["2nd Baritone/Trombone B.C."],         "2nd Baritone/Trombone B.C."],   // bass clef
    [["Solo Horn/1st Horn Eb"],              "Solo Horn/1st Horn Eb"],        // Solo as an ordinal
    [["Baritone & Trombone"],                "Baritone & Trombone"],          // ampersand joiner
    [["Euphonium/Tuba T.C."],                "Euphonium/Tuba T.C."],          // treble clef
    [["1st Horn/2nd Horn F"],                "1st Horn/2nd Horn F"],          // key with no flat
  ];
  for(const [items, name] of shapes) eq(detect(...items), name, items[0]);
});

check("the label may wrap around the piece title, as it does on the real sets", () => {
  // multipage.pdf p.13 arrives in this order: the label's first line, then the centred title read
  // between the two lines of the label, then the rest of the label.
  eq(detect(["The Salvation Army Australia Territory", 15], ["Arthur Gullidge Series (AGS2004)", 12],
            ["1st Baritone/", 8.6], ["Christmas Encore Medley", 15.5], ["Trombone B", 8.6], ["b", 8.6]),
     "1st Baritone/Trombone Bb", "wrapped label");
  eq(detect(["1st. Baritone/", 8.6], ["Christmas Encore Medley", 15.5], ["Trombone B.C.", 8.6]),
     "1st Baritone/Trombone B.C.", "wrapped bass-clef label");
});

check("a combined label beats either of its halves", () => {
  // The half is what today's code settled for: "1st Baritone B.C." matches the very same span,
  // ending on the very same clef, so the shared part has to win the tie outright.
  eq(core.matchPart(core.norm("1st Baritone/Trombone B.C.")), "1st Baritone/Trombone B.C.", "vs 1st Baritone B.C.");
  eq(core.matchPart(core.norm("1st Baritone/2nd Trombone Bb")), "1st Baritone/2nd Trombone Bb", "vs 1st Baritone Bb");
  eq(core.matchPart(core.norm("2nd Baritone/Trombone Bb")), "2nd Baritone/Trombone Bb", "vs 2nd Baritone Bb");
  // And a plain label is still plain: neither half may be invented where no joiner was printed.
  eq(core.matchPart(core.norm("1st Baritone Bb")), "1st Baritone Bb", "plain label");
  eq(core.matchCombined(core.norm("1st Baritone Bb")), null, "plain label matched the pattern");
});

check("a slash between two words that are not both instruments is not a shared part", () => {
  // encore.pdf.pdf p.18's credit line, and the String/Electric Bass part, which is a shared part but
  // is carried by its own PARTS entry: neither half of it is an instrument name on its own.
  for(const line of ["Words/Music: English 16th Century Folk Song", "String/Electric Bass"]){
    eq(!!core.matchCombined(core.norm(line)), false, line.slice(0, 40));
  }
  eq(detect("String/Electric Bass"), "String Bass", "String/Electric Bass");
});

check("prose that mentions two instruments does not become a shared part", () => {
  // score.pdf's Score Notes page discusses "Trombone/Baritone in Bar 36" mid-sentence. The pattern
  // itself cannot tell a sentence from a label, so the two places that matter are guarded instead:
  // the score signal ignores a match that starts inside a long text item, and detection marks it as
  // weak evidence, which is what stops it breaking out of a score run into a part of its own.
  const line = "Work on projecting sound through the lower register for Trombone/Baritone and";
  // Zero, not one: neither half matches a PARTS entry on its own either, so the sentence names
  // nothing the score signal can see — which is exactly the state it was in before this change.
  eq(core.labelCount(hdr([line])), 0, "counted the sentence as an instrument");
  eq(core.detectPart(hdr([line])).weak, true, "weak evidence");
  // The same words as an actual label, in label-sized type, are a shared part.
  eq(core.labelCount(hdr(["Trombone/Baritone"])), 1, "label count");
  eq(core.detectPart(hdr(["Trombone/Baritone"])).weak, false, "weak evidence for a real label");
});

check("the score signal counts a combined label as one instrument", () => {
  eq(core.labelCount(hdr(["1st Baritone/2nd Trombone Bb"])), 1, "1st Baritone/2nd Trombone Bb");
  eq(core.labelCount(hdr(["2nd Baritone/Trombone B.C."])), 1, "2nd Baritone/Trombone B.C.");
  eq(core.labelCount(hdr(["Flute/Oboe"])), 1, "Flute/Oboe");
  // Two separate labels are still two, so the shared part cannot mask a real score page.
  eq(core.labelCount(hdr(["1st Baritone Bb"], ["2nd Trombone Bb"])), 2, "two plain labels");
  eq(core.labelCount(hdr(["1st Baritone/2nd Trombone Bb"], ["Soprano Eb"], ["Solo Cornet Bb"])), 3, "combined plus two");
});

check("the filename keeps the label readable: / becomes -", () => {
  eq(core.safeName("1st Baritone/Trombone Bb"), "1st Baritone-Trombone Bb", "slash");
  eq(core.safeName("Baritone & Trombone"), "Baritone & Trombone", "ampersand is left alone");
  eq(`x${core.SEP}${core.safeName("2nd Baritone/Trombone B.C.")}.pdf`, "x - 2nd Baritone-Trombone B.C..pdf", "example file");
});

check("a shared part sorts immediately after the first of its two instruments", () => {
  const parts = ["Soprano Eb", "1st Baritone Bb", "1st Baritone/Trombone Bb", "2nd Baritone Bb",
                 "1st Baritone/Trombone B.C.", "1st Baritone B.C.", "Bass Trombone", "Euphonium Bb"];
  eq([...parts].sort((a,b)=>core.partOrder(a)-core.partOrder(b)),
     ["Soprano Eb", "1st Baritone Bb", "1st Baritone/Trombone Bb", "2nd Baritone Bb",
      "1st Baritone B.C.", "1st Baritone/Trombone B.C.", "Bass Trombone", "Euphonium Bb"], "band order");
  // A combined label with no plain entry for its first half falls in beside the same instrument.
  const i = core.PARTS.findIndex(p => p[0] === "Baritone Bb");
  eq(core.partOrder("Baritone/Trombone") > i && core.partOrder("Baritone/Trombone") < i + 1, true, "Baritone/Trombone");
});

check("the dropdown offers the shared parts this document prints", () => {
  const pages = [{detected:"1st Baritone/Trombone Bb"}, {detected:"Soprano Eb"}, {detected:null, override:core.SKIP}];
  const opts = core.partOptions(pages);
  eq(opts.length, core.PARTS.length + 1, "option count");
  eq(opts[opts.indexOf("1st Baritone Bb") + 1], "1st Baritone/Trombone Bb", "sits after its first instrument");
  eq(opts.includes(core.SKIP), false, "Skip leaked into the part list");
  // Nothing is added for a document that prints no shared part.
  eq(core.partOptions([{detected:"Soprano Eb"}]).length, core.PARTS.length, "unchanged option count");
});

console.log(failed ? `\n${failed} check(s) failed\n` : "\nall checks passed\n");
process.exit(failed ? 1 : 0);
