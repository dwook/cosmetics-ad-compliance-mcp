#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  LAW_SNAPSHOT_SYNC_SOURCES,
  buildAllSyncedLawSnapshotOutputs,
} from "./lib/law_snapshot_sync_builder.mjs";

const ROOT = process.cwd();

function parseArgs(argv) {
  const formatIndex = argv.indexOf("--format");
  const format =
    formatIndex >= 0 && argv[formatIndex + 1] === "json" ? "json" : "text";

  return { format };
}

function readText(relativePath) {
  return readFileSync(path.resolve(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function evaluateSource(source, generated) {
  const committedMetadata = readJson(source.metadataPath);
  const committedAnchors = readJson(source.anchorsPath);
  const committedManifest = readJson(source.manifestPath);
  const committedBody = readText(source.bodyPath);
  const changes = [];

  if (JSON.stringify(committedMetadata) !== JSON.stringify(generated.metadata)) {
    changes.push({
      artifact: "metadata",
      path: source.metadataPath,
    });
  }

  if (committedBody !== generated.bodyText) {
    changes.push({
      artifact: "body",
      path: source.bodyPath,
    });
  }

  if (JSON.stringify(committedAnchors) !== JSON.stringify(generated.anchorsDoc)) {
    changes.push({
      artifact: "anchors",
      path: source.anchorsPath,
      committedCount: committedAnchors.anchors?.length ?? 0,
      generatedCount: generated.anchorsDoc.anchors.length,
    });
  }

  if (JSON.stringify(committedManifest) !== JSON.stringify(generated.manifest)) {
    changes.push({
      artifact: "manifest",
      path: source.manifestPath,
      committedVersionTag: committedManifest.currentVersionTag ?? null,
      generatedVersionTag: generated.manifest.currentVersionTag ?? null,
    });
  }

  return {
    sourceId: source.sourceId,
    versionTag: generated.versionTag,
    status: changes.length === 0 ? "ready" : "attention",
    changes,
  };
}

function formatText(report) {
  const lines = [
    "Law Snapshot Regen Diff",
    "=======================",
    "",
    `Ready ${report.summary.readySources}/${report.summary.totalSources} | Attention ${report.summary.attentionSources}`,
    `Changed source artifacts ${report.summary.changedSourceArtifacts}`,
  ];

  for (const source of report.sources) {
    lines.push("");
    lines.push(`${source.status === "ready" ? "OK" : "ATTN"} ${source.sourceId}`);
    lines.push(`  version: ${source.versionTag}`);

    if (source.changes.length === 0) {
      lines.push("  - no regen diff");
      continue;
    }

    for (const change of source.changes) {
      if (change.artifact === "anchors") {
        lines.push(
          `  - changed anchors: ${change.path} (${change.committedCount} -> ${change.generatedCount})`,
        );
        continue;
      }

      if (change.artifact === "manifest") {
        lines.push(
          `  - changed manifest: ${change.path} (${change.committedVersionTag} -> ${change.generatedVersionTag})`,
        );
        continue;
      }

      lines.push(`  - changed ${change.artifact}: ${change.path}`);
    }
  }

  return lines.join("\n");
}

const { format } = parseArgs(process.argv.slice(2));
const outputs = await buildAllSyncedLawSnapshotOutputs();
const sources = outputs.map(({ source, generated }) =>
  evaluateSource(source, generated),
);
const summary = {
  totalSources: sources.length,
  readySources: sources.filter((source) => source.status === "ready").length,
  attentionSources: sources.filter((source) => source.status === "attention").length,
  changedSourceArtifacts: sources.reduce(
    (sum, source) => sum + source.changes.length,
    0,
  ),
};
const report = {
  summary,
  sources,
};

if (format === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(formatText(report));
}

if (summary.attentionSources > 0) {
  process.exitCode = 1;
}
