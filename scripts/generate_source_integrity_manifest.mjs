#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  buildSourceIntegrityManifest,
  normalizePath,
} from "./lib/source_integrity_manifest_builder.mjs";

const ROOT = process.cwd();
const OUTPUT_PATH = path.resolve(ROOT, "policies/source_integrity_manifest.json");

const manifest = buildSourceIntegrityManifest();

mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${normalizePath(path.relative(ROOT, OUTPUT_PATH))}`);
