#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MANIFEST_PATH = path.resolve(ROOT, "policies/source_integrity_manifest.json");

function parseArgs(argv) {
  const formatIndex = argv.indexOf("--format");
  const format =
    formatIndex >= 0 && argv[formatIndex + 1] === "json" ? "json" : "text";

  return { format };
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function evaluateSource(source) {
  const checks = source.artifacts.map((artifact) => {
    const absolutePath = path.resolve(ROOT, artifact.path);
    const exists = existsSync(absolutePath);
    const currentSha256 = exists ? sha256(absolutePath) : null;
    const checksumMatches = exists && currentSha256 === artifact.sha256;
    const state = !exists
      ? "missing"
      : checksumMatches
        ? "unchanged"
        : "changed";

    return {
      label: artifact.label,
      path: artifact.path,
      exists,
      expectedSha256: artifact.sha256,
      currentSha256,
      checksumMatches,
      state,
    };
  });

  const artifactSummary = {
    totalArtifacts: checks.length,
    unchangedArtifacts: checks.filter((check) => check.state === "unchanged").length,
    changedArtifacts: checks.filter((check) => check.state === "changed").length,
    missingArtifacts: checks.filter((check) => check.state === "missing").length,
  };

  return {
    sourceId: source.sourceId,
    kind: source.kind,
    versionTag: source.versionTag ?? null,
    status: checks.every((check) => check.checksumMatches) ? "ready" : "attention",
    artifactSummary,
    checks,
  };
}

function shortSha(value) {
  return value ? value.slice(0, 12) : "missing";
}

function formatText(report) {
  const readyCount = report.summary.readySources;
  const attentionCount = report.summary.attentionSources;
  const lines = [
    "Source Integrity Drift",
    "======================",
    "",
    `Ready ${readyCount}/${report.sources.length} | Attention ${attentionCount}`,
    `Artifacts ${report.summary.unchangedArtifacts}/${report.summary.totalArtifacts} unchanged | Changed ${report.summary.changedArtifacts} | Missing ${report.summary.missingArtifacts}`,
  ];

  for (const source of report.sources) {
    lines.push("");
    lines.push(`${source.status === "ready" ? "OK" : "ATTN"} ${source.sourceId}`);

    if (source.versionTag) {
      lines.push(`  version: ${source.versionTag}`);
    }

    lines.push(
      `  artifact summary: unchanged ${source.artifactSummary.unchangedArtifacts}/${source.artifactSummary.totalArtifacts} | changed ${source.artifactSummary.changedArtifacts} | missing ${source.artifactSummary.missingArtifacts}`,
    );

    for (const check of source.checks) {
      lines.push(
        `  - ${check.checksumMatches ? "pass" : "fail"} ${check.label}: ${check.path}`,
      );

      if (!check.checksumMatches) {
        lines.push(
          `    expected ${shortSha(check.expectedSha256)} current ${shortSha(check.currentSha256)}`,
        );
      }
    }
  }

  return lines.join("\n");
}

const { format } = parseArgs(process.argv.slice(2));
const manifest = readManifest();
const sources = manifest.sources.map(evaluateSource);
const summary = {
  totalSources: sources.length,
  readySources: sources.filter((source) => source.status === "ready").length,
  attentionSources: sources.filter((source) => source.status === "attention").length,
  totalArtifacts: sources.reduce(
    (sum, source) => sum + source.artifactSummary.totalArtifacts,
    0,
  ),
  unchangedArtifacts: sources.reduce(
    (sum, source) => sum + source.artifactSummary.unchangedArtifacts,
    0,
  ),
  changedArtifacts: sources.reduce(
    (sum, source) => sum + source.artifactSummary.changedArtifacts,
    0,
  ),
  missingArtifacts: sources.reduce(
    (sum, source) => sum + source.artifactSummary.missingArtifacts,
    0,
  ),
};
const report = {
  manifestPath: path.relative(ROOT, MANIFEST_PATH).replaceAll("\\", "/"),
  manifestVersion: manifest.manifestVersion,
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
