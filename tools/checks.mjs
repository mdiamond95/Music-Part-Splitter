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
  "detectPart", "matchPart", "matchCombined", "matchPartInKey", "labelCount", "partOrder", "partOptions",
  "stitch", "isFirstPage", "hasPieceNumber", "abbrevColumn", "SCORE_ABBREVS", "SCORE_LABELS", "pageRecord",
  "canCopyPages", "ENCRYPTED_MSG"];
const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
const m = html.match(/<script id="core">([\s\S]*?)<\/script>/);
if(!m) throw new Error('index.html has no <script id="core"> block');
const core = new Function(`${m[1]}\nreturn {${CORE_EXPORTS.join(",")}};`)();

let failed = 0;
function check(name, fn){
  try{
    const r = fn();
    // Most checks are synchronous. The export probe is not — it is an async function in the shipped
    // code — so a check that returns a promise is awaited, and the caller awaits the check.
    if(r && typeof r.then === "function"){
      return r.then(() => console.log(`  ok    ${name}`),
                    e => { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); });
    }
    console.log(`  ok    ${name}`);
  }
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

check("a shared part may be a qualifier and an instrument, not two instrument names", () => {
  // "String/Electric Bass" is one part for two players. Neither half is an instrument on its own:
  // the first is a bare qualifier, the second qualifies the Bass that ends the label.
  eq(detect("String/Electric Bass"), "String/Electric Bass", "String/Electric Bass");
  eq(detect("Christmas Encore Medley String/Electric Bass arr. Brian Hogg"), "String/Electric Bass", "in a header");
  eq(core.safeName("String/Electric Bass"), "String-Electric Bass", "filename");
  eq(core.labelCount(hdr(["String/Electric Bass"])), 1, "one instrument");
  // It sorts where String Bass sorts, since that is the entry naming its first half.
  const i = core.PARTS.findIndex(p => p[0] === "String Bass");
  eq(core.partOrder("String/Electric Bass") > i && core.partOrder("String/Electric Bass") < i + 1, true, "band order");
  // A set that prints the plain label, or prints the joiner loose, still lands on the PARTS entry.
  eq(detect("String Bass"), "String Bass", "String Bass");
  eq(detect("String / Electric Bass"), "String Bass", "String / Electric Bass");
});

check("a slash between two words that name no instrument is not a shared part", () => {
  // encore.pdf p.18's credit line, score.pdf's notes page, and a bar of repeat slashes.
  for(const line of ["Words/Music: English 16th Century Folk Song",
                     "equivalent to the piano/rhythm guitar part and basses",
                     "a movement to 4/4 can breathe new rhythmic",
                     "‰ ‰ ‰ / ‘ ‘ mf"]){
    eq(!!core.matchCombined(core.norm(line)), false, line.slice(0, 40));
    eq(detect(line), null, `detected on "${line.slice(0, 30)}"`);
  }
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

check("\"or\" joins a shared part, as a whole word only", () => {
  // unity.pdf pp.20-23 print "BARITONE or TROMBONE Bb", with the flat as its own text item.
  eq(detect(["BARITONE or TROMBONE B", 14.5], ["b", 14.5]), "Baritone or Trombone Bb", "unity label");
  eq(detect("1st Horn or 2nd Horn Eb"), "1st Horn or 2nd Horn Eb", "ordinals on both halves");
  eq(core.safeName("Baritone or Trombone Bb"), "Baritone or Trombone Bb", "filename needs no change");
  const i = core.PARTS.findIndex(p => p[0] === "Baritone Bb");
  eq(core.partOrder("Baritone or Trombone Bb") > i && core.partOrder("Baritone or Trombone Bb") < i + 1, true, "sorts after Baritone");
  // Negatives: "or" inside a word is not a joiner, and neither is one with no instrument beside it.
  for(const line of ["Tenor Horn Eb", "Baritoneor Trombone", "Horn or", "or Trombone Bb",
                     "players can be encouraged to add extra percussion or vocal shouts"]){
    eq(!!core.matchCombined(core.norm(line)), false, line);
  }
  eq(detect("Tenor Horn Eb"), null, "Tenor Horn Eb");
});

check("an abbreviated column label is not a shared part", () => {
  // unity.pdf's score column prints "Bar./Trom. Bb". It matches no PARTS entry and no shared-part
  // shape either, so it counts as nothing at all — the score signal on that page rests on the other
  // nine instruments in the column. Recorded here because the brief expected it to count as one.
  eq(core.matchCombined(core.norm("Bar./Trom. Bb")), null, "Bar./Trom. Bb");
  eq(core.labelCount(hdr(["Bar./Trom. Bb"])), 0, "label count");
});

check("the score signal counts a combined label as one instrument", () => {
  eq(core.labelCount(hdr(["1st Baritone/2nd Trombone Bb"])), 1, "1st Baritone/2nd Trombone Bb");
  eq(core.labelCount(hdr(["2nd Baritone/Trombone B.C."])), 1, "2nd Baritone/Trombone B.C.");
  eq(core.labelCount(hdr(["Flute/Oboe"])), 1, "Flute/Oboe");
  // Two separate labels are still two, so the shared part cannot mask a real score page.
  eq(core.labelCount(hdr(["1st Baritone Bb"], ["2nd Trombone Bb"])), 2, "two plain labels");
  eq(core.labelCount(hdr(["1st Baritone/2nd Trombone Bb"], ["Soprano Eb"], ["Solo Cornet Bb"])), 3, "combined plus two");
});

check("every shape of a Part-in-Key label is recognised", () => {
  const shapes = [
    [["PART I in C"],                        "Part I in C"],      // the six unity.pdf prints
    [["PART II in F"],                       "Part II in F"],
    [["PART III in F"],                      "Part III in F"],
    [["PART VIII in E", ["b", 14.5]],        "Part VIII in Eb"],  // flat as its own text item
    [["PART II in B", ["b", 14.5]],          "Part II in Bb"],
    [["PART 3 in F"],                        "Part III in F"],    // Arabic numeral, normalised
    [["PART 7 in C"],                        "Part VII in C"],
  ];
  for(const [items, name] of shapes) eq(detect(...items), name, items[0]);
  eq(core.safeName("Part III in Bb"), "Part III in Bb", "filename");
});

check("an Arabic numeral and its Roman twin are one part", () => {
  // A set printed either way has to yield one part under one filename, so the numeral is normalised
  // rather than kept as printed.
  eq(detect("PART 3 in F"), detect("PART III in F"), "3 in F vs III in F");
  eq(detect("PART 3 in F"), "Part III in F", "canonical name");
  eq(core.safeName(detect("PART 3 in F")), core.safeName(detect("PART III in F")), "filename");
  // The key still separates them: same numeral, different key, different part.
  eq(detect("PART 3 in F") === detect("PART 3 in C"), false, "3 in F vs 3 in C");
  eq(detect("PART 3 in C"), "Part III in C", "3 in C");
});

check("the same numeral in two keys is two parts", () => {
  // unity.pdf prints both, on pp.35 and 36. They are different parts, not one printed twice.
  eq(detect("PART III in F") === detect("PART III in C"), false, "III in F vs III in C");
  eq(core.partOrder("Part III in F") === core.partOrder("Part III in C"), false, "sort keys");
});

check("Part-in-Key parts sort as a block after the band and before percussion", () => {
  const parts = ["Percussion Score", "Part III in F", "Bass Bb", "Part I in C", "Percussion I",
                 "Part III in C", "String/Electric Bass", "Part V in C", "Part IV in C", "Part II in F"];
  eq([...parts].sort((a,b)=>core.partOrder(a)-core.partOrder(b)),
     ["Bass Bb", "String/Electric Bass", "Part I in C", "Part II in F", "Part III in C",
      "Part III in F", "Part IV in C", "Part V in C", "Percussion Score", "Percussion I"], "band order");
  // Numeral first, then key. A name that still carries an Arabic numeral — a dropdown choice saved
  // before the numeral was normalised, say — sorts with the Roman one of the same value.
  eq(core.partOrder("Part 3 in F") === core.partOrder("Part III in F"), true, "3 sorts with III");
});

check("a Part-in-Key page is a first page and offers itself in the dropdown", () => {
  // unity.pdf's six pages carry "No. 549" at 14pt, so they open a part rather than inheriting.
  const words = core.stitch(hdr(["THANK YOU, LORD", 20], ["No. 549", 14], ["PART I in C", 14.5]));
  eq(core.isFirstPage(words), true, "first page");
  eq(core.hasPieceNumber(words), true, "piece number");
  const opts = core.partOptions([{detected:"Part I in C"}, {detected:"1st Cornet Bb"}]);
  eq(opts.length, core.PARTS.length + 1, "option count");
  eq(opts[opts.indexOf("Percussion Score") - 1], "Part I in C", "sits just before percussion");
});

check("prose about a part, and an incomplete label, are not Part-in-Key parts", () => {
  for(const line of ["Euphonium part for that duet section to achieve balance",
                     "PART I", "PART in C", "PART IX in C", "the part in question"]){
    eq(!!core.matchPartInKey(core.norm(line)), false, line);
  }
  eq(detect("Euphonium part for that duet section to achieve balance"), "Euphonium Bb", "still the Euphonium");
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

console.log("\nCHANGES5 — the abbreviated stave column\n");

// A score page's left margin, as pdf.js hands it over: [string, x, size]. The real column sits at
// x = 42-52 of a 612pt page at 7.7pt, which is what these imitate. Page width is 612 throughout.
const PAGE_W = 612;
const col = (...rows) => rows.map(([str, x = 45, size = 7.7], i) =>
  ({ str, width: str.length * size * 0.5, transform: [size, 0, 0, size, x, 700 - i * 40] }));
const MLB_COLUMN = ["Sop. Cor.", "1st Cor.", "2nd Cor.", "1st Hn", "2nd Hn", "1st Bari.", "2nd Bari.",
                    "1st Tbn.", "2nd Tbn.", "B. Tbn.", "Euph.", "Perc. 1", "Perc. 2"];

check("the abbreviated column is counted, with the measured margin on both sides", () => {
  eq(core.SCORE_ABBREVS, 6, "threshold");
  // mlb.pdf pp.3-18: thirteen abbreviated staves, seven clear above the threshold.
  eq(core.abbrevColumn(col(...MLB_COLUMN.map(s => [s])), PAGE_W), 13, "the full column");
  // The worst page in the fixtures that is not a score page — encore.pdf p.35, a Baritone/Trombone
  // part carrying three cues over its music — counts 3, three clear below.
  eq(core.abbrevColumn(col(["Bar."], ["Trom."], ["B. Trom."]), PAGE_W), 3, "a part page's cues");
  // Distinct labels, not items: the same stave named twice down a long page is still one.
  eq(core.abbrevColumn(col(["1st Cor."], ["1st Cor."], ["Euph."]), PAGE_W), 2, "repeats");
  // Exactly at the threshold fires; one below does not.
  const six = col(...MLB_COLUMN.slice(0, 6).map(s => [s]));
  eq(core.abbrevColumn(six, PAGE_W) >= core.SCORE_ABBREVS, true, "six fires");
  eq(core.abbrevColumn(col(...MLB_COLUMN.slice(0, 5).map(s => [s])), PAGE_W) >= core.SCORE_ABBREVS, false, "five does not");
});

check("only a column counts: cues over the music, and title-sized text, do not", () => {
  // Same thirteen labels printed out over the stave rather than down the margin.
  eq(core.abbrevColumn(col(...MLB_COLUMN.map(s => [s, 300])), PAGE_W), 0, "past the left quarter");
  // Same thirteen set at title size. A part's own title block is never a stave column.
  eq(core.abbrevColumn(col(...MLB_COLUMN.map(s => [s, 45, 14])), PAGE_W), 0, "title type");
  // Single glyphs down the margin — clefs, braces, accidentals — are not words.
  eq(core.abbrevColumn(col(["&"], ["?"], ["b"], ["\u00b0"], ["\u00a2"]), PAGE_W), 0, "notation glyphs");
});

check("an abbreviated stave label still names no part", () => {
  // The signal classifies the page. It must not put a part behind any of these labels, and the
  // weak-evidence test must keep flagging them as the small margin type they are.
  for(const label of MLB_COLUMN){
    const hit = core.detectPart(hdr([label, 7.7]));
    eq(!!(hit.part && !hit.weak), false, `${label} detected as a strong part match`);
  }
  // unity.pdf's score column prints "Bar./Trom. Bb", which the CHANGES4 baseline recorded as matching
  // nothing at all. It still matches nothing: the stave vocabulary is anchored at the end of the
  // label and this one ends on a key, not on an abbreviation. That page's score signal rests where it
  // always did, on the nine instruments in the column that are spelled out.
  eq(core.abbrevColumn(col(["Bar./Trom. B"], ["b"]), PAGE_W), 0, "Bar./Trom. Bb column count");
  eq(core.detectPart(hdr(["Bar./Trom. Bb", 7.7])).part, null, "Bar./Trom. Bb detects nothing");
});

check("a spelled-out stave inside the column does not claim the page", () => {
  // mlb.pdf's column spells out two of its fifteen staves. Bass Eb is a real PARTS match on a real
  // page, and without the page-level signal outranking detection the score page would file under it.
  const page = pg(3, {detected:"Bass Eb", score:true});
  const r = core.plan([pg(1), pg(2,{detected:"Full Score",first:true}), page, pg(4,{score:true})], true);
  eq(partOf(r,3), "Full Score", "p.3 part");
  eq(r.groups.has("Bass Eb"), false, "Bass Eb group");
  // The dropdown still outranks the signal, as it does for the original one.
  const chosen = core.plan([pg(1), pg(2,{detected:"Full Score",first:true}),
                            {...page, override:"Bass Eb"}], true);
  eq(partOf(chosen,3), "Bass Eb", "an explicit choice wins");
});

check("the signal opens a run that behaves like the original", () => {
  // mlb.pdf's shape: letterhead, then a score whose pages carry nothing but the column, then a part.
  // Same page size throughout — this set is portrait from cover to last part, so the size cue that
  // bounds the run on the landscape-score fixtures says nothing here.
  const score = n => pg(n, {score:true});
  const r = core.plan([pg(1), score(2), score(3), pg(4), pg(5),
                       pg(6, {detected:"Soprano Eb", first:true}), pg(7)], true);
  eq(r.groups.get("Full Score"), [1,2,3,4,5], "Full Score pages");
  eq(label(r,4), "cont. of p.3", "an unlabelled page inside the run inherits");
  eq(r.groups.get("Soprano Eb"), [6,7], "the run ends at the first real part page");
});

check("leading pages ahead of a signal page are swept into the score", () => {
  // The brief's expected mlb.pdf shape: a letterhead and a label-less first score page ahead of the
  // first page the signal fires on. Two leading pages, under the cap of three.
  const r = core.plan([pg(1), pg(2), pg(3,{score:true}), pg(4,{score:true}),
                       pg(5,{detected:"Soprano Eb", first:true})], true);
  eq(r.groups.get("Full Score"), [1,2,3,4], "Full Score pages");
  eq([1,2].map(n=>label(r,n)), ["cover \u2192 Full Score","cover \u2192 Full Score"], "leading statuses");
});

console.log("\nCHANGES5 — naming a set that prints no series line\n");

// mlb.pdf's front matter, as pdf.js hands it over. p.1 is the letterhead: the publisher, the cover
// shorthand "MLB 115", and the title broken across two lines at two sizes. p.2 is the first score
// page: the full title on one line, and the number beside it.
const MLB_P1 = items(["The Salvation Army", 12, 627], ["Music and Gospel Arts", 12, 613],
                     ["MLB 115", 19.9, 540], ["Prelude", 22.1, 497], ["The Reason I Live", 28.1, 466],
                     ["Wayne & Cathy Perrin", 18, 431], ["arr. Michael Cooper", 18, 410]);
const MLB_P2 = items(["Prelude - The Reason I Live", 26.1, 728], ["No. 115", 12.4, 703],
                     ["WAYNE & CATHY PERRIN", 12.4, 703], ["Soprano Cornet E", 7.7, 652]);
// The front matter as plan() leaves it: p.1 swept in by the cover rule, p.2 the score's first page.
const mlbFront = (...extra) => [pg(1, {cover:MLB_P1}), pg(2, {cover:MLB_P2, score:true}),
                                pg(3, {cover:[], score:true}), ...extra];

check("a set with no series line is named from its cover shorthand and its number", () => {
  const pages = mlbFront();
  const s = core.seriesName(pages, core.plan(pages, true).status);
  eq([s.abbr, s.number, s.year], ["MLB", "115", null], "series/number/year");
  // The title comes from the page the number is on, which is where the set prints it whole. The
  // cover's own largest item is "The Reason I Live" — the second half of a title split over two lines.
  eq([s.title, s.page], ["Prelude - The Reason I Live", 2], "title and page");
  eq(prefixOf(pages, ["115"]), "MLB #115 - Prelude - The Reason I Live", "prefix");
});

check("the series name is matched through a dropped \u201cti\u201d", () => {
  // The running-head form, which is the shape the fonts in this set actually extract to. Read here
  // from a front-matter page, since that is the only place this path is allowed to look.
  const front = [pg(1, {cover:items(["The Salva", 15, 764], ["on Army Maple Leaf Brass", 15, 764],
                                    ["No. 115", 20, 742], ["Prelude - The Reason I Live", 25, 742])})];
  const s = core.seriesName(front, core.plan(front, true).status);
  eq([s.abbr, s.number, s.title], ["MLB", "115", "Prelude - The Reason I Live"], "series/number/title");
  // The same tolerance where the dropout falls inside the series name itself.
  const collec = [pg(1, {cover:items(["Judd Street Collec", 15, 764], ["on", 15, 764],
                                     ["No. 12", 20, 742], ["A Title", 25, 742])})];
  eq(core.seriesName(collec, core.plan(collec, true).status).abbr, "JSC", "Judd Street Collection");
});

check("the secondary path never reads a part page's running head", () => {
  // Every part page of mlb.pdf carries "The Salva on Army Maple Leaf Brass" and "No. 115" over its
  // title. None of them is front matter, so none of them can name the document.
  const head = items(["The Salva", 15, 764], ["on Army Maple Leaf Brass", 15, 764],
                     ["No. 115", 20, 742], ["Prelude - The Reason I Live", 25, 742]);
  const pages = [pg(1, {cover:[]}), pg(2, {detected:"Soprano Eb", first:true, cover:head}),
                 pg(3, {detected:"1st Cornet Bb", first:true, cover:head})];
  eq(core.seriesName(pages, core.plan(pages, true).status), null, "series");
  eq(prefixOf(pages, ["115"]), "115", "prefix falls back to the piece number");
  // And nothing past the third page is even kept as front matter to read.
  eq(core.pageRecord(4, [], 792, 612).cover, null, "p.4 keeps no cover items");
});

check("the single-line pattern still comes first", () => {
  // A cover carrying both: the real series line, and a shorthand item that the secondary path would
  // otherwise answer with. The line wins, year and all.
  const p = withCover([...cover("Snowfall","A Composer","Triumph Series 1352 (2023)"),
                       ...items(["MLB 115", 20, 500], ["No. 115", 14, 480])]);
  const s = core.seriesName(p, core.plan(p, true).status);
  eq([s.abbr, s.number, s.year], ["TS", "1352", "2023"], "series/number/year");
});

check("half a cue names nothing", () => {
  const only = (...rows) => { const p = [pg(1, {cover:items(...rows)})]; return core.seriesName(p, core.plan(p,true).status); };
  eq(only(["MLB 115", 20, 540], ["A Title", 28, 466]), null, "a shorthand with no No. item");
  eq(only(["No. 115", 20, 540], ["A Title", 28, 466]), null, "a number with no series");
  // A hymn book reference is the same shape as the shorthand and must not be read as a series.
  eq(only(["SASB 126", 20, 540], ["No. 115", 14, 520], ["A Title", 28, 466]), null, "SASB 126");
  eq(only(["TB 857", 20, 540], ["No. 115", 14, 520], ["A Title", 28, 466]), null, "TB 857");
});

console.log("\nCHANGES5 — the export guard\n");

// A stand-in for pdf-lib's PDFDocument, with each step able to fail the way the real one does on an
// encrypted source. mlb.pdf fails at copyPages: PDFDocument.load(..., {ignoreEncryption:true})
// returns a document whose page tree is still ciphertext, so the first lookup throws
// "Expected instance of PDFDict, but got instance of undefined".
const fakeDoc = (failAt) => ({
  copyPages: async (src, idx) => {
    if(failAt === "copy") throw new Error("Expected instance of PDFDict, but got instance of undefined");
    return idx.map(i => ({page:i}));
  },
  addPage(){ if(failAt === "add") throw new Error("addPage failed"); },
  save: async () => { if(failAt === "save") throw new Error("save failed"); return new Uint8Array([1,2,3]); },
});
const quiet = async fn => { const w = console.warn; console.warn = () => {}; try{ return await fn(); } finally { console.warn = w; } };

await (async () => {
await check("a document that copies and saves one page passes the probe", async () => {
  eq(await core.canCopyPages({}, async () => fakeDoc(null)), true, "probe");
});

await check("a probe failure at any step refuses the export", async () => {
  for(const step of ["copy", "add", "save"]){
    eq(await quiet(() => core.canCopyPages({}, async () => fakeDoc(step))), false, `failure at ${step}`);
  }
  // And a create() that throws outright — the shape of a load that came back unusable.
  eq(await quiet(() => core.canCopyPages({}, async () => { throw new Error("nope"); })), false, "create throws");
});

check("the refusal message is the one the user sees", () => {
  eq(core.ENCRYPTED_MSG,
     "This PDF is locked by the tool that created it and can't be split. "
     + "Unlock it once (e.g. qpdf --decrypt, or iLovePDF's Unlock tool) and reload.", "message");
});
})();

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
