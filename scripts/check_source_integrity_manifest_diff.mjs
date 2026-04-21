#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  buildSourceIntegrityManifest,
} from "./lib/source_integrity_manifest_builder.mjs";

const ROOT = process.cwd();
const MANIFEST_PATH = path.resolve(ROOT, "policies/source_integrity_manifest.json");

function parseArgs(argv) {
  const formatIndex = argv.indexOf("--format");
  const format =
    formatIndex >= 0 && argv[formatIndex + 1] === "json" ? "json" : "text";

  return { format };
}

function readCommittedManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function buildArtifactMap(artifacts) {
  return new Map(artifacts.map((artifact) => [artifact.label, artifact]));
}

function evaluateSource(committedSource, generatedSource) {
  const committedArtifacts = buildArtifactMap(committedSource?.artifacts ?? []);
  const generatedArtifacts = buildArtifactMap(generatedSource?.artifacts ?? []);
  const artifactLabels = new Set([
    ...committedArtifacts.keys(),
    ...generatedArtifacts.keys(),
  ]);

  const changes = [];

  for (const label of artifactLabels) {
    const committedArtifact = committedArtifacts.get(label);
    const generatedArtifact = generatedArtifacts.get(label);

    if (!committedArtifact && generatedArtifact) {
      changes.push({
        label,
        kind: "added",
        committedPath: null,
        generatedPath: generatedArtifact.path,
        committedSha256: null,
        generatedSha256: generatedArtifact.sha256,
      });
      continue;
    }

    if (committedArtifact && !generatedArtifact) {
      changes.push({
        label,
        kind: "removed",
        committedPath: committedArtifact.path,
        generatedPath: null,
        committedSha256: committedArtifact.sha256,
        generatedSha256: null,
      });
      continue;
    }

    const pathChanged = committedArtifact.path !== generatedArtifact.path;
    const checksumChanged = committedArtifact.sha256 !== generatedArtifact.sha256;

    if (pathChanged || checksumChanged) {
      changes.push({
        label,
        kind: "changed",
        committedPath: committedArtifact.path,
        generatedPath: generatedArtifact.path,
        committedSha256: committedArtifact.sha256,
        generatedSha256: generatedArtifact.sha256,
        pathChanged,
        checksumChanged,
      });
    }
  }

  const versionChanged =
    (committedSource?.versionTag ?? null) !== (generatedSource?.versionTag ?? null);
  const status = !versionChanged && changes.length === 0 ? "ready" : "attention";

  return {
    sourceId: generatedSource?.sourceId ?? committedSource?.sourceId,
    kind: generatedSource?.kind ?? committedSource?.kind ?? "unknown",
    committedVersionTag: committedSource?.versionTag ?? null,
    generatedVersionTag: generatedSource?.versionTag ?? null,
    status,
    versionChanged,
    changes,
  };
}

function shortSha(value) {
  return value ? value.slice(0, 12) : "missing";
}

function formatText(report) {
  const lines = [
    "Source Integrity Manifest Diff",
    "==============================",
    "",
    `Ready ${report.summary.readySources}/${report.summary.totalSources} | Attention ${report.summary.attentionSources}`,
    `Changed sources ${report.summary.changedSources} | Changed artifacts ${report.summary.changedArtifacts} | Added ${report.summary.addedArtifacts} | Removed ${report.summary.removedArtifacts}`,
  ];

  for (const source of report.sources) {
    lines.push("");
    lines.push(`${source.status === "ready" ? "OK" : "ATTN"} ${source.sourceId}`);

    if (source.generatedVersionTag || source.committedVersionTag) {
      const versionText = source.versionChanged
        ? `${source.committedVersionTag ?? "none"} -> ${source.generatedVersionTag ?? "none"}`
        : `${source.generatedVersionTag ?? source.committedVersionTag}`;
      lines.push(`  version: ${versionText}`);
    }

    if (source.changes.length === 0) {
      lines.push("  - no manifest diff");
      continue;
    }

    for (const change of source.changes) {
      if (change.kind === "added") {
        lines.push(`  - added ${change.label}: ${change.generatedPath}`);
        continue;
      }

      if (change.kind === "removed") {
        lines.push(`  - removed ${change.label}: ${change.committedPath}`);
        continue;
      }

      const pathLine =
        change.committedPath === change.generatedPath
          ? change.generatedPath
          : `${change.committedPath} -> ${change.generatedPath}`;
      lines.push(`  - changed ${change.label}: ${pathLine}`);

      if (change.checksumChanged) {
        lines.push(
          `    checksum ${shortSha(change.committedSha256)} -> ${shortSha(change.generatedSha256)}`,
        );
      }
    }
  }

  return lines.join("\n");
}

const { format } = parseArgs(process.argv.slice(2));
const committedManifest = readCommittedManifest();
const generatedManifest = buildSourceIntegrityManifest();
const committedSources = new Map(
  committedManifest.sources.map((source) => [source.sourceId, source]),
);
const generatedSources = new Map(
  generatedManifest.sources.map((source) => [source.sourceId, source]),
);
const sourceIds = new Set([...committedSources.keys(), ...generatedSources.keys()]);
const sources = [...sourceIds]
  .sort()
  .map((sourceId) =>
    evaluateSource(committedSources.get(sourceId), generatedSources.get(sourceId)),
  );

const summary = {
  totalSources: sources.length,
  readySources: sources.filter((source) => source.status === "ready").length,
  attentionSources: sources.filter((source) => source.status === "attention").length,
  changedSources: sources.filter((source) => source.changes.length > 0 || source.versionChanged)
    .length,
  changedArtifacts: sources.reduce(
    (sum, source) =>
      sum + source.changes.filter((change) => change.kind === "changed").length,
    0,
  ),
  addedArtifacts: sources.reduce(
    (sum, source) =>
      sum + source.changes.filter((change) => change.kind === "added").length,
    0,
  ),
  removedArtifacts: sources.reduce(
    (sum, source) =>
      sum + source.changes.filter((change) => change.kind === "removed").length,
    0,
  ),
};
const report = {
  manifestPath: path.relative(ROOT, MANIFEST_PATH).replaceAll("\\", "/"),
  manifestVersion: committedManifest.manifestVersion,
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
