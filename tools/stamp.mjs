#!/usr/bin/env node
// Writes the build stamp into index.html's footer: the short commit hash and the date.
//
//   npm run stamp            stamp from HEAD
//   npm run stamp -- --clear reset it to "dev", which is what an unstamped working copy shows
//
// Run automatically by .githooks/pre-commit. See README.md for why the hash is the commit the build
// descends from rather than the commit that carries it — that one cannot be known in advance.

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = resolve(ROOT, "index.html");
// Rewrites only what sits between the markers, so the stamp can never grow a second copy of itself
// and a bad stamp can always be replaced by another.
const MARKED = /(<!--BUILD-->)([\s\S]*?)(<!--\/BUILD-->)/;

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

function stamp(){
  if(process.argv.includes("--clear")) return "dev";
  const hash = git("rev-parse", "--short", "HEAD");
  const date = git("log", "-1", "--format=%cs");   // YYYY-MM-DD, committer date
  return `${hash} · ${date}`;
}

const html = readFileSync(FILE, "utf8");
if(!MARKED.test(html)){
  console.error("index.html has no <!--BUILD--> markers; nothing stamped");
  process.exit(1);
}
const text = stamp();
const out = html.replace(MARKED, `$1${text}$3`);
if(out !== html) writeFileSync(FILE, out);
console.log(`build stamp: ${text}${out === html ? " (unchanged)" : ""}`);
