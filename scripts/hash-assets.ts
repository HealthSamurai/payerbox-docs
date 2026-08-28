#!/usr/bin/env bun
//
// Fingerprints the data-integration templates.
//
// The site serves assets/** with `cache-control: max-age=31536000, immutable`,
// so an edited template never reaches anyone at its old URL. Putting the content
// hash in the filename is what that header expects: new content, new URL, fresh
// fetch. The file widget's visible label is a separate line, so readers still
// see `clinical_observations.csv`.
//
// Run after touching a template:  bun assets:hash

import { createHash } from "node:crypto";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ASSETS = "assets/data-integration";
const DOCS = "docs";
const NAME = /^(.+?)(?:\.[0-9a-f]{8})?\.csv$/;

async function markdownFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await markdownFiles(path)));
    else if (entry.name.endsWith(".md")) out.push(path);
  }
  return out;
}

const renames = new Map<string, string>(); // base name -> hashed file name

for (const entry of (await readdir(ASSETS)).sort()) {
  const match = NAME.exec(entry);
  if (!match) continue;

  const base = match[1];
  const body = await readFile(join(ASSETS, entry));
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 8);
  const hashed = `${base}.${hash}.csv`;

  if (entry !== hashed) {
    await rename(join(ASSETS, entry), join(ASSETS, hashed));
    console.log(`  ${entry} -> ${hashed}`);
  }
  renames.set(base, hashed);
}

for (const path of await markdownFiles(DOCS)) {
  const before = await readFile(path, "utf8");
  let after = before;

  for (const [base, hashed] of renames) {
    const pattern = new RegExp(`(${ASSETS}/)${base}(?:\\.[0-9a-f]{8})?\\.csv`, "g");
    after = after.replace(pattern, `$1${hashed}`);
  }

  if (after !== before) {
    await writeFile(path, after);
    console.log(`  updated ${path}`);
  }
}
